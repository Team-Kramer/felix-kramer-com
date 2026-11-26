import type { FootballDataset } from './types';

export interface DatasetValidationIssue {
	path: string;
	message: string;
}

export class DatasetValidationError extends Error {
	readonly issues: DatasetValidationIssue[];

	constructor(issues: DatasetValidationIssue[]) {
		super(`Dataset validation failed with ${issues.length} issue(s).`);
		this.name = 'DatasetValidationError';
		this.issues = issues;
	}
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
	typeof value === 'string' && value.trim().length > 0;

const isArray = (value: unknown): value is unknown[] => Array.isArray(value);

const isFiniteNumber = (value: unknown): value is number =>
	typeof value === 'number' && Number.isFinite(value);

const isIsoDate = (value: unknown): value is string =>
	typeof value === 'string' &&
	/^\d{4}-\d{2}-\d{2}$/.test(value) &&
	!Number.isNaN(Date.parse(`${value}T00:00:00Z`));

const isIsoDateTime = (value: unknown): value is string =>
	typeof value === 'string' && !Number.isNaN(Date.parse(value));

function addRequiredArrayIssue(
	value: Record<string, unknown>,
	key: string,
	issues: DatasetValidationIssue[]
) {
	if (!isArray(value[key])) {
		issues.push({ path: key, message: 'must be an array' });
	}
}

function validateUniqueIds(value: unknown[], path: string, issues: DatasetValidationIssue[]) {
	const ids = new Set<string>();
	value.forEach((entry, index) => {
		if (!isRecord(entry) || !isNonEmptyString(entry.id)) {
			issues.push({ path: `${path}[${index}].id`, message: 'must be a non-empty string' });
			return;
		}
		if (ids.has(entry.id)) {
			issues.push({ path: `${path}[${index}].id`, message: `duplicate id "${entry.id}"` });
		}
		ids.add(entry.id);
	});
}

function validateInterval(
	entry: Record<string, unknown>,
	path: string,
	issues: DatasetValidationIssue[]
) {
	if (!isIsoDate(entry.validFrom)) {
		issues.push({ path: `${path}.validFrom`, message: 'must be an ISO date (YYYY-MM-DD)' });
	}
	if (entry.validTo !== null && entry.validTo !== undefined && !isIsoDate(entry.validTo)) {
		issues.push({ path: `${path}.validTo`, message: 'must be null or an ISO date (YYYY-MM-DD)' });
	}
	if (isIsoDate(entry.validFrom) && isIsoDate(entry.validTo) && entry.validFrom > entry.validTo) {
		issues.push({ path: `${path}.validTo`, message: 'must not be before validFrom' });
	}
}

function validateRange(
	value: unknown,
	path: string,
	min: number,
	max: number,
	issues: DatasetValidationIssue[]
) {
	if (!isFiniteNumber(value) || value < min || value > max) {
		issues.push({ path, message: `must be a number between ${min} and ${max}` });
	}
}

function validateReferences(
	value: unknown[],
	path: string,
	field: string,
	references: Set<string>,
	issues: DatasetValidationIssue[]
) {
	value.forEach((entry, index) => {
		if (!isRecord(entry)) return;
		const reference = entry[field];
		if (isNonEmptyString(reference) && !references.has(reference)) {
			issues.push({
				path: `${path}[${index}].${field}`,
				message: `unknown reference "${reference}"`,
			});
		}
	});
}

export function validateDataset(value: unknown): FootballDataset {
	const issues: DatasetValidationIssue[] = [];

	if (!isRecord(value)) {
		throw new DatasetValidationError([{ path: '', message: 'must be an object' }]);
	}
	if (value.$schema !== 'https://felix-kramer.com/schemas/football-dataset-v1.json') {
		issues.push({ path: '$schema', message: 'unsupported dataset schema' });
	}
	if (!isRecord(value.dataset)) {
		issues.push({ path: 'dataset', message: 'must be an object' });
	} else {
		for (const field of ['id', 'name', 'schemaVersion', 'datasetVersion', 'createdAt', 'updatedAt']) {
			if (!isNonEmptyString(value.dataset[field])) {
				issues.push({ path: `dataset.${field}`, message: 'must be a non-empty string' });
			}
		}
	}

	const arrayKeys = [
		'competitions',
		'seasons',
		'teams',
		'teamParticipations',
		'players',
		'memberships',
		'teamSnapshots',
		'playerSnapshots',
		'tacticalProfiles',
		'matches',
		'matchAppearances',
		'events',
		'heatmaps',
		'tracking',
		'chemistry',
		'provenance',
	];
	for (const key of arrayKeys) addRequiredArrayIssue(value, key, issues);

	for (const key of arrayKeys) {
		if (isArray(value[key])) validateUniqueIds(value[key], key, issues);
	}

	const ids = (key: string) =>
		new Set(
			isArray(value[key])
				? value[key].filter(isRecord).flatMap((entry) => (isNonEmptyString(entry.id) ? [entry.id] : []))
				: []
		);
	const teamIds = ids('teams');
	const playerIds = ids('players');
	const competitionIds = ids('competitions');
	const seasonIds = ids('seasons');
	const matchIds = ids('matches');

	if (isArray(value.seasons)) {
		validateReferences(value.seasons, 'seasons', 'competitionId', competitionIds, issues);
	}
	if (isArray(value.teamParticipations)) {
		validateReferences(value.teamParticipations, 'teamParticipations', 'competitionId', competitionIds, issues);
		validateReferences(value.teamParticipations, 'teamParticipations', 'seasonId', seasonIds, issues);
		validateReferences(value.teamParticipations, 'teamParticipations', 'teamId', teamIds, issues);
		value.teamParticipations.forEach((entry, index) => {
			if (isRecord(entry)) validateInterval(entry, `teamParticipations[${index}]`, issues);
		});
	}
	if (isArray(value.memberships)) {
		validateReferences(value.memberships, 'memberships', 'playerId', playerIds, issues);
		validateReferences(value.memberships, 'memberships', 'teamId', teamIds, issues);
		value.memberships.forEach((entry, index) => {
			if (isRecord(entry)) validateInterval(entry, `memberships[${index}]`, issues);
		});
	}
	if (isArray(value.teamSnapshots)) {
		validateReferences(value.teamSnapshots, 'teamSnapshots', 'teamId', teamIds, issues);
		value.teamSnapshots.forEach((entry, index) => {
			if (!isRecord(entry)) return;
			const path = `teamSnapshots[${index}]`;
			validateInterval(entry, path, issues);
			const rating = entry.rating;
			if (!isRecord(rating) || !isFiniteNumber(rating.elo)) {
				issues.push({ path: `${path}.rating.elo`, message: 'must be a finite number' });
			}
		});
	}
	if (isArray(value.playerSnapshots)) {
		validateReferences(value.playerSnapshots, 'playerSnapshots', 'playerId', playerIds, issues);
		value.playerSnapshots.forEach((entry, index) => {
			if (!isRecord(entry)) return;
			validateInterval(entry, `playerSnapshots[${index}]`, issues);
			if (isRecord(entry.ability) && entry.ability.confidence !== undefined) {
				validateRange(entry.ability.confidence, `playerSnapshots[${index}].ability.confidence`, 0, 1, issues);
			}
		});
	}
	if (isArray(value.tacticalProfiles)) {
		validateReferences(value.tacticalProfiles, 'tacticalProfiles', 'playerId', playerIds, issues);
		value.tacticalProfiles.forEach((entry, index) => {
			if (!isRecord(entry)) return;
			validateInterval(entry, `tacticalProfiles[${index}]`, issues);
			validateRange(entry.roleFit, `tacticalProfiles[${index}].roleFit`, 0, 1, issues);
		});
	}
	if (isArray(value.matches)) {
		validateReferences(value.matches, 'matches', 'competitionId', competitionIds, issues);
		validateReferences(value.matches, 'matches', 'seasonId', seasonIds, issues);
		validateReferences(value.matches, 'matches', 'homeTeamId', teamIds, issues);
		validateReferences(value.matches, 'matches', 'awayTeamId', teamIds, issues);
		value.matches.forEach((entry, index) => {
			if (!isRecord(entry)) return;
			if (!isIsoDateTime(entry.dateTime)) {
				issues.push({ path: `matches[${index}].dateTime`, message: 'must be an ISO date-time' });
			}
			if (entry.homeTeamId === entry.awayTeamId) {
				issues.push({ path: `matches[${index}]`, message: 'homeTeamId and awayTeamId must differ' });
			}
		});
	}
	if (isArray(value.matchAppearances)) {
		validateReferences(value.matchAppearances, 'matchAppearances', 'matchId', matchIds, issues);
		validateReferences(value.matchAppearances, 'matchAppearances', 'playerId', playerIds, issues);
		validateReferences(value.matchAppearances, 'matchAppearances', 'teamId', teamIds, issues);
	}
	if (isArray(value.events)) {
		validateReferences(value.events, 'events', 'matchId', matchIds, issues);
		validateReferences(value.events, 'events', 'teamId', teamIds, issues);
		validateReferences(value.events, 'events', 'actorPlayerId', playerIds, issues);
	}
	if (isArray(value.chemistry)) {
		validateReferences(value.chemistry, 'chemistry', 'teamId', teamIds, issues);
		value.chemistry.forEach((entry, index) => {
			if (!isRecord(entry)) return;
			validateInterval(entry, `chemistry[${index}]`, issues);
			validateRange(entry.overall, `chemistry[${index}].overall`, 0, 1, issues);
		});
	}
	if (isArray(value.heatmaps)) {
		validateReferences(value.heatmaps, 'heatmaps', 'matchId', matchIds, issues);
		value.heatmaps.forEach((entry, index) => {
			if (!isRecord(entry)) return;
			const path = 'heatmaps[' + index + ']';
			const resolution = entry.resolution;
			const cells = entry.cells;
			if (!isRecord(resolution) || !Number.isInteger(resolution.width) || !Number.isInteger(resolution.height)) {
				issues.push({ path: `${path}.resolution`, message: 'must define integer width and height' });
				return;
			}
			if (!isArray(cells) || cells.length !== resolution.height) {
				issues.push({ path: `${path}.cells`, message: 'row count must equal resolution.height' });
				return;
			}
			cells.forEach((row, rowIndex) => {
				if (!isArray(row) || row.length !== resolution.width) {
					issues.push({ path: `${path}.cells[${rowIndex}]`, message: 'column count must equal resolution.width' });
				}
			});
		});
	}
	if (isArray(value.tracking)) {
		validateReferences(value.tracking, 'tracking', 'matchId', matchIds, issues);
	}
	if (isArray(value.provenance)) {
		const provenanceIds = ids('provenance');
		const sourceRefCollections = ['teamSnapshots', 'playerSnapshots', 'chemistry'];
		for (const collection of sourceRefCollections) {
			if (!isArray(value[collection])) continue;
			value[collection].forEach((entry, index) => {
				if (!isRecord(entry) || !isArray(entry.sourceRefs)) return;
				entry.sourceRefs.forEach((ref, refIndex) => {
					if (!isNonEmptyString(ref) || !provenanceIds.has(ref)) {
						issues.push({
							path: `${collection}[${index}].sourceRefs[${refIndex}]`,
							message: `unknown provenance reference "${String(ref)}"`,
						});
					}
				});
			});
		}
	}

	if (issues.length > 0) throw new DatasetValidationError(issues);
	return value as unknown as FootballDataset;
}

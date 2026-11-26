import type { Team } from '../types';
import type { FootballDataset } from './types';

export interface DatasetTeamOptions {
	asOf?: string;
}

function isWithinInterval(asOf: string, validFrom: string, validTo: string | null): boolean {
	return asOf >= validFrom && (validTo === null || asOf <= validTo);
}

function latestSnapshot<T extends { validFrom: string; validTo: string | null }>(
	snapshots: T[],
	asOf: string
): T | undefined {
	return snapshots
		.filter((snapshot) => isWithinInterval(asOf, snapshot.validFrom, snapshot.validTo))
		.sort((left, right) => right.validFrom.localeCompare(left.validFrom))[0];
}

export function toEngineTeams(
	dataset: FootballDataset,
	{ asOf = dataset.dataset.updatedAt.slice(0, 10) }: DatasetTeamOptions = {}
): Team[] {
	return dataset.teams.map((team) => {
		const snapshot = latestSnapshot(
			dataset.teamSnapshots.filter((candidate) => candidate.teamId === team.id),
			asOf
		);
		return {
			id: team.id,
			name: team.canonicalName,
			elo: snapshot?.rating.elo ?? 1500,
			color: team.colors?.primary,
		};
	});
}

export function teamsForCompetition(
	dataset: FootballDataset,
	competitionId: string,
	seasonId: string
): Team[] {
	const teamIds = new Set(
		dataset.teamParticipations
			.filter(
				(participation) =>
					participation.competitionId === competitionId &&
					participation.seasonId === seasonId &&
					participation.status !== 'withdrawn'
			)
			.map((participation) => participation.teamId)
	);
	return toEngineTeams(dataset).filter((team) => teamIds.has(team.id));
}

export function seasonForCompetition(dataset: FootballDataset, competitionId: string): string | undefined {
	return dataset.competitions.find((competition) => competition.id === competitionId)?.seasonIds[0];
}

/** Synthetic route pool used while the default dataset intentionally stays minimal. */
export function routeTeams(dataset: FootballDataset): Team[] {
	const base = toEngineTeams(dataset);
	if (base.length > 2 || dataset.dataset.sourceType !== 'synthetic-fixture') return base;
	return [
		...base,
		...Array.from({ length: 64 }, (_, index) => ({
			id: `team-fictional-${String(index + 1).padStart(2, '0')}`,
			name: `Fictional Club ${String(index + 1).padStart(2, '0')}`,
			elo: 1480 + ((index * 17) % 220),
			color: ['#3366FF', '#FF6633', '#22AA77', '#AA55CC'][index % 4],
		})),
	];
}

export function routeTeamsForCompetition(dataset: FootballDataset, competitionId: string, count: number): Team[] {
	const season = seasonForCompetition(dataset, competitionId);
	const existing = season ? teamsForCompetition(dataset, competitionId, season) : [];
	return (existing.length >= count ? existing : routeTeams(dataset)).slice(0, count);
}

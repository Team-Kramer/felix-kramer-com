#!/usr/bin/env node
/**
 * Generate a deterministic, synthetic football dataset for size and integration
 * experiments. The generated data contains no real clubs, players, or sources.
 *
 * Examples:
 *   node scripts/generate-dataset-fixture.mjs
 *   node scripts/generate-dataset-fixture.mjs --players-per-team=30 --seasons=5
 *   node scripts/generate-dataset-fixture.mjs --heatmaps=match --output=tmp/full-fixture
 *
 * The output directory is intentionally outside src/ so generated fixture data
 * cannot accidentally become part of the public bundle.
 */

import { brotliCompressSync, gzipSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(new URL('..', import.meta.url)));

const DEFAULTS = {
	seed: 'synthetic-bundesliga-2026-27',
	output: join(ROOT, 'tmp', 'football-dataset-fixture'),
	teams: 18,
	playersPerTeam: 25,
	seasons: 3,
	matches: 306,
	heatmaps: 'season',
};

const POSITION_CYCLE = ['GK', 'DEF', 'DEF', 'MID', 'MID', 'MID', 'FWD', 'FWD'];
const HEATMAP_WIDTH = 12;
const HEATMAP_HEIGHT = 8;

function parseArgs(argv) {
	const options = { ...DEFAULTS };

	for (const argument of argv) {
		if (!argument.startsWith('--')) continue;
		const separator = argument.indexOf('=');
		const key = separator === -1 ? argument.slice(2) : argument.slice(2, separator);
		const value = separator === -1 ? 'true' : argument.slice(separator + 1);

		if (key === 'output' || key === 'seed' || key === 'heatmaps') options[key] = value;
		else if (key in options) options[key] = Number(value);
	}

	if (!['none', 'season', 'match'].includes(options.heatmaps)) {
		throw new Error('--heatmaps must be one of: none, season, match');
	}

	for (const key of ['teams', 'playersPerTeam', 'seasons', 'matches']) {
		if (!Number.isInteger(options[key]) || options[key] < 1) {
			throw new Error(`--${key} must be a positive integer`);
		}
	}

	return options;
}

function mulberry32(seed) {
	let state = seed >>> 0;
	return () => {
		state = (state + 0x6d2b79f5) | 0;
		let value = Math.imul(state ^ (state >>> 15), 1 | state);
		value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
		return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
	};
}

function seedFromString(value) {
	let hash = 1779033703 ^ value.length;
	for (let index = 0; index < value.length; index += 1) {
		hash = Math.imul(hash ^ value.charCodeAt(index), 3432918353);
		hash = (hash << 13) | (hash >>> 19);
	}
	return hash >>> 0;
}

function integer(rng, min, max) {
	return Math.floor(rng() * (max - min + 1)) + min;
}

function decimal(rng, min, max, digits = 2) {
	const factor = 10 ** digits;
	return Math.round((min + rng() * (max - min)) * factor) / factor;
}

function dateForSeason(seasonIndex) {
	const year = 2026 - seasonIndex;
	return {
		id: `season-bundesliga-${year}-${String(year + 1).slice(-2)}`,
		start: `${year}-08-01`,
		end: `${year + 1}-06-30`,
	};
}

function createHeatmap(rng) {
	const cells = Array.from({ length: HEATMAP_HEIGHT }, () =>
		Array.from({ length: HEATMAP_WIDTH }, () => decimal(rng, 0, 1, 4))
	);
	const sum = cells.flat().reduce((total, value) => total + value, 0);

	return {
		resolution: { width: HEATMAP_WIDTH, height: HEATMAP_HEIGHT },
		cells: cells.map((row) => row.map((value) => Number((value / sum).toFixed(6)))),
		normalization: { method: 'minutes-weighted', sum: 1 },
	};
}

function createAttributes(rng) {
	const group = (names) => Object.fromEntries(names.map((name) => [name, integer(rng, 6, 19)]));

	return {
		technical: group(['finishing', 'firstTouch', 'heading', 'passing', 'technique', 'longShots']),
		mental: group(['composure', 'decisions', 'offTheBall', 'positioning', 'teamwork', 'vision', 'workRate']),
		physical: group(['acceleration', 'pace', 'stamina', 'strength', 'agility', 'jumpingReach']),
		goalkeeping: null,
	};
}

function createSchedule(teamIds, matchCount) {
	const pairs = [];
	for (let home = 0; home < teamIds.length; home += 1) {
		for (let away = home + 1; away < teamIds.length; away += 1) {
			pairs.push([teamIds[home], teamIds[away]]);
			pairs.push([teamIds[away], teamIds[home]]);
		}
	}

	return Array.from({ length: matchCount }, (_, index) => {
		const [homeTeamId, awayTeamId] = pairs[index % pairs.length];
		return { homeTeamId, awayTeamId, sequence: index + 1 };
	});
}

function createDataset(options) {
	const rng = mulberry32(seedFromString(options.seed));
	const seasons = Array.from({ length: options.seasons }, (_, index) => dateForSeason(index));
	const teams = Array.from({ length: options.teams }, (_, index) => ({
		id: `team-synthetic-${String(index + 1).padStart(2, '0')}`,
		canonicalName: `Synthetic Club ${String(index + 1).padStart(2, '0')}`,
		shortName: `SC${String(index + 1).padStart(2, '0')}`,
		countryCode: 'XX',
		aliases: [`Synthetic FC ${index + 1}`],
		colors: {
			primary: `#${integer(rng, 0x100000, 0xffffff).toString(16).padStart(6, '0')}`,
			secondary: '#FFFFFF',
		},
	}));
	const players = [];
	const memberships = [];
	const playerSnapshots = [];
	const tacticalProfiles = [];
	const playerByTeam = new Map();

	for (const [teamIndex, team] of teams.entries()) {
		const teamPlayers = [];
		for (let playerIndex = 0; playerIndex < options.playersPerTeam; playerIndex += 1) {
			const playerId = `player-synthetic-${String(teamIndex * options.playersPerTeam + playerIndex + 1).padStart(4, '0')}`;
			const player = {
				id: playerId,
				canonicalName: `Synthetic Player ${String(teamIndex * options.playersPerTeam + playerIndex + 1).padStart(4, '0')}`,
				dateOfBirth: `${integer(rng, 1985, 2005)}-${String(integer(rng, 1, 12)).padStart(2, '0')}-${String(integer(rng, 1, 28)).padStart(2, '0')}`,
				nationalityCodes: ['XX'],
				positions: [POSITION_CYCLE[playerIndex % POSITION_CYCLE.length]],
				preferredFoot: playerIndex % 3 === 0 ? 'left' : 'right',
				status: 'active',
			};
			players.push(player);
			teamPlayers.push(playerId);

			memberships.push({
				id: `membership-${playerId}-${team.id}`,
				playerId,
				teamId: team.id,
				role: 'player',
				contractType: 'permanent',
				squadNumber: playerIndex + 1,
				validFrom: seasons[seasons.length - 1].start,
				validTo: null,
			});

			for (const season of seasons) {
				playerSnapshots.push({
					id: `snapshot-${playerId}-${season.id}`,
					playerId,
					validFrom: season.start,
					validTo: season.end,
					scale: { min: 1, max: 20 },
					ability: {
						current: integer(rng, 8, 18),
						potential: integer(rng, 10, 20),
						confidence: decimal(rng, 0.6, 0.98),
					},
					attributes: createAttributes(rng),
					weaknesses: [
						{
							type: ['pace', 'strength', 'decisions'][playerIndex % 3],
							severity: decimal(rng, 0.2, 0.8),
							confidence: decimal(rng, 0.6, 0.95),
						},
					],
					traits: ['holds-up-play', 'attempts-through-balls'].slice(0, 1 + (playerIndex % 2)),
					assessmentType: 'estimated',
					sourceRefs: ['source-synthetic-generator'],
				});
				tacticalProfiles.push({
					id: `tactical-${playerId}-${season.id}`,
					playerId,
					validFrom: season.start,
					validTo: season.end,
					role: ['advanced-forward', 'box-to-box', 'ball-playing-defender'][playerIndex % 3],
					position: player.positions[0],
					roleFit: decimal(rng, 0.45, 0.98),
					attributes: {
						pressing: decimal(rng, 0.2, 1),
						linkUpPlay: decimal(rng, 0.2, 1),
						boxPresence: decimal(rng, 0.2, 1),
						runBehindDefense: decimal(rng, 0.2, 1),
					},
					preferredZones: ['central', 'left-half-space', 'right-half-space'],
				});
			}
		}
		playerByTeam.set(team.id, teamPlayers);
	}

	const competitions = [
		{
			id: 'competition-bundesliga',
			type: 'league',
			countryCode: 'XX',
			name: 'Synthetic Bundesliga Fixture',
			shortName: 'SBL',
			level: 1,
			gender: 'male',
			seasonIds: seasons.map((season) => season.id),
		},
	];
	const seasonRecords = seasons.map((season) => ({
		id: season.id,
		competitionId: 'competition-bundesliga',
		name: season.id.replace('season-bundesliga-', 'Synthetic Bundesliga '),
		startDate: season.start,
		endDate: season.end,
	}));
	const participations = seasons.flatMap((season) =>
		teams.map((team) => ({
			id: `participation-${season.id}-${team.id}`,
			competitionId: 'competition-bundesliga',
			seasonId: season.id,
			teamId: team.id,
			status: 'active',
			position: null,
			points: null,
			validFrom: season.start,
			validTo: season.end,
		}))
	);
	const teamSnapshots = seasons.flatMap((season) =>
		teams.map((team) => ({
			id: `snapshot-${team.id}-${season.id}`,
			teamId: team.id,
			validFrom: season.start,
			validTo: season.end,
			rating: {
				elo: integer(rng, 1450, 2050),
				attack: integer(rng, 55, 92),
				midfield: integer(rng, 55, 92),
				defense: integer(rng, 55, 92),
				goalkeeping: integer(rng, 55, 92),
				overall: integer(rng, 55, 92),
			},
			style: {
				possession: decimal(rng, 0.25, 0.75),
				pressingIntensity: decimal(rng, 0.25, 0.9),
				directness: decimal(rng, 0.2, 0.8),
				defensiveLine: decimal(rng, 0.2, 0.9),
				tempo: decimal(rng, 0.2, 0.9),
			},
			formationPreferences: [
				{ formation: '4-2-3-1', usage: decimal(rng, 0.2, 0.7) },
				{ formation: '4-3-3', usage: decimal(rng, 0.1, 0.5) },
			],
			sourceRefs: ['source-synthetic-generator'],
		}))
	);
	const teamIds = teams.map((team) => team.id);
	const schedule = createSchedule(teamIds, options.matches);
	const matches = [];
	const appearances = [];
	const events = [];
	const heatmaps = [];
	const tracking = [];

	for (const season of seasons) {
		const seasonMatches = season.id === seasons[seasons.length - 1].id ? schedule : schedule.slice(0, Math.ceil(schedule.length / 2));
		for (const scheduled of seasonMatches) {
			const matchId = `match-${season.id}-${String(scheduled.sequence).padStart(3, '0')}`;
			const date = new Date(Date.UTC(Number(season.start.slice(0, 4)), 7, 1 + scheduled.sequence));
			const homeScore = integer(rng, 0, 4);
			const awayScore = integer(rng, 0, 4);
			matches.push({
				id: matchId,
				competitionId: 'competition-bundesliga',
				seasonId: season.id,
				dateTime: date.toISOString(),
				homeTeamId: scheduled.homeTeamId,
				awayTeamId: scheduled.awayTeamId,
				status: 'finished',
				score: { home: homeScore, away: awayScore },
			});

			for (const teamId of [scheduled.homeTeamId, scheduled.awayTeamId]) {
				const squad = playerByTeam.get(teamId);
				const selectedPlayers = squad.slice(0, Math.min(11, squad.length));
				for (const [lineupIndex, playerId] of selectedPlayers.entries()) {
					const appearanceId = `appearance-${matchId}-${playerId}`;
					appearances.push({
						id: appearanceId,
						matchId,
						playerId,
						teamId,
						started: true,
						minutes: integer(rng, 60, 96),
						position: POSITION_CYCLE[lineupIndex % POSITION_CYCLE.length],
						rating: decimal(rng, 5.5, 9.5),
						stats: {
							goals: integer(rng, 0, 2),
							assists: integer(rng, 0, 2),
							shots: integer(rng, 0, 6),
							shotsOnTarget: integer(rng, 0, 4),
							xg: decimal(rng, 0, 1.2),
							xa: decimal(rng, 0, 0.8),
							passesCompleted: integer(rng, 8, 80),
							distanceKm: decimal(rng, 5, 13),
							sprints: integer(rng, 3, 35),
						},
						heatmapRef: options.heatmaps === 'match' ? `heatmap-${appearanceId}` : undefined,
						trackingRef: `tracking-${appearanceId}`,
					});
					events.push({
						id: `event-${appearanceId}`,
						matchId,
						actorPlayerId: playerId,
						teamId,
						type: ['pass', 'shot', 'pressure', 'carry'][lineupIndex % 4],
						period: lineupIndex % 2 === 0 ? 1 : 2,
						minute: integer(rng, 1, 94),
						location: { x: decimal(rng, 0, 1, 4), y: decimal(rng, 0, 1, 4) },
					});
					if (options.heatmaps === 'match') {
						heatmaps.push({
							id: `heatmap-${appearanceId}`,
							subjectType: 'player',
							subjectId: playerId,
							matchId,
							scope: 'match',
							coordinateSystem: 'normalized-pitch',
							...createHeatmap(rng),
						});
					}
				}
			}
			for (const teamId of [scheduled.homeTeamId, scheduled.awayTeamId]) {
				for (let pairIndex = 0; pairIndex < 12; pairIndex += 1) {
					const playerA = playerByTeam.get(teamId)[pairIndex % playerByTeam.get(teamId).length];
					const playerB = playerByTeam.get(teamId)[(pairIndex + 1) % playerByTeam.get(teamId).length];
					events.push({
						id: `event-chemistry-${matchId}-${teamId}-${pairIndex}`,
						matchId,
						teamId,
						type: 'relationship-observation',
						playerA,
						playerB,
						compatibility: decimal(rng, 0.2, 1),
					});
				}
			}
		}
	}

	if (options.heatmaps === 'season') {
		for (const season of seasons) {
			for (const player of players) {
				heatmaps.push({
					id: `heatmap-${player.id}-${season.id}`,
					subjectType: 'player',
					subjectId: player.id,
					seasonId: season.id,
					scope: 'season',
					coordinateSystem: 'normalized-pitch',
					...createHeatmap(rng),
				});
			}
		}
	}

	for (const season of seasons) {
		for (const team of teams) {
			const teamPlayers = playerByTeam.get(team.id);
			tracking.push({
				id: `tracking-${team.id}-${season.id}`,
				teamId: team.id,
				seasonId: season.id,
				subjectType: 'team',
				coordinateSystem: 'normalized-pitch',
				samplingHz: 10,
				pointCount: options.matches * 22 * 5400,
				storage: {
					format: 'jsonl',
					path: `tracking/${season.id}/${team.id}.jsonl`,
					compression: 'gzip',
				},
				playerCount: teamPlayers.length,
			});
		}
	}

	const chemistry = seasons.flatMap((season) =>
		teams.map((team) => ({
			id: `chemistry-${team.id}-${season.id}`,
			teamId: team.id,
			validFrom: season.start,
			validTo: season.end,
			overall: decimal(rng, 0.4, 0.95),
			factors: {
				familiarity: decimal(rng, 0.3, 1),
				roleClarity: decimal(rng, 0.3, 1),
				tacticalCoherence: decimal(rng, 0.3, 1),
				leadership: decimal(rng, 0.3, 1),
				morale: decimal(rng, 0.3, 1),
			},
			pairwise: Array.from({ length: Math.min(40, playerByTeam.get(team.id).length * 2) }, (_, index) => ({
				playerA: playerByTeam.get(team.id)[index % playerByTeam.get(team.id).length],
				playerB: playerByTeam.get(team.id)[(index + 1) % playerByTeam.get(team.id).length],
				affinity: decimal(rng, 0.2, 1),
				passingCompatibility: decimal(rng, 0.2, 1),
				movementCompatibility: decimal(rng, 0.2, 1),
				sampleSize: integer(rng, 1, 40),
			})),
			modelVersion: 'chemistry-synthetic-0.1',
			sourceRefs: ['source-synthetic-generator'],
		}))
	);

	const dataset = {
		$schema: 'https://felix-kramer.com/schemas/football-dataset-v1.json',
		dataset: {
			id: 'dataset-synthetic-bundesliga-2026-27',
			name: 'Synthetic Bundesliga Fixture',
			schemaVersion: '1.0.0',
			datasetVersion: '0.1.0',
			createdAt: '2026-11-25T00:00:00Z',
			updatedAt: '2026-11-25T00:00:00Z',
			sourceType: 'synthetic-fixture',
			defaultTimeZone: 'Europe/Berlin',
			defaultCoordinateSystem: 'normalized-pitch',
			units: { distance: 'km', speed: 'kmh', duration: 'minutes' },
		},
		competitions,
		seasons: seasonRecords,
		teams,
		teamParticipations: participations,
		players,
		memberships,
		teamSnapshots,
		playerSnapshots,
		tacticalProfiles,
		matches,
		matchAppearances: appearances,
		events,
		heatmaps,
		tracking,
		chemistry,
		provenance: [
			{
				id: 'source-synthetic-generator',
				type: 'synthetic',
				provider: 'generate-dataset-fixture.mjs',
				name: 'Deterministic synthetic fixture',
				license: 'internal-test-data',
				method: 'seeded-prng',
			},
		],
	};

	return dataset;
}

function bytes(value) {
	return `${(Buffer.byteLength(value) / 1024 / 1024).toFixed(2)} MiB`;
}

function writeOutput(dataset, options, elapsedMs) {
	const outputDir = options.output.startsWith('/') ? options.output : join(ROOT, options.output);
	mkdirSync(outputDir, { recursive: true });

	const compact = JSON.stringify(dataset);
	const pretty = JSON.stringify(dataset, null, 2);
	const report = {
		generatedAt: new Date().toISOString(),
		seed: options.seed,
		options,
		generationMs: Math.round(elapsedMs),
		records: Object.fromEntries(
			Object.entries(dataset)
				.filter(([, value]) => Array.isArray(value))
				.map(([key, value]) => [key, value.length])
		),
		sizes: {
			compactJson: bytes(compact),
			prettyJson: bytes(pretty),
			gzip: bytes(gzipSync(compact, { level: 9 })),
			brotli: bytes(brotliCompressSync(compact)),
		},
	};

	writeFileSync(join(outputDir, 'dataset.json'), compact);
	writeFileSync(join(outputDir, 'dataset.pretty.json'), `${pretty}\n`);
	writeFileSync(join(outputDir, 'size-report.json'), `${JSON.stringify(report, null, 2)}\n`);

	console.log(`Generated synthetic dataset in ${outputDir}`);
	console.log(`Records: ${JSON.stringify(report.records)}`);
	console.log(`Sizes: ${JSON.stringify(report.sizes)}`);
	console.log(`Generation time: ${report.generationMs} ms`);
}

const options = parseArgs(process.argv.slice(2));
const startedAt = performance.now();
const dataset = createDataset(options);
writeOutput(dataset, options, performance.now() - startedAt);

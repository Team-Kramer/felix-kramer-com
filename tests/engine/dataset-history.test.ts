import { describe, expect, it } from 'vitest';
import { createMinimalDataset } from '$lib/engine/dataset/fixture';
import {
	appearancesForPlayer,
	chemistryForTeam,
	eventsForMatch,
	eventsForPlayer,
	heatmapForSubject,
	hasHistory,
	matchesForCompetition,
	matchesForTeam,
	playerTeamAt,
	seasonAggregates,
	teamForm,
	teamParticipationAt,
	teamSquadAt,
	trackingForSubject,
	appendPlayerSnapshot,
	appendTeamSnapshot,
	resolvePlayerSnapshot,
	resolveTeamSnapshot
} from '$lib/engine/dataset/history';
import { validateDataset } from '$lib/engine/dataset/schema';
import type { FootballDataset } from '$lib/engine/dataset/types';

/** A small but complete historical dataset: transfers, loans, snapshots, matches. */
function createHistoricalDataset(): FootballDataset {
	return validateDataset({
		$schema: 'https://felix-kramer.com/schemas/football-dataset-v1.json',
		dataset: {
			id: 'dataset-history-test',
			name: 'History Test Dataset',
			schemaVersion: '1.0.0',
			datasetVersion: '1.0.0',
			createdAt: '2026-11-26T00:00:00Z',
			updatedAt: '2026-11-26T00:00:00Z',
			sourceType: 'synthetic-fixture',
			defaultTimeZone: 'Europe/Berlin',
			defaultCoordinateSystem: 'normalized-pitch',
			units: { distance: 'km', speed: 'kmh', duration: 'minutes' }
		},
		competitions: [
			{
				id: 'comp-test-league',
				type: 'league',
				countryCode: 'XX',
				name: 'Test League',
				shortName: 'TL',
				level: 1,
				gender: 'male',
				seasonIds: ['season-2025']
			}
		],
		seasons: [
			{
				id: 'season-2025',
				competitionId: 'comp-test-league',
				name: '2025/26',
				startDate: '2025-08-01',
				endDate: '2026-05-31'
			}
		],
		teams: [
			{
				id: 'team-alpha',
				canonicalName: 'Alpha United',
				shortName: 'ALP',
				countryCode: 'XX',
				aliases: [],
				colors: { primary: '#3366FF' }
			},
			{
				id: 'team-beta',
				canonicalName: 'Beta City',
				shortName: 'BET',
				countryCode: 'XX',
				aliases: [],
				colors: { primary: '#FF6633' }
			},
			{
				id: 'team-national-fn03',
				canonicalName: 'National Team FN03',
				shortName: 'FN03',
				countryCode: 'FN03',
				aliases: [],
				colors: { primary: '#33AA33' }
			}
		],
		teamParticipations: [
			{
				id: 'part-alpha-2025',
				competitionId: 'comp-test-league',
				seasonId: 'season-2025',
				teamId: 'team-alpha',
				status: 'active',
				position: null,
				points: null,
				validFrom: '2025-08-01',
				validTo: null
			},
			{
				id: 'part-beta-2025',
				competitionId: 'comp-test-league',
				seasonId: 'season-2025',
				teamId: 'team-beta',
				status: 'active',
				position: null,
				points: null,
				validFrom: '2025-08-01',
				validTo: null
			}
		],
		players: [
			{
				id: 'player-rossi',
				canonicalName: 'Rossi',
				nationalityCodes: ['FN01'],
				positions: ['FWD'],
				status: 'active'
			},
			{
				id: 'player-luigi',
				canonicalName: 'Luigi',
				nationalityCodes: ['FN02'],
				positions: ['MID'],
				status: 'active'
			},
			{
				id: 'player-mario',
				canonicalName: 'Mario',
				nationalityCodes: ['FN03'],
				positions: ['DEF'],
				status: 'active'
			}
		],
		memberships: [
			// Rossi transfers from Alpha to Beta in summer 2025.
			{
				id: 'memb-rossi-alpha',
				playerId: 'player-rossi',
				teamId: 'team-alpha',
				role: 'player',
				contractType: 'permanent',
				validFrom: '2023-01-01',
				validTo: '2025-07-31'
			},
			{
				id: 'memb-rossi-beta',
				playerId: 'player-rossi',
				teamId: 'team-beta',
				role: 'player',
				contractType: 'permanent',
				validFrom: '2025-08-01',
				validTo: null
			},
			// Luigi is on loan at Beta while permanently registered at Alpha.
			{
				id: 'memb-luigi-alpha',
				playerId: 'player-luigi',
				teamId: 'team-alpha',
				role: 'player',
				contractType: 'permanent',
				validFrom: '2024-01-01',
				validTo: null
			},
			{
				id: 'memb-luigi-beta',
				playerId: 'player-luigi',
				teamId: 'team-beta',
				role: 'player',
				contractType: 'loan',
				validFrom: '2025-08-01',
				validTo: '2026-06-30'
			},
			// Mario plays for Alpha and his national team.
			{
				id: 'memb-mario-alpha',
				playerId: 'player-mario',
				teamId: 'team-alpha',
				role: 'player',
				contractType: 'permanent',
				validFrom: '2020-01-01',
				validTo: null
			},
			{
				id: 'memb-mario-national',
				playerId: 'player-mario',
				teamId: 'team-national-fn03',
				role: 'national-team',
				validFrom: '2021-01-01',
				validTo: null
			}
		],
		teamSnapshots: [
			{
				id: 'snap-alpha-2024',
				teamId: 'team-alpha',
				validFrom: '2024-01-01',
				validTo: '2025-07-31',
				rating: { elo: 1500 }
			},
			{
				id: 'snap-alpha-2025',
				teamId: 'team-alpha',
				validFrom: '2025-08-01',
				validTo: null,
				rating: { elo: 1550 }
			},
			{
				id: 'snap-beta-2025',
				teamId: 'team-beta',
				validFrom: '2025-08-01',
				validTo: null,
				rating: { elo: 1520 }
			}
		],
		playerSnapshots: [
			{
				id: 'psnap-rossi-2024',
				playerId: 'player-rossi',
				validFrom: '2024-01-01',
				validTo: '2025-07-31',
				scale: { min: 1, max: 20 },
				ability: { current: 15 },
				attributes: { technical: { finishing: 14 } },
				assessmentType: 'observed'
			},
			{
				id: 'psnap-rossi-2025',
				playerId: 'player-rossi',
				validFrom: '2025-08-01',
				validTo: null,
				scale: { min: 1, max: 20 },
				ability: { current: 16 },
				attributes: { technical: { finishing: 15 } },
				assessmentType: 'scouted'
			}
		],
		tacticalProfiles: [],
		matches: [
			{
				id: 'match-1',
				competitionId: 'comp-test-league',
				seasonId: 'season-2025',
				dateTime: '2025-08-16T15:30:00Z',
				homeTeamId: 'team-alpha',
				awayTeamId: 'team-beta',
				status: 'finished',
				score: { home: 2, away: 1 }
			},
			{
				id: 'match-2',
				competitionId: 'comp-test-league',
				seasonId: 'season-2025',
				dateTime: '2025-08-23T15:30:00Z',
				homeTeamId: 'team-beta',
				awayTeamId: 'team-alpha',
				status: 'finished',
				score: { home: 2, away: 2 }
			},
			{
				id: 'match-3',
				competitionId: 'comp-test-league',
				seasonId: 'season-2025',
				dateTime: '2025-08-30T15:30:00Z',
				homeTeamId: 'team-alpha',
				awayTeamId: 'team-beta',
				status: 'scheduled'
			}
		],
		matchAppearances: [
			{
				id: 'app-rossi-1',
				matchId: 'match-1',
				playerId: 'player-rossi',
				teamId: 'team-beta',
				started: true,
				minutes: 90,
				position: 'FWD',
				rating: 7.5,
				stats: { goals: 1, assists: 0, xg: 0.8, xa: 0.1 }
			},
			{
				id: 'app-rossi-2',
				matchId: 'match-2',
				playerId: 'player-rossi',
				teamId: 'team-beta',
				started: true,
				minutes: 60,
				position: 'FWD',
				rating: 6.5,
				stats: { goals: 0, assists: 1, xg: 0.2, xa: 0.4 }
			}
		],
		events: [
			{
				id: 'event-1',
				matchId: 'match-1',
				teamId: 'team-beta',
				actorPlayerId: 'player-rossi',
				type: 'goal',
				minute: 34,
				location: { x: 0.9, y: 0.5 }
			}
		],
		heatmaps: [
			{
				id: 'heatmap-rossi-season',
				subjectType: 'player',
				subjectId: 'player-rossi',
				scope: 'season',
				seasonId: 'season-2025',
				coordinateSystem: 'normalized-pitch',
				resolution: { width: 2, height: 2 },
				cells: [
					[0.1, 0.2],
					[0.3, 0.4]
				]
			},
			{
				id: 'heatmap-rossi-match1',
				subjectType: 'player',
				subjectId: 'player-rossi',
				scope: 'match',
				matchId: 'match-1',
				coordinateSystem: 'normalized-pitch',
				resolution: { width: 2, height: 2 },
				cells: [
					[0.5, 0.5],
					[0.5, 0.5]
				]
			}
		],
		tracking: [
			{
				id: 'tracking-rossi-match1',
				matchId: 'match-1',
				subjectType: 'player',
				subjectId: 'player-rossi',
				coordinateSystem: 'normalized-pitch',
				samplingHz: 25,
				pointCount: 13500,
				storage: { format: 'jsonl', path: 'tracking/rossi-match1.jsonl', compression: 'gzip' }
			}
		],
		chemistry: [
			{
				id: 'chem-beta-2025',
				teamId: 'team-beta',
				validFrom: '2025-08-01',
				validTo: null,
				overall: 0.7,
				pairwise: [
					{ playerA: 'player-rossi', playerB: 'player-luigi', affinity: 0.8 }
				],
				modelVersion: 'v1'
			}
		],
		provenance: []
	});
}

describe('resolveTeamSnapshot', () => {
	const dataset = createHistoricalDataset();

	it('resolves the snapshot valid for the given date', () => {
		expect(resolveTeamSnapshot(dataset, 'team-alpha', '2024-06-01')?.id).toBe('snap-alpha-2024');
		expect(resolveTeamSnapshot(dataset, 'team-alpha', '2025-09-01')?.id).toBe('snap-alpha-2025');
	});

	it('falls back to undefined when no snapshot covers the date', () => {
		expect(resolveTeamSnapshot(dataset, 'team-alpha', '2023-01-01')).toBeUndefined();
	});
});

describe('resolvePlayerSnapshot', () => {
	const dataset = createHistoricalDataset();

	it('resolves the snapshot valid for the given date', () => {
		expect(resolvePlayerSnapshot(dataset, 'player-rossi', '2024-06-01')?.id).toBe('psnap-rossi-2024');
		expect(resolvePlayerSnapshot(dataset, 'player-rossi', '2025-09-01')?.id).toBe('psnap-rossi-2025');
	});
});

describe('playerTeamAt (transfers, loans, national teams)', () => {
	const dataset = createHistoricalDataset();

	it('follows a transfer across the validTo/validFrom boundary', () => {
		expect(playerTeamAt(dataset, 'player-rossi', '2025-07-31')?.teamId).toBe('team-alpha');
		expect(playerTeamAt(dataset, 'player-rossi', '2025-08-01')?.teamId).toBe('team-beta');
	});

	it('prefers the permanent registration over a concurrent loan', () => {
		expect(playerTeamAt(dataset, 'player-luigi', '2025-09-01')?.teamId).toBe('team-alpha');
	});

	it('prefers the club over the national team', () => {
		expect(playerTeamAt(dataset, 'player-mario', '2025-09-01')?.teamId).toBe('team-alpha');
	});

	it('returns undefined when no membership is active', () => {
		expect(playerTeamAt(dataset, 'player-rossi', '2022-01-01')).toBeUndefined();
	});
});

describe('teamSquadAt', () => {
	const dataset = createHistoricalDataset();

	it('lists the squad for a team at a date (n:m aware)', () => {
		const squad = teamSquadAt(dataset, 'team-beta', '2025-09-01');
		expect(squad.map((membership) => membership.playerId).sort()).toEqual([
			'player-luigi',
			'player-rossi'
		]);
	});
});

describe('teamParticipationAt', () => {
	const dataset = createHistoricalDataset();

	it('lists active participations for a date', () => {
		expect(teamParticipationAt(dataset, 'team-alpha', '2025-09-01').map((p) => p.seasonId)).toEqual([
			'season-2025'
		]);
		expect(teamParticipationAt(dataset, 'team-alpha', '2024-01-01')).toEqual([]);
	});
});

describe('match queries', () => {
	const dataset = createHistoricalDataset();

	it('returns a team matches oldest first', () => {
		const matches = matchesForTeam(dataset, 'team-alpha');
		expect(matches.map((match) => match.id)).toEqual(['match-1', 'match-2', 'match-3']);
	});

	it('filters by status and season', () => {
		const finished = matchesForTeam(dataset, 'team-alpha', { status: 'finished' });
		expect(finished).toHaveLength(2);
		const otherSeason = matchesForCompetition(dataset, 'comp-test-league', 'no-such-season');
		expect(otherSeason).toEqual([]);
	});
});

describe('appearances and aggregates', () => {
	const dataset = createHistoricalDataset();

	it('orders a player appearances by match date', () => {
		expect(
			appearancesForPlayer(dataset, 'player-rossi').map((appearance) => appearance.matchId)
		).toEqual(['match-1', 'match-2']);
	});

	it('computes season aggregates from appearances', () => {
		const aggregate = seasonAggregates(dataset, 'player-rossi', 'season-2025');
		expect(aggregate).toEqual({
			appearances: 2,
			minutes: 150,
			goals: 1,
			assists: 1,
			xg: 1.0,
			xa: 0.5,
			averageRating: 7.0
		});
	});

	it('returns null averageRating when no rated appearances exist', () => {
		const aggregate = seasonAggregates(dataset, 'player-mario');
		expect(aggregate.averageRating).toBeNull();
		expect(aggregate.appearances).toBe(0);
	});
});

describe('teamForm', () => {
	const dataset = createHistoricalDataset();

	it('derives W/D/L from finished matches, oldest first', () => {
		expect(teamForm(dataset, 'team-alpha')).toEqual([
			{ matchId: 'match-1', dateTime: '2025-08-16T15:30:00Z', outcome: 'W' },
			{ matchId: 'match-2', dateTime: '2025-08-23T15:30:00Z', outcome: 'D' }
		]);
	});

	it('respects the window size', () => {
		expect(teamForm(dataset, 'team-alpha', 1)).toHaveLength(1);
	});
});

describe('events, chemistry, heatmaps, tracking', () => {
	const dataset = createHistoricalDataset();

	it('lists events for a match and for a player', () => {
		expect(eventsForMatch(dataset, 'match-1').map((event) => event.id)).toEqual(['event-1']);
		expect(eventsForPlayer(dataset, 'player-rossi')).toHaveLength(1);
	});

	it('resolves team chemistry for a date', () => {
		expect(chemistryForTeam(dataset, 'team-beta', '2025-09-01')?.overall).toBe(0.7);
		expect(chemistryForTeam(dataset, 'team-alpha', '2025-09-01')).toBeUndefined();
	});

	it('finds heatmaps by subject and scope without raw tracking data', () => {
		expect(heatmapForSubject(dataset, 'player', 'player-rossi', 'season')?.id).toBe(
			'heatmap-rossi-season'
		);
		expect(heatmapForSubject(dataset, 'player', 'player-rossi', 'match')?.id).toBe(
			'heatmap-rossi-match1'
		);
		expect(heatmapForSubject(dataset, 'team', 'team-alpha')).toBeUndefined();
	});

	it('returns tracking references only (no raw data)', () => {
		const tracking = trackingForSubject(dataset, 'player', 'player-rossi');
		expect(tracking).toHaveLength(1);
		expect(tracking[0].storage.path).toBe('tracking/rossi-match1.jsonl');
	});
});

describe('append-only snapshots', () => {
	const dataset = createHistoricalDataset();

	it('appends a correction without removing the original', () => {
		const corrected = appendTeamSnapshot(dataset, {
			id: 'snap-alpha-2025-correction',
			teamId: 'team-alpha',
			validFrom: '2025-08-01',
			validTo: null,
			rating: { elo: 1560 }
		});
		expect(corrected.teamSnapshots).toHaveLength(dataset.teamSnapshots.length + 1);
		// Same validFrom, appended later → the correction wins the resolution.
		expect(resolveTeamSnapshot(corrected, 'team-alpha', '2025-09-01')?.rating.elo).toBe(1560);
		// The original snapshot is still there.
		expect(resolveTeamSnapshot(dataset, 'team-alpha', '2025-09-01')?.rating.elo).toBe(1550);
	});

	it('rejects a duplicate snapshot id', () => {
		expect(() =>
			appendTeamSnapshot(dataset, {
				id: 'snap-alpha-2025',
				teamId: 'team-alpha',
				validFrom: '2026-01-01',
				validTo: null,
				rating: { elo: 1600 }
			})
		).toThrow(/already exists/);
	});

	it('appends player snapshots the same way', () => {
		const corrected = appendPlayerSnapshot(dataset, {
			id: 'psnap-rossi-2025-correction',
			playerId: 'player-rossi',
			validFrom: '2025-08-01',
			validTo: null,
			scale: { min: 1, max: 20 },
			ability: { current: 17 },
			attributes: {},
			assessmentType: 'derived'
		});
		expect(resolvePlayerSnapshot(corrected, 'player-rossi', '2025-09-01')?.ability?.current).toBe(
			17
		);
	});
});

describe('minimal dataset without history', () => {
	const minimal = createMinimalDataset();
	const teamId = minimal.teams[0].id;

	it('reports no history', () => {
		expect(hasHistory(minimal)).toBe(false);
	});

	it('degrades to empty results instead of throwing', () => {
		expect(matchesForTeam(minimal, teamId)).toEqual([]);
		expect(teamSquadAt(minimal, teamId, '2026-01-01')).toEqual([]);
		expect(teamForm(minimal, teamId)).toEqual([]);
		expect(chemistryForTeam(minimal, teamId, '2026-01-01')).toBeUndefined();
		expect(heatmapForSubject(minimal, 'team', teamId)).toBeUndefined();
		// The minimal fixture carries a team snapshot, so it resolves.
		expect(resolveTeamSnapshot(minimal, teamId, '2026-06-01')?.rating.elo).toBe(1600);
		expect(resolveTeamSnapshot(minimal, teamId, '2025-12-31')).toBeUndefined();
		expect(seasonAggregates(minimal, 'player-fictional-alpha').averageRating).toBeNull();
	});
});

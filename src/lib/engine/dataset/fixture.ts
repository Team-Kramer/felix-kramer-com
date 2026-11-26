import type { FootballDataset } from './types';

export function createMinimalDataset(): FootballDataset {
	return {
		$schema: 'https://felix-kramer.com/schemas/football-dataset-v1.json',
		dataset: {
			id: 'dataset-fictional-minimal',
			name: 'Fictional Minimal Dataset',
			schemaVersion: '1.0.0',
			datasetVersion: '1.0.0',
			createdAt: '2026-11-26T00:00:00Z',
			updatedAt: '2026-11-26T00:00:00Z',
			sourceType: 'synthetic-fixture',
			defaultTimeZone: 'Europe/Berlin',
			defaultCoordinateSystem: 'normalized-pitch',
			units: { distance: 'km', speed: 'kmh', duration: 'minutes' },
		},
		competitions: [],
		seasons: [],
		teams: [
			{
				id: 'team-fictional-alpha',
				canonicalName: 'Fictional Alpha',
				shortName: 'ALP',
				countryCode: 'XX',
				aliases: [],
				colors: { primary: '#3366FF' },
			},
			{
				id: 'team-fictional-beta',
				canonicalName: 'Fictional Beta',
				shortName: 'BET',
				countryCode: 'XX',
				aliases: [],
				colors: { primary: '#FF6633' },
			},

		],
		teamParticipations: [],
		players: [],
		memberships: [],
		teamSnapshots: [
			{
				id: 'snapshot-team-fictional-alpha-current',
				teamId: 'team-fictional-alpha',
				validFrom: '2026-01-01',
				validTo: null,
				rating: { elo: 1600 },
			},
			{
				id: 'snapshot-team-fictional-beta-current',
				teamId: 'team-fictional-beta',
				validFrom: '2026-01-01',
				validTo: null,
				rating: { elo: 1550 },
			},

		],
		playerSnapshots: [],
		tacticalProfiles: [],
		matches: [],
		matchAppearances: [],
		events: [],
		heatmaps: [],
		tracking: [],
		chemistry: [],
		provenance: [],
	};

}

export function createDetailedFixture(): FootballDataset {
	const dataset = createMinimalDataset();
	dataset.dataset.id = 'dataset-fictional-detailed';
	dataset.dataset.name = 'Fictional Detailed Dataset';
	dataset.competitions = [
		{
			id: 'competition-fictional-league',
			type: 'league',
			countryCode: 'XX',
			name: 'Fictional League',
			shortName: 'FL',
			level: 1,
			gender: 'mixed',
			seasonIds: ['season-fictional-2026'],
		},
	];
	dataset.seasons = [
		{
			id: 'season-fictional-2026',
			competitionId: 'competition-fictional-league',
			name: '2026/27',
			startDate: '2026-08-01',
			endDate: '2027-06-30',
		},
	];
	dataset.teamParticipations = dataset.teams.map((team, index) => ({
		id: `participation-${team.id}`,
		competitionId: 'competition-fictional-league',
		seasonId: 'season-fictional-2026',
		teamId: team.id,
		status: 'active',
		position: index + 1,
		points: index === 0 ? 3 : 0,
		validFrom: '2026-08-01',
		validTo: '2027-06-30',
	}));
	dataset.players = [
		{
			id: 'player-fictional-alpha',
			canonicalName: 'Alex Example',
			nationalityCodes: ['XX'],
			positions: ['ST'],
			preferredFoot: 'right',
			status: 'active',
		},
	];
	dataset.memberships = [
		{
			id: 'membership-player-fictional-alpha',
			playerId: 'player-fictional-alpha',
			teamId: 'team-fictional-alpha',
			role: 'player',
			contractType: 'permanent',
			squadNumber: 9,
			validFrom: '2026-08-01',
			validTo: null,
		},
	];
	dataset.playerSnapshots = [
		{
			id: 'snapshot-player-fictional-alpha',
			playerId: 'player-fictional-alpha',
			validFrom: '2026-08-01',
			validTo: null,
			scale: { min: 1, max: 20 },
			ability: { current: 15, potential: 17, confidence: 0.8 },
			attributes: {
				technical: { finishing: 16, passing: 12 },
				mental: { composure: 14, teamwork: 13 },
				physical: { acceleration: 15, stamina: 14 },
			},
			weaknesses: [{ type: 'aerial-duels', severity: 0.3, confidence: 0.7 }],
			traits: ['runs-behind'],
			assessmentType: 'scouted',
			sourceRefs: ['source-fictional-scout'],
		},
	];
	dataset.tacticalProfiles = [
		{
			id: 'profile-player-fictional-alpha-st',
			playerId: 'player-fictional-alpha',
			validFrom: '2026-08-01',
			validTo: null,
			role: 'pressing-forward',
			position: 'ST',
			roleFit: 0.85,
			preferredZones: ['central-attack'],
		},
	];
	dataset.provenance = [
		{
			id: 'source-fictional-scout',
			type: 'synthetic',
			provider: 'fixture-generator',
			name: 'Fictional scout assessment',
			license: 'internal-test-data',
			method: 'deterministic fixture',
		},
	];
	dataset.matches = [
		{
			id: 'match-fictional-opening',
			competitionId: 'competition-fictional-league',
			seasonId: 'season-fictional-2026',
			dateTime: '2026-08-08T15:30:00Z',
			homeTeamId: 'team-fictional-alpha',
			awayTeamId: 'team-fictional-beta',
			status: 'finished',
			score: { home: 2, away: 1 },
		},
	];
	dataset.matchAppearances = [
		{
			id: 'appearance-player-fictional-alpha',
			matchId: 'match-fictional-opening',
			playerId: 'player-fictional-alpha',
			teamId: 'team-fictional-alpha',
			started: true,
			minutes: 90,
			position: 'ST',
			rating: 8.1,
			stats: { goals: 1, xg: 0.7 },
			heatmapRef: 'heatmap-player-fictional-alpha',
		},
	];
	dataset.heatmaps = [
		{
			id: 'heatmap-player-fictional-alpha',
			subjectType: 'player',
			subjectId: 'player-fictional-alpha',
			scope: 'match',
			matchId: 'match-fictional-opening',
			coordinateSystem: 'normalized-pitch',
			resolution: { width: 2, height: 2 },
			cells: [
				[0.1, 0.2],
				[0.4, 0.3],
			],
			normalization: { method: 'sum-to-one', sum: 1 },
		},
	];
	dataset.chemistry = [
		{
			id: 'chemistry-fictional-alpha',
			teamId: 'team-fictional-alpha',
			validFrom: '2026-08-01',
			validTo: null,
			overall: 0.75,
			modelVersion: 'fixture-v1',
		},
	];
	return dataset;
}

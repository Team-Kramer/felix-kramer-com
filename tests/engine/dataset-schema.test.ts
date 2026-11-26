import { describe, expect, it } from 'vitest';
import { toEngineTeams, teamsForCompetition } from '$lib/engine/dataset/adapter';
import { createDetailedFixture, createMinimalDataset } from '$lib/engine/dataset/fixture';
import { getDefaultDataset, getDefaultEngineTeams } from '$lib/engine/dataset';
import { DatasetImportError, parseDatasetJson } from '$lib/engine/dataset/import';
import { serializeDataset } from '$lib/engine/dataset/export';
import {
	DATASET_STORAGE_KEY,
	clearStoredDataset,
	loadStoredDataset,
	saveStoredDataset
} from '$lib/engine/dataset/storage';
import { DatasetValidationError, validateDataset } from '$lib/engine/dataset/schema';
import type { FootballDataset } from '$lib/engine/dataset/types';

const dataset: FootballDataset = {
	$schema: 'https://felix-kramer.com/schemas/football-dataset-v1.json',
	dataset: {
		id: 'dataset-test',
		name: 'Test dataset',
		schemaVersion: '1.0.0',
		datasetVersion: '1.0.0',
		createdAt: '2026-11-25T00:00:00Z',
		updatedAt: '2026-11-25T00:00:00Z',
		sourceType: 'synthetic-fixture',
		defaultTimeZone: 'Europe/Berlin',
		defaultCoordinateSystem: 'normalized-pitch',
		units: { distance: 'km', speed: 'kmh', duration: 'minutes' },
	},
	competitions: [
		{
			id: 'competition-test',
			type: 'league',
			countryCode: 'XX',
			name: 'Test League',
			shortName: 'TL',
			level: 1,
			gender: 'mixed',
			seasonIds: ['season-test'],
		},
	],
	seasons: [
		{
			id: 'season-test',
			competitionId: 'competition-test',
			name: 'Test Season',
			startDate: '2026-08-01',
			endDate: '2027-06-30',
		},
	],
	teams: [
		{
			id: 'team-test',
			canonicalName: 'Test Team',
			shortName: 'TST',
			countryCode: 'XX',
			aliases: [],
		},
	],
	teamParticipations: [],
	players: [],
	memberships: [],
	teamSnapshots: [],
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

describe('validateDataset', () => {
	it('accepts a minimal canonical dataset', () => {
		expect(validateDataset(dataset)).toBe(dataset);
	});

	it('round-trips canonical JSON through import and export', () => {
		const fixture = createDetailedFixture();
		const restored = parseDatasetJson(serializeDataset(fixture));
		expect(restored).toEqual(fixture);
	});

	it('reports malformed JSON explicitly', () => {
		expect(() => parseDatasetJson('{')).toThrow(DatasetImportError);
	});

	it('persists and clears a dataset in localStorage', () => {
		const fixture = createMinimalDataset();
		clearStoredDataset();
		saveStoredDataset(fixture);
		expect(localStorage.getItem(DATASET_STORAGE_KEY)).toBeTruthy();
		expect(loadStoredDataset()).toEqual(fixture);
		clearStoredDataset();
		expect(loadStoredDataset()).toBeNull();
	});

	it('exposes a validated fictional default through the dataset entry point', () => {
		expect(getDefaultDataset().dataset.sourceType).toBe('synthetic-fixture');
		expect(getDefaultEngineTeams('2026-11-26')).toHaveLength(2);
	});

	it('reports duplicate IDs and missing references', () => {
		const invalid = {
			...dataset,
			teams: [dataset.teams[0], dataset.teams[0]],
			seasons: [{ ...dataset.seasons[0], competitionId: 'missing-competition' }],
		};

		expect(() => validateDataset(invalid)).toThrow(DatasetValidationError);
		try {
			validateDataset(invalid);
		} catch (error) {
			expect(error).toBeInstanceOf(DatasetValidationError);
			expect((error as DatasetValidationError).issues).toEqual(
				expect.arrayContaining([
					expect.objectContaining({ path: 'teams[1].id' }),
					expect.objectContaining({ path: 'seasons[0].competitionId' }),
				])
			);
		}
	});

	it('maps dated team snapshots to engine teams', () => {
		const fixture = createMinimalDataset();
		expect(toEngineTeams(fixture, { asOf: '2026-11-26' })).toEqual([
			{ id: 'team-fictional-alpha', name: 'Fictional Alpha', elo: 1600, color: '#3366FF' },
			{ id: 'team-fictional-beta', name: 'Fictional Beta', elo: 1550, color: '#FF6633' },
		]);
	});

	it('accepts a detailed fictional dataset fixture', () => {
		const fixture = createDetailedFixture();
		expect(validateDataset(fixture)).toBe(fixture);
		expect(fixture.players).toHaveLength(1);
		expect(fixture.matches).toHaveLength(1);
		expect(fixture.heatmaps[0].cells).toHaveLength(2);
	});

	it('filters teams by competition participation', () => {
		const fixture = createMinimalDataset();
		fixture.competitions = [
			{
				id: 'competition-fictional',
				type: 'league',
				countryCode: 'XX',
				name: 'Fictional League',
				shortName: 'FL',
				level: 1,
				gender: 'mixed',
				seasonIds: ['season-fictional'],
			},
		];
		fixture.seasons = [
			{
				id: 'season-fictional',
				competitionId: 'competition-fictional',
				name: '2026/27',
				startDate: '2026-08-01',
				endDate: '2027-06-30',
			},
		];
		fixture.teamParticipations = [
			{
				id: 'participation-alpha',
				competitionId: 'competition-fictional',
				seasonId: 'season-fictional',
				teamId: 'team-fictional-alpha',
				status: 'active',
				position: null,
				points: null,
				validFrom: '2026-08-01',
				validTo: '2027-06-30',
			},
		];

		expect(teamsForCompetition(fixture, 'competition-fictional', 'season-fictional')).toHaveLength(1);
	});

	it('rejects invalid temporal, range, and heatmap data', () => {
		const invalid = {
			...dataset,
			teamSnapshots: [
				{
					id: 'snapshot-invalid',
					teamId: 'team-test',
					validFrom: '2027-01-01',
					validTo: '2026-01-01',
					rating: { elo: 1500 },
				},
			],
			tacticalProfiles: [
				{
					id: 'profile-invalid',
					playerId: 'missing-player',
					validFrom: '2026-01-01',
					validTo: null,
					role: 'forward',
					position: 'ST',
					roleFit: 1.5,
				},
			],
			heatmaps: [
				{
					id: 'heatmap-invalid',
					subjectType: 'team',
					subjectId: 'team-test',
					scope: 'season',
					coordinateSystem: 'normalized-pitch',
					resolution: { width: 2, height: 2 },
					cells: [[0.1, 0.2]],
				},
			],
		};

		expect(() => validateDataset(invalid)).toThrow(DatasetValidationError);
		try {
			validateDataset(invalid);
		} catch (error) {
			expect((error as DatasetValidationError).issues).toEqual(
				expect.arrayContaining([
					expect.objectContaining({ path: 'teamSnapshots[0].validTo' }),
					expect.objectContaining({ path: 'tacticalProfiles[0].roleFit' }),
					expect.objectContaining({ path: 'heatmaps[0].cells' }),
				])
			);
		}
	});
});

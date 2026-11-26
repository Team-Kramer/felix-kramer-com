import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it, afterEach } from 'vitest';
import { parseDatasetJson } from '$lib/engine/dataset/import';
import { createMinimalDataset } from '$lib/engine/dataset/fixture';
import { getDefaultDataset } from '$lib/engine/dataset';
import { datasetStore, replaceDataset, resetDataset } from '$lib/engine/dataset/store.svelte';
import { clearStoredDataset, loadStoredDataset, saveStoredDataset } from '$lib/engine/dataset/storage';
import { render } from '@testing-library/svelte';
import Match from '../../src/routes/match/+page.svelte';
import League from '../../src/routes/league/+page.svelte';
import Tournament from '../../src/routes/tournament/+page.svelte';
import Bracket from '../../src/routes/bracket/+page.svelte';
import Draft from '../../src/routes/draft/+page.svelte';

const routeCases = [Match, League, Tournament, Bracket, Draft];

afterEach(async () => {
	await resetDataset();
});

describe('release candidate static dataset', () => {
	it('imports the dataset served by the built-site static path', async () => {
		const json = await readFile(resolve('static/data/bundesliga-2026-27-real/dataset.json'), 'utf8');
		const dataset = parseDatasetJson(json);
		expect(dataset.dataset.id).toBe('bundesliga-2026-27-real');
		expect(dataset.teams).toHaveLength(18);
	});

	it.each(routeCases.map((route, index) => [index, route] as const))('renders simulator route %i with fallback and imported dataset', async (_index, Route) => {
		replaceDataset(getDefaultDataset(), false);
		expect(() => render(Route)).not.toThrow();
		const real = parseDatasetJson(await readFile(resolve('static/data/bundesliga-2026-27-real/dataset.json'), 'utf8'));
		replaceDataset(real);
		expect(() => render(Route)).not.toThrow();
		expect(datasetStore.dataset?.dataset.id).toBe('bundesliga-2026-27-real');
	});

	it('round-trips persistence and reset restores the default dataset', async () => {
		const real = parseDatasetJson(await readFile(resolve('static/data/bundesliga-2026-27-real/dataset.json'), 'utf8'));
		await clearStoredDataset();
		await saveStoredDataset(real);
		expect((await loadStoredDataset())?.dataset.id).toBe(real.dataset.id);
		replaceDataset(real);
		await resetDataset();
		expect(datasetStore.dataset?.dataset.id).toBe(getDefaultDataset().dataset.id);
		expect(datasetStore.isUserDataset).toBe(false);
		expect(await loadStoredDataset()).toBeNull();
	});
});

import { describe, expect, it, vi } from 'vitest';
import { createMinimalDataset } from '$lib/engine/dataset/fixture';
import { loadStoredDataset, saveStoredDataset, clearStoredDataset, LOCAL_STORAGE_SIZE_LIMIT } from '$lib/engine/dataset/storage';

describe('dataset storage fallback', () => {
	it('uses localStorage when IndexedDB is unavailable', async () => {
		const dataset = createMinimalDataset();
		localStorage.clear();
		await saveStoredDataset(dataset);
		expect((await loadStoredDataset())?.dataset.id).toBe(dataset.dataset.id);
		await clearStoredDataset();
		expect(await loadStoredDataset()).toBeNull();
	});

	it('exports the 2 MB localStorage threshold', () => {
		expect(LOCAL_STORAGE_SIZE_LIMIT).toBe(2 * 1024 * 1024);
	});
});

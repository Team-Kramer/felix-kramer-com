import { describe, expect, it, vi } from 'vitest';
import { createMinimalDataset } from '$lib/engine/dataset/fixture';
import { checkStorageAvailable, loadStoredDataset, saveStoredDataset, clearStoredDataset, LOCAL_STORAGE_SIZE_LIMIT } from '$lib/engine/dataset/storage';
import { checkImportSize, DatasetImportError, MAX_IMPORT_FILE_SIZE } from '$lib/engine/dataset/import';

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

	it('accepts datasets within the 20 MB import limit', () => {
		checkImportSize({ size: MAX_IMPORT_FILE_SIZE } as File);
		expect(() => checkImportSize({ size: MAX_IMPORT_FILE_SIZE + 1 } as File)).toThrow(DatasetImportError);
	});

	it('reports storage availability when localStorage works', async () => {
		await expect(checkStorageAvailable()).resolves.toBeUndefined();
	});
});

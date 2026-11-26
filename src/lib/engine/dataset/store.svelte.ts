import { getDefaultDataset } from './index';
import { DatasetValidationError, validateDataset } from './schema';
import { importDatasetFile } from './import';
import { checkStorageAvailable, clearStoredDataset, loadStoredDataset, saveStoredDataset } from './storage';
import { serializeDataset } from './export';
import type { FootballDataset } from './types';

export const datasetStore = $state<{
	dataset: FootballDataset | null;
	isUserDataset: boolean;
	initialized: boolean;
	storageAvailable: boolean;
	error: string | null;
}>({
	dataset: null,
	isUserDataset: false,
	initialized: false,
	storageAvailable: true,
	error: null,
});

export async function initializeDataset(): Promise<void> {
	if (datasetStore.initialized) return;
	try {
		await checkStorageAvailable();
	} catch (error) {
		datasetStore.storageAvailable = false;
		datasetStore.dataset = getDefaultDataset();
		datasetStore.error = error instanceof Error ? error.message : 'Browser storage is not available.';
		datasetStore.initialized = true;
		return;
	}
	try {
		const stored = await loadStoredDataset();
		if (stored) {
			datasetStore.dataset = stored;
			datasetStore.isUserDataset = true;
		} else {
			datasetStore.dataset = getDefaultDataset();
		}
	} catch (error) {
		datasetStore.dataset = getDefaultDataset();
		datasetStore.error =
			error instanceof DatasetValidationError ? error.issues.map((issue) => issue.path).join(', ') : 'Stored dataset could not be loaded.';
	}
	datasetStore.initialized = true;
}

export async function importDatasetFileIntoStore(file: File): Promise<void> {
	try {
		const dataset = await importDatasetFile(file);
		// Persist first so the in-memory state never diverges from storage.
		await saveStoredDataset(dataset);
		datasetStore.dataset = dataset;
		datasetStore.isUserDataset = true;
		datasetStore.error = null;
	} catch (error) {
		datasetStore.error = error instanceof Error ? error.message : 'Dataset import failed.';
		throw error;
	}
}

export async function resetDataset(): Promise<void> {
	try {
		await clearStoredDataset();
	} catch {
		// Storage unavailable — the in-memory reset below is still applied.
	}
	datasetStore.dataset = getDefaultDataset();
	datasetStore.isUserDataset = false;
	datasetStore.error = null;
}

export function exportDatasetFile(profile: import('./export').DatasetExportProfile = 'internal-complete'): void {
	if (!datasetStore.dataset) throw new Error('No dataset is loaded.');
	const blob = new Blob([serializeDataset(datasetStore.dataset, true, profile)], { type: 'application/json' });
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = `${datasetStore.dataset.dataset.id}.json`;
	link.click();
	URL.revokeObjectURL(url);
}

export function replaceDataset(dataset: FootballDataset, userProvided = true): void {
	const validated = validateDataset(dataset);
	datasetStore.dataset = validated;
	datasetStore.isUserDataset = userProvided;
	datasetStore.error = null;
}

import { parseDatasetJson } from './import';
import { serializeDataset } from './export';
import type { FootballDataset } from './types';

export const DATASET_STORAGE_KEY = 'fk-dataset-v1';

export class DatasetStorageError extends Error {
	constructor(message: string, cause?: unknown) {
		super(message, { cause });
		this.name = 'DatasetStorageError';
	}
}

function getStorage(): Storage | null {
	if (typeof localStorage === 'undefined') return null;
	return localStorage;
}

export function loadStoredDataset(): FootballDataset | null {
	const storage = getStorage();
	if (!storage) return null;
	try {
		const serialized = storage.getItem(DATASET_STORAGE_KEY);
		return serialized === null ? null : parseDatasetJson(serialized);
	} catch (error) {
		if (error instanceof SyntaxError) {
			throw new DatasetStorageError('Stored dataset could not be read.', error);
		}
		throw error;
	}
}

export function saveStoredDataset(dataset: FootballDataset): void {
	const storage = getStorage();
	if (!storage) throw new DatasetStorageError('localStorage is not available.');
	try {
		storage.setItem(DATASET_STORAGE_KEY, serializeDataset(dataset, false));
	} catch (error) {
		throw new DatasetStorageError('Dataset could not be saved to localStorage.', error);
	}
}

export function clearStoredDataset(): void {
	const storage = getStorage();
	if (!storage) return;
	try {
		storage.removeItem(DATASET_STORAGE_KEY);
	} catch (error) {
		throw new DatasetStorageError('Stored dataset could not be cleared.', error);
	}
}

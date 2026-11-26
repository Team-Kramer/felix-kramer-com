import { parseDatasetJson } from './import';
import { serializeDataset } from './export';
import { clearDatasetRecord, loadDatasetRecord, saveDatasetRecord } from './idb';
import type { FootballDataset } from './types';

export const DATASET_STORAGE_KEY = 'fk-dataset-v1';
export const LOCAL_STORAGE_SIZE_LIMIT = 2 * 1024 * 1024;

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

function hasIndexedDb(): boolean {
	return typeof indexedDB !== 'undefined';
}

/**
 * Verifies that at least one storage backend accepts a write.
 * Throws a DatasetStorageError when neither localStorage nor IndexedDB is usable.
 */
export async function checkStorageAvailable(): Promise<void> {
	const storage = getStorage();
	if (storage) {
		const probeKey = `${DATASET_STORAGE_KEY}-probe`;
		try {
			storage.setItem(probeKey, '1');
			storage.removeItem(probeKey);
			return;
		} catch {
			// fall through to IndexedDB
		}
	}
	if (!hasIndexedDb()) throw new DatasetStorageError('No browser storage is available.');
	try {
		await new Promise<void>((resolve, reject) => {
			const request = indexedDB.open('fk-storage-probe', 1);
			request.onupgradeneeded = () => request.result.createObjectStore('probe');
			request.onsuccess = () => {
				const db = request.result;
				const tx = db.transaction('probe', 'readwrite');
				tx.objectStore('probe').put('1', 'key');
				tx.oncomplete = () => { db.close(); resolve(); };
				tx.onerror = () => { db.close(); reject(tx.error); };
			};
			request.onerror = () => reject(request.error);
		});
	} catch (error) {
		throw new DatasetStorageError('Browser storage is not available.', error);
	}
}

export function loadStoredDataset(): FootballDataset | null | Promise<FootballDataset | null> {
	const storage = getStorage();
	let serialized: string | null = null;
	try {
		serialized = storage?.getItem(DATASET_STORAGE_KEY) ?? null;
	} catch (error) {
		throw new DatasetStorageError('Stored dataset could not be read.', error);
	}
	if (serialized !== null) {
		try { return parseDatasetJson(serialized); }
		catch (error) {
			if (error instanceof SyntaxError) throw new DatasetStorageError('Stored dataset could not be read.', error);
			throw error;
		}
	}
	if (!hasIndexedDb()) return null;
	return loadDatasetRecord(DATASET_STORAGE_KEY).then((value) => value === null ? null : parseDatasetJson(value)).catch((error) => {
		if (error instanceof DatasetStorageError) throw error;
		throw new DatasetStorageError('Stored dataset could not be read from IndexedDB.', error);
	});
}

export function saveStoredDataset(dataset: FootballDataset): void | Promise<void> {
	const storage = getStorage();
	if (!storage && !hasIndexedDb()) throw new DatasetStorageError('localStorage is not available.');
	const serialized = serializeDataset(dataset, false);
	if (serialized.length <= LOCAL_STORAGE_SIZE_LIMIT && storage) {
		try {
			storage.setItem(DATASET_STORAGE_KEY, serialized);
			if (hasIndexedDb()) return clearDatasetRecord(DATASET_STORAGE_KEY).catch(() => undefined);
			return;
		} catch (error) {
			throw new DatasetStorageError('Dataset could not be saved to localStorage.', error);
		}
	}
	if (!hasIndexedDb()) {
		console.warn('IndexedDB is unavailable; storing the large dataset in localStorage.');
		if (!storage) throw new DatasetStorageError('No browser storage is available.');
		try { storage.setItem(DATASET_STORAGE_KEY, serialized); }
		catch (error) { throw new DatasetStorageError('Dataset could not be saved to localStorage.', error); }
		return;
	}
	return saveDatasetRecord(DATASET_STORAGE_KEY, serialized).then(() => {
		try { storage?.removeItem(DATASET_STORAGE_KEY); } catch { /* stale local data is non-fatal */ }
	}).catch((error) => { throw new DatasetStorageError('Dataset could not be saved to IndexedDB.', error); });
}

export function clearStoredDataset(): void | Promise<void> {
	const storage = getStorage();
	try { storage?.removeItem(DATASET_STORAGE_KEY); }
	catch (error) { throw new DatasetStorageError('Stored dataset could not be cleared.', error); }
	if (hasIndexedDb()) return clearDatasetRecord(DATASET_STORAGE_KEY);
}

const DATABASE_NAME = 'fk-dataset';
const STORE_NAME = 'datasets';

function available(): boolean {
	return typeof indexedDB !== 'undefined';
}

function openDatabase(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DATABASE_NAME, 1);
		request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error ?? new Error('IndexedDB could not be opened.'));
	});
}

export async function loadDatasetRecord(key: string): Promise<string | null> {
	if (!available()) return null;
	const db = await openDatabase();
	return new Promise((resolve, reject) => {
		const request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(key);
		request.onsuccess = () => resolve(typeof request.result === 'string' ? request.result : null);
		request.onerror = () => reject(request.error);
	});
}

export async function saveDatasetRecord(key: string, value: string): Promise<void> {
	if (!available()) throw new Error('IndexedDB is not available.');
	const db = await openDatabase();
	return new Promise((resolve, reject) => {
		const request = db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).put(value, key);
		request.onsuccess = () => resolve();
		request.onerror = () => reject(request.error);
	});
}

export async function clearDatasetRecord(key: string): Promise<void> {
	if (!available()) return;
	const db = await openDatabase();
	return new Promise((resolve, reject) => {
		const request = db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).delete(key);
		request.onsuccess = () => resolve();
		request.onerror = () => reject(request.error);
	});
}

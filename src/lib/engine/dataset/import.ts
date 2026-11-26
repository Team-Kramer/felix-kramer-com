import { DatasetValidationError, validateDataset } from './schema';
import type { FootballDataset } from './types';

export class DatasetImportError extends Error {
	readonly cause: unknown;

	constructor(message: string, cause?: unknown) {
		super(message);
		this.name = 'DatasetImportError';
		this.cause = cause;
	}
}

/** 20 MB keeps browser parsing and storage realistic for a single JSON file. */
export const MAX_IMPORT_FILE_SIZE = 20 * 1024 * 1024;

export function checkImportSize(file: File): void {
	if (file.size > MAX_IMPORT_FILE_SIZE) {
		throw new DatasetImportError(`Dataset file is too large (${(file.size / 1024 / 1024).toFixed(1)} MB, maximum ${MAX_IMPORT_FILE_SIZE / 1024 / 1024} MB).`);
	}
}

export function parseDatasetJson(json: string): FootballDataset {
	let value: unknown;
	try {
		value = JSON.parse(json);
	} catch (error) {
		throw new DatasetImportError('Dataset is not valid JSON.', error);
	}

	try {
		return validateDataset(value);
	} catch (error) {
		if (error instanceof DatasetValidationError) throw error;
		throw new DatasetImportError('Dataset could not be validated.', error);
	}
}

export async function importDatasetFile(file: File): Promise<FootballDataset> {
	if (typeof file?.text !== 'function') {
		throw new DatasetImportError('Selected file cannot be read.');
	}
	checkImportSize(file);
	return parseDatasetJson(await file.text());
}

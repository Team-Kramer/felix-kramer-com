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
	return parseDatasetJson(await file.text());
}

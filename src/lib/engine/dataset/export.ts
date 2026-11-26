import { validateDataset } from './schema';
import type { FootballDataset } from './types';

export function serializeDataset(dataset: FootballDataset, pretty = true): string {
	const validated = validateDataset(dataset);
	return JSON.stringify(validated, null, pretty ? 2 : 0);
}

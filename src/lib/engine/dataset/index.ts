import { toEngineTeams } from './adapter';
import { createMinimalDataset } from './fixture';
import { validateDataset } from './schema';
import type { FootballDataset } from './types';
import type { Team } from '../types';

export * from './history';

let defaultDataset: FootballDataset | undefined;

export function getDefaultDataset(): FootballDataset {
	if (!defaultDataset) {
		defaultDataset = validateDataset(createMinimalDataset());
	}
	return defaultDataset;
}

export function getDefaultEngineTeams(asOf = new Date().toISOString().slice(0, 10)): Team[] {
	return toEngineTeams(getDefaultDataset(), { asOf });
}

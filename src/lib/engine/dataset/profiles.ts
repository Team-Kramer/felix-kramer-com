import { projectDataset, type DatasetExportProfile } from './export';
import type { FootballDataset } from './types';

export type GameMode = 'match' | 'league' | 'tournament' | 'bracket' | 'draft' | 'editor';

const profilesByGameMode: Record<GameMode, DatasetExportProfile> = {
	match: 'simulation-compact',
	league: 'simulation',
	tournament: 'simulation',
	bracket: 'simulation',
	draft: 'detailed',
	editor: 'internal-complete',
};

export function profileForGameMode(mode: GameMode): DatasetExportProfile {
	return profilesByGameMode[mode];
}

/** Project the stored dataset for an engine working set without mutating the store. */
export function projectForGameMode(dataset: FootballDataset, mode: GameMode): FootballDataset {
	return projectDataset(dataset, profileForGameMode(mode));
}

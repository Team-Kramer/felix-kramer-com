import type { Player } from '../draft';
import type { FootballDataset } from './types';

export function toDraftPlayers(dataset: FootballDataset, wcYear = 2026): Player[] {
	if (dataset.players.length > 0) return dataset.players.filter((p) => p.status === 'active').map((p, index) => ({
		id: p.id, name: p.canonicalName, nation: p.nationalityCodes[0] ?? `FN${index + 1}`, wcYear,
		position: (['GK', 'DEF', 'MID', 'FWD'] as Player['position'][]).find((position) => p.positions.includes(position)) ?? 'MID',
		rating: Math.round(dataset.playerSnapshots.find((s) => s.playerId === p.id)?.ability?.current ?? 60),
	}));
	return Array.from({ length: 48 }, (_, index) => ({
		id: `player-fictional-${String(index + 1).padStart(2, '0')}`,
		name: `Fictional Player ${String(index + 1).padStart(2, '0')}`,
		nation: `FN${String((index % 16) + 1).padStart(2, '0')}`,
		wcYear,
		position: (['GK', 'DEF', 'MID', 'FWD'] as Player['position'][])[index % 4],
		rating: 62 + (index % 29),
	}));
}

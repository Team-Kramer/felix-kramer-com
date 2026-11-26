import { describe, expect, it } from 'vitest';
import { createMinimalDataset } from '$lib/engine/dataset/fixture';
import { routeTeamsForCompetition } from '$lib/engine/dataset/adapter';
import { toDraftPlayers } from '$lib/engine/dataset/draft-adapter';
import { projectForGameMode, profileForGameMode } from '$lib/engine/dataset/profiles';
import { validateDataset } from '$lib/engine/dataset/schema';

describe('dataset route adapters', () => {
	it('resolves fictional league and tournament pools from competition participation', () => {
		const dataset = createMinimalDataset();
		expect(routeTeamsForCompetition(dataset, 'competition-fictional-bundesliga', 18)).toHaveLength(18);
		expect(routeTeamsForCompetition(dataset, 'competition-fictional-wc2026', 48)).toHaveLength(48);
		expect(routeTeamsForCompetition(dataset, 'competition-fictional-bracket', 64)).toHaveLength(64);
	});

	it('maps fictional dataset players to draft players with stable defaults', () => {
		const players = toDraftPlayers(createMinimalDataset());
		expect(players).toHaveLength(48);
		expect(players[0]).toMatchObject({ id: 'player-fictional-01', name: 'Fictional Player 01', nation: 'FN01', wcYear: 2026, position: 'GK' });
		expect(players.every((player) => player.rating >= 0 && player.rating <= 100)).toBe(true);
	});
});


describe('game mode dataset profiles', () => {
	it('projects a schema-valid working set without changing the stored dataset', () => {
		const source = createMinimalDataset();
		const before = JSON.stringify(source);
		const projected = projectForGameMode(source, 'league');

		expect(profileForGameMode('match')).toBe('simulation-compact');
		expect(() => validateDataset(projected)).not.toThrow();
		expect(JSON.stringify(source)).toBe(before);
		expect(projected).not.toBe(source);
	});
});

import { describe, it, expect } from 'vitest';
import {
	createSwiss,
	finalStandings,
	isComplete,
	nextPairings,
	simulateRound,
} from '$lib/engine/swiss.js';
import { rngFromString } from '$lib/engine/prng.js';
import type { Team } from '$lib/engine/types.js';

function teams(n: number): Team[] {
	return Array.from({ length: n }, (_, i) => ({
		id: `t${i + 1}`,
		name: `Team ${String(i + 1).padStart(2, '0')}`,
		elo: 2000 - i * 20,
	}));
}

describe('swiss', () => {
	it('round 0 pairs by name order (all teams level)', () => {
		const state = createSwiss(teams(8), 5);
		const pairings = nextPairings(state);
		expect(pairings).toHaveLength(4);
		// All 0 points → sorted by name → 1v2, 3v4, 5v6, 7v8.
		const pairs = pairings.map((p) => [p.home, p.away].sort().join('|'));
		expect(pairs).toEqual(['t1|t2', 't3|t4', 't5|t6', 't7|t8']);
	});

	it('no rematches across all rounds', () => {
		const state = createSwiss(teams(8), 5);
		const rng = rngFromString('swiss-no-rematch');
		const eloOf = (id: string) => state.teams.find((t) => t.id === id)!.elo;
		const seen = new Set<string>();
		while (!isComplete(state)) {
			simulateRound(state, rng, eloOf);
			for (const p of state.rounds[state.rounds.length - 1]) {
				const key = [p.home, p.away].sort().join('|');
				expect(seen.has(key)).toBe(false);
				seen.add(key);
			}
		}
		// 8 teams × 5 rounds / 2 = 20 unique pairings.
		expect(seen.size).toBe(20);
	});

	it('each team plays exactly totalRounds matches', () => {
		const state = createSwiss(teams(8), 5);
		const rng = rngFromString('swiss-count');
		const eloOf = (id: string) => state.teams.find((t) => t.id === id)!.elo;
		while (!isComplete(state)) simulateRound(state, rng, eloOf);
		for (const s of state.standings) {
			expect(s.played).toBe(5);
		}
	});

	it('final standings sorted by points → GD → GF', () => {
		const state = createSwiss(teams(8), 5);
		const rng = rngFromString('swiss-standings');
		const eloOf = (id: string) => state.teams.find((t) => t.id === id)!.elo;
		while (!isComplete(state)) simulateRound(state, rng, eloOf);
		const standings = finalStandings(state);
		for (let i = 1; i < standings.length; i++) {
			const a = standings[i - 1];
			const b = standings[i];
			const aKey = [a.points, a.goalDiff, a.goalsFor];
			const bKey = [b.points, b.goalDiff, b.goalsFor];
			expect(
				aKey[0] > bKey[0] ||
					(aKey[0] === bKey[0] && aKey[1] > bKey[1]) ||
					(aKey[0] === bKey[0] && aKey[1] === bKey[1] && aKey[2] >= bKey[2])
			).toBe(true);
		}
	});

	it('isComplete transitions false → true after totalRounds', () => {
		const state = createSwiss(teams(8), 3);
		const rng = rngFromString('swiss-complete');
		const eloOf = (id: string) => state.teams.find((t) => t.id === id)!.elo;
		expect(isComplete(state)).toBe(false);
		simulateRound(state, rng, eloOf);
		expect(isComplete(state)).toBe(false);
		simulateRound(state, rng, eloOf);
		expect(isComplete(state)).toBe(false);
		simulateRound(state, rng, eloOf);
		expect(isComplete(state)).toBe(true);
		// Requesting pairings after completion throws.
		expect(() => nextPairings(state)).toThrow();
	});

	it('rejects an odd number of teams', () => {
		const state = createSwiss(teams(7), 5);
		expect(() => nextPairings(state)).toThrow();
	});
});

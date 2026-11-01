import { describe, it, expect } from 'vitest';
import { updateElo, K_STANDARD, K_WORLD_CUP } from '$lib/engine/elo-update.js';

describe('elo-update', () => {
	it('upset (weak team wins) → big rating swing', () => {
		const [a, b] = updateElo(1500, 1800, 'home');
		expect(a).toBeGreaterThan(1500);
		expect(b).toBeLessThan(1800);
		// Underdog wins: home gains a lot (expected score ~0.15 → delta ~17).
		expect(a - 1500).toBeGreaterThan(15);
	});

	it('favorite wins → smaller swing than upset', () => {
		const fav = updateElo(1800, 1500, 'home');
		const upset = updateElo(1500, 1800, 'home');
		expect(Math.abs(fav[0] - 1800)).toBeLessThan(Math.abs(upset[0] - 1500));
	});

	it('draw → ratings move toward each other', () => {
		const [a, b] = updateElo(1500, 1800, 'draw');
		expect(a).toBeGreaterThan(1500); // weaker team gains on a draw
		expect(b).toBeLessThan(1800); // stronger team loses
	});

	it('equal ratings + draw → no change', () => {
		const [a, b] = updateElo(1500, 1500, 'draw');
		expect(a).toBeCloseTo(1500, 5);
		expect(b).toBeCloseTo(1500, 5);
	});

	it('ratings are conserved (zero-sum)', () => {
		const [a, b] = updateElo(1600, 1400, 'away');
		expect(a + b).toBeCloseTo(3000, 5);
	});

	it('K_WORLD_CUP moves ratings more than K_STANDARD', () => {
		const std = updateElo(1500, 1800, 'home', K_STANDARD);
		const wc = updateElo(1500, 1800, 'home', K_WORLD_CUP);
		expect(Math.abs(wc[0] - 1500)).toBeGreaterThan(Math.abs(std[0] - 1500));
	});

	it('away win is the mirror of home win', () => {
		const homeWin = updateElo(1500, 1800, 'home');
		const awayWin = updateElo(1800, 1500, 'away');
		// Swapping sides should mirror the deltas.
		expect(homeWin[0] - 1500).toBeCloseTo(awayWin[1] - 1500, 5);
	});
});

import { describe, it, expect } from 'vitest';
import { eloWinProbability, eloSplit, expectedGoals, BASE_GOALS } from '$lib/engine/elo.js';

describe('elo', () => {
	it('equal ratings → 50/50 win probability', () => {
		expect(eloWinProbability(1500, 1500)).toBeCloseTo(0.5, 5);
	});

	it('higher rating → higher win probability', () => {
		expect(eloWinProbability(1700, 1500)).toBeGreaterThan(0.5);
		expect(eloWinProbability(1500, 1700)).toBeLessThan(0.5);
	});

	it('200 Elo gap ≈ 75% win probability', () => {
		// Standard Elo: 200 points ≈ 0.75.
		expect(eloWinProbability(1700, 1500)).toBeCloseTo(0.759, 1);
	});

	it('eloSplit sums to 1', () => {
		const s = eloSplit(1600, 1400);
		expect(s.home + s.draw + s.away).toBeCloseTo(1, 5);
	});

	it('eloSplit: stronger home team has higher home share', () => {
		const s = eloSplit(1700, 1400);
		expect(s.home).toBeGreaterThan(s.away);
		expect(s.home).toBeGreaterThan(0.5);
	});

	it('expectedGoals: total ≈ 2 * base', () => {
		const g = expectedGoals(1500, 1500);
		expect(g.home + g.away).toBeCloseTo(2 * BASE_GOALS, 3);
	});

	it('expectedGoals: equal ratings → equal λ (before home adv)', () => {
		const g = expectedGoals(1500, 1500, { homeAdvantage: 1 });
		expect(g.home).toBeCloseTo(g.away, 5);
	});

	it('expectedGoals: stronger team has higher λ', () => {
		const g = expectedGoals(1800, 1300);
		expect(g.home).toBeGreaterThan(g.away);
	});

	it('expectedGoals: chaos 100 → λA ≈ λB ≈ base', () => {
		const g = expectedGoals(2000, 1000, { chaos: 100, homeAdvantage: 1 });
		expect(g.home).toBeCloseTo(BASE_GOALS, 1);
		expect(g.away).toBeCloseTo(BASE_GOALS, 1);
	});

	it('expectedGoals: chaos 0 → full Elo influence (big gap)', () => {
		const g = expectedGoals(2000, 1000, { chaos: 0, homeAdvantage: 1 });
		expect(g.home).toBeGreaterThan(g.away * 2);
	});
});

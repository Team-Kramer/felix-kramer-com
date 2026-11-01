import { describe, it, expect } from 'vitest';
import {
	poissonPmf,
	scoreMatrix,
	matchProbabilities,
	sampleScore,
	simulateMatch,
	MAX_GOALS
} from '$lib/engine/poisson.js';
import { mulberry32 } from '$lib/engine/prng.js';

describe('poisson', () => {
	it('poissonPmf sums to ~1 over a wide range', () => {
		let sum = 0;
		for (let k = 0; k < 30; k++) sum += poissonPmf(k, 1.5);
		expect(sum).toBeCloseTo(1, 3);
	});

	it('poissonPmf: λ=0 → P(0)=1', () => {
		expect(poissonPmf(0, 0)).toBe(1);
		expect(poissonPmf(1, 0)).toBe(0);
	});

	it('scoreMatrix sums to 1', () => {
		const m = scoreMatrix(1.4, 1.1);
		let sum = 0;
		for (let h = 0; h <= MAX_GOALS; h++)
			for (let a = 0; a <= MAX_GOALS; a++) sum += m[h][a];
		expect(sum).toBeCloseTo(1, 5);
	});

	it('matchProbabilities sums to 1', () => {
		const p = matchProbabilities(1.5, 1.0);
		expect(p.home + p.draw + p.away).toBeCloseTo(1, 5);
	});

	it('matchProbabilities: stronger home team → higher home win prob', () => {
		const p = matchProbabilities(2.0, 0.8);
		expect(p.home).toBeGreaterThan(p.away);
		expect(p.home).toBeGreaterThan(0.4);
	});

	it('matchProbabilities: equal λ → home ≈ away (symmetric)', () => {
		const p = matchProbabilities(1.3, 1.3);
		expect(p.home).toBeCloseTo(p.away, 5);
		expect(p.draw).toBeGreaterThan(0.2);
	});

	it('sampleScore is deterministic with a fixed seed', () => {
		const a = sampleScore(mulberry32(5), 1.5, 1.0);
		const b = sampleScore(mulberry32(5), 1.5, 1.0);
		expect(a).toEqual(b);
	});

	it('sampleScore: distribution sanity (mean ≈ λ)', () => {
		const rng = mulberry32(123);
		let sumH = 0;
		const n = 5000;
		for (let i = 0; i < n; i++) sumH += sampleScore(rng, 1.5, 1.0).home;
		const mean = sumH / n;
		expect(mean).toBeGreaterThan(1.2);
		expect(mean).toBeLessThan(1.8);
	});

	it('simulateMatch: final score matches event goal count', () => {
		const rng = mulberry32(8);
		const r = simulateMatch(rng, 1.6, 1.2);
		const homeGoals = r.events.filter((e) => e.type === 'goal' && e.team === 'home').length;
		const awayGoals = r.events.filter((e) => e.type === 'goal' && e.team === 'away').length;
		expect(homeGoals).toBe(r.homeScore);
		expect(awayGoals).toBe(r.awayScore);
	});

	it('simulateMatch: events are sorted by minute', () => {
		const rng = mulberry32(21);
		const r = simulateMatch(rng, 2.0, 1.5);
		for (let i = 1; i < r.events.length; i++) {
			expect(r.events[i].minute).toBeGreaterThanOrEqual(r.events[i - 1].minute);
		}
	});

	it('simulateMatch: deterministic with fixed seed', () => {
		const a = simulateMatch(mulberry32(3), 1.5, 1.0);
		const b = simulateMatch(mulberry32(3), 1.5, 1.0);
		expect(a).toEqual(b);
	});

	it('simulateMatch: goal attribution uses provided players', () => {
		const rng = mulberry32(4);
		const r = simulateMatch(rng, 3.0, 0.2, { homePlayers: ['A', 'B'], events: false });
		expect(r.homeScore).toBeGreaterThan(0); // ensure the assertion is not vacuous
		const goals = r.events.filter((e) => e.type === 'goal' && e.team === 'home');
		expect(goals.length).toBe(r.homeScore);
		for (const g of goals) {
			expect(['A', 'B']).toContain(g.player);
		}
	});
});

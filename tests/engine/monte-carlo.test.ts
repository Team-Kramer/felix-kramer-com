import { describe, it, expect } from 'vitest';
import { simulateN } from '$lib/engine/monte-carlo.js';
import type { Team } from '$lib/engine/types.js';

function teams(n: number, base = 2000, gap = 20): Team[] {
	return Array.from({ length: n }, (_, i) => ({
		id: `t${i + 1}`,
		name: `Team ${String(i + 1).padStart(2, '0')}`,
		elo: base - i * gap,
	}));
}

function sumProbs(probs: Record<string, number>): number {
	return Object.values(probs).reduce((a, b) => a + b, 0);
}

describe('monte-carlo', () => {
	it('1,000 runs: favorite has highest title prob; probs sum to 1 ± 0.01', () => {
		const ts = teams(16);
		const result = simulateN('single', ts, 1000, 'mc-1');
		expect(result.runs).toBe(1000);

		// The highest-Elo team (t1) must have the highest title probability.
		const favorite = ts.reduce((a, b) => (a.elo > b.elo ? a : b));
		let max = favorite.id;
		for (const t of ts) {
			if (result.titleProb[t.id] > result.titleProb[max]) max = t.id;
		}
		expect(max).toBe(favorite.id);

		// Title probabilities sum to 1 (every run produces exactly one champion).
		expect(Math.abs(sumProbs(result.titleProb) - 1)).toBeLessThan(0.01);
	});

	it('wc2026: favorite has highest title prob; probs sum to 1 ± 0.01', () => {
		const ts = teams(48);
		const result = simulateN('wc2026', ts, 200, 'mc-wc');
		expect(result.runs).toBe(200);

		const favorite = ts.reduce((a, b) => (a.elo > b.elo ? a : b));
		let max = favorite.id;
		for (const t of ts) {
			if (result.titleProb[t.id] > result.titleProb[max]) max = t.id;
		}
		expect(max).toBe(favorite.id);
		expect(Math.abs(sumProbs(result.titleProb) - 1)).toBeLessThan(0.01);

		// Qualification probabilities: 32 of 48 advance, so the average
		// qualification probability is 32/48 ≈ 0.667.
		const avgQual =
			Object.values(result.qualificationProb).reduce((a, b) => a + b, 0) / ts.length;
		expect(avgQual).toBeCloseTo(32 / 48, 1);
	});

	it('is deterministic: same seed → same probabilities', () => {
		const ts = teams(8);
		const a = simulateN('single', ts, 100, 'mc-det');
		const b = simulateN('single', ts, 100, 'mc-det');
		expect(a.titleProb).toEqual(b.titleProb);
	});

	it('different seeds produce different outcomes', () => {
		const ts = teams(8);
		const a = simulateN('single', ts, 100, 'mc-a');
		const b = simulateN('single', ts, 100, 'mc-b');
		expect(a.titleProb).not.toEqual(b.titleProb);
	});

	it('reports progress every 10%', () => {
		const ts = teams(8);
		const calls: number[] = [];
		simulateN('single', ts, 100, 'mc-prog', {
			onProgress: (done) => calls.push(done),
		});
		// 100 runs → progress at 10, 20, …, 100.
		expect(calls).toEqual([10, 20, 30, 40, 50, 60, 70, 80, 90, 100]);
	});

	it('rejects n <= 0', () => {
		expect(() => simulateN('single', teams(8), 0, 'x')).toThrow();
	});
});

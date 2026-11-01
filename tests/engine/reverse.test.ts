import { describe, it, expect } from 'vitest';
import {
	advancer,
	invertScore,
	loserOf,
	reverseAdvancer,
	winnerOf,
} from '$lib/engine/reverse.js';

describe('reverse', () => {
	describe('winnerOf / loserOf', () => {
		it('home win', () => {
			expect(winnerOf('h', 'a', 2, 1)).toBe('h');
			expect(loserOf('h', 'a', 2, 1)).toBe('a');
		});

		it('away win', () => {
			expect(winnerOf('h', 'a', 0, 3)).toBe('a');
			expect(loserOf('h', 'a', 0, 3)).toBe('h');
		});

		it('both throw on a draw', () => {
			expect(() => winnerOf('h', 'a', 1, 1)).toThrow();
			expect(() => loserOf('h', 'a', 1, 1)).toThrow();
		});
	});

	describe('reverseAdvancer', () => {
		it('the football loser advances', () => {
			// h beats a 2-1 → in reverse mode a advances.
			expect(reverseAdvancer('h', 'a', 2, 1)).toBe('a');
			expect(reverseAdvancer('h', 'a', 0, 3)).toBe('h');
		});

		it('throws on a draw (no loser exists)', () => {
			expect(() => reverseAdvancer('h', 'a', 1, 1)).toThrow();
		});
	});

	describe('invertScore', () => {
		it('inverts a home win', () => {
			// 2-1 home win → 1-3 away win (old loser gets old winner's goals + 1).
			expect(invertScore(2, 1)).toEqual({ homeScore: 1, awayScore: 3 });
		});

		it('inverts an away win', () => {
			// 0-3 away win → 4-0 home win (old loser gets old winner's goals + 1).
			expect(invertScore(0, 3)).toEqual({ homeScore: 4, awayScore: 0 });
		});

		it('leaves a draw unchanged', () => {
			expect(invertScore(1, 1)).toEqual({ homeScore: 1, awayScore: 1 });
		});

		it('the inverted score always has the other team winning', () => {
			const cases: Array<[number, number]> = [
				[2, 1],
				[1, 0],
				[0, 2],
				[3, 2],
				[0, 1],
			];
			for (const [h, a] of cases) {
				const inv = invertScore(h, a);
				if (h > a) expect(inv.awayScore).toBeGreaterThan(inv.homeScore);
				else expect(inv.homeScore).toBeGreaterThan(inv.awayScore);
			}
		});
	});

	describe('advancer (central switch)', () => {
		it('normal mode: winner advances', () => {
			expect(advancer('h', 'a', 2, 1, false)).toBe('h');
			expect(advancer('h', 'a', 0, 3, false)).toBe('a');
		});

		it('reverse mode: loser advances', () => {
			expect(advancer('h', 'a', 2, 1, true)).toBe('a');
			expect(advancer('h', 'a', 0, 3, true)).toBe('h');
		});

		it('both modes throw on a draw', () => {
			expect(() => advancer('h', 'a', 1, 1, false)).toThrow();
			expect(() => advancer('h', 'a', 1, 1, true)).toThrow();
		});
	});
});

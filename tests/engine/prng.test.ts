import { describe, it, expect } from 'vitest';
import { mulberry32, seedFromString, rngFromString, randInt, shuffle } from '$lib/engine/prng.js';

describe('prng', () => {
	it('is deterministic: same seed → same sequence', () => {
		const a = mulberry32(12345);
		const b = mulberry32(12345);
		for (let i = 0; i < 100; i++) expect(a()).toBe(b());
	});

	it('produces values in [0, 1)', () => {
		const rng = mulberry32(42);
		for (let i = 0; i < 1000; i++) {
			const v = rng();
			expect(v).toBeGreaterThanOrEqual(0);
			expect(v).toBeLessThan(1);
		}
	});

	it('different seeds → different sequences', () => {
		const a = mulberry32(1);
		const b = mulberry32(2);
		const seqA = Array.from({ length: 10 }, () => a());
		const seqB = Array.from({ length: 10 }, () => b());
		expect(seqA).not.toEqual(seqB);
	});

	it('seedFromString is stable', () => {
		expect(seedFromString('wc2026')).toBe(seedFromString('wc2026'));
		expect(seedFromString('wc2026')).not.toBe(seedFromString('wc2027'));
	});

	it('seedFromString returns a 32-bit unsigned int', () => {
		const s = seedFromString('hello world');
		expect(Number.isInteger(s)).toBe(true);
		expect(s).toBeGreaterThanOrEqual(0);
		expect(s).toBeLessThanOrEqual(0xffffffff);
	});

	it('rngFromString is deterministic', () => {
		const a = rngFromString('felix');
		const b = rngFromString('felix');
		for (let i = 0; i < 50; i++) expect(a()).toBe(b());
	});

	it('randInt stays within [min, max]', () => {
		const rng = mulberry32(7);
		for (let i = 0; i < 1000; i++) {
			const v = randInt(rng, 1, 10);
			expect(v).toBeGreaterThanOrEqual(1);
			expect(v).toBeLessThanOrEqual(10);
			expect(Number.isInteger(v)).toBe(true);
		}
	});

	it('shuffle is deterministic and preserves elements', () => {
		const input = [1, 2, 3, 4, 5, 6, 7, 8];
		const a = shuffle(mulberry32(99), [...input]);
		const b = shuffle(mulberry32(99), [...input]);
		expect(a).toEqual(b);
		expect([...a].sort((x, y) => x - y)).toEqual(input);
	});
});

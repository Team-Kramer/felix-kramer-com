/**
 * Seeded pseudo-random number generator.
 *
 * Determinism is the contract: same seed + same inputs = same results. This is
 * what makes share links and golden-file tests possible.
 */

/**
 * mulberry32 — a fast, high-quality 32-bit PRNG.
 * Returns a function producing floats in [0, 1).
 *
 * @param seed 32-bit integer seed.
 */
export function mulberry32(seed: number): () => number {
	let a = seed >>> 0;
	return function () {
		a |= 0;
		a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

/**
 * FNV-1a 32-bit hash — stable string → 32-bit seed.
 *
 * Used to derive a numeric seed from a human-readable string (e.g. a share
 * link like `?seed=wc2026`). The same string always yields the same seed.
 */
export function seedFromString(str: string): number {
	let h = 0x811c9dc5; // FNV offset basis
	for (let i = 0; i < str.length; i++) {
		h ^= str.charCodeAt(i);
		h = Math.imul(h, 0x01000193); // FNV prime
	}
	return h >>> 0;
}

/** Convenience: a PRNG seeded from a string. */
export function rngFromString(str: string): () => number {
	return mulberry32(seedFromString(str));
}

/** Draw an integer in [min, max] (inclusive) from a PRNG. */
export function randInt(rng: () => number, min: number, max: number): number {
	return min + Math.floor(rng() * (max - min + 1));
}

/** Fisher–Yates shuffle (in place) using the given PRNG. */
export function shuffle<T>(rng: () => number, arr: T[]): T[] {
	for (let i = arr.length - 1; i > 0; i--) {
		const j = Math.floor(rng() * (i + 1));
		[arr[i], arr[j]] = [arr[j], arr[i]];
	}
	return arr;
}

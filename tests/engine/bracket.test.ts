import { describe, it, expect, beforeEach } from 'vitest';
import {
	champion,
	clearResult,
	createDoubleBracket,
	createSingleBracket,
	isComplete,
	readyMatches,
	resetIdCounter,
	setResult,
} from '$lib/engine/bracket.js';
import type { BracketMatch } from '$lib/engine/types.js';

function ids(n: number): string[] {
	return Array.from({ length: n }, (_, i) => `t${i + 1}`);
}

function byRound(matches: BracketMatch[], bracket: string, round: number): BracketMatch[] {
	return matches.filter((m) => m.bracket === bracket && m.round === round);
}

/** Fill a bracket to completion by repeatedly deciding ready matches. */
function fillBracket(matches: BracketMatch[], reverse = false): void {
	let guard = 0;
	while (readyMatches(matches).length > 0 && guard < 1000) {
		for (const m of readyMatches(matches)) {
			setResult(matches, m.id, 2, 1, { reverse });
		}
		guard++;
	}
}

beforeEach(() => resetIdCounter());

describe('bracket — single elimination', () => {
	it.each([4, 8, 16, 32, 64])('n=%i: n-1 matches, log2(n) rounds', (n) => {
		const matches = createSingleBracket(ids(n));
		expect(matches).toHaveLength(n - 1);
		const rounds = new Set(matches.map((m) => m.round));
		expect(Math.max(...rounds)).toBe(Math.log2(n) - 1);
	});

	it('rejects non-power-of-2', () => {
		expect(() => createSingleBracket(ids(6))).toThrow();
	});

	it('seeding: seed 1 vs seed n in round 0', () => {
		const matches = createSingleBracket(ids(8));
		const r0 = byRound(matches, 'W', 0);
		expect(r0[0].home).toBe('t1');
		expect(r0[0].away).toBe('t8');
	});

	it('fills to a champion', () => {
		const matches = createSingleBracket(ids(16));
		fillBracket(matches);
		expect(isComplete(matches)).toBe(true);
		expect(champion(matches)).not.toBeNull();
	});

	it('reverse mode: the football loser advances', () => {
		const matches = createSingleBracket(ids(4));
		const r0 = byRound(matches, 'W', 0);
		// t1 (home) beats t4 2-1 on the pitch; in reverse mode t4 advances.
		setResult(matches, r0[0].id, 2, 1, { reverse: true });
		expect(r0[0].winner).toBe('t1');
		expect(r0[0].advancer).toBe('t4');
	});
});

describe('bracket — double elimination', () => {
	it.each([8, 16, 32])('n=%i: 3n/2 - 1 total matches', (n) => {
		const matches = createDoubleBracket(ids(n));
		expect(matches).toHaveLength((3 * n) / 2 - 1);
		// Exactly one grand final.
		expect(matches.filter((m) => m.bracket === 'GF')).toHaveLength(1);
	});

	it('rejects out-of-range sizes', () => {
		expect(() => createDoubleBracket(ids(4))).toThrow();
		expect(() => createDoubleBracket(ids(64))).toThrow();
	});

	it('fills to a champion', () => {
		const matches = createDoubleBracket(ids(8));
		fillBracket(matches);
		expect(isComplete(matches)).toBe(true);
		expect(champion(matches)).not.toBeNull();
	});

	it('round-1 losers drop to the loser bracket', () => {
		const matches = createDoubleBracket(ids(8));
		const w0 = byRound(matches, 'W', 0);
		const l0 = byRound(matches, 'L', 0);
		// Decide the two W0 matches that feed L0.0.
		setResult(matches, w0[0].id, 2, 1); // t1 beats t8 → t8 drops
		setResult(matches, w0[1].id, 1, 2); // t7 beats t2 → t2 drops
		expect(l0[0].home).toBe('t8');
		expect(l0[0].away).toBe('t2');
	});
});

describe('bracket — result-change recalculation (Renderfoot behavior)', () => {
	it('changing a QF resets the fed SF slot and the final, keeps the sibling SF', () => {
		const matches = createSingleBracket(ids(16));
		fillBracket(matches);
		const originalChampion = champion(matches);
		expect(originalChampion).not.toBeNull();

		// The QF at (W, round 1, index 0) feeds SF (W, round 2, index 0) home slot.
		const qf = matches.find((m) => m.bracket === 'W' && m.round === 1 && m.index === 0)!;
		const sf = matches.find((m) => m.bracket === 'W' && m.round === 2 && m.index === 0)!;
		const sfSibling = matches.find((m) => m.bracket === 'W' && m.round === 2 && m.index === 1)!;
		const final = matches.find((m) => m.bracket === 'W' && m.round === 3)!;
		const oldAdvancer = qf.advancer;

		// Flip the QF result so the other team advances.
		const newAdvancer = qf.winner === qf.home ? qf.away : qf.home;
		setResult(matches, qf.id, qf.homeScore! === 2 ? 1 : 2, qf.homeScore! === 2 ? 2 : 1);

		// The QF now advances the other team.
		expect(qf.advancer).toBe(newAdvancer);
		expect(qf.advancer).not.toBe(oldAdvancer);

		// The fed SF slot was reset and re-populated with the new advancer.
		expect(sf.home).toBe(newAdvancer);
		// The SF is no longer decided (its result was invalidated).
		expect(sf.decided).toBe(false);
		expect(sf.homeScore).toBeNull();

		// The final's slot fed by this SF was cleared.
		expect(final.home).toBeNull();
		expect(final.decided).toBe(false);

		// The sibling SF (fed by a different QF) is untouched.
		expect(sfSibling.decided).toBe(true);
		expect(sfSibling.homeScore).not.toBeNull();

		// The bracket is no longer complete.
		expect(isComplete(matches)).toBe(false);
		expect(champion(matches)).toBeNull();

		// Re-filling resolves to a valid champion again.
		fillBracket(matches);
		expect(isComplete(matches)).toBe(true);
		expect(champion(matches)).not.toBeNull();
	});

	it('clearResult resets a match and its downstream', () => {
		const matches = createSingleBracket(ids(8));
		fillBracket(matches);
		const qf = matches.find((m) => m.bracket === 'W' && m.round === 1 && m.index === 0)!;
		const sf = matches.find((m) => m.bracket === 'W' && m.round === 2 && m.index === 0)!;
		clearResult(matches, qf.id);
		expect(qf.decided).toBe(false);
		expect(sf.decided).toBe(false);
		expect(isComplete(matches)).toBe(false);
	});
});

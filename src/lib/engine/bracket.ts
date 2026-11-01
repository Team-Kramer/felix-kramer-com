/**
 * Knockout bracket logic: single elimination and double elimination.
 *
 * Key contract: `setResult()` sets a match result, propagates the winner to
 * the next match, and **invalidates + recalculates all downstream matches**
 * (their scores/winners are cleared so they can be re-simulated). This is
 * what lets the UI let a user change an earlier result and watch the bracket
 * re-resolve.
 */

import type { BracketMatch } from './types.js';

let idCounter = 0;
function nextId(prefix: string): string {
	idCounter += 1;
	return `${prefix}-${idCounter}`;
}

/** Reset the id counter (for deterministic tests). */
export function resetIdCounter(): void {
	idCounter = 0;
}

function makeMatch(
	bracket: BracketMatch['bracket'],
	round: number,
	index: number
): BracketMatch {
	return {
		id: nextId(bracket),
		bracket,
		round,
		index,
		home: null,
		away: null,
		homeScore: null,
		awayScore: null,
		winner: null,
		loser: null,
		advancer: null,
		next: null,
		nextSlot: null,
		loserNext: null,
		loserNextSlot: null,
		decided: false,
	};
}

function findMatch(matches: BracketMatch[], id: string): BracketMatch {
	const m = matches.find((x) => x.id === id);
	if (!m) throw new Error(`Match not found: ${id}`);
	return m;
}

/**
 * Create a single-elimination bracket.
 * @param teamIds ordered team ids (seeding order); length must be a power of 2.
 */
export function createSingleBracket(teamIds: string[]): BracketMatch[] {
	const n = teamIds.length;
	if (n < 2 || (n & (n - 1)) !== 0) {
		throw new Error(`Team count must be a power of 2 (got ${n})`);
	}
	const rounds = Math.log2(n);
	const matches: BracketMatch[] = [];

	// Round 0: n/2 matches.
	const round0: BracketMatch[] = [];
	for (let i = 0; i < n / 2; i++) {
		const m = makeMatch('W', 0, i);
		m.home = teamIds[i];
		m.away = teamIds[n - 1 - i]; // seed 1 vs seed n, etc.
		round0.push(m);
	}
	matches.push(...round0);

	// Subsequent rounds.
	let prev = round0;
	for (let r = 1; r < rounds; r++) {
		const count = n / Math.pow(2, r + 1);
		const cur: BracketMatch[] = [];
		for (let i = 0; i < count; i++) {
			const m = makeMatch('W', r, i);
			const a = prev[i * 2];
			const b = prev[i * 2 + 1];
			a.next = m.id;
			a.nextSlot = 'home';
			b.next = m.id;
			b.nextSlot = 'away';
			cur.push(m);
		}
		matches.push(...cur);
		prev = cur;
	}

	return matches;
}

/**
 * Create a double-elimination bracket (simplified, no bracket reset).
 *
 * Structure:
 * - Winner's bracket W1..Wk (single elimination over all n teams).
 * - Loser's bracket L1..L(k-1): single elimination over the n/2 teams that
 *   lost in round 1 of the winner's bracket.
 * - Grand final: winner's champion vs. loser's champion.
 *
 * Simplification: only round-1 losers drop to the loser's bracket (no
 * bracket reset / re-entry for later-round losers). This keeps the graph a
 * clean DAG that always converges. Documented in tests.
 *
 * @param teamIds ordered team ids; length must be a power of 2, 8–32.
 */
export function createDoubleBracket(teamIds: string[]): BracketMatch[] {
	const n = teamIds.length;
	if (n < 8 || n > 32 || (n & (n - 1)) !== 0) {
		throw new Error(`Team count must be a power of 2 between 8 and 32 (got ${n})`);
	}
	const k = Math.log2(n);
	const matches: BracketMatch[] = [];

	// --- Winner's bracket (single elimination over all n teams) ---
	const wRounds: BracketMatch[][] = [];
	const round0: BracketMatch[] = [];
	for (let i = 0; i < n / 2; i++) {
		const m = makeMatch('W', 0, i);
		m.home = teamIds[i];
		m.away = teamIds[n - 1 - i];
		round0.push(m);
	}
	matches.push(...round0);
	wRounds.push(round0);

	let prevW = round0;
	for (let r = 1; r < k; r++) {
		const count = n / Math.pow(2, r + 1);
		const cur: BracketMatch[] = [];
		for (let i = 0; i < count; i++) {
			const m = makeMatch('W', r, i);
			const a = prevW[i * 2];
			const b = prevW[i * 2 + 1];
			a.next = m.id;
			a.nextSlot = 'home';
			b.next = m.id;
			b.nextSlot = 'away';
			cur.push(m);
		}
		matches.push(...cur);
		wRounds.push(cur);
		prevW = cur;
	}
	const winnersFinal = prevW[0]; // Wk

	// --- Loser's bracket (single elimination over the n/2 round-1 losers) ---
	const lRounds: BracketMatch[][] = [];
	const lRound0: BracketMatch[] = [];
	for (let i = 0; i < n / 4; i++) {
		const m = makeMatch('L', 0, i);
		const a = wRounds[0][i * 2];
		const b = wRounds[0][i * 2 + 1];
		a.loserNext = m.id;
		a.loserNextSlot = 'home';
		b.loserNext = m.id;
		b.loserNextSlot = 'away';
		lRound0.push(m);
	}
	matches.push(...lRound0);
	lRounds.push(lRound0);

	let prevL = lRound0;
	for (let r = 1; r < k - 1; r++) {
		const count = n / Math.pow(2, r + 2);
		const cur: BracketMatch[] = [];
		for (let i = 0; i < count; i++) {
			const m = makeMatch('L', r, i);
			const a = prevL[i * 2];
			const b = prevL[i * 2 + 1];
			a.next = m.id;
			a.nextSlot = 'home';
			b.next = m.id;
			b.nextSlot = 'away';
			cur.push(m);
		}
		matches.push(...cur);
		lRounds.push(cur);
		prevL = cur;
	}
	const losersFinal = prevL[0]; // L(k-2)

	// --- Grand final ---
	const gf = makeMatch('GF', 0, 0);
	winnersFinal.next = gf.id;
	winnersFinal.nextSlot = 'home';
	losersFinal.next = gf.id;
	losersFinal.nextSlot = 'away';
	matches.push(gf);

	return matches;
}

export interface SetResultOptions {
	/** Reverse mode: the football *loser* advances instead of the winner. */
	reverse?: boolean;
}

/**
 * Set a match result and propagate.
 *
 * - Sets the score, football winner, and football loser.
 * - Advances the *advancer* to the next match (home or away slot). In normal
 *   mode the advancer is the winner; in reverse mode it is the loser.
 * - For double elimination, drops the football loser to the loser's bracket.
 * - **Invalidates all downstream matches** (clears scores/winners/decided)
 *   so they can be re-simulated.
 *
 * @returns the list of matches that were invalidated (downstream of this one).
 */
export function setResult(
	matches: BracketMatch[],
	matchId: string,
	homeScore: number,
	awayScore: number,
	options: SetResultOptions = {}
): BracketMatch[] {
	const m = findMatch(matches, matchId);
	if (m.home === null || m.away === null) {
		throw new Error(`Cannot set result: match ${matchId} has no teams yet`);
	}
	if (homeScore === awayScore) {
		throw new Error('Knockout matches cannot end in a draw');
	}
	const reverse = options.reverse ?? false;

	// Invalidate this match and everything downstream.
	const invalidated = invalidateDownstream(matches, m);

	// Set the football result.
	m.homeScore = homeScore;
	m.awayScore = awayScore;
	m.winner = homeScore > awayScore ? m.home : m.away;
	m.loser = homeScore > awayScore ? m.away : m.home;
	m.decided = true;

	// The team that advances (winner normally, loser in reverse mode).
	const advancer = reverse ? m.loser : m.winner;
	m.advancer = advancer;

	// Propagate advancer to next match.
	if (m.next && advancer !== null) {
		const next = findMatch(matches, m.next);
		if (m.nextSlot === 'home') next.home = advancer;
		else next.away = advancer;
	}

	// Drop football loser to loser's bracket (double elimination).
	// Re-propagated here because invalidateDownstream cleared the target's
	// stale team assignment when this match was re-decided.
	if (m.loserNext && m.loser !== null) {
		const loserNext = findMatch(matches, m.loserNext);
		if (m.loserNextSlot === 'home') loserNext.home = m.loser;
		else loserNext.away = m.loser;
	}

	return invalidated;
}

/**
 * Clear a match result and invalidate downstream (for "undo").
 */
export function clearResult(matches: BracketMatch[], matchId: string): void {
	const m = findMatch(matches, matchId);
	invalidateDownstream(matches, m);
	m.homeScore = null;
	m.awayScore = null;
	m.winner = null;
	m.loser = null;
	m.advancer = null;
	m.decided = false;
}

/**
 * Invalidate a match and all matches that depend on it (transitively).
 *
 * Clears scores/winners/decided everywhere downstream, and clears the specific
 * team *slot* that each downstream match is fed into by the invalidated path
 * (so a re-decided match's new advancer/loser re-populates it). Sibling slots
 * (fed by non-invalidated matches) are left intact.
 */
function invalidateDownstream(matches: BracketMatch[], root: BracketMatch): BracketMatch[] {
	const invalidated: BracketMatch[] = [];
	const visited = new Set<string>();
	// [match, slot fed by the upstream path] — null for the root.
	const queue: [BracketMatch, 'home' | 'away' | null][] = [[root, null]];
	while (queue.length > 0) {
		const [m, slot] = queue.shift()!;
		if (visited.has(m.id)) continue;
		visited.add(m.id);
		// Clear the slot this path feeds into (sibling slots stay intact).
		if (slot === 'home') m.home = null;
		else if (slot === 'away') m.away = null;
		// Clear the result.
		m.homeScore = null;
		m.awayScore = null;
		m.winner = null;
		m.loser = null;
		m.advancer = null;
		m.decided = false;
		invalidated.push(m);
		// Follow winner + loser edges, recording which slot each feeds.
		if (m.next) queue.push([findMatch(matches, m.next), m.nextSlot]);
		if (m.loserNext) queue.push([findMatch(matches, m.loserNext), m.loserNextSlot]);
	}
	return invalidated;
}

/** The champion of a completed bracket (single or double). */
export function champion(matches: BracketMatch[]): string | null {
	const final = matches.find((m) => m.bracket === 'GF') ??
		matches.filter((m) => m.bracket === 'W').sort((a, b) => b.round - a.round)[0];
	// The champion is whoever advanced from the final (winner normally,
	// loser in reverse mode).
	return final?.advancer ?? null;
}

/** All matches that are ready to be simulated (both teams set, not decided). */
export function readyMatches(matches: BracketMatch[]): BracketMatch[] {
	return matches.filter((m) => m.home !== null && m.away !== null && !m.decided);
}

/** Whether the bracket is fully decided (champion known). */
export function isComplete(matches: BracketMatch[]): boolean {
	return champion(matches) !== null;
}

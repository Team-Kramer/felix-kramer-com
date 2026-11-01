/**
 * Poisson goal model.
 *
 * Given expected goals (λ) for each side, the score distribution is the
 * product of two independent Poisson distributions. We build a score matrix
 * up to MAX_GOALS (10) and normalize it so it sums to exactly 1.
 */

import type { MatchEvent, MatchProbabilities, MatchResult } from './types.js';
import { randInt } from './prng.js';

/** Maximum goals per team considered in the score matrix (10–10). */
export const MAX_GOALS = 10;

/** P(k goals) for a Poisson(λ) distribution. */
export function poissonPmf(k: number, lambda: number): number {
	if (lambda <= 0) return k === 0 ? 1 : 0;
	return Math.exp(-lambda) * Math.pow(lambda, k) / factorial(k);
}

function factorial(n: number): number {
	let f = 1;
	for (let i = 2; i <= n; i++) f *= i;
	return f;
}

/**
 * Score matrix: `matrix[h][a]` = P(home scores h, away scores a).
 * Normalized so the whole matrix sums to 1.
 */
export function scoreMatrix(homeLambda: number, awayLambda: number): number[][] {
	const raw: number[][] = [];
	let sum = 0;
	for (let h = 0; h <= MAX_GOALS; h++) {
		const row: number[] = [];
		const ph = poissonPmf(h, homeLambda);
		for (let a = 0; a <= MAX_GOALS; a++) {
			const p = ph * poissonPmf(a, awayLambda);
			row.push(p);
			sum += p;
		}
		raw.push(row);
	}
	// Normalize (truncation at 10–10 drops a tiny tail).
	for (let h = 0; h <= MAX_GOALS; h++) {
		for (let a = 0; a <= MAX_GOALS; a++) raw[h][a] /= sum;
	}
	return raw;
}

/**
 * Win / draw / loss probabilities for the home team.
 * @param homeLambda expected home goals
 * @param awayLambda expected away goals
 */
export function matchProbabilities(homeLambda: number, awayLambda: number): MatchProbabilities {
	const matrix = scoreMatrix(homeLambda, awayLambda);
	let home = 0;
	let draw = 0;
	let away = 0;
	for (let h = 0; h <= MAX_GOALS; h++) {
		for (let a = 0; a <= MAX_GOALS; a++) {
			const p = matrix[h][a];
			if (h > a) home += p;
			else if (h === a) draw += p;
			else away += p;
		}
	}
	return { home, draw, away };
}

/**
 * Sample a single final score from the Poisson model.
 * @param rng PRNG (determinism)
 */
export function sampleScore(rng: () => number, homeLambda: number, awayLambda: number): { home: number; away: number } {
	const matrix = scoreMatrix(homeLambda, awayLambda);
	const r = rng();
	let acc = 0;
	for (let h = 0; h <= MAX_GOALS; h++) {
		for (let a = 0; a <= MAX_GOALS; a++) {
			acc += matrix[h][a];
			if (r <= acc) return { home: h, away: a };
		}
	}
	return { home: MAX_GOALS, away: MAX_GOALS };
}

export interface SimulateMatchOptions {
	/** Include non-goal events (cards, subs). Default true. */
	events?: boolean;
	/** Optional player name pools per side (for goal attribution). */
	homePlayers?: string[];
	awayPlayers?: string[];
}

/**
 * Simulate a full match: final score + a minute-by-minute event timeline.
 *
 * Goal minutes are drawn from a slightly right-skewed distribution (more goals
 * late in halves), and non-goal events are sprinkled in for realism.
 *
 * @param rng PRNG (determinism)
 * @param homeLambda expected home goals
 * @param awayLambda expected away goals
 */
export function simulateMatch(
	rng: () => number,
	homeLambda: number,
	awayLambda: number,
	options: SimulateMatchOptions = {}
): MatchResult {
	const { home, away } = sampleScore(rng, homeLambda, awayLambda);
	const events: MatchEvent[] = [];

	const addGoal = (team: 'home' | 'away', count: number, players?: string[]) => {
		for (let i = 0; i < count; i++) {
			const minute = goalMinute(rng);
			events.push({
				minute,
				type: 'goal',
				team,
				player: players && players.length > 0 ? players[randInt(rng, 0, players.length - 1)] : undefined
			});
		}
	};

	addGoal('home', home, options.homePlayers);
	addGoal('away', away, options.awayPlayers);

	if (options.events !== false) {
		// A few cards and subs for texture (deterministic given rng).
		const cards = randInt(rng, 0, 3);
		for (let i = 0; i < cards; i++) {
			events.push({
				minute: randInt(rng, 1, 90),
				type: rng() < 0.85 ? 'yellow' : 'red',
				team: rng() < 0.5 ? 'home' : 'away'
			});
		}
		const subs = randInt(rng, 1, 3);
		for (let i = 0; i < subs; i++) {
			events.push({
				minute: randInt(rng, 55, 90),
				type: 'sub',
				team: rng() < 0.5 ? 'home' : 'away'
			});
		}
	}

	events.sort((a, b) => a.minute - b.minute);
	return { homeScore: home, awayScore: away, events };
}

/**
 * Draw a goal minute in [1, 90] with a slight late-half skew.
 * Two independent uniform draws summed and clamped biases toward mid/late.
 */
function goalMinute(rng: () => number): number {
	const u = rng();
	// CDF-inversion-ish: bias toward the second half.
	const minute = Math.floor(Math.pow(u, 0.85) * 90) + 1;
	return Math.min(90, Math.max(1, minute));
}

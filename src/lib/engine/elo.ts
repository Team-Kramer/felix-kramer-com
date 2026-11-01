/**
 * Elo → expected-goals model.
 *
 * The Elo gap is converted into a win/draw/loss split, which is then mapped to
 * expected goals (λ) for the Poisson model. A `chaos` parameter (0–100) blends
 * toward a neutral 50/50 match: chaos 0 = full Elo influence, chaos 100 = both
 * teams equally likely (λA ≈ λB ≈ base).
 */

import type { ExpectedGoals } from './types.js';

/** Base expected goals per team in a neutral match. */
export const BASE_GOALS = 1.35;
/** Home advantage multiplier applied to the home team's λ. */
export const HOME_ADVANTAGE = 1.12;
/** Elo points that correspond to a 75% win probability (standard). */
const ELO_SCALE = 400;

/**
 * Standard Elo win probability: P(A beats B) ignoring draws.
 * @param eloA rating of team A
 * @param eloB rating of team B
 */
export function eloWinProbability(eloA: number, eloB: number): number {
	return 1 / (1 + Math.pow(10, (eloB - eloA) / ELO_SCALE));
}

export interface EloSplit {
	home: number;
	draw: number;
	away: number;
}

/**
 * Convert an Elo gap into a home/draw/away probability split.
 *
 * The draw share is held at a fixed base (typical top-flight ~25%) and the
 * remaining 75% is split by the Elo win probability.
 *
 * @param eloA home team rating
 * @param eloB away team rating
 * @param drawShare base draw probability (default 0.25)
 */
export function eloSplit(eloA: number, eloB: number, drawShare = 0.25): EloSplit {
	const winProb = eloWinProbability(eloA, eloB);
	const nonDraw = 1 - drawShare;
	return {
		home: winProb * nonDraw,
		draw: drawShare,
		away: (1 - winProb) * nonDraw
	};
}

export interface ExpectedGoalsOptions {
	/** 0–100. 0 = full Elo influence, 100 = neutral (λA ≈ λB ≈ base). */
	chaos?: number;
	/** Home advantage multiplier (default {@link HOME_ADVANTAGE}). */
	homeAdvantage?: number;
	/** Base expected goals per team (default {@link BASE_GOALS}). */
	baseGoals?: number;
}

/**
 * Compute expected goals (λ) for both sides from Elo ratings.
 *
 * The total expected goals is kept constant at `2 * baseGoals`; the Elo gap
 * redistributes that total between the two teams, and home advantage nudges
 * the home side. Chaos blends the whole thing toward a neutral split.
 */
export function expectedGoals(
	eloA: number,
	eloB: number,
	options: ExpectedGoalsOptions = {}
): ExpectedGoals {
	const chaos = (options.chaos ?? 0) / 100;
	const homeAdvantage = options.homeAdvantage ?? HOME_ADVANTAGE;
	const base = options.baseGoals ?? BASE_GOALS;

	// Full-Elo split, then blend toward neutral (0.5 / 0.5).
	const split = eloSplit(eloA, eloB);
	const homeShare = split.home + chaos * (0.5 - split.home);
	const awayShare = split.away + chaos * (0.5 - split.away);

	// Map the win/draw/loss split to a goal share. A team's share of the
	// "decisive" outcome (win + half of draw) drives its expected goals.
	// homeGoalShare + awayGoalShare === 1 by construction.
	const homeGoalShare = homeShare + 0.5 * (1 - homeShare - awayShare);
	const awayGoalShare = 1 - homeGoalShare;

	const total = 2 * base;
	const home = total * homeGoalShare;
	const away = total * awayGoalShare;

	// Apply home advantage, then re-normalize so the total is preserved.
	const homeAdj = home * homeAdvantage;
	const awayAdj = away * (2 - homeAdvantage);
	const scale = total / (homeAdj + awayAdj);

	return { home: homeAdj * scale, away: awayAdj * scale };
}

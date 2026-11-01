/**
 * Reverse-mode helpers: in the "reverse" simulator the *loser* of each match
 * advances instead of the winner. These are pure functions used by the
 * tournament orchestrator and the bracket when reverse mode is enabled.
 *
 * The idea: a fun "what if the underdogs kept winning" mode. The match score
 * itself is simulated normally (the favorite still usually scores more), but
 * the *advancement* is inverted — the team that lost the match moves on.
 */

/**
 * The team that lost the match.
 * @throws if the match is a draw (knockout matches must have a winner).
 */
export function loserOf(
	home: string,
	away: string,
	homeScore: number,
	awayScore: number
): string {
	if (homeScore === awayScore) {
		throw new Error('Cannot determine a loser from a draw');
	}
	return homeScore > awayScore ? away : home;
}

/**
 * The team that won the match.
 * @throws if the match is a draw.
 */
export function winnerOf(
	home: string,
	away: string,
	homeScore: number,
	awayScore: number
): string {
	if (homeScore === awayScore) {
		throw new Error('Cannot determine a winner from a draw');
	}
	return homeScore > awayScore ? home : away;
}

/**
 * In reverse mode, the team that advances is the loser of the match.
 */
export function reverseAdvancer(
	home: string,
	away: string,
	homeScore: number,
	awayScore: number
): string {
	return loserOf(home, away, homeScore, awayScore);
}

/**
 * Invert a match score so the other team wins (for display / "upset" framing).
 * A 2-1 home win becomes a 1-3 away win. A draw is left unchanged.
 */
export function invertScore(
	homeScore: number,
	awayScore: number
): { homeScore: number; awayScore: number } {
	if (homeScore === awayScore) {
		return { homeScore, awayScore };
	}
	// The new winner (old loser) gets the old winner's goal count + 1,
	// the new loser (old winner) keeps the old loser's goal count.
	if (homeScore > awayScore) {
		return { homeScore: awayScore, awayScore: homeScore + 1 };
	}
	// Away win: 1-2 → 3-1, 0-1 → 2-0, 2-3 → 4-2
	return { homeScore: awayScore + 1, awayScore: homeScore };
}

/**
 * Given a normal-mode advancer and a reverse flag, return the team that
 * advances. Central switch so callers don't branch on `reverse` themselves.
 */
export function advancer(
	home: string,
	away: string,
	homeScore: number,
	awayScore: number,
	reverse: boolean
): string {
	return reverse
		? reverseAdvancer(home, away, homeScore, awayScore)
		: winnerOf(home, away, homeScore, awayScore);
}

/**
 * Post-match Elo update.
 *
 * Standard Elo with a K-factor. World-Cup mode uses a larger K (40) so that
 * tournament results move ratings more.
 */

/** Standard K-factor. */
export const K_STANDARD = 20;
/** World-Cup / high-stakes K-factor. */
export const K_WORLD_CUP = 40;

export type MatchOutcome = 'home' | 'draw' | 'away';

/**
 * Compute the new Elo ratings after a match.
 *
 * @param eloA home team rating before the match
 * @param eloB away team rating before the match
 * @param outcome who won (or draw)
 * @param k K-factor (default {@link K_STANDARD})
 * @returns [newEloA, newEloB]
 */
export function updateElo(
	eloA: number,
	eloB: number,
	outcome: MatchOutcome,
	k: number = K_STANDARD
): [number, number] {
	const expectedA = 1 / (1 + Math.pow(10, (eloB - eloA) / 400));
	const scoreA = outcome === 'home' ? 1 : outcome === 'draw' ? 0.5 : 0;
	const delta = k * (scoreA - expectedA);
	return [eloA + delta, eloB - delta];
}

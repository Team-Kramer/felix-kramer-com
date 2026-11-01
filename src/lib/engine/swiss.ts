/**
 * Swiss-system tournament: pair players each round by standing
 * (points → goal diff → goals for), no rematches, fixed number of rounds.
 *
 * Used for the "Swiss" simulator format (e.g. 16 teams, 5 rounds).
 */

import type { SwissPairing, Team } from './types.js';
import { expectedGoals } from './elo.js';
import { simulateMatch } from './poisson.js';

export interface SwissStanding {
	id: string;
	name: string;
	points: number;
	goalDiff: number;
	goalsFor: number;
	played: number;
	/** Team ids already played (for the no-rematch constraint). */
	playedAgainst: string[];
}

export interface SwissState {
	teams: Team[];
	rounds: SwissPairing[][];
	standings: SwissStanding[];
	/** Total rounds planned. */
	totalRounds: number;
}

/**
 * Create a fresh Swiss tournament state.
 * @param teams participating teams
 * @param totalRounds number of rounds (default 5)
 */
export function createSwiss(teams: Team[], totalRounds = 5): SwissState {
	return {
		teams,
		rounds: [],
		totalRounds,
		standings: teams.map((t) => ({
			id: t.id,
			name: t.name,
			points: 0,
			goalDiff: 0,
			goalsFor: 0,
			played: 0,
			playedAgainst: [],
		})),
	};
}

/**
 * Compute the next round's pairings from the current standings.
 *
 * Teams are sorted by points → GD → GF, then paired 1v2, 3v4, … (the
 * "1-2, 3-4" method). If a rematch would occur, the lower team is swapped
 * with the next available opponent.
 *
 * @returns the pairings for the next round (not yet simulated).
 */
export function nextPairings(state: SwissState): SwissPairing[] {
	const round = state.rounds.length;
	if (round >= state.totalRounds) {
		throw new Error(`Swiss tournament already finished (${state.totalRounds} rounds)`);
	}

	const byId = new Map(state.standings.map((s) => [s.id, s]));
	const sorted = [...state.standings].sort((a, b) => {
		if (b.points !== a.points) return b.points - a.points;
		if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
		if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
		return a.name.localeCompare(b.name);
	});

	const n = sorted.length;
	if (n % 2 !== 0) throw new Error('Swiss requires an even number of teams');

	const pairings: SwissPairing[] = [];
	const used = new Set<string>();
	const chosen: Array<[SwissStanding, SwissStanding]> = [];

	// Backtracking "1-2, 3-4" pairing: pair the highest unused team with the
	// next best candidate in rank order. First search forbids rematches
	// entirely; only if no rematch-free matching exists do we allow them.
	const find = (start: number, allowRematches: boolean): boolean => {
		let i = start;
		while (i < n && used.has(sorted[i].id)) i++;
		if (i >= n) return chosen.length === n / 2;

		const high = sorted[i];
		for (let j = i + 1; j < n; j++) {
			const candidate = sorted[j];
			if (used.has(candidate.id)) continue;
			const isRematch = high.playedAgainst.includes(candidate.id);
			if (!allowRematches && isRematch) continue;

			used.add(high.id);
			used.add(candidate.id);
			chosen.push([high, candidate]);
			// Continue from the next team after `high` (not after the
			// candidate) so teams skipped between them can still pair.
			if (find(i + 1, allowRematches)) return true;
			chosen.pop();
			used.delete(high.id);
			used.delete(candidate.id);
		}
		return false;
	};

	if (!find(0, false) && !find(0, true)) {
		throw new Error('Swiss pairing: no valid pairing found');
	}

	chosen.forEach(([high, low], i) => {
		// Alternate home/away by round parity for fairness.
		const homeFirst = (round + i) % 2 === 0;
		const home = homeFirst ? high : low;
		const away = homeFirst ? low : high;
		pairings.push({ round, home: home.id, away: away.id });
	});

	return pairings;
}

/**
 * Simulate the next round: compute pairings, simulate each match, update
 * standings. Returns the pairings with scores filled in.
 */
export function simulateRound(
	state: SwissState,
	rng: () => number,
	eloOf: (id: string) => number,
	chaos = 0
): SwissPairing[] {
	const pairings = nextPairings(state);
	const byId = new Map(state.standings.map((s) => [s.id, s]));

	for (const p of pairings) {
		const g = expectedGoals(eloOf(p.home), eloOf(p.away), { chaos });
		const m = simulateMatch(rng, g.home, g.away, { events: false });
		p.homeScore = m.homeScore;
		p.awayScore = m.awayScore;

		const h = byId.get(p.home)!;
		const a = byId.get(p.away)!;
		h.played += 1;
		a.played += 1;
		h.goalsFor += m.homeScore;
		a.goalsFor += m.awayScore;
		h.goalDiff += m.homeScore - m.awayScore;
		a.goalDiff += m.awayScore - m.homeScore;
		h.playedAgainst.push(p.away);
		a.playedAgainst.push(p.home);

		if (m.homeScore > m.awayScore) h.points += 3;
		else if (m.homeScore < m.awayScore) a.points += 3;
		else {
			h.points += 1;
			a.points += 1;
		}
	}

	state.rounds.push(pairings);
	return pairings;
}

/** Final standings (sorted) after all rounds. */
export function finalStandings(state: SwissState): SwissStanding[] {
	return [...state.standings].sort((a, b) => {
		if (b.points !== a.points) return b.points - a.points;
		if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
		if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
		return a.name.localeCompare(b.name);
	});
}

/** Whether all rounds have been played. */
export function isComplete(state: SwissState): boolean {
	return state.rounds.length >= state.totalRounds;
}

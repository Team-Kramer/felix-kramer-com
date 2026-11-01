/**
 * Campaign: a drafted XI + playstyle + seed plays a full tournament
 * (reusing the tournament orchestrator). Produces result-card data:
 * record, goals for/against, overall rating, placement.
 */

import type { Team } from './types.js';
import { rngFromString } from './prng.js';
import { runTournament, type TournamentFormat } from './tournament.js';
import { avgRating as draftAvgRating, type DraftState } from './draft.js';
import { teamElo, type Playstyle } from './formation.js';
import type { BracketMatch } from './types.js';

export const USER_TEAM_ID = 'user';

export interface CampaignConfig {
	/** The drafted XI (11 players). */
	xi: DraftState;
	playstyle: Playstyle;
	seed: string | number;
	/** Tournament format (default 'single'). */
	format?: TournamentFormat;
	/** Total teams including the user's (default 16). */
	teamCount?: number;
	/** 0–100 chaos (default 0). */
	chaos?: number;
	/** Reverse mode (default false). */
	reverse?: boolean;
	/** Opponent teams (default: drawn from the given pool). */
	opponents?: Team[];
	/** Pool of teams to draw opponents from (used when `opponents` is not set). */
	teamPool?: Team[];
}

export interface CampaignMatch {
	opponent: string;
	home: boolean;
	homeScore: number;
	awayScore: number;
	won: boolean;
	drawn: boolean;
}

export interface CampaignResult {
	userTeamId: string;
	champion: string | null;
	/** 1 = champion, 2 = runner-up, 3 = semi-finalist, … */
	placement: number;
	record: {
		played: number;
		won: number;
		drawn: number;
		lost: number;
		goalsFor: number;
		goalsAgainst: number;
	};
	/** 0–100, blend of squad rating and tournament performance. */
	overallRating: number;
	matches: CampaignMatch[];
}

/**
 * Run the campaign: the user's team (Elo derived from the XI's average
 * rating + playstyle) plays a full tournament against the opponents.
 *
 * Deterministic: same seed + same inputs = same result.
 */
export function runCampaign(config: CampaignConfig): CampaignResult {
	const { xi, playstyle, seed, chaos = 0, reverse = false } = config;
	const format = config.format ?? 'single';
	const teamCount = config.teamCount ?? 16;

	const userElo = teamElo(draftAvgRating(xi), playstyle);
	const userTeam: Team = { id: USER_TEAM_ID, name: 'Your Team', elo: userElo };

	let opponents: Team[];
	if (config.opponents) {
		opponents = config.opponents.slice(0, teamCount - 1);
	} else {
		const pool = config.teamPool ?? [];
		if (pool.length < teamCount - 1) {
			throw new Error(`Need ${teamCount - 1} opponents, pool has ${pool.length}`);
		}
		const rng = rngFromString(`${seed}:opponents`);
		// Deterministic shuffle, take the first teamCount-1.
		const shuffled = [...pool];
		for (let i = shuffled.length - 1; i > 0; i--) {
			const j = Math.floor(rng() * (i + 1));
			[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
		}
		opponents = shuffled.slice(0, teamCount - 1);
	}

	const teams = [userTeam, ...opponents];
	const state = runTournament({
		format,
		teams,
		seed,
		chaos,
		reverse,
	});

	const matches = collectUserMatches(state);
	const record = {
		played: matches.length,
		won: matches.filter((m) => m.won).length,
		drawn: matches.filter((m) => m.drawn).length,
		lost: matches.filter((m) => !m.won && !m.drawn).length,
		goalsFor: matches.reduce((s, m) => s + (m.home ? m.homeScore : m.awayScore), 0),
		goalsAgainst: matches.reduce((s, m) => s + (m.home ? m.awayScore : m.homeScore), 0),
	};

	const placement = computePlacement(state, format, teams.length);
	const overallRating = computeOverallRating(draftAvgRating(xi), record, placement, teams.length);

	return {
		userTeamId: USER_TEAM_ID,
		champion: state.champion,
		placement,
		record,
		overallRating,
		matches,
	};
}

function collectUserMatches(state: ReturnType<typeof runTournament>): CampaignMatch[] {
	const matches: CampaignMatch[] = [];
	const push = (m: BracketMatch) => {
		if (m.home !== USER_TEAM_ID && m.away !== USER_TEAM_ID) return;
		if (m.homeScore === null || m.awayScore === null) return;
		const home = m.home === USER_TEAM_ID;
		const hs = home ? m.homeScore : m.awayScore;
		const as = home ? m.awayScore : m.homeScore;
		matches.push({
			opponent: (home ? m.away : m.home) ?? 'TBD',
			home,
			homeScore: m.homeScore,
			awayScore: m.awayScore,
			won: hs > as,
			drawn: hs === as,
		});
	};

	if (state.bracket) {
		for (const m of state.bracket) push(m);
	}
	if (state.fixtures) {
		for (const f of state.fixtures) {
			if (f.home !== USER_TEAM_ID && f.away !== USER_TEAM_ID) continue;
			if (f.homeScore === undefined || f.awayScore === undefined) continue;
			const home = f.home === USER_TEAM_ID;
			const hs = home ? f.homeScore : f.awayScore;
			const as = home ? f.awayScore : f.homeScore;
			matches.push({
				opponent: home ? f.away : f.home,
				home,
				homeScore: f.homeScore,
				awayScore: f.awayScore,
				won: hs > as,
				drawn: hs === as,
			});
		}
	}
	if (state.swiss) {
		for (const round of state.swiss.rounds) {
			for (const p of round) {
				if (p.home !== USER_TEAM_ID && p.away !== USER_TEAM_ID) continue;
				if (p.homeScore === undefined || p.awayScore === undefined) continue;
				const home = p.home === USER_TEAM_ID;
				const hs = home ? p.homeScore : p.awayScore;
				const as = home ? p.awayScore : p.homeScore;
				matches.push({
					opponent: home ? p.away : p.home,
					home,
					homeScore: p.homeScore,
					awayScore: p.awayScore,
					won: hs > as,
					drawn: hs === as,
				});
			}
		}
	}
	return matches;
}

function computePlacement(
	state: ReturnType<typeof runTournament>,
	format: TournamentFormat,
	teamCount: number
): number {
	if (state.champion === USER_TEAM_ID) return 1;

	if (format === 'league' && state.table) {
		const idx = state.table.findIndex((r) => r.id === USER_TEAM_ID);
		return idx >= 0 ? idx + 1 : teamCount;
	}

	if (format === 'swiss' && state.swiss) {
		const standings = state.swiss.standings;
		const idx = standings.findIndex((s) => s.id === USER_TEAM_ID);
		return idx >= 0 ? idx + 1 : teamCount;
	}

	if (state.bracket) {
		// Find the user's last decided match and its round.
		let lastRound = -1;
		let maxRound = 0;
		for (const m of state.bracket) {
			maxRound = Math.max(maxRound, m.round);
			if (m.decided && (m.home === USER_TEAM_ID || m.away === USER_TEAM_ID)) {
				lastRound = Math.max(lastRound, m.round);
			}
		}
		if (lastRound < 0) return teamCount;
		// Rounds are 0-based; a loss in round r of (maxRound+1) rounds means
		// 2^(maxRound - r) teams finished ahead → placement = that + 1.
		return Math.pow(2, maxRound - lastRound) + 1;
	}

	return teamCount;
}

function computeOverallRating(
	squadRating: number,
	record: CampaignResult['record'],
	placement: number,
	teamCount: number
): number {
	// Performance bonus: points per match (win 3 / draw 1) scaled, plus a
	// goal-difference nudge, plus a placement bonus (champion +5 … last 0).
	const points = record.won * 3 + record.drawn;
	const perMatch = record.played > 0 ? points / record.played : 0; // 0–3
	const gd = record.goalsFor - record.goalsAgainst;
	const placementBonus =
		teamCount > 1 ? ((teamCount - placement) / (teamCount - 1)) * 5 : 0;
	const raw = squadRating + perMatch * 2 + Math.max(-5, Math.min(5, gd)) + placementBonus;
	return Math.round(Math.max(0, Math.min(100, raw)));
}

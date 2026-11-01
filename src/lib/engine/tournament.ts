/**
 * Tournament orchestrator: composes the format modules (groups, bracket,
 * swiss, round-robin) into a full tournament with serializable state.
 *
 * The state is plain JSON (no functions, no DOM) so it can be:
 * - stored in localStorage,
 * - encoded into a share link (base64),
 * - restored to continue a partially-simulated tournament.
 */

import type { Fixture, TableRow, Team } from './types.js';
import { rngFromString } from './prng.js';
import { expectedGoals } from './elo.js';
import { simulateMatch } from './poisson.js';
import { doubleRoundRobin, leagueTable } from './round-robin.js';
import {
	groupDraw,
	qualify,
	seedBracket,
	simulateGroupStage,
	type GroupStageResult,
} from './groups.js';
import {
	champion as bracketChampion,
	createDoubleBracket,
	createSingleBracket,
	isComplete as bracketComplete,
	readyMatches,
	resetIdCounter,
	setResult,
} from './bracket.js';
import {
	createSwiss,
	finalStandings,
	isComplete as swissComplete,
	simulateRound,
	type SwissState,
} from './swiss.js';

export type TournamentFormat =
	| 'wc2026' // groups (12×4) + 32-team knockout
	| 'groups-knockout' // generic groups + knockout
	| 'single' // single elimination
	| 'double' // double elimination
	| 'swiss' // swiss system
	| 'league'; // double round-robin league

export interface TournamentConfig {
	format: TournamentFormat;
	teams: Team[];
	/** Seed string (or number) — same seed + same inputs = same results. */
	seed: string | number;
	/** 0–100, how much randomness overrides Elo. */
	chaos?: number;
	/** Reverse mode: the loser advances. */
	reverse?: boolean;
	// groups-knockout / wc2026
	groupCount?: number;
	groupSize?: number;
	pots?: number;
	topN?: number;
	bestThirds?: number;
	// swiss
	totalRounds?: number;
}

export type TournamentPhase =
	| 'groups'
	| 'knockout'
	| 'swiss'
	| 'league'
	| 'done';

export interface TournamentState {
	config: Omit<TournamentConfig, 'teams'> & { teamIds: string[] };
	teams: Team[];
	phase: TournamentPhase;
	// group stage
	groups?: string[][];
	groupResults?: GroupStageResult;
	qualified?: string[];
	// knockout
	bracket?: ReturnType<typeof createSingleBracket>;
	// swiss
	swiss?: SwissState;
	// league
	fixtures?: Fixture[];
	table?: TableRow[];
	champion: string | null;
}

/**
 * Create a fresh tournament state (nothing simulated yet).
 */
export function createTournament(config: TournamentConfig): TournamentState {
	const chaos = config.chaos ?? 0;
	const reverse = config.reverse ?? false;
	// WC 2026 is the specific 48-team format: 12 groups of 4, top-2 + best 8
	// thirds = 32 advance. groups-knockout leaves bestThirds at 0 unless set.
	const isWc = config.format === 'wc2026';
	const resolvedBestThirds = config.bestThirds ?? (isWc ? 8 : 0);
	const state: TournamentState = {
		config: {
			format: config.format,
			seed: config.seed,
			chaos,
			reverse,
			teamIds: config.teams.map((t) => t.id),
			groupCount: config.groupCount,
			groupSize: config.groupSize,
			pots: config.pots,
			topN: config.topN,
			bestThirds: resolvedBestThirds,
			totalRounds: config.totalRounds,
		},
		teams: config.teams,
		phase: 'groups',
		champion: null,
	};

	switch (config.format) {
		case 'wc2026':
		case 'groups-knockout': {
			const groupCount = config.groupCount ?? 12;
			const groupSize = config.groupSize ?? 4;
			// groupDraw expects seed order (strongest first).
			const seeded = [...config.teams].sort((a, b) => b.elo - a.elo);
			const groups = groupDraw(seeded, groupCount, groupSize, {
				pots: config.pots ?? groupSize,
			});
			state.groups = groups.map((g) => g.map((t) => t.id));
			state.phase = 'groups';
			break;
		}
		case 'single':
		case 'double': {
			resetIdCounter();
			state.bracket =
				config.format === 'single'
					? createSingleBracket(config.teams.map((t) => t.id))
					: createDoubleBracket(config.teams.map((t) => t.id));
			state.phase = 'knockout';
			break;
		}
		case 'swiss': {
			state.swiss = createSwiss(config.teams, config.totalRounds ?? 5);
			state.phase = 'swiss';
			break;
		}
		case 'league': {
			state.fixtures = doubleRoundRobin(config.teams.map((t) => t.id));
			state.phase = 'league';
			break;
		}
	}

	return state;
}

function eloOf(state: TournamentState): (id: string) => number {
	const byId = new Map(state.teams.map((t) => [t.id, t.elo]));
	return (id: string) => byId.get(id) ?? 1500;
}

/**
 * Advance the tournament by one stage (or one round for swiss/league).
 * Mutates and returns the state.
 */
export function advance(state: TournamentState): TournamentState {
	const rng = rngFromString(String(state.config.seed) + ':' + state.phase + ':' + stageIndex(state));
	const chaos = state.config.chaos ?? 0;
	const reverse = state.config.reverse ?? false;
	const elo = eloOf(state);

	switch (state.phase) {
		case 'groups': {
			if (!state.groups) throw new Error('No groups in state');
			state.groupResults = simulateGroupStage(state.groups, rng, elo, chaos);
			state.qualified = qualify(
				state.groupResults.groups.map((g) => ({ teamIds: g.teamIds, table: g.table })),
				{
					topN: state.config.topN ?? 2,
					bestThirds: state.config.bestThirds ?? 0,
					reverse,
			}
			);
			// Build the knockout bracket from qualified teams.
			resetIdCounter();
			const seeded = seedBracket(state.qualified);
			state.bracket = createSingleBracket(seeded);
			state.phase = 'knockout';
			break;
		}
		case 'knockout': {
			if (!state.bracket) throw new Error('No bracket in state');
			const ready = readyMatches(state.bracket);
			if (ready.length === 0) {
				// Nothing ready — either complete or waiting on upstream.
				if (bracketComplete(state.bracket)) {
					state.champion = bracketChampion(state.bracket);
					state.phase = 'done';
				}
				break;
			}
			// Simulate all currently-ready matches (one round of the bracket).
			for (const m of ready) {
				const g = expectedGoals(elo(m.home!), elo(m.away!), { chaos });
				const r = simulateMatch(rng, g.home, g.away, { events: false });
				// Knockout: no draws. On a sampled draw, home wins a golden
				// goal (deterministic tiebreak).
				const hs = r.homeScore;
				const as = r.awayScore;
				const finalHome = hs === as ? hs + 1 : hs;
				const finalAway = as;
				setResult(state.bracket, m.id, finalHome, finalAway, { reverse });
			}
			if (bracketComplete(state.bracket)) {
				state.champion = bracketChampion(state.bracket);
				state.phase = 'done';
			}
			break;
		}
		case 'swiss': {
			if (!state.swiss) throw new Error('No swiss state');
			if (!swissComplete(state.swiss)) {
				simulateRound(state.swiss, rng, elo, chaos);
			}
			if (swissComplete(state.swiss)) {
				const standings = finalStandings(state.swiss);
				state.champion = reverse ? standings[standings.length - 1].id : standings[0].id;
				state.phase = 'done';
			}
			break;
		}
		case 'league': {
			if (!state.fixtures) throw new Error('No fixtures in state');
			const next = state.fixtures.find((f) => f.homeScore === undefined);
			if (next) {
				const g = expectedGoals(elo(next.home), elo(next.away), { chaos });
				const r = simulateMatch(rng, g.home, g.away, { events: false });
				next.homeScore = r.homeScore;
				next.awayScore = r.awayScore;
			}
			if (state.fixtures.every((f) => f.homeScore !== undefined)) {
				state.table = leagueTable(state.teams, state.fixtures);
				state.champion = reverse
					? state.table[state.table.length - 1].id
					: state.table[0].id;
				state.phase = 'done';
			}
			break;
		}
		case 'done':
			break;
	}

	return state;
}

/** A monotonic stage counter derived from state (for per-stage RNG streams). */
function stageIndex(state: TournamentState): number {
	switch (state.phase) {
		case 'groups':
			return 0;
		case 'knockout':
			return 1 + (state.bracket?.filter((m) => m.decided).length ?? 0);
		case 'swiss':
			return 1 + (state.swiss?.rounds.length ?? 0);
		case 'league':
			return 1 + (state.fixtures?.filter((f) => f.homeScore !== undefined).length ?? 0);
		default:
			return 999;
	}
}

/**
 * Run a tournament to completion.
 * @param maxStages safety valve (default 1000).
 */
export function runTournament(
	config: TournamentConfig,
	maxStages = 1000
): TournamentState {
	const state = createTournament(config);
	let stages = 0;
	while (state.phase !== 'done' && stages < maxStages) {
		advance(state);
		stages += 1;
	}
	if (state.phase !== 'done') {
		throw new Error(`Tournament did not finish within ${maxStages} stages`);
	}
	return state;
}

/** Serialize state to a compact JSON string (for share links / localStorage). */
export function serialize(state: TournamentState): string {
	return JSON.stringify(state);
}

/** Restore a tournament from a serialized string. */
export function deserialize(json: string): TournamentState {
	return JSON.parse(json) as TournamentState;
}

/** Encode state into a URL-safe base64 string (for share links). */
export function encodeShare(state: TournamentState): string {
	const json = serialize(state);
	// Use btoa with UTF-8 safety (team names may be non-ASCII).
	const bytes = new TextEncoder().encode(json);
	let bin = '';
	for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
	return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Decode a share string back into state. */
export function decodeShare(encoded: string): TournamentState {
	const b64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
	const pad = b64.length % 4 === 0 ? '' : '='.repeat(4 - (b64.length % 4));
	const bin = atob(b64 + pad);
	const bytes = new Uint8Array(bin.length);
	for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
	return deserialize(new TextDecoder().decode(bytes));
}

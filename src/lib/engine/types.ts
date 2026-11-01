/**
 * Shared types for the Felix simulation engine.
 *
 * The engine is pure TypeScript with zero DOM dependencies — every function is
 * deterministic given its inputs (including the PRNG) and 100% unit-testable.
 */

/** A team's identity + strength inputs. Elo drives the goal model. */
export interface Team {
	id: string;
	name: string;
	elo: number;
	/** Optional display color (hex). */
	color?: string;
	/** Optional 3-letter code (e.g. "GER"). */
	code?: string;
}

/** Expected goals (λ) for both sides of a match. */
export interface ExpectedGoals {
	home: number;
	away: number;
}

/** Win / draw / loss probabilities for the home team (sum ≈ 1). */
export interface MatchProbabilities {
	home: number;
	draw: number;
	away: number;
}

export type EventType = 'goal' | 'yellow' | 'red' | 'sub';

/** A single event in a match timeline. */
export interface MatchEvent {
	minute: number;
	type: EventType;
	team: 'home' | 'away';
	/** Optional player name (filled in by the data/draft layer). */
	player?: string;
}

/** The full result of a simulated match. */
export interface MatchResult {
	homeScore: number;
	awayScore: number;
	events: MatchEvent[];
}

/** A single fixture in a schedule. */
export interface Fixture {
	round: number;
	home: string;
	away: string;
	/** Filled in after the match is simulated. */
	homeScore?: number;
	awayScore?: number;
}

/** A row in a league/group table. */
export interface TableRow {
	id: string;
	name: string;
	played: number;
	won: number;
	drawn: number;
	lost: number;
	goalsFor: number;
	goalsAgainst: number;
	goalDiff: number;
	points: number;
}

/** Which ladder a bracket match belongs to. */
export type BracketLane = 'W' | 'L' | 'GF';

/** A bracket match node. */
export interface BracketMatch {
	id: string;
	/** Ladder: 'W' = winner's, 'L' = loser's, 'GF' = grand final. */
	bracket: BracketLane;
	round: number;
	index: number;
	home: string | null;
	away: string | null;
	homeScore: number | null;
	awayScore: number | null;
	/** Team id that won on the pitch (null until decided). */
	winner: string | null;
	/** Team id that lost on the pitch (null until decided). */
	loser: string | null;
	/** Team id that advanced to the next round (winner normally, loser in reverse mode). */
	advancer: string | null;
	/** Match id of the node the winner feeds into (null for the final). */
	next: string | null;
	/** Which slot ('home' | 'away') the winner advances into. */
	nextSlot: 'home' | 'away' | null;
	/** Match id of the node the loser feeds into (double elimination only). */
	loserNext: string | null;
	/** Which slot the loser drops into. */
	loserNextSlot: 'home' | 'away' | null;
	/** True once both teams are set and a result has been entered. */
	decided: boolean;
}

/** Swiss-system round pairing. */
export interface SwissPairing {
	round: number;
	home: string;
	away: string;
	homeScore?: number;
	awayScore?: number;
}

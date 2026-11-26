/**
 * Temporal and historical adapters for the canonical football dataset.
 *
 * The dataset is normalized and time-dependent: players are independent of
 * teams, and every mutable value (team strength, player attributes, squad
 * membership) is stored as a snapshot with a `validFrom`/`validTo` interval.
 *
 * Everything in this module is a pure read over a {@link FootballDataset}:
 * no mutation, no DOM, no network. A minimal dataset without any history
 * (no matches, appearances, or extra snapshots) is fully supported — every
 * function degrades to an empty result or `undefined` instead of throwing.
 *
 * The append-only rule is enforced at the write boundary: {@link
 * appendTeamSnapshot} and {@link appendPlayerSnapshot} never replace an
 * existing snapshot, they add a new one, so historical values are preserved.
 */

import type {
	ChemistrySnapshot,
	DatasetEvent,
	DatasetMatch,
	FootballDataset,
	Heatmap,
	MatchAppearance,
	PlayerMembership,
	PlayerSnapshot,
	TeamParticipation,
	TeamSnapshot,
	TrackingReference
} from './types';

/** A date (YYYY-MM-DD) within a snapshot's validity interval. */
function withinInterval(asOf: string, validFrom: string, validTo: string | null): boolean {
	return asOf >= validFrom && (validTo === null || asOf <= validTo);
}

/**
 * Resolve the team snapshot that is valid for `asOf`.
 *
 * When several snapshots cover the date, the one with the latest `validFrom`
 * wins; ties (e.g. an append-only correction with the same `validFrom`) are
 * broken by the later entry in the array, so a correction appended afterwards
 * takes precedence without destroying the original.
 */
export function resolveTeamSnapshot(
	dataset: FootballDataset,
	teamId: string,
	asOf: string
): TeamSnapshot | undefined {
	let best: { snapshot: TeamSnapshot; index: number } | undefined;
	dataset.teamSnapshots.forEach((snapshot, index) => {
		if (snapshot.teamId !== teamId) return;
		if (!withinInterval(asOf, snapshot.validFrom, snapshot.validTo)) return;
		if (!best) {
			best = { snapshot, index };
			return;
		}
		const current = best.snapshot;
		if (snapshot.validFrom > current.validFrom) {
			best = { snapshot, index };
		} else if (snapshot.validFrom === current.validFrom && index > best.index) {
			best = { snapshot, index };
		}
	});
	return best?.snapshot;
}

/** Resolve the player snapshot that is valid for `asOf` (same rules as teams). */
export function resolvePlayerSnapshot(
	dataset: FootballDataset,
	playerId: string,
	asOf: string
): PlayerSnapshot | undefined {
	let best: { snapshot: PlayerSnapshot; index: number } | undefined;
	dataset.playerSnapshots.forEach((snapshot, index) => {
		if (snapshot.playerId !== playerId) return;
		if (!withinInterval(asOf, snapshot.validFrom, snapshot.validTo)) return;
		if (!best) {
			best = { snapshot, index };
			return;
		}
		const current = best.snapshot;
		if (snapshot.validFrom > current.validFrom) {
			best = { snapshot, index };
		} else if (snapshot.validFrom === current.validFrom && index > best.index) {
			best = { snapshot, index };
		}
	});
	return best?.snapshot;
}

/**
 * The club/team a player is registered to at `asOf`.
 *
 * Club memberships (`role: 'player'`) take precedence over reserves and
 * national-team registrations; among equal roles a permanent contract beats
 * a loan. Returns `undefined` when the player has no active membership.
 */
export function playerTeamAt(
	dataset: FootballDataset,
	playerId: string,
	asOf: string
): PlayerMembership | undefined {
	const roleRank: Record<PlayerMembership['role'], number> = {
		player: 0,
		reserve: 1,
		'national-team': 2
	};
	const contractRank: Record<string, number> = {
		permanent: 0,
		loan: 1,
		'free-agent': 2,
		unknown: 3
	};
	const active = dataset.memberships.filter(
		(membership) =>
			membership.playerId === playerId &&
			withinInterval(asOf, membership.validFrom, membership.validTo)
	);
	if (active.length === 0) return undefined;
	return active.sort((a, b) => {
		const role = roleRank[a.role] - roleRank[b.role];
		if (role !== 0) return role;
		return (
			(contractRank[a.contractType ?? 'unknown'] ?? 3) -
			(contractRank[b.contractType ?? 'unknown'] ?? 3)
		);
	})[0];
}

/** All active memberships for a team at `asOf` (the squad, n:m aware). */
export function teamSquadAt(
	dataset: FootballDataset,
	teamId: string,
	asOf: string
): PlayerMembership[] {
	return dataset.memberships.filter(
		(membership) =>
			membership.teamId === teamId &&
			withinInterval(asOf, membership.validFrom, membership.validTo)
	);
}

/** Competitions a team participates in at `asOf`. */
export function teamParticipationAt(
	dataset: FootballDataset,
	teamId: string,
	asOf: string
): TeamParticipation[] {
	return dataset.teamParticipations.filter(
		(participation) =>
			participation.teamId === teamId &&
			withinInterval(asOf, participation.validFrom, participation.validTo)
	);
}

export interface MatchFilter {
	seasonId?: string;
	/** Only include matches in this status (e.g. 'finished'). */
	status?: DatasetMatch['status'];
}

/** A team's matches, oldest first, optionally filtered by season/status. */
export function matchesForTeam(
	dataset: FootballDataset,
	teamId: string,
	filter: MatchFilter = {}
): DatasetMatch[] {
	return dataset.matches
		.filter((match) => match.homeTeamId === teamId || match.awayTeamId === teamId)
		.filter((match) => (filter.seasonId ? match.seasonId === filter.seasonId : true))
		.filter((match) => (filter.status ? match.status === filter.status : true))
		.sort((a, b) => a.dateTime.localeCompare(b.dateTime));
}

/** All matches in a competition (optionally one season), oldest first. */
export function matchesForCompetition(
	dataset: FootballDataset,
	competitionId: string,
	seasonId?: string
): DatasetMatch[] {
	return dataset.matches
		.filter((match) => match.competitionId === competitionId)
		.filter((match) => (seasonId ? match.seasonId === seasonId : true))
		.sort((a, b) => a.dateTime.localeCompare(b.dateTime));
}

/** A player's appearances across all matches, in match-date order. */
export function appearancesForPlayer(
	dataset: FootballDataset,
	playerId: string
): MatchAppearance[] {
	const dateByMatch = new Map(dataset.matches.map((match) => [match.id, match.dateTime]));
	return dataset.matchAppearances
		.filter((appearance) => appearance.playerId === playerId)
		.sort((a, b) =>
			(dateByMatch.get(a.matchId) ?? '').localeCompare(dateByMatch.get(b.matchId) ?? '')
		);
}

/** All events recorded for a match. */
export function eventsForMatch(dataset: FootballDataset, matchId: string): DatasetEvent[] {
	return dataset.events.filter((event) => event.matchId === matchId);
}

/** All events a player was the actor of. */
export function eventsForPlayer(dataset: FootballDataset, playerId: string): DatasetEvent[] {
	return dataset.events.filter((event) => event.actorPlayerId === playerId);
}

/** Season aggregate line for a player (optionally one season). */
export interface SeasonAggregate {
	appearances: number;
	minutes: number;
	goals: number;
	assists: number;
	xg: number;
	xa: number;
	/** Mean match rating, or null when no rated appearances exist. */
	averageRating: number | null;
}

function matchSeasonMap(dataset: FootballDataset): Map<string, string> {
	return new Map(dataset.matches.map((match) => [match.id, match.seasonId]));
}

function stat(appearance: MatchAppearance, key: string): number {
	return appearance.stats?.[key] ?? 0;
}

/** Aggregate a player's season stats from their appearances. */
export function seasonAggregates(
	dataset: FootballDataset,
	playerId: string,
	seasonId?: string
): SeasonAggregate {
	const seasonMap = matchSeasonMap(dataset);
	const appearances = appearancesForPlayer(dataset, playerId).filter((appearance) =>
		seasonId ? seasonMap.get(appearance.matchId) === seasonId : true
	);
	const rated = appearances.filter((appearance) => typeof appearance.rating === 'number');
	return {
		appearances: appearances.length,
		minutes: appearances.reduce((sum, appearance) => sum + appearance.minutes, 0),
		goals: appearances.reduce((sum, appearance) => sum + stat(appearance, 'goals'), 0),
		assists: appearances.reduce((sum, appearance) => sum + stat(appearance, 'assists'), 0),
		xg: appearances.reduce((sum, appearance) => sum + stat(appearance, 'xg'), 0),
		xa: appearances.reduce((sum, appearance) => sum + stat(appearance, 'xa'), 0),
		averageRating:
			rated.length > 0
				? rated.reduce((sum, appearance) => sum + (appearance.rating as number), 0) /
				  rated.length
				: null
	};
}

export type FormOutcome = 'W' | 'D' | 'L';

/** One row of a team's recent form. */
export interface FormEntry {
	matchId: string;
	dateTime: string;
	outcome: FormOutcome;
}

/**
 * A team's recent form (last `windowSize` finished matches), oldest first.
 * Unfinished matches without a score are ignored.
 */
export function teamForm(
	dataset: FootballDataset,
	teamId: string,
	windowSize = 5
): FormEntry[] {
	return matchesForTeam(dataset, teamId, { status: 'finished' })
		.filter((match) => match.score !== undefined)
		.slice(-windowSize)
		.map((match) => {
			const isHome = match.homeTeamId === teamId;
			const own = isHome ? match.score!.home : match.score!.away;
			const opponent = isHome ? match.score!.away : match.score!.home;
			const outcome: FormOutcome = own > opponent ? 'W' : own === opponent ? 'D' : 'L';
			return { matchId: match.id, dateTime: match.dateTime, outcome };
		});
}

/** The latest chemistry snapshot for a team at `asOf`. */
export function chemistryForTeam(
	dataset: FootballDataset,
	teamId: string,
	asOf: string
): ChemistrySnapshot | undefined {
	let best: { snapshot: ChemistrySnapshot; index: number } | undefined;
	dataset.chemistry.forEach((snapshot, index) => {
		if (snapshot.teamId !== teamId) return;
		if (!withinInterval(asOf, snapshot.validFrom, snapshot.validTo)) return;
		if (!best) {
			best = { snapshot, index };
			return;
		}
		const current = best.snapshot;
		if (snapshot.validFrom > current.validFrom) {
			best = { snapshot, index };
		} else if (snapshot.validFrom === current.validFrom && index > best.index) {
			best = { snapshot, index };
		}
	});
	return best?.snapshot;
}

/**
 * Heatmap aggregates for a subject (player or team). Returns the aggregated
 * heatmap without requiring any raw tracking data; `scope` narrows to a
 * specific window (match / season / rolling-window / career).
 */
export function heatmapForSubject(
	dataset: FootballDataset,
	subjectType: Heatmap['subjectType'],
	subjectId: string,
	scope?: Heatmap['scope']
): Heatmap | undefined {
	return dataset.heatmaps.find(
		(heatmap) =>
			heatmap.subjectType === subjectType &&
			heatmap.subjectId === subjectId &&
			(scope ? heatmap.scope === scope : true)
	);
}

/**
 * Tracking sidecar references for a subject. These point at compressed
 * external data (jsonl) and are returned as references only — the raw
 * tracking stream is never loaded into the browser.
 */
export function trackingForSubject(
	dataset: FootballDataset,
	subjectType: TrackingReference['subjectType'],
	subjectId: string
): TrackingReference[] {
	return dataset.tracking.filter(
		(reference) => reference.subjectType === subjectType && reference.subjectId === subjectId
	);
}

/**
 * Append a team snapshot without overwriting history (append-only).
 *
 * Returns a new dataset with the snapshot added. An existing snapshot with
 * the same `id` is an error — a correction must use a new id. The resolver
 * picks the latest covering snapshot, so an appended correction with the same
 * `validFrom` takes effect while the original stays in the array.
 */
export function appendTeamSnapshot(
	dataset: FootballDataset,
	snapshot: TeamSnapshot
): FootballDataset {
	if (dataset.teamSnapshots.some((existing) => existing.id === snapshot.id)) {
		throw new Error(
			`Team snapshot id "${snapshot.id}" already exists; append-only requires a new id.`
		);
	}
	return { ...dataset, teamSnapshots: [...dataset.teamSnapshots, snapshot] };
}

/** Append a player snapshot without overwriting history (append-only). */
export function appendPlayerSnapshot(
	dataset: FootballDataset,
	snapshot: PlayerSnapshot
): FootballDataset {
	if (dataset.playerSnapshots.some((existing) => existing.id === snapshot.id)) {
		throw new Error(
			`Player snapshot id "${snapshot.id}" already exists; append-only requires a new id.`
		);
	}
	return { ...dataset, playerSnapshots: [...dataset.playerSnapshots, snapshot] };
}

/** True when the dataset carries any historical detail beyond the minimal. */
export function hasHistory(dataset: FootballDataset): boolean {
	return (
		dataset.matches.length > 0 ||
		dataset.matchAppearances.length > 0 ||
		dataset.events.length > 0 ||
		dataset.heatmaps.length > 0 ||
		dataset.tracking.length > 0
	);
}

/**
 * Group-stage logic: group draw (pots), group tables, and qualification.
 *
 * Supports the WC 2026 format (12 groups of 4 → top-2 + best 4 thirds) and
 * generic group sizes. A `reverse` flag inverts qualification (worst teams
 * advance) for the reverse-mode simulator.
 */

import type { Fixture, TableRow, Team } from './types.js';
import { leagueTable, roundRobin } from './round-robin.js';
import { shuffle } from './prng.js';
import { expectedGoals } from './elo.js';
import { simulateMatch } from './poisson.js';

export interface GroupDrawOptions {
	/** Number of pots (seed tiers). Teams are chunked into pots in order. */
	pots?: number;
	/** Optional confederation constraint: teams from the same confed can't share a group. */
	confederationOf?: (teamId: string) => string;
}

/**
 * Assign teams to groups.
 *
 * Teams are split into `pots` (in the order given — usually sorted by Elo),
 * then dealt round-robin into groups so each group gets one team per pot.
 *
 * @param teams teams in seed order (strongest first)
 * @param groupCount number of groups
 * @param groupSize teams per group
 */
export function groupDraw(
	teams: Team[],
	groupCount: number,
	groupSize: number,
	options: GroupDrawOptions = {}
): Team[][] {
	const pots = options.pots ?? groupSize;
	const potSize = Math.ceil(teams.length / pots);
	const potTeams: Team[][] = [];
	for (let p = 0; p < pots; p++) {
		potTeams.push(teams.slice(p * potSize, (p + 1) * potSize));
	}

	const groups: Team[][] = Array.from({ length: groupCount }, () => []);
	const confedSeen: string[][] = Array.from({ length: groupCount }, () => []);

	// Deal pot by pot; within a pot, shuffle (deterministic if caller pre-shuffles).
	for (let p = 0; p < pots; p++) {
		const pot = [...potTeams[p]];
		// Assign each team in the pot to the group with the fewest teams from
		// the same confederation (if a constraint is provided).
		for (const team of pot) {
			let best = -1;
			let bestScore = Infinity;
			for (let g = 0; g < groupCount; g++) {
				if (groups[g].length >= groupSize) continue;
				let score = groups[g].length; // prefer filling evenly
				const confed = options.confederationOf?.(team.id);
				if (confed && confedSeen[g].includes(confed)) score += 100;
				if (score < bestScore) {
					bestScore = score;
					best = g;
				}
			}
			if (best === -1) best = 0;
			groups[best].push(team);
			const confed = options.confederationOf?.(team.id);
			if (confed) confedSeen[best].push(confed);
		}
	}

	return groups;
}

export interface GroupStageResult {
	groups: {
		teamIds: string[];
		fixtures: Fixture[];
		table: TableRow[];
	}[];
}

/**
 * Simulate a full group stage (double round-robin within each group).
 *
 * @param groups groups of team ids
 * @param rng PRNG
 * @param eloOf team id → Elo
 * @param chaos 0–100
 */
export function simulateGroupStage(
	groups: string[][],
	rng: () => number,
	eloOf: (id: string) => number,
	chaos = 0
): GroupStageResult {
	const result: GroupStageResult = { groups: [] };
	for (const group of groups) {
		const groupFixtures = roundRobin(group);
		for (const f of groupFixtures) {
			const g = expectedGoals(eloOf(f.home), eloOf(f.away), { chaos });
			const m = simulateMatch(rng, g.home, g.away, { events: false });
			f.homeScore = m.homeScore;
			f.awayScore = m.awayScore;
		}
		const teams = group.map((id) => ({ id, name: id, elo: eloOf(id) }));
		const table = leagueTable(teams, groupFixtures);
		result.groups.push({ teamIds: group, fixtures: groupFixtures, table });
	}
	return result;
}

export interface QualificationOptions {
	/** Teams per group that advance directly (default 2). */
	topN?: number;
	/** Number of "best third" (or best-Nth) teams that also advance. */
	bestThirds?: number;
	/** Reverse mode: worst teams advance instead of best. */
	reverse?: boolean;
}

/**
 * Determine which teams qualify from the group stage.
 *
 * @returns ordered list of qualified team ids (group winners first, then
 *   runners-up, then best thirds by GD/GF).
 */
export function qualify(
	groups: { teamIds: string[]; table: TableRow[] }[],
	options: QualificationOptions = {}
): string[] {
	const topN = options.topN ?? 2;
	const bestThirds = options.bestThirds ?? 0;
	const reverse = options.reverse ?? false;

	const pick = (table: TableRow[], rank: number): TableRow | undefined => {
		// rank is 0-based from the top; reverse flips it.
		const idx = reverse ? table.length - 1 - rank : rank;
		return table[idx];
	};

	const qualified: string[] = [];
	const thirds: TableRow[] = [];

	for (const g of groups) {
		for (let r = 0; r < topN; r++) {
			const row = pick(g.table, r);
			if (row) qualified.push(row.id);
		}
		// Collect the (topN)-th place team for best-third ranking.
		const third = pick(g.table, topN);
		if (third) thirds.push(third);
	}

	if (bestThirds > 0) {
		thirds.sort((a, b) => {
			if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
			if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
			return a.name.localeCompare(b.name);
		});
		for (let i = 0; i < Math.min(bestThirds, thirds.length); i++) {
			qualified.push(thirds[i].id);
		}
	}

	return qualified;
}

/**
 * Seed a bracket from qualified teams (snake draft for even seeding).
 * @returns ordered team ids for the bracket.
 */
export function seedBracket(qualified: string[]): string[] {
	const n = qualified.length;
	const out: (string | undefined)[] = new Array(n);
	let i = 0;
	for (let round = 0; round < n; round++) {
		const pos = round % (n / 2);
		const slot = round < n / 2 ? pos : n - 1 - pos;
		out[slot] = qualified[i++];
	}
	return out as string[];
}

/** Convenience: shuffle teams deterministically (for random group draws). */
export function shuffleTeams(rng: () => number, teams: Team[]): Team[] {
	return shuffle(rng, [...teams]);
}

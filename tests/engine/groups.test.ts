import { describe, it, expect } from 'vitest';
import {
	groupDraw,
	qualify,
	seedBracket,
	simulateGroupStage,
} from '$lib/engine/groups.js';
import { rngFromString } from '$lib/engine/prng.js';
import type { TableRow, Team } from '$lib/engine/types.js';

function teams(n: number): Team[] {
	return Array.from({ length: n }, (_, i) => ({
		id: `t${String(i + 1).padStart(2, '0')}`,
		name: `Team ${i + 1}`,
		elo: 2000 - i * 20,
	}));
}

function row(id: string, points: number, gd: number, gf: number): TableRow {
	return {
		id,
		name: id,
		played: 6,
		won: 0,
		drawn: 0,
		lost: 0,
		goalsFor: gf,
		goalsAgainst: gf - gd,
		goalDiff: gd,
		points,
	};
}

/**
 * A synthetic group table: 4 teams with strictly decreasing points.
 * The third-place row's GD/GF vary with `base` so best-third ranking is
 * decided by GD, not by the name tiebreak.
 */
function tableFor(prefix: string, base: number): TableRow[] {
	return [
		row(`${prefix}1`, base + 12, 6, 10),
		row(`${prefix}2`, base + 6, 2, 6),
		row(`${prefix}3`, base + 3, base - 5, base + 4),
		row(`${prefix}4`, base, -7, 2),
	];
}

describe('groups', () => {
	it('groupDraw: 48 teams → 12 groups of 4, one team per pot', () => {
		const ts = teams(48);
		const groups = groupDraw(ts, 12, 4, { pots: 4 });
		expect(groups).toHaveLength(12);
		for (const g of groups) expect(g).toHaveLength(4);
		// Pot 1 = t01..t12, pot 2 = t13..t24, pot 3 = t25..t36, pot 4 = t37..t48.
		for (const g of groups) {
			const pots = g.map((t) => Math.ceil(Number(t.id.slice(1)) / 12));
			expect(new Set(pots).size).toBe(4);
		}
		// Every team appears exactly once.
		const all = groups.flat().map((t) => t.id).sort();
		expect(all).toEqual(ts.map((t) => t.id).sort());
	});

	it('groupDraw: confederation constraint keeps same confed apart', () => {
		// 8 teams, 2 confeds of 4, 2 groups of 4, 2 pots.
		const ts: Team[] = [
			{ id: 'a1', name: 'A1', elo: 2000 },
			{ id: 'a2', name: 'A2', elo: 1900 },
			{ id: 'b1', name: 'B1', elo: 1800 },
			{ id: 'b2', name: 'B2', elo: 1700 },
			{ id: 'a3', name: 'A3', elo: 1600 },
			{ id: 'a4', name: 'A4', elo: 1500 },
			{ id: 'b3', name: 'B3', elo: 1400 },
			{ id: 'b4', name: 'B4', elo: 1300 },
		];
		const confedOf = (id: string) => id[0];
		const groups = groupDraw(ts, 2, 4, { pots: 2, confederationOf: confedOf });
		for (const g of groups) {
			const confeds = g.map((t) => confedOf(t.id));
			expect(new Set(confeds).size).toBe(2);
		}
	});

	it('simulateGroupStage: double RR within each group (6 matches per group of 4)', () => {
		const groups = [['a', 'b', 'c', 'd'], ['e', 'f', 'g', 'h']];
		const eloOf = (id: string) => 1500 + id.charCodeAt(0);
		const result = simulateGroupStage(groups, rngFromString('g1'), eloOf, 0);
		expect(result.groups).toHaveLength(2);
		for (const g of result.groups) {
			expect(g.fixtures).toHaveLength(6);
			expect(g.table).toHaveLength(4);
			// Table is sorted by points descending.
			for (let i = 1; i < g.table.length; i++) {
				expect(g.table[i - 1].points).toBeGreaterThanOrEqual(g.table[i].points);
			}
		}
	});

	it('qualify: 12 groups, top-2 + best 8 thirds = 32 (WC 2026)', () => {
		const groups = Array.from({ length: 12 }, (_, i) => ({
			teamIds: [],
			table: tableFor(`g${i}`, i),
		}));
		const qualified = qualify(groups, { topN: 2, bestThirds: 8 });
		expect(qualified).toHaveLength(32);
		// All 24 top-2 teams are in.
		for (let i = 0; i < 12; i++) {
			expect(qualified).toContain(`g${i}1`);
			expect(qualified).toContain(`g${i}2`);
		}
		// Best 8 thirds: g43..g113 (third's GD = base − 5, so higher base wins).
		for (let i = 4; i < 12; i++) expect(qualified).toContain(`g${i}3`);
		expect(qualified).not.toContain('g03');
		expect(qualified).not.toContain('g33');
	});

	it('qualify: reverse mode inverts (worst teams advance)', () => {
		const groups = [
			{ teamIds: [], table: tableFor('g0', 0) },
			{ teamIds: [], table: tableFor('g1', 1) },
		];
		const normal = qualify(groups, { topN: 2 });
		const reversed = qualify(groups, { topN: 2, reverse: true });
		expect(normal).toEqual(['g01', 'g02', 'g11', 'g12']);
		expect(reversed).toEqual(['g04', 'g03', 'g14', 'g13']);
	});

	it('seedBracket: snake draft spreads top seeds across the bracket', () => {
		const qualified = ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8'];
		const seeded = seedBracket(qualified);
		expect(seeded).toHaveLength(8);
		// Snake: seeds 1-4 fill the top half in order, seeds 5-8 fill the
		// bottom half in reverse (s8 lands opposite s1, s5 at the very end).
		expect(seeded[0]).toBe('s1');
		expect(seeded[7]).toBe('s5');
		expect(seeded[4]).toBe('s8');
		// No duplicates, all present.
		expect(new Set(seeded).size).toBe(8);
	});
});

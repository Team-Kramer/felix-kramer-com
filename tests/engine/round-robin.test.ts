import { describe, it, expect } from 'vitest';
import {
	doubleRoundRobin,
	leagueTable,
	roundRobin,
	zoneMarkers,
} from '$lib/engine/round-robin.js';
import type { Fixture, Team } from '$lib/engine/types.js';

function teams(n: number): Team[] {
	return Array.from({ length: n }, (_, i) => ({
		id: `t${i + 1}`,
		name: `Team ${i + 1}`,
		elo: 2000 - i * 10,
	}));
}

describe('round-robin', () => {
	it('single RR: every pair meets exactly once', () => {
		const ids = ['a', 'b', 'c', 'd'];
		const fixtures = roundRobin(ids);
		// 4 teams → 3 rounds, 2 matches each = 6 matches = C(4,2).
		expect(fixtures).toHaveLength(6);
		const pairs = new Set(
			fixtures.map((f) => [f.home, f.away].sort().join('|'))
		);
		expect(pairs.size).toBe(6);
	});

	it('single RR: odd count pads with a BYE, no team plays itself', () => {
		const ids = ['a', 'b', 'c', 'd', 'e'];
		const fixtures = roundRobin(ids);
		// 5 teams → 5 rounds, 2 real matches each = 10 = C(5,2).
		expect(fixtures).toHaveLength(10);
		for (const f of fixtures) {
			expect(f.home).not.toBe(f.away);
			expect(f.home).not.toBe('BYE');
			expect(f.away).not.toBe('BYE');
		}
	});

	it('double RR: 20 teams = 380 matches (Fut parity)', () => {
		const ids = teams(20).map((t) => t.id);
		const fixtures = doubleRoundRobin(ids);
		// C(20,2) = 190 pairings × 2 (home + away) = 380.
		expect(fixtures).toHaveLength(380);
		// Each ordered pair appears exactly once.
		const ordered = new Set(fixtures.map((f) => `${f.home}>${f.away}`));
		expect(ordered.size).toBe(380);
	});

	it('double RR: every team plays 2×(n-1) matches', () => {
		const n = 10;
		const ids = teams(n).map((t) => t.id);
		const fixtures = doubleRoundRobin(ids);
		for (const id of ids) {
			const played = fixtures.filter((f) => f.home === id || f.away === id).length;
			expect(played).toBe(2 * (n - 1));
		}
	});

	it('leagueTable: points → GD → GF ordering', () => {
		const ts = teams(3);
		const fixtures: Fixture[] = [
			{ round: 1, home: 't1', away: 't2', homeScore: 2, awayScore: 0 },
			{ round: 1, home: 't1', away: 't3', homeScore: 1, awayScore: 1 },
			{ round: 1, home: 't2', away: 't3', homeScore: 0, awayScore: 1 },
		];
		const table = leagueTable(ts, fixtures);
		// t1: 4 pts (W+D). t3: 4 pts (W+D). t2: 0.
		// t1 GD +2, t3 GD 0 → t1 first.
		expect(table[0].id).toBe('t1');
		expect(table[1].id).toBe('t3');
		expect(table[2].id).toBe('t2');
	});

	it('leagueTable: head-to-head breaks a points/GD/GF tie', () => {
		const ts = teams(3);
		// t1 beats t2 2-1; t3 beats t1 1-0; t2 beats t3 1-0.
		// t1: 3 pts, 2 GF, 2 GA, GD 0. t2: 3 pts, 2 GF, 2 GA, GD 0.
		// t3: 3 pts, 1 GF, 1 GA, GD 0.
		// t1 and t2 tie on points/GD/GF → H2H: t1 beat t2 2-1 → t1 first.
		const fixtures: Fixture[] = [
			{ round: 1, home: 't1', away: 't2', homeScore: 2, awayScore: 1 },
			{ round: 1, home: 't3', away: 't1', homeScore: 1, awayScore: 0 },
			{ round: 2, home: 't2', away: 't3', homeScore: 1, awayScore: 0 },
		];
		const table = leagueTable(ts, fixtures);
		expect(table[0].id).toBe('t1');
		expect(table[1].id).toBe('t2');
		expect(table[2].id).toBe('t3');
	});

	it('zoneMarkers: title / europa / relegation bands', () => {
		// Zero-padded names so the no-fixture name tiebreak sorts in id order.
		const ts = teams(10).map((t, i) => ({
			...t,
			name: `Team ${String(i + 1).padStart(2, '0')}`,
		}));
		const table = leagueTable(ts, []);
		const zones = zoneMarkers(table, { title: 1, europa: 3, relegation: 2 });
		expect(zones.get('t1')).toBe('title');
		expect(zones.get('t2')).toBe('europa');
		expect(zones.get('t3')).toBe('europa');
		expect(zones.get('t9')).toBe('relegation');
		expect(zones.get('t10')).toBe('relegation');
		expect(zones.has('t5')).toBe(false);
	});
});

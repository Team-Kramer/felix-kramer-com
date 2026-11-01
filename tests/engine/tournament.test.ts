import { describe, it, expect } from 'vitest';
import {
	createTournament,
	decodeShare,
	encodeShare,
	runTournament,
	serialize,
	deserialize,
} from '$lib/engine/tournament.js';
import type { Team } from '$lib/engine/types.js';

/** 48 teams, Elo descending — the canonical WC 2026 test fixture. */
function wcTeams(): Team[] {
	return Array.from({ length: 48 }, (_, i) => ({
		id: `t${String(i + 1).padStart(2, '0')}`,
		name: `Team ${i + 1}`,
		elo: 2000 - i * 20,
	}));
}

describe('tournament — WC 2026 golden run', () => {
	// Golden values for { format: 'wc2026', teams: wcTeams(), seed: 'golden-1' }.
	// Recomputed after the group stage switched from double to single RR.
	const GOLDEN = {
		champion: 't05',
		qualified: [
			't13', 't01', 't14', 't02', 't15', 't03', 't04', 't28',
			't05', 't29', 't06', 't18', 't07', 't19', 't08', 't20',
			't09', 't21', 't10', 't22', 't11', 't35', 't24', 't12',
			't31', 't17', 't25', 't46', 't36', 't30', 't27', 't32',
		],
		groups: [
			['t01', 't13', 't25', 't37'],
			['t02', 't14', 't26', 't38'],
			['t03', 't15', 't27', 't39'],
			['t04', 't16', 't28', 't40'],
			['t05', 't17', 't29', 't41'],
			['t06', 't18', 't30', 't42'],
			['t07', 't19', 't31', 't43'],
			['t08', 't20', 't32', 't44'],
			['t09', 't21', 't33', 't45'],
			['t10', 't22', 't34', 't46'],
			['t11', 't23', 't35', 't47'],
			['t12', 't24', 't36', 't48'],
		],
	};

	it('reproduces the golden champion, qualifiers, and groups', () => {
		const state = runTournament({ format: 'wc2026', teams: wcTeams(), seed: 'golden-1' });
		expect(state.phase).toBe('done');
		expect(state.champion).toBe(GOLDEN.champion);
		expect(state.qualified).toHaveLength(32);
		expect([...state.qualified!].sort()).toEqual([...GOLDEN.qualified].sort());
		expect(state.groups).toEqual(GOLDEN.groups);
	});

	it('is deterministic: same seed → same result', () => {
		const a = runTournament({ format: 'wc2026', teams: wcTeams(), seed: 'golden-1' });
		const b = runTournament({ format: 'wc2026', teams: wcTeams(), seed: 'golden-1' });
		expect(a.champion).toBe(b.champion);
		expect(a.qualified).toEqual(b.qualified);
	});

	it('completes in < 100ms (main-thread budget)', () => {
		const start = performance.now();
		const state = runTournament({ format: 'wc2026', teams: wcTeams(), seed: 'perf' });
		const ms = performance.now() - start;
		expect(state.phase).toBe('done');
		expect(ms).toBeLessThan(100);
	});
});

describe('tournament — other formats', () => {
	it('single elimination runs to a champion', () => {
		const state = runTournament({
			format: 'single',
			teams: wcTeams().slice(0, 16),
			seed: 'single-1',
		});
		expect(state.phase).toBe('done');
		expect(state.champion).not.toBeNull();
	});

	it('double elimination runs to a champion', () => {
		const state = runTournament({
			format: 'double',
			teams: wcTeams().slice(0, 16),
			seed: 'double-1',
		});
		expect(state.phase).toBe('done');
		expect(state.champion).not.toBeNull();
	});

	it('swiss runs to a champion', () => {
		const state = runTournament({
			format: 'swiss',
			teams: wcTeams().slice(0, 16),
			seed: 'swiss-1',
			totalRounds: 5,
		});
		expect(state.phase).toBe('done');
		expect(state.champion).not.toBeNull();
	});

	it('league runs to a champion with a full table', () => {
		const state = runTournament({
			format: 'league',
			teams: wcTeams().slice(0, 10),
			seed: 'league-1',
		});
		expect(state.phase).toBe('done');
		expect(state.champion).not.toBeNull();
		expect(state.table).toHaveLength(10);
	});

	it('reverse mode inverts the WC 2026 champion', () => {
		const normal = runTournament({ format: 'wc2026', teams: wcTeams(), seed: 'rev-1' });
		const reversed = runTournament({
			format: 'wc2026',
			teams: wcTeams(),
			seed: 'rev-1',
			reverse: true,
		});
		expect(normal.champion).not.toBeNull();
		expect(reversed.champion).not.toBeNull();
		// Same seed, inverted advancement → a different champion.
		expect(reversed.champion).not.toBe(normal.champion);
	});
});

describe('tournament — serialization', () => {
	it('serialize/deserialize round-trips the champion', () => {
		const state = runTournament({ format: 'wc2026', teams: wcTeams(), seed: 'ser-1' });
		const restored = deserialize(serialize(state));
		expect(restored.champion).toBe(state.champion);
		expect(restored.phase).toBe('done');
	});

	it('encodeShare/decodeShare round-trips (URL-safe base64)', () => {
		const state = runTournament({ format: 'single', teams: wcTeams().slice(0, 8), seed: 'share-1' });
		const encoded = encodeShare(state);
		// URL-safe: no +, /, or = characters.
		expect(encoded).not.toMatch(/[+/=]/);
		const restored = decodeShare(encoded);
		expect(restored.champion).toBe(state.champion);
	});

	it('createTournament leaves the state un-simulated', () => {
		const state = createTournament({ format: 'wc2026', teams: wcTeams(), seed: 'x' });
		expect(state.phase).toBe('groups');
		expect(state.champion).toBeNull();
		expect(state.groups).toHaveLength(12);
	});
});

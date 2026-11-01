/**
 * Round-robin fixture generation (circle method) + league table.
 *
 * The circle method fixes one team and rotates the rest, producing a balanced
 * single round-robin. A double round-robin adds the mirror fixtures.
 */

import type { Fixture, TableRow, Team } from './types.js';

/**
 * Generate a single round-robin schedule using the circle method.
 *
 * @param teamIds ordered list of team ids (even count recommended; an odd
 *   count gets a "BYE" placeholder so every team still plays each round).
 * @returns fixtures grouped by round.
 */
export function roundRobin(teamIds: string[]): Fixture[] {
	const n = teamIds.length;
	const ids = [...teamIds];
	// Pad to even with a BYE so the rotation works.
	const bye = n % 2 === 1 ? 'BYE' : null;
	if (bye) ids.push(bye);
	const m = ids.length;
	const rounds = m - 1;
	const half = m / 2;

	const fixtures: Fixture[] = [];
	const circle = [...ids];

	for (let r = 0; r < rounds; r++) {
		for (let i = 0; i < half; i++) {
			const a = circle[i];
			const b = circle[m - 1 - i];
			if (a === bye || b === bye) continue;
			// Alternate home/away by round for fairness.
			const home = r % 2 === 0 ? a : b;
			const away = r % 2 === 0 ? b : a;
			fixtures.push({ round: r + 1, home, away });
		}
		// Rotate: keep circle[0] fixed, rotate the rest (indices 1..m-1) right by one.
		const last = circle.pop() as string;
		circle.splice(1, 0, last);
	}

	return fixtures;
}

/**
 * Generate a double round-robin (home + away for every pairing).
 */
export function doubleRoundRobin(teamIds: string[]): Fixture[] {
	const single = roundRobin(teamIds);
	const mirror = single.map((f) => ({
		round: f.round,
		home: f.away,
		away: f.home
	}));
	// Mirror rounds are offset after the single round-robin.
	const maxRound = Math.max(...single.map((f) => f.round));
	return [...single, ...mirror.map((f) => ({ ...f, round: f.round + maxRound }))];
}

export interface LeagueTableOptions {
	/** Points for a win (default 3). */
	winPoints?: number;
	/** Points for a draw (default 1). */
	drawPoints?: number;
}

/**
 * Build a league table from played fixtures, with tiebreaks:
 * points → goal difference → goals for → head-to-head → name.
 */
export function leagueTable(
	teams: Team[],
	fixtures: Fixture[],
	options: LeagueTableOptions = {}
): TableRow[] {
	const winPoints = options.winPoints ?? 3;
	const drawPoints = options.drawPoints ?? 1;

	const rows = new Map<string, TableRow>();
	for (const t of teams) {
		rows.set(t.id, {
			id: t.id,
			name: t.name,
			played: 0,
			won: 0,
			drawn: 0,
			lost: 0,
			goalsFor: 0,
			goalsAgainst: 0,
			goalDiff: 0,
			points: 0
		});
	}

	// Head-to-head goal difference for tiebreaks.
	const h2h = new Map<string, number>(); // "a|b" → (goalsA - goalsB)

	for (const f of fixtures) {
		if (f.homeScore === undefined || f.awayScore === undefined) continue;
		const home = rows.get(f.home);
		const away = rows.get(f.away);
		if (!home || !away) continue;

		home.played++;
		away.played++;
		home.goalsFor += f.homeScore;
		home.goalsAgainst += f.awayScore;
		away.goalsFor += f.awayScore;
		away.goalsAgainst += f.homeScore;

		if (f.homeScore > f.awayScore) {
			home.won++;
			away.lost++;
			home.points += winPoints;
		} else if (f.homeScore < f.awayScore) {
			away.won++;
			home.lost++;
			away.points += winPoints;
		} else {
			home.drawn++;
			away.drawn++;
			home.points += drawPoints;
			away.points += drawPoints;
		}

		const keyAB = `${f.home}|${f.away}`;
		const keyBA = `${f.away}|${f.home}`;
		h2h.set(keyAB, (h2h.get(keyAB) ?? 0) + (f.homeScore - f.awayScore));
		h2h.set(keyBA, (h2h.get(keyBA) ?? 0) + (f.awayScore - f.homeScore));
	}

	const table = [...rows.values()];
	for (const row of table) row.goalDiff = row.goalsFor - row.goalsAgainst;

	table.sort((a, b) => {
		if (b.points !== a.points) return b.points - a.points;
		if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
		if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
		const h2hAB = h2h.get(`${a.id}|${b.id}`) ?? 0;
		const h2hBA = h2h.get(`${b.id}|${a.id}`) ?? 0;
		if (h2hAB !== h2hBA) return h2hBA - h2hAB;
		return a.name.localeCompare(b.name);
	});

	return table;
}

/**
 * Mark qualification zones on a table (1-based row indices).
 * @returns a map of team id → zone label.
 */
export function zoneMarkers(
	table: TableRow[],
	zoneConfig: { title?: number; europa?: number; relegation?: number }
): Map<string, string> {
	const zones = new Map<string, string>();
	table.forEach((row, i) => {
		const pos = i + 1;
		if (zoneConfig.title && pos <= zoneConfig.title) zones.set(row.id, 'title');
		else if (zoneConfig.europa && pos <= zoneConfig.europa) zones.set(row.id, 'europa');
		else if (zoneConfig.relegation && pos > table.length - zoneConfig.relegation)
			zones.set(row.id, 'relegation');
	});
	return zones;
}

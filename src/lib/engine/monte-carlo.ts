/**
 * Monte Carlo simulation: run a tournament N times and aggregate
 * championship / qualification probabilities and average positions.
 *
 * Pure TS, no DOM — the Web Worker wrapper (workers/monte-carlo.worker.ts)
 * just calls this in a loop and posts progress.
 */

import type { Team } from './types.js';
import {
	runTournament,
	type TournamentConfig,
	type TournamentFormat,
} from './tournament.js';

export interface MonteCarloOptions {
	/** 0–100 chaos (default 0). */
	chaos?: number;
	/** Reverse mode (default false). */
	reverse?: boolean;
	// groups-knockout / wc2026
	groupCount?: number;
	groupSize?: number;
	pots?: number;
	topN?: number;
	bestThirds?: number;
	// swiss
	totalRounds?: number;
	/** Called after each run with (completed, total). */
	onProgress?: (done: number, total: number) => void;
}

export interface MonteCarloResult {
	/** Team id → P(champion) (sums to 1). */
	titleProb: Record<string, number>;
	/** Team id → P(qualifying from groups) — only for group formats. */
	qualificationProb: Record<string, number>;
	/** Team id → average final position (1 = champion / group winner). */
	avgPosition: Record<string, number>;
	/** Number of completed runs. */
	runs: number;
}

/**
 * Run a tournament `n` times and aggregate the outcomes.
 *
 * Each run uses a derived seed (`${seed}:${i}`) so the whole batch is
 * reproducible from (format, teams, n, seed).
 *
 * @param format tournament format.
 * @param teams participating teams.
 * @param n number of runs.
 * @param seed base seed string.
 * @param options simulation options.
 */
export function simulateN(
	format: TournamentFormat,
	teams: Team[],
	n: number,
	seed: string,
	options: MonteCarloOptions = {}
): MonteCarloResult {
	if (n <= 0) throw new Error('n must be > 0');

	const baseConfig: TournamentConfig = {
		format,
		teams,
		seed: 'unused',
		chaos: options.chaos ?? 0,
		reverse: options.reverse ?? false,
		groupCount: options.groupCount,
		groupSize: options.groupSize,
		pots: options.pots,
		topN: options.topN,
		bestThirds: options.bestThirds,
		totalRounds: options.totalRounds,
	};

	const titleWins: Record<string, number> = {};
	const qualified: Record<string, number> = {};
	const positionSum: Record<string, number> = {};
	const positionCount: Record<string, number> = {};
	const hasGroups = format === 'wc2026' || format === 'groups-knockout';

	for (const t of teams) {
		titleWins[t.id] = 0;
		qualified[t.id] = 0;
		positionSum[t.id] = 0;
		positionCount[t.id] = 0;
	}

	for (let i = 0; i < n; i++) {
		const config: TournamentConfig = { ...baseConfig, seed: `${seed}:${i}` };
		const state = runTournament(config);

		// Title.
		if (state.champion) titleWins[state.champion]++;

		// Qualification (group formats only).
		if (hasGroups && state.qualified) {
			for (const id of state.qualified) qualified[id]++;
		}

		// Positions: group table rank for group formats, final table for
		// league, bracket depth is not tracked (champion = 1, else n).
		if (hasGroups && state.groupResults) {
			for (const g of state.groupResults.groups) {
				g.table.forEach((row, idx) => {
					positionSum[row.id] += idx + 1;
					positionCount[row.id]++;
				});
			}
		} else if (state.table) {
			state.table.forEach((row, idx) => {
				positionSum[row.id] += idx + 1;
				positionCount[row.id]++;
			});
		} else {
			// Knockout / swiss: champion is 1, everyone else n (no finer
			// ranking is tracked by the engine).
			for (const t of teams) {
				const pos = t.id === state.champion ? 1 : teams.length;
				positionSum[t.id] += pos;
				positionCount[t.id]++;
			}
		}

		if (options.onProgress && (i + 1) % Math.max(1, Math.floor(n / 10)) === 0) {
			options.onProgress(i + 1, n);
		}
	}

	const titleProb: Record<string, number> = {};
	const qualificationProb: Record<string, number> = {};
	const avgPosition: Record<string, number> = {};
	for (const t of teams) {
		titleProb[t.id] = titleWins[t.id] / n;
		qualificationProb[t.id] = qualified[t.id] / n;
		avgPosition[t.id] = positionCount[t.id] > 0 ? positionSum[t.id] / positionCount[t.id] : 0;
	}

	return { titleProb, qualificationProb, avgPosition, runs: n };
}

/**
 * Convenience: create a tournament state for a single run (used by the
 * worker to report the first run's structure if needed).
 */
export function createMonteCarloConfig(
	format: TournamentFormat,
	teams: Team[],
	seed: string,
	options: MonteCarloOptions = {}
): TournamentConfig {
	return {
		format,
		teams,
		seed,
		chaos: options.chaos ?? 0,
		reverse: options.reverse ?? false,
		groupCount: options.groupCount,
		groupSize: options.groupSize,
		pots: options.pots,
		topN: options.topN,
		bestThirds: options.bestThirds,
		totalRounds: options.totalRounds,
	};
}

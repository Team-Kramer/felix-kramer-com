/**
 * Monte Carlo Web Worker: runs `simulateN` off the main thread and posts
 * progress every 10% plus the final result.
 *
 * Usage (SvelteKit):
 *   import MonteCarloWorker from '../workers/monte-carlo.worker?worker';
 *   const w = new MonteCarloWorker();
 *   w.postMessage({ format, teams, n, seed, options });
 *   w.onmessage = (e) => { ... }; // { type: 'progress', done, total } | { type: 'result', result }
 */

import { simulateN, type MonteCarloOptions } from '../lib/engine/monte-carlo.js';
import type { Team } from '../lib/engine/types.js';
import type { TournamentFormat } from '../lib/engine/tournament.js';

export interface MonteCarloRequest {
	format: TournamentFormat;
	teams: Team[];
	n: number;
	seed: string;
	options?: MonteCarloOptions;
}

export interface MonteCarloProgress {
	type: 'progress';
	done: number;
	total: number;
}

export interface MonteCarloResultMessage {
	type: 'result';
	result: ReturnType<typeof simulateN>;
}

export interface MonteCarloErrorMessage {
	type: 'error';
	message: string;
}

self.onmessage = (e: MessageEvent<MonteCarloRequest>) => {
	const { format, teams, n, seed, options } = e.data;
	try {
		const result = simulateN(format, teams, n, seed, {
			...options,
			onProgress: (done, total) => {
				(self as unknown as Worker).postMessage({
					type: 'progress',
					done,
					total,
				} satisfies MonteCarloProgress);
			},
		});
		(self as unknown as Worker).postMessage({
			type: 'result',
			result,
		} satisfies MonteCarloResultMessage);
	} catch (err) {
		(self as unknown as Worker).postMessage({
			type: 'error',
			message: err instanceof Error ? err.message : String(err),
		} satisfies MonteCarloErrorMessage);
	}
};

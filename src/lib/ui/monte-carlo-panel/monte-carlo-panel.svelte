<script lang="ts">
	import { onMount } from 'svelte';
	import MonteCarloWorker from '$lib/../workers/monte-carlo.worker?worker';
	import { simulateN, type MonteCarloOptions, type MonteCarloResult } from '$lib/engine/monte-carlo';
	import type { Team } from '$lib/engine/types';
	import type { TournamentFormat } from '$lib/engine/tournament';

	let {
		format,
		teams,
		options = {},
		defaultRuns = 1000
	}: {
		format: TournamentFormat;
		teams: Team[];
		options?: MonteCarloOptions;
		defaultRuns?: number;
	} = $props();

	let runs = $state(defaultRuns);
	let seed = $state('felix');
	let running = $state(false);
	let progress = $state(0);
	let result = $state<MonteCarloResult | null>(null);
	let error = $state<string | null>(null);

	let worker: Worker | null = null;
	const hasGroups = $derived(format === 'wc2026' || format === 'groups-knockout');

	const ranked = $derived.by(() => {
		const r = result;
		if (!r) return [];
		return [...teams]
			.sort((a, b) => (r.titleProb[b.id] ?? 0) - (r.titleProb[a.id] ?? 0))
			.map((t) => ({
				team: t,
				title: r.titleProb[t.id] ?? 0,
				qual: r.qualificationProb[t.id] ?? 0,
				pos: r.avgPosition[t.id] ?? 0
			}));
	});

	function start() {
		if (running) return;
		running = true;
		progress = 0;
		result = null;
		error = null;

		const onProgress = (done: number, total: number) => {
			progress = Math.round((done / total) * 100);
		};
		const finish = (r: MonteCarloResult) => {
			result = r;
			progress = 100;
			running = false;
		};

		try {
			worker = new MonteCarloWorker();
			worker.onmessage = (e: MessageEvent) => {
				const msg = e.data;
				if (msg.type === 'progress') onProgress(msg.done, msg.total);
				else if (msg.type === 'result') finish(msg.result);
				else if (msg.type === 'error') {
					error = msg.message;
					running = false;
				}
			};
			worker.onerror = () => {
				// Fallback: run on the main thread (e.g. in tests).
				worker?.terminate();
				worker = null;
				finish(simulateN(format, teams, runs, seed, { ...options, onProgress }));
			};
			worker.postMessage({ format, teams, n: runs, seed, options });
		} catch {
			// Worker unavailable (e.g. jsdom) — simulate synchronously.
			finish(simulateN(format, teams, runs, seed, { ...options, onProgress }));
		}
	}

	function stop() {
		worker?.terminate();
		worker = null;
		running = false;
	}

	onMount(() => () => worker?.terminate());
</script>

<section class="flex flex-col gap-4 rounded-lg border border-line bg-surface p-4 shadow-sm" aria-label="Monte-Carlo-Simulation">
	<h2 class="text-title-panel font-bold text-ink">Monte-Carlo-Simulation</h2>

	<div class="flex flex-wrap items-end gap-3">
		<div class="flex flex-col gap-1">
			<label for="mc-runs" class="text-caption font-semibold text-ink-secondary">Läufe</label>
			<select
				id="mc-runs"
				bind:value={runs}
				disabled={running}
				class="rounded-md border border-line bg-surface-variant px-2 py-1.5 text-body-md text-ink focus-visible:outline-2 focus-visible:outline-accent"
			>
				<option value={100}>100</option>
				<option value={1000}>1.000</option>
				<option value={10000}>10.000</option>
			</select>
		</div>
		<div class="flex flex-col gap-1">
			<label for="mc-seed" class="text-caption font-semibold text-ink-secondary">Seed</label>
			<input
				id="mc-seed"
				bind:value={seed}
				disabled={running}
				class="w-28 rounded-md border border-line bg-surface-variant px-2 py-1.5 font-mono text-body-md text-ink focus-visible:outline-2 focus-visible:outline-accent"
			/>
		</div>
		{#if running}
			<button
				type="button"
				onclick={stop}
				class="rounded-md border border-coral/60 px-3 py-1.5 text-body-md font-semibold text-coral transition-colors duration-150 hover:bg-coral/10 focus-visible:outline-2 focus-visible:outline-accent"
			>
				Abbrechen
			</button>
		{:else}
			<button
				type="button"
				onclick={start}
				class="rounded-md bg-accent px-4 py-1.5 text-body-md font-semibold text-on-green transition-colors duration-150 hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
			>
				Simulieren
			</button>
		{/if}
	</div>

	{#if running}
		<div class="flex flex-col gap-1" role="status">
			<div class="flex justify-between text-caption text-ink-secondary">
				<span>Simuliere {runs} Läufe …</span>
				<span class="font-mono tabular-nums">{progress}%</span>
			</div>
			<div class="h-2 w-full overflow-hidden rounded-full bg-surface-variant">
				<div class="h-full rounded-full bg-accent transition-[width] duration-200 ease-out" style:width="{progress}%"></div>
			</div>
		</div>
	{/if}

	{#if error}
		<p class="rounded-md border border-coral/40 bg-coral/10 px-3 py-2 text-body-md text-coral" role="alert">{error}</p>
	{/if}

	{#if result}
		<div class="flex flex-col gap-3">
			<p class="text-caption text-ink-tertiary">{result.runs} Läufe abgeschlossen</p>
			<ul class="flex flex-col gap-2" aria-label="Titelchancen">
				{#each ranked.slice(0, 10) as row (row.team.id)}
					<li class="flex items-center gap-3">
						<span class="w-24 truncate text-body-md font-semibold text-ink">{row.team.name}</span>
						<div
							class="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-surface-variant"
							role="progressbar"
							aria-label="{row.team.name} Titelchance"
							aria-valuemin="0"
							aria-valuemax="100"
							aria-valuenow={Math.round(row.title * 100)}
						>
							<div class="h-full rounded-full bg-accent transition-[width] duration-300 ease-out" style:width="{Math.round(row.title * 100)}%"></div>
						</div>
						<span class="w-10 text-right font-mono text-caption tabular-nums text-ink">{Math.round(row.title * 100)}%</span>
						{#if hasGroups}
							<span class="w-14 text-right font-mono text-caption tabular-nums text-ink-secondary" title="Quali-Chance">
								Q {Math.round(row.qual * 100)}%
							</span>
						{/if}
						<span class="w-12 text-right font-mono text-caption tabular-nums text-ink-tertiary" title="Ø Platzierung">
							Ø {row.pos.toFixed(1)}
						</span>
					</li>
				{/each}
			</ul>
		</div>
	{/if}
</section>

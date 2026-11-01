<script lang="ts">
	import type { CampaignResult } from '$lib/engine/campaign';

	let {
		result,
		teamName = 'Dein Team'
	}: {
		result: CampaignResult;
		teamName?: string;
	} = $props();

	const placementLabel = $derived(
		result.placement === 1
			? '🏆 Meister'
			: result.placement === 2
				? '🥈 Vizemeister'
				: result.placement === 3
					? '🥉 Dritter'
					: `Platz ${result.placement}`
	);

	const record = $derived(
		`${result.record.won}S ${result.record.drawn}U ${result.record.lost}N · ${result.record.goalsFor}:${result.record.goalsAgainst} Tore`
	);
</script>

<article
	class="relative flex flex-col gap-3 overflow-hidden rounded-xl border border-gold/40 bg-surface p-5 shadow-card"
	aria-label="Saisonbilanz"
>
	<div class="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-gold to-transparent" aria-hidden="true"></div>

	<header class="flex items-center justify-between gap-2">
		<div class="min-w-0">
			<p class="text-section-header-panel font-semibold uppercase tracking-wide text-ink-tertiary">Saisonbilanz</p>
			<h2 class="truncate text-headline-md font-bold text-ink">{teamName}</h2>
		</div>
		<span class="shrink-0 rounded-full border border-gold/50 bg-gold/10 px-3 py-1 text-body-md font-bold text-gold">
			{placementLabel}
		</span>
	</header>

	<dl class="grid grid-cols-3 gap-2 text-center">
		<div class="rounded-lg bg-surface-variant px-2 py-3">
			<dt class="text-caption font-semibold uppercase tracking-wide text-ink-tertiary">Platz</dt>
			<dd class="font-mono text-headline-md font-bold tabular-nums text-ink">{result.placement}</dd>
		</div>
		<div class="rounded-lg bg-surface-variant px-2 py-3">
			<dt class="text-caption font-semibold uppercase tracking-wide text-ink-tertiary">Rating</dt>
			<dd class="font-mono text-headline-md font-bold tabular-nums text-accent">{result.overallRating.toFixed(1)}</dd>
		</div>
		<div class="rounded-lg bg-surface-variant px-2 py-3">
			<dt class="text-caption font-semibold uppercase tracking-wide text-ink-tertiary">Spiele</dt>
			<dd class="font-mono text-headline-md font-bold tabular-nums text-ink">{result.record.played}</dd>
		</div>
	</dl>

	<p class="text-center font-mono text-body-md tabular-nums text-ink-secondary">{record}</p>

	{#if result.matches.length > 0}
		<ol class="flex flex-col gap-1" aria-label="Spiele">
			{#each result.matches as m, i (i)}
				<li class="flex items-center gap-2 rounded-md px-2 py-1 text-caption transition-colors duration-150 hover:bg-surface-variant/50">
					<span
						class="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-caption font-bold {m.won ? 'bg-accent-light text-accent' : m.drawn ? 'bg-surface-variant text-ink-secondary' : 'bg-coral/20 text-coral'}"
						aria-label={m.won ? 'Sieg' : m.drawn ? 'Unentschieden' : 'Niederlage'}
					>
						{m.won ? 'S' : m.drawn ? 'U' : 'N'}
					</span>
					<span class="min-w-0 flex-1 truncate text-ink-secondary">{m.home ? 'Heim' : 'Aus'} gegen {m.opponent}</span>
					<span class="shrink-0 font-mono tabular-nums text-ink">{m.homeScore}:{m.awayScore}</span>
				</li>
			{/each}
		</ol>
	{/if}
</article>

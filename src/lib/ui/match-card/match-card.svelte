<script lang="ts">
	import type { MatchProbabilities, MatchResult, Team } from '$lib/engine/types';

	let {
		home,
		away,
		homeScore,
		awayScore,
		probabilities,
		round,
		compact = false
	}: {
		home: Team;
		away: Team;
		homeScore?: number | null;
		awayScore?: number | null;
		probabilities?: MatchProbabilities;
		round?: string;
		compact?: boolean;
	} = $props();

	const played = $derived(homeScore != null && awayScore != null);
	const winnerId = $derived(
		!played ? null : homeScore! > awayScore! ? home.id : awayScore! > homeScore! ? away.id : null
	);
</script>

<article
	class="flex flex-col gap-2 rounded-lg border border-line bg-surface p-3 shadow-sm"
	aria-label="{home.name} gegen {away.name}"
>
	{#if round}<span class="text-caption font-semibold uppercase tracking-wide text-ink-tertiary">{round}</span>{/if}

	<div class="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
		<div class="flex min-w-0 items-center justify-end gap-2">
			{#if home.color}<span class="h-2.5 w-2.5 shrink-0 rounded-full" style:background-color="{home.color}" aria-hidden="true"></span>{/if}
			<span
				class="truncate text-body-md font-semibold {winnerId === home.id ? 'text-ink' : 'text-ink-secondary'}"
			>{home.name}</span>
		</div>

		<div
			class="flex items-center gap-1 rounded-md bg-surface-variant px-2 py-1 font-mono tabular-nums {compact ? 'text-caption' : 'text-title-panel'} font-bold"
			aria-label={played ? `Ergebnis ${homeScore} zu ${awayScore}` : 'Noch nicht gespielt'}
		>
			<span class={winnerId === home.id ? 'text-ink' : 'text-ink-secondary'}>{homeScore ?? '–'}</span>
			<span class="text-ink-tertiary" aria-hidden="true">:</span>
			<span class={winnerId === away.id ? 'text-ink' : 'text-ink-secondary'}>{awayScore ?? '–'}</span>
		</div>

		<div class="flex min-w-0 items-center gap-2">
			{#if away.color}<span class="h-2.5 w-2.5 shrink-0 rounded-full" style:background-color="{away.color}" aria-hidden="true"></span>{/if}
			<span
				class="truncate text-body-md font-semibold {winnerId === away.id ? 'text-ink' : 'text-ink-secondary'}"
			>{away.name}</span>
		</div>
	</div>

	{#if probabilities}
		<div class="flex h-1.5 w-full overflow-hidden rounded-full bg-surface-variant" aria-hidden="true">
			<div class="h-full bg-accent" style:width="{Math.round(probabilities.home * 100)}%"></div>
			<div class="h-full bg-ink-tertiary" style:width="{Math.round(probabilities.draw * 100)}%"></div>
			<div class="h-full bg-coral" style:width="{Math.round(probabilities.away * 100)}%"></div>
		</div>
		<div class="flex justify-between text-caption tabular-nums text-ink-tertiary" aria-hidden="true">
			<span>{Math.round(probabilities.home * 100)}%</span>
			<span>{Math.round(probabilities.draw * 100)}%</span>
			<span>{Math.round(probabilities.away * 100)}%</span>
		</div>
	{/if}
</article>

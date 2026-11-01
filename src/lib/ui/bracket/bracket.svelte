<script lang="ts">
	import type { BracketMatch, Team } from '$lib/engine/types';

	let {
		matches,
		teams,
		championId = null
	}: {
		matches: BracketMatch[];
		/** team id → Team. */
		teams: Map<string, Team>;
		championId?: string | null;
	} = $props();

	const nameOf = (id: string | null) => (id ? (teams.get(id)?.name ?? id) : 'TBD');
	const colorOf = (id: string | null) => (id ? teams.get(id)?.color : undefined);

	const rounds = $derived(matches.length ? Math.max(...matches.map((m) => m.round)) + 1 : 0);
	const byRound = $derived.by(() => {
		const map = new Map<number, BracketMatch[]>();
		for (const m of matches) {
			if (!map.has(m.round)) map.set(m.round, []);
			map.get(m.round)!.push(m);
		}
		for (const list of map.values()) list.sort((a, b) => a.index - b.index);
		return map;
	});

	const ROUND_LABELS = ['Achtelfinale', 'Viertelfinale', 'Halbfinale', 'Finale'];
	const roundLabel = (r: number) =>
		ROUND_LABELS[r] ?? `Runde ${r + 1}`;
</script>

<div class="flex gap-4 overflow-x-auto pb-2" role="tree" aria-label="K.-o.-Plan">
	{#each Array.from({ length: rounds }) as _, r (r)}
		<div class="flex min-w-40 flex-col justify-around gap-3" role="group" aria-label="{roundLabel(r)}">
			<h3 class="text-center text-section-header-panel font-semibold uppercase tracking-wide text-ink-tertiary">
				{roundLabel(r)}
			</h3>
			{#each byRound.get(r) ?? [] as m (m.id)}
				{@const isFinal = r === rounds - 1 && m.bracket === 'W'}
				<div
					class="rounded-lg border bg-surface p-2 shadow-sm {isFinal ? 'border-gold/60 shadow-teal-glow' : 'border-line'}"
					role="treeitem"
					aria-selected="false"
					aria-label="{nameOf(m.home)} gegen {nameOf(m.away)}{m.decided ? `, Ergebnis ${m.homeScore} zu ${m.awayScore}` : ''}"
				>
					{#each [m.home, m.away] as side, si (si)}
						{@const winner = m.decided && (si === 0 ? m.winner === m.home : m.winner === m.away)}
						<div
							class="flex items-center gap-1.5 rounded px-1.5 py-1 text-body-md {winner ? 'bg-accent-light/60 font-bold text-ink' : 'text-ink-secondary'}"
						>
							{#if colorOf(side)}<span class="h-2 w-2 shrink-0 rounded-full" style:background-color="{colorOf(side)}" aria-hidden="true"></span>{/if}
							<span class="min-w-0 flex-1 truncate">{nameOf(side)}</span>
							<span class="font-mono tabular-nums">{m.decided ? (si === 0 ? m.homeScore : m.awayScore) : '–'}</span>
						</div>
					{/each}
				</div>
			{/each}
		</div>
	{/each}

	{#if championId}
		<div class="flex min-w-36 flex-col items-center justify-center gap-2">
			<h3 class="text-section-header-panel font-semibold uppercase tracking-wide text-ink-tertiary">Sieger</h3>
			<div class="flex items-center gap-2 rounded-lg border border-gold/60 bg-surface px-4 py-3 shadow-teal-glow">
				<span class="text-title-panel" aria-hidden="true">🏆</span>
				<span class="text-body-md font-bold text-ink">{nameOf(championId)}</span>
			</div>
		</div>
	{/if}
</div>

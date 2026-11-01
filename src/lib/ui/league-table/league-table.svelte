<script lang="ts">
	import type { TableRow } from '$lib/engine/types';

	let {
		table,
		zones,
		compact = false
	}: {
		table: TableRow[];
		/** team id → zone label ('title' | 'europa' | 'relegation'). */
		zones?: Map<string, string>;
		compact?: boolean;
	} = $props();

	const zoneMap = $derived(zones instanceof Map ? zones : new Map<string, string>());

	const ZONE_BAR: Record<string, string> = {
		title: 'bg-accent',
		europa: 'bg-sky',
		relegation: 'bg-coral'
	};
</script>

<div class="overflow-x-auto rounded-lg border border-line bg-surface shadow-sm">
	<table class="w-full border-collapse text-left">
		<caption class="sr-only">Tabelle</caption>
		<thead>
			<tr class="border-b border-line text-table-header font-semibold uppercase tracking-wide text-ink-tertiary">
				<th scope="col" class="w-8 px-2 py-2 text-center">#</th>
				<th scope="col" class="px-2 py-2">Team</th>
				<th scope="col" class="px-2 py-2 text-center">Sp</th>
				{#if !compact}
					<th scope="col" class="px-2 py-2 text-center">S</th>
					<th scope="col" class="px-2 py-2 text-center">U</th>
					<th scope="col" class="px-2 py-2 text-center">N</th>
				{/if}
				<th scope="col" class="px-2 py-2 text-center">T+</th>
				<th scope="col" class="px-2 py-2 text-center">T−</th>
				<th scope="col" class="px-2 py-2 text-center">Diff</th>
				<th scope="col" class="px-2 py-2 text-center">Pkt</th>
			</tr>
		</thead>
		<tbody>
			{#each table as row, i (row.id)}
				{@const zone = zoneMap.get(row.id)}
				<tr
					class="border-b border-line-subtle last:border-0 text-table-body transition-colors duration-150 hover:bg-surface-variant/50"
				>
					<td class="relative px-2 py-1.5 text-center font-mono tabular-nums text-ink-tertiary">
						{#if zone}<span class="absolute inset-y-1 left-0 w-0.5 rounded-full {ZONE_BAR[zone] ?? ''}" aria-hidden="true"></span>{/if}
						{i + 1}
					</td>
					<th scope="row" class="px-2 py-1.5 text-left font-semibold text-ink">{row.name}</th>
					<td class="px-2 py-1.5 text-center font-mono tabular-nums">{row.played}</td>
					{#if !compact}
						<td class="px-2 py-1.5 text-center font-mono tabular-nums text-ink-secondary">{row.won}</td>
						<td class="px-2 py-1.5 text-center font-mono tabular-nums text-ink-secondary">{row.drawn}</td>
						<td class="px-2 py-1.5 text-center font-mono tabular-nums text-ink-secondary">{row.lost}</td>
					{/if}
					<td class="px-2 py-1.5 text-center font-mono tabular-nums text-ink-secondary">{row.goalsFor}</td>
					<td class="px-2 py-1.5 text-center font-mono tabular-nums text-ink-secondary">{row.goalsAgainst}</td>
					<td class="px-2 py-1.5 text-center font-mono tabular-nums {row.goalDiff > 0 ? 'text-success' : row.goalDiff < 0 ? 'text-danger' : 'text-ink-secondary'}">
						{row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff}
					</td>
					<td class="px-2 py-1.5 text-center font-mono font-bold tabular-nums text-ink">{row.points}</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>

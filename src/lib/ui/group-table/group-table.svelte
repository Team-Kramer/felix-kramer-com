<script lang="ts">
	import type { GroupStageResult } from '$lib/engine/groups';
	import type { Team } from '$lib/engine/types';

	let {
		result,
		teams,
		qualifying = 2
	}: {
		result: GroupStageResult;
		/** team id → Team (for names/colors). */
		teams: Map<string, Team>;
		/** Rows per group that qualify (default 2). */
		qualifying?: number;
	} = $props();

	const nameOf = (id: string) => teams.get(id)?.name ?? id;
</script>

<div class="grid gap-4 md:grid-cols-2">
	{#each result.groups as group, gi (gi)}
		<section class="rounded-lg border border-line bg-surface p-3 shadow-sm">
			<h3 class="mb-2 text-section-header-panel font-semibold uppercase tracking-wide text-ink-tertiary">
				Gruppe {String.fromCharCode(65 + gi)}
			</h3>
			<table class="w-full border-collapse text-left">
				<thead>
					<tr class="border-b border-line text-table-header font-semibold uppercase tracking-wide text-ink-tertiary">
						<th scope="col" class="w-6 px-1 py-1.5 text-center">#</th>
						<th scope="col" class="px-1 py-1.5">Team</th>
						<th scope="col" class="px-1 py-1.5 text-center">Sp</th>
						<th scope="col" class="px-1 py-1.5 text-center">Diff</th>
						<th scope="col" class="px-1 py-1.5 text-center">Pkt</th>
					</tr>
				</thead>
				<tbody>
					{#each group.table as row, i (row.id)}
						{@const team = teams.get(row.id)}
						<tr
							class="border-b border-line-subtle last:border-0 text-table-body {i < qualifying ? 'bg-accent-light/40' : ''}"
						>
							<td class="px-1 py-1.5 text-center font-mono tabular-nums text-ink-tertiary">{i + 1}</td>
							<th scope="row" class="flex items-center gap-1.5 px-1 py-1.5 text-left font-semibold text-ink">
								{#if team?.color}<span class="h-2 w-2 shrink-0 rounded-full" style:background-color="{team.color}" aria-hidden="true"></span>{/if}
								<span class="truncate">{nameOf(row.id)}</span>
							</th>
							<td class="px-1 py-1.5 text-center font-mono tabular-nums text-ink-secondary">{row.played}</td>
							<td class="px-1 py-1.5 text-center font-mono tabular-nums {row.goalDiff > 0 ? 'text-success' : row.goalDiff < 0 ? 'text-danger' : 'text-ink-secondary'}">
								{row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff}
							</td>
							<td class="px-1 py-1.5 text-center font-mono font-bold tabular-nums text-ink">{row.points}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</section>
	{/each}
</div>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import EmptyState from '../empty-state/empty-state.svelte';

	export type TableColumn = {
		key: string;
		label: string;
		align?: 'left' | 'center' | 'right';
	};
	export type TableRow = Record<string, string | number | null>;

	let {
		columns,
		rows,
		rowKey = 'id',
		selectedKey,
		label = 'Data table',
		emptyTitle = 'No records',
		interactive = false,
		onrowselect,
		rowActions
	}: {
		columns: TableColumn[];
		rows: TableRow[];
		rowKey?: string;
		selectedKey?: string | number;
		label?: string;
		emptyTitle?: string;
		interactive?: boolean;
		onrowselect?: (row: TableRow) => void;
		rowActions?: Snippet<[TableRow]>;
	} = $props();

	const ALIGN: Record<string, string> = {
		left: 'text-left',
		center: 'text-center',
		right: 'text-right'
	};
</script>

{#if rows.length}
	<div class="overflow-auto rounded-[10px] border border-line bg-surface shadow-card">
		<table class="w-full border-separate border-spacing-0 text-ink text-table-body" aria-label={label}>
			<thead class="sticky top-0 z-10 bg-surface-variant">
				<tr>
					{#each columns as column (column.key)}
						<th
							scope="col"
							class="px-3 py-2.5 text-table-header font-bold tracking-table-header whitespace-nowrap text-ink-secondary uppercase {ALIGN[column.align ?? 'left']}"
						>
							{column.label}
						</th>
					{/each}
					{#if rowActions}<th scope="col" class="px-3 py-2.5 text-right text-table-header font-bold tracking-table-header whitespace-nowrap text-ink-secondary uppercase">Actions</th>{/if}
				</tr>
			</thead>
			<tbody>
				{#each rows as row, index (`${row[rowKey] ?? index}`)}
					{@const selected = selectedKey !== undefined && row[rowKey] === selectedKey}
					<tr
						class="cursor-default focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent {interactive
							? 'cursor-pointer'
							: ''} {selected
							? 'bg-accent-light text-accent-hover'
							: ''}"
						tabindex={interactive ? 0 : undefined}
						aria-selected={interactive ? selected : undefined}
						onclick={() => interactive && onrowselect?.(row)}
						onkeydown={(event) => {
							if (interactive && (event.key === 'Enter' || event.key === ' ')) {
								event.preventDefault();
								onrowselect?.(row);
							}
						}}
					>
						{#each columns as column (column.key)}
							<td class="h-11 border-t border-line-subtle px-3 py-2 {ALIGN[column.align ?? 'left']}">
								{row[column.key] ?? '—'}
							</td>
						{/each}
						{#if rowActions}<td class="border-t border-line-subtle px-3 py-2 text-right whitespace-nowrap">{@render rowActions(row)}</td>{/if}
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{:else}
	<EmptyState kind="no-data" title={emptyTitle} />
{/if}

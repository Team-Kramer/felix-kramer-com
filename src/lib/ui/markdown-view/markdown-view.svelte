<script lang="ts">
	import { renderMarkdown, type Inline } from '$lib/markdown';

	let { markdown }: { markdown: string } = $props();

	const blocks = $derived(renderMarkdown(markdown));
</script>

{#snippet inlines(items: Inline[])}
	{#each items as inline, i (i)}
		{#if inline.type === 'bold'}
			<strong class="font-semibold text-ink">{inline.text}</strong>
		{:else if inline.type === 'italic'}
			<em>{inline.text}</em>
		{:else if inline.type === 'code'}
			<code class="rounded bg-surface-elevated px-1.5 py-0.5 font-mono text-[0.85em] text-ink">
				{inline.text}
			</code>
		{:else if inline.type === 'link'}
			<a
				href={inline.href}
				class="font-medium text-accent underline decoration-accent/40 underline-offset-2 transition-colors duration-150 hover:decoration-accent"
			>
				{inline.text}
			</a>
		{:else}
			<span>{inline.text}</span>
		{/if}
	{/each}
{/snippet}

<div class="space-y-5 text-ink-secondary">
	{#each blocks as block, idx (idx)}
		{#if block.type === 'heading'}
			{@const cls =
				block.level <= 2
					? 'mt-10 text-headline-md font-bold tracking-tight text-ink'
					: 'mt-8 text-headline-sm font-bold text-ink'}
			{#if block.level === 1}
				<h1 class={cls}>{@render inlines(block.inlines)}</h1>
			{:else if block.level === 2}
				<h2 class={cls}>{@render inlines(block.inlines)}</h2>
			{:else if block.level === 3}
				<h3 class={cls}>{@render inlines(block.inlines)}</h3>
			{:else}
				<h4 class={cls}>{@render inlines(block.inlines)}</h4>
			{/if}
		{:else if block.type === 'paragraph'}
			<p class="leading-relaxed">{@render inlines(block.inlines)}</p>
		{:else if block.type === 'list'}
			{#if block.ordered}
				<ol class="list-decimal space-y-1.5 pl-6 marker:text-ink-tertiary">
					{#each block.items as item, i (i)}
						<li>{@render inlines(item)}</li>
					{/each}
				</ol>
			{:else}
				<ul class="list-disc space-y-1.5 pl-6 marker:text-ink-tertiary">
					{#each block.items as item, i (i)}
						<li>{@render inlines(item)}</li>
					{/each}
				</ul>
			{/if}
		{:else if block.type === 'code'}
			<pre
				class="overflow-x-auto rounded-xl border border-line bg-surface p-4 font-mono text-sm leading-relaxed text-ink"
			>
				<code>{block.code}</code>
			</pre>
		{:else if block.type === 'quote'}
			<blockquote class="border-l-4 border-accent/40 pl-4 italic text-ink-secondary">
				{@render inlines(block.inlines)}
			</blockquote>
		{:else if block.type === 'hr'}
			<hr class="border-line" />
		{/if}
	{/each}
</div>

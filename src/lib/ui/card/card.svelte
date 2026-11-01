<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		title,
		variant = 'default',
		panelHeader = false,
		accentDot = false,
		glow = false,
		interactive = false,
		selected = false,
		disabled = false,
		padding = 'standard',
		onactivate,
		children
	}: {
		title?: string;
		variant?: 'default' | 'highlighted' | 'boom';
		panelHeader?: boolean;
		accentDot?: boolean;
		glow?: boolean;
		interactive?: boolean;
		selected?: boolean;
		disabled?: boolean;
		padding?: 'standard' | 'dense' | 'none';
		onactivate?: () => void;
		children?: Snippet;
	} = $props();

	const id = $props.id();

	const VARIANT: Record<string, string> = {
		default: '',
		highlighted: 'bg-gradient-to-br from-surface to-surface-cream shadow-accent-glow',
		boom: ''
	};

	const BAR: Record<string, string> = {
		default: 'bg-accent-light',
		highlighted: 'bg-gold',
		boom: 'bg-coral'
	};

	const PAD: Record<string, string> = {
		standard: 'p-4',
		dense: 'p-2',
		none: 'p-0'
	};

	const cardClass = $derived(
		`relative block w-full overflow-hidden rounded-lg border border-line bg-surface shadow-card text-left ${VARIANT[variant]} ${glow
			? 'glow-border'
			: ''} ${interactive || selected
			? 'border-accent bg-accent-light'
			: ''} ${interactive
				? 'cursor-pointer transition-[border-color,background-color,box-shadow] duration-150 ease-out focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2'
				: ''} ${disabled ? 'opacity-60' : ''}`
	);
</script>

{#snippet cardContents()}
	<span class="pointer-events-none absolute inset-y-0 left-0 w-[3px] {BAR[variant]}" aria-hidden="true"></span>
	{#if title || panelHeader}
		<header
			class={panelHeader
				? 'flex min-h-10 items-center gap-2 border-b border-line bg-surface-variant px-4 py-2'
				: ''}
		>
			{#if accentDot}<span class="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true"></span>{/if}
			{#if title}<h2 id="{id}-title" class="m-0 text-section-header-panel font-semibold uppercase tracking-wide">{title}</h2>{/if}
		</header>
	{/if}
	<div class={PAD[padding]}>{@render children?.()}</div>
{/snippet}

{#if interactive && !disabled}
	<button
		type="button"
		class="{cardClass}"
		aria-labelledby={title ? `${id}-title` : undefined}
		aria-pressed={selected}
		onclick={() => onactivate?.()}
	>
		{@render cardContents()}
	</button>
{:else}
	<section
		class="{cardClass}"
		role={title ? 'region' : undefined}
		aria-labelledby={title ? `${id}-title` : undefined}
		aria-disabled={disabled ? 'true' : undefined}
	>
		{@render cardContents()}
	</section>
{/if}

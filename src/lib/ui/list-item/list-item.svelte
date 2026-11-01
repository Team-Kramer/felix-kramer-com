<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		selected = false,
		interactive = false,
		disabled = false,
		href,
		label,
		onactivate,
		children,
		actions
	}: {
		selected?: boolean;
		interactive?: boolean;
		disabled?: boolean;
		href?: string;
		label?: string;
		onactivate?: () => void;
		children?: Snippet;
		actions?: Snippet;
	} = $props();

	const id = $props.id();

	const itemClass = $derived(
		`flex min-h-11 items-center justify-between gap-3 border-b border-line-subtle px-3 py-2 text-inherit no-underline ${interactive && !disabled
			? 'cursor-pointer transition-[background-color,color] duration-150 ease-out'
			: ''} ${selected
			? 'bg-accent-light text-accent-hover'
			: ''} ${disabled ? 'pointer-events-none cursor-not-allowed opacity-55' : ''}`
	);

	const controlClass = $derived(
		'flex min-w-0 flex-1 items-center border-0 bg-transparent p-0 text-left text-inherit no-underline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2'
	);
</script>

<div {id} class={itemClass}>
	{#if href && !disabled}
		<a href={href} class={controlClass} aria-label={label} aria-current={selected ? 'page' : undefined}>
			{@render children?.()}
		</a>
	{:else if interactive && !disabled}
		<button
			type="button"
			class="{controlClass} cursor-pointer"
			aria-label={label}
			aria-pressed={selected}
			onclick={() => onactivate?.()}
		>
			{@render children?.()}
		</button>
	{:else}
		<div class="flex min-w-0 flex-1 items-center" aria-label={label} aria-disabled={disabled ? 'true' : undefined}>
			{@render children?.()}
		</div>
	{/if}
	<div class="flex min-w-0 items-center gap-2">{@render actions?.()}</div>
</div>

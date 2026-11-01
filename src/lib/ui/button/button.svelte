<script lang="ts">
	import type { Snippet } from 'svelte';
	import Spinner from '../spinner/spinner.svelte';

	type Variant = 'primary' | 'secondary' | 'destructive' | 'icon-outline';

	let {
		variant = 'primary',
		type = 'button',
		busy = false,
		disabled = false,
		pulse = false,
		class: className = '',
		'aria-label': ariaLabel,
		'aria-pressed': ariaPressed,
		onclick,
		children
	}: {
		variant?: Variant;
		type?: 'button' | 'submit' | 'reset';
		busy?: boolean;
		disabled?: boolean;
		pulse?: boolean;
		class?: string;
		'aria-label'?: string;
		'aria-pressed'?: boolean;
		onclick?: (event: MouseEvent) => void;
		children?: Snippet;
	} = $props();

	const VARIANT: Record<Variant, string> = {
		primary:
			'overflow-hidden bg-gradient-to-br from-gold to-gold-dark text-(--on-gold) shadow-accent-glow before:pointer-events-none before:absolute before:inset-[0_0_50%] before:rounded-[inherit] before:bg-white/25 before:content-[""]',
		secondary: 'bg-accent text-on-teal hover:not-disabled:bg-accent-hover hover:not-disabled:shadow-teal-glow',
		destructive:
			'bg-coral text-(--on-coral) hover:not-disabled:bg-coral-dark hover:not-disabled:shadow-coral-glow',
		'icon-outline':
			'h-9 w-9 min-w-9 border-line bg-surface p-0 text-ink icon-glow active:not-disabled:scale-[0.96]'
	};
</script>

<button
	{type}
	class="relative inline-flex min-h-9 cursor-pointer items-center justify-center gap-2 rounded-full border border-transparent px-4 py-2 text-button-label font-bold leading-tight transition-[transform,background-color,box-shadow] duration-150 ease-out focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 focus-visible:shadow-focus active:not-disabled:scale-95 disabled:cursor-not-allowed disabled:opacity-60 {VARIANT[variant]} {pulse
		? 'pulse-cta'
		: ''} {variant === 'secondary'
			? 'hover-lift'
			: ''} {className}"
	disabled={disabled || busy}
	aria-busy={busy ? 'true' : undefined}
	aria-label={ariaLabel}
	aria-pressed={ariaPressed}
	onclick={onclick}
>
	{#if busy}<Spinner label="Loading" decorative />{/if}
	<span class="relative z-10">{@render children?.()}</span>
</button>

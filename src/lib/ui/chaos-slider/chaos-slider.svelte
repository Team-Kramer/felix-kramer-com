<script lang="ts">
	let {
		value = $bindable(0),
		min = 0,
		max = 100,
		step = 1,
		label = 'Chaos'
	}: {
		value: number;
		min?: number;
		max?: number;
		step?: number;
		label?: string;
	} = $props();

	const id = $props.id();
	const pct = $derived(max > min ? ((value - min) / (max - min)) * 100 : 0);
</script>

<div class="flex flex-col gap-1.5">
	<div class="flex items-baseline justify-between">
		<label for="{id}" class="text-caption font-semibold text-ink-secondary">{label}</label>
		<span class="font-mono text-body-md font-bold tabular-nums text-ink" aria-live="polite">{value}</span>
	</div>
	<input
		id="{id}"
		type="range"
		bind:value
		{min}
		{max}
		{step}
		aria-valuetext="{value} von {max}"
		class="chaos-range h-2 w-full cursor-pointer appearance-none rounded-full focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-4"
		style:background="linear-gradient(to right, var(--color-accent) {pct}%, var(--color-surface-variant) {pct}%)"
	/>
</div>

<style>
	/* Range thumb — Tailwind can't style pseudo-elements, so this stays scoped. */
	.chaos-range::-webkit-slider-thumb {
		appearance: none;
		height: 18px;
		width: 18px;
		border-radius: 9999px;
		background: var(--color-ink);
		border: 2px solid var(--color-accent);
		box-shadow: var(--shadow-sm);
		transition: transform 150ms ease-out;
	}
	.chaos-range::-webkit-slider-thumb:active {
		transform: scale(1.15);
	}
	.chaos-range::-moz-range-thumb {
		height: 18px;
		width: 18px;
		border-radius: 9999px;
		background: var(--color-ink);
		border: 2px solid var(--color-accent);
		box-shadow: var(--shadow-sm);
		transition: transform 150ms ease-out;
	}
	.chaos-range::-moz-range-thumb:active {
		transform: scale(1.15);
	}
</style>

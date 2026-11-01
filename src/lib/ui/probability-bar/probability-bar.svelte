<script lang="ts">
	let {
		label,
		value,
		color = 'accent',
		showValue = true
	}: {
		label: string;
		/** 0–1 probability. */
		value: number;
		/** Color token: 'accent' | 'gold' | 'coral' | 'sky' | 'success' | 'warning' | 'danger'. */
		color?: string;
		showValue?: boolean;
	} = $props();

	const FILL: Record<string, string> = {
		accent: 'bg-accent',
		gold: 'bg-gold',
		coral: 'bg-coral',
		sky: 'bg-sky',
		success: 'bg-success',
		warning: 'bg-warning',
		danger: 'bg-danger'
	};

	const pct = $derived(Math.round(Math.min(1, Math.max(0, value)) * 100));
</script>

<div class="flex flex-col gap-1">
	<div class="flex items-baseline justify-between gap-2">
		<span class="text-caption font-semibold text-ink-secondary">{label}</span>
		{#if showValue}<span class="font-mono text-caption tabular-nums text-ink">{pct}%</span>{/if}
	</div>
	<div
		class="h-2 w-full overflow-hidden rounded-full bg-surface-variant"
		role="progressbar"
		aria-label={label}
		aria-valuemin="0"
		aria-valuemax="100"
		aria-valuenow={pct}
	>
		<div
			class="h-full rounded-full transition-[width] duration-300 ease-out {FILL[color] ?? FILL.accent}"
			style:width="{pct}%"
		></div>
	</div>
</div>

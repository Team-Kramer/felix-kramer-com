<script lang="ts">
	let {
		value,
		max = 100,
		label = 'Progress',
		indeterminate = value === undefined
	}: {
		value?: number;
		max?: number;
		label?: string;
		indeterminate?: boolean;
	} = $props();

	const safeMax = $derived(Number.isFinite(max) && max > 0 ? max : 100);
	const safeValue = $derived(
		value === undefined || !Number.isFinite(value)
			? undefined
			: Math.min(safeMax, Math.max(0, value))
	);
	const percentage = $derived(safeValue === undefined ? 0 : (safeValue / safeMax) * 100);
</script>

<div
	class="progress"
	role="progressbar"
	aria-label={label}
	aria-valuemin="0"
	aria-valuemax={safeMax}
	aria-valuenow={indeterminate ? undefined : safeValue}
>
	<span
		class="progress__fill"
		class:progress__fill--indeterminate={indeterminate}
		style:width={indeterminate ? undefined : `${percentage}%`}
	></span>
</div>

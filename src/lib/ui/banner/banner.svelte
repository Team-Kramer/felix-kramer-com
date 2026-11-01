<script lang="ts">
	let {
		message,
		variant = 'info',
		actionLabel,
		onaction
	}: {
		message: string;
		variant?: 'info' | 'success' | 'warning' | 'error';
		actionLabel?: string;
		onaction?: () => void;
	} = $props();

	const VARIANT: Record<string, string> = {
		info: 'border-l-accent bg-surface',
		success: 'border-l-success bg-success-container',
		warning: 'border-l-warning bg-warning-container',
		error: 'border-l-danger bg-danger-container'
	};
</script>

<div
	class="flex items-center justify-between gap-3 rounded-md border border-line border-l-4 px-4 py-3 text-ink {VARIANT[variant]}"
	role={variant === 'error' ? 'alert' : 'status'}
>
	<p class="m-0">{message}</p>
	{#if actionLabel}
		<button
			type="button"
			class="cursor-pointer border-0 bg-transparent font-bold text-accent-hover"
			onclick={() => onaction?.()}
		>
			{actionLabel}
		</button>
	{/if}
</div>

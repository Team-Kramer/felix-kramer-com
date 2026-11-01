<script lang="ts">
	let {
		label,
		variant = 'neutral',
		dot = false
	}: {
		label: string;
		variant?: 'success' | 'warning' | 'error' | 'neutral';
		dot?: boolean;
	} = $props();

	const VARIANT: Record<string, string> = {
		neutral: 'bg-surface-variant text-ink-secondary',
		success: 'bg-success-container text-success-ink',
		warning: 'bg-warning-container text-warning-ink',
		error: 'bg-danger-container text-danger-ink'
	};
</script>

<span class="inline-flex min-h-6 items-center gap-1.5 rounded-full px-2.5 py-[3px] text-caption font-semibold {VARIANT[variant]}">
	{#if dot}<span class="h-2 w-2 rounded-full bg-current" aria-hidden="true"></span>{/if}
	{label}
</span>

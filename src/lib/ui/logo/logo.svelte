<script lang="ts">
	let {
		variant = 'wordmark',
		label = 'Felix Kramer'
	}: {
		variant?: 'wordmark' | 'compact';
		label?: string;
	} = $props();
</script>

<a
	class="inline-flex min-h-12 cursor-pointer items-center gap-2 text-inherit no-underline"
	href="/"
	aria-label={label}
>
	<span
		class="grid flex-none place-items-center rounded-full bg-accent-light text-accent-hover {variant === 'compact'
			? 'h-8 w-8 text-xl'
			: 'h-10 w-10 text-2xl'}"
		aria-hidden="true"
	>
		<span class="material-symbols-outlined">sports_soccer</span>
	</span>
	{#if variant === 'wordmark'}
		<span class="text-headline-md font-extrabold tracking-[-0.02em] leading-none" aria-hidden="true">
			Felix <span class="text-accent-hover">Kramer</span>
		</span>
	{/if}
</a>

<script lang="ts">
	let {
		rows = 3,
		shape = 'line'
	}: {
		rows?: number;
		shape?: 'line' | 'card';
	} = $props();
</script>

<div class="skeleton-list grid gap-3" class:skeleton-list--card={shape === 'card'} aria-hidden="true">
	{#each Array.from({ length: Math.max(0, Math.floor(rows)) }) as _, index (index)}
		<span class="skeleton"></span>
	{/each}
</div>

<style>
	/* Gradient shimmer + nth-child widths: not expressible as Tailwind utilities */
	.skeleton {
		display: block;
		height: 16px;
		border-radius: var(--radius-sm);
		background: linear-gradient(
			90deg,
			var(--color-surface-variant),
			var(--color-surface),
			var(--color-surface-variant)
		);
		background-size: 200% 100%;
		animation: skeleton-pulse 1.4s ease-in-out infinite;
	}

	.skeleton:nth-child(2n) {
		width: 78%;
	}

	.skeleton-list--card .skeleton {
		height: 88px;
		border-radius: var(--radius-lg);
	}
</style>

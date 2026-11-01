<script lang="ts">
	let {
		kind,
		title,
		message,
		actionLabel,
		onaction
	}: {
		kind: 'no-data' | 'no-results';
		title?: string;
		message?: string;
		actionLabel?: string;
		onaction?: () => void;
	} = $props();

	const id = $props.id();

	const defaultTitle = $derived(title ?? (kind === 'no-data' ? 'Nothing here yet' : 'No results'));
	const defaultMessage = $derived(
		message ??
			(kind === 'no-data'
				? 'Add an item to get started.'
				: 'Try changing or clearing your filters.')
	);
</script>

<section class="grid justify-items-center gap-2 rounded-lg border border-dashed border-line p-8 px-5 text-center text-ink-secondary" aria-labelledby="{id}-title">
	<h2 id="{id}-title" class="m-0 text-headline-md font-extrabold text-ink">{defaultTitle}</h2>
	<p class="m-0">{defaultMessage}</p>
	{#if actionLabel}
		<button
			type="button"
			class="min-h-9 cursor-pointer rounded-full border-0 bg-accent px-3.5 py-2 font-bold text-on-teal transition-transform duration-150 ease-out focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 active:scale-95"
			onclick={() => onaction?.()}
		>
			{actionLabel}
		</button>
	{/if}
</section>

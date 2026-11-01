<script lang="ts">
	import Card from '$lib/ui/card/card.svelte';

	let {
		title,
		body = 'Content',
		interactive = false,
		selected = false,
		onactivate
	}: {
		title?: string;
		body?: string;
		interactive?: boolean;
		selected?: boolean;
		onactivate?: () => void;
	} = $props();
</script>

<Card {title} {interactive} {selected} {onactivate}>{body}</Card>

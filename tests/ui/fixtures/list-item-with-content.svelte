<script lang="ts">
	import ListItem from '$lib/ui/list-item/list-item.svelte';

	let {
		body = 'Eintrag',
		interactive = false,
		selected = false,
		label,
		onactivate
	}: {
		body?: string;
		interactive?: boolean;
		selected?: boolean;
		label?: string;
		onactivate?: () => void;
	} = $props();
</script>

<ListItem {interactive} {selected} {label} {onactivate}>{body}</ListItem>

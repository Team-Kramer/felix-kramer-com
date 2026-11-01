<script lang="ts">
	import Tabs from '$lib/ui/tabs/tabs.svelte';

	let { initial = 'a' }: { initial?: string } = $props();
	let activeId = $state(initial);
</script>

<Tabs
	bind:activeId
	label="Test tabs"
	tabs={[
		{ id: 'a', label: 'Erste', content: contentA },
		{ id: 'b', label: 'Zweite', count: 3, content: contentB }
	]}
/>

{#snippet contentA()}
	Panel A
{/snippet}
{#snippet contentB()}
	Panel B
{/snippet}

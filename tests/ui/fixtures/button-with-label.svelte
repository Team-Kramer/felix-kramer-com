<script lang="ts">
	import Button from '$lib/ui/button/button.svelte';

	let {
		label = 'Start',
		busy = false,
		variant = 'primary',
		onclick
	}: {
		label?: string;
		busy?: boolean;
		variant?: 'primary' | 'secondary' | 'destructive' | 'icon-outline';
		onclick?: (event: MouseEvent) => void;
	} = $props();
</script>

<Button {busy} {variant} {onclick}>{label}</Button>

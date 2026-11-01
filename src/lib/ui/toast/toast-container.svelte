<script lang="ts">
	import { onMount } from 'svelte';
	import Toast from './toast.svelte';
	import { dismissToast, toastStore, type ToastMessage } from './toast.store';

	let messages = $state<ToastMessage[]>([]);
	onMount(() => toastStore.subscribe((nextMessages) => (messages = nextMessages)));
</script>

<div class="pointer-events-none fixed right-4 bottom-4 z-[1000] grid w-[min(400px,calc(100vw-32px))] gap-2" aria-live="polite" aria-relevant="additions text">
	{#each messages as toast (toast.id)}
		<div class="pointer-events-auto"><Toast {toast} ondismiss={() => dismissToast(toast.id)} /></div>
	{/each}
</div>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import Button from '../button/button.svelte';

	let {
		open = false,
		title,
		message,
		confirmLabel = 'Confirm',
		cancelLabel = 'Cancel',
		destructive = false,
		busy = false,
		onconfirm,
		oncancel,
		children
	}: {
		open?: boolean;
		title: string;
		message?: string;
		confirmLabel?: string;
		cancelLabel?: string;
		destructive?: boolean;
		busy?: boolean;
		onconfirm: () => void;
		oncancel: () => void;
		children?: Snippet;
	} = $props();

	let dialog = $state<HTMLDialogElement | undefined>(undefined);
	let closing = $state(false);

	$effect(() => {
		if (!dialog) return;
		if (open && !dialog.open) {
			closing = false;
			dialog.showModal();
		} else if (!open && dialog.open) {
			closing = true;
			dialog.close();
		}
	});

	function onDialogClose() {
		if (closing) {
			closing = false;
			return;
		}
		oncancel();
	}
</script>

<dialog
	bind:this={dialog}
	class="fixed inset-0 m-auto grid max-h-[min(640px,calc(100dvh-32px))] w-[min(480px,calc(100vw-32px))] gap-4 overflow-y-auto rounded-lg border border-line bg-surface p-5 text-ink shadow-dialog backdrop:bg-black/60"
	aria-labelledby="confirm-panel-title"
	onclose={onDialogClose}
>
	<h2 id="confirm-panel-title" class="m-0 text-headline-md font-bold">{title}</h2>
	{#if message}<p class="m-0 text-body-md text-ink-secondary">{message}</p>{/if}
	{@render children?.()}
	<div class="flex justify-end gap-2 border-t border-line pt-3">
		<Button variant="secondary" disabled={busy} onclick={oncancel}>{cancelLabel}</Button>
		<Button variant={destructive ? 'destructive' : 'primary'} {busy} onclick={onconfirm}>
			{confirmLabel}
		</Button>
	</div>
</dialog>

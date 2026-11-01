<script lang="ts">
	import type { ToastMessage } from './toast.store';

	let { toast, ondismiss }: { toast: ToastMessage; ondismiss: () => void } = $props();

	const BORDER: Record<string, string> = {
		info: 'border-l-accent',
		success: 'border-l-success',
		warning: 'border-l-warning',
		error: 'border-l-danger'
	};
</script>

<div
	class="flex items-center justify-between gap-3 rounded-md border border-line border-l-4 bg-surface px-4 py-3 text-ink shadow-md {BORDER[toast.kind]} {toast.exiting
		? 'animate-[toast-out_300ms_ease-in_both]'
		: 'animate-[toast-in_200ms_ease-out_both]'}"
	role={toast.kind === 'error' ? 'alert' : 'status'}
>
	<p class="m-0">{toast.message}</p>
	<button
		type="button"
		class="grid h-8 w-8 cursor-pointer place-items-center rounded-full border-0 bg-transparent text-ink-secondary text-xl"
		aria-label="Dismiss notification"
		onclick={ondismiss}
	>
		×
	</button>
</div>

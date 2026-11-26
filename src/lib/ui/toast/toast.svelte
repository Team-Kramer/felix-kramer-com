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
	class="toast flex items-center justify-between gap-3 rounded-md border border-line border-l-4 bg-surface px-4 py-3 text-ink shadow-md {BORDER[toast.kind]}"
	data-exiting={toast.exiting}
	role={toast.kind === 'error' ? 'alert' : 'status'}
>
	<p class="m-0">{toast.message}</p>
	<button
		type="button"
		class="toast__dismiss grid h-8 w-8 cursor-pointer place-items-center rounded-full border-0 bg-transparent text-ink-secondary text-xl"
		aria-label="Dismiss notification"
		onclick={ondismiss}
	>
		×
	</button>
</div>

<style>
	/* Transitions (not keyframes) so rapid add/dismiss retargets smoothly. */
	.toast {
		opacity: 1;
		transform: translateY(0);
		transition:
			opacity var(--transition-toast-in) var(--ease-out),
			transform var(--transition-toast-in) var(--ease-out);
		@starting-style {
			opacity: 0;
			transform: translateY(8px);
		}
	}

	.toast[data-exiting='true'] {
		opacity: 0;
		transform: translateY(8px);
		transition:
			opacity var(--transition-toast-out) var(--ease-out),
			transform var(--transition-toast-out) var(--ease-out);
	}

	.toast__dismiss {
		transition:
			color var(--transition-fast) var(--ease-out),
			transform var(--transition-fast) var(--ease-out);
	}

	.toast__dismiss:hover {
		color: var(--color-ink);
	}

	.toast__dismiss:active {
		transform: scale(0.9);
	}
</style>

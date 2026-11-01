import { writable } from 'svelte/store';

export type ToastKind = 'info' | 'success' | 'warning' | 'error';

export interface ToastMessage {
	id: number;
	message: string;
	kind: ToastKind;
	exiting: boolean;
}

export const toastStore = writable<ToastMessage[]>([]);

let nextToastId = 0;
const dismissTimers = new Map<number, ReturnType<typeof setTimeout>>();
const removalTimers = new Map<number, ReturnType<typeof setTimeout>>();

function removeToast(id: number): void {
	const timer = removalTimers.get(id);
	if (timer) clearTimeout(timer);
	removalTimers.delete(id);
	toastStore.update((messages) => messages.filter((message) => message.id !== id));
}

export function showToast(message: string, kind: ToastKind = 'success', duration = 2700): number {
	const normalizedMessage = message.trim();
	if (!normalizedMessage) throw new Error('Toast message must not be empty.');

	const id = ++nextToastId;
	toastStore.update((messages) => [...messages, { id, message: normalizedMessage, kind, exiting: false }]);
	if (duration > 0) {
		dismissTimers.set(id, setTimeout(() => {
			dismissTimers.delete(id);
			toastStore.update((messages) =>
				messages.map((item) => (item.id === id ? { ...item, exiting: true } : item))
			);
			removalTimers.set(id, setTimeout(() => removeToast(id), 300));
		}, duration));
	}
	return id;
}

export function dismissToast(id: number): void {
	const timer = dismissTimers.get(id);
	if (timer) clearTimeout(timer);
	dismissTimers.delete(id);
	removeToast(id);
}

export function clearToasts(): void {
	for (const timer of dismissTimers.values()) clearTimeout(timer);
	for (const timer of removalTimers.values()) clearTimeout(timer);
	dismissTimers.clear();
	removalTimers.clear();
	toastStore.set([]);
}

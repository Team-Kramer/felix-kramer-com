import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/svelte';
import { afterEach } from 'vitest';

// jsdom ships a window.matchMedia stub that throws "not implemented" when
// called. The effect modules query it for reduced-motion / coarse-pointer
// detection, so replace it with a no-op that reports "no preference" — the
// normal (non-reduced) code path then runs in tests.
if (typeof window !== 'undefined') {
	let mediaQueryWorks = true;
	try {
		window.matchMedia('(prefers-reduced-motion: reduce)');
	} catch {
		mediaQueryWorks = false;
	}
	if (!mediaQueryWorks) {
		window.matchMedia = (query: string) =>
			({
				matches: false,
				media: query,
				onchange: null,
				addEventListener: () => {},
				removeEventListener: () => {},
				addListener: () => {},
				removeListener: () => {},
				dispatchEvent: () => false
			}) as MediaQueryList;
	}
}

// jsdom does not implement the modal dialog API; polyfill the minimum needed.
if (typeof HTMLDialogElement !== 'undefined') {
	if (!HTMLDialogElement.prototype.showModal) {
		HTMLDialogElement.prototype.showModal = function () {
			this.open = true;
		};
	}
	if (!HTMLDialogElement.prototype.close) {
		HTMLDialogElement.prototype.close = function () {
			this.open = false;
			this.dispatchEvent(new Event('close'));
		};
	}
}

afterEach(() => {
	cleanup();
});

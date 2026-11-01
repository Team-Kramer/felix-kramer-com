import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/svelte';
import { afterEach } from 'vitest';

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

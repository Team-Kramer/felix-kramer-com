export interface GlidingPillBinding {
	refresh(): void;
	destroy(): void;
}

export function supportsAnchorPositioning(): boolean {
	return typeof CSS !== 'undefined' && CSS.supports('anchor-name: --test');
}

export function bindGlidingPill(
	container: HTMLElement,
	indicator: HTMLElement,
	getActiveElement: () => HTMLElement | null
): GlidingPillBinding {
	let raf = 0;
	let 	ro: ResizeObserver | null = null;
	let onResize: (() => void) | null = null;

	function position() {
		raf = 0;
		const active = getActiveElement();
		if (!active || !container.contains(active)) {
			indicator.style.opacity = '0';
			return;
		}
		const cRect = container.getBoundingClientRect();
		const aRect = active.getBoundingClientRect();
		const x = aRect.left - cRect.left + container.scrollLeft;
		const y = aRect.top - cRect.top + container.scrollTop;
		indicator.style.opacity = '1';
		indicator.style.width = `${aRect.width}px`;
		indicator.style.height = `${aRect.height}px`;
		indicator.style.transform = `translate3d(${x}px, ${y}px, 0)`;
	}

	function schedule() {
		if (!raf) raf = requestAnimationFrame(position);
	}

	if (typeof ResizeObserver !== 'undefined') {
		ro = new ResizeObserver(schedule);
		ro.observe(container);
		ro.observe(indicator);
	} else {
		// Fallback for environments without ResizeObserver (e.g. jsdom).
		onResize = schedule;
		window.addEventListener('resize', onResize, { passive: true });
	}
	container.addEventListener('scroll', schedule, { passive: true });
	schedule();

	return {
		refresh: schedule,
		destroy() {
			if (raf) cancelAnimationFrame(raf);
			ro?.disconnect();
			if (onResize) window.removeEventListener('resize', onResize);
			container.removeEventListener('scroll', schedule);
		},
	};
}

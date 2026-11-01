export interface GlidingPillBinding {
	refresh(): void;
	destroy(): void;
}

export function supportsAnchorPositioning(): boolean {
	return (
		typeof CSS !== 'undefined' &&
		typeof CSS.supports === 'function' &&
		CSS.supports('anchor-name: --glide-active') &&
		CSS.supports('position-anchor: --glide-active')
	);
}

export function bindGlidingPill(
	container: HTMLElement,
	indicator: HTMLElement,
	getActiveElement: () => HTMLElement | null
): GlidingPillBinding {
	const viewport = container.ownerDocument.defaultView;
	if (!viewport) throw new Error('Gliding pill container must belong to a document window.');
	const frameWindow: Window = viewport;

	let frame = 0;
	let observedElement: HTMLElement | null = null;
	const resizeObserver =
		typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(schedule);

	function update() {
		frame = 0;
		const active = getActiveElement();
		if (active !== observedElement) {
			if (observedElement) resizeObserver?.unobserve(observedElement);
			observedElement = active;
			if (observedElement) resizeObserver?.observe(observedElement);
		}
		if (!active) {
			indicator.hidden = true;
			return;
		}

		indicator.hidden = false;
		const containerRect = container.getBoundingClientRect();
		const activeRect = active.getBoundingClientRect();
		const x = activeRect.left - containerRect.left - container.clientLeft + container.scrollLeft;
		const y = activeRect.top - containerRect.top - container.clientTop + container.scrollTop;
		indicator.style.inlineSize = `${activeRect.width}px`;
		indicator.style.blockSize = `${activeRect.height}px`;
		indicator.style.transform = `translate3d(${x}px, ${y}px, 0)`;
	}

	function schedule() {
		if (frame) frameWindow.cancelAnimationFrame(frame);
		frame = frameWindow.requestAnimationFrame(update);
	}

	resizeObserver?.observe(container);
	container.addEventListener('scroll', schedule, { passive: true });
	frameWindow.addEventListener('resize', schedule);
	update();

	return {
		refresh: schedule,
		destroy() {
			if (frame) frameWindow.cancelAnimationFrame(frame);
			container.removeEventListener('scroll', schedule);
			frameWindow.removeEventListener('resize', schedule);
			resizeObserver?.disconnect();
		}
	};
}

export function bindScrollProgress(element: HTMLElement, viewport: Window = window): () => void {
	const documentElement = viewport.document.documentElement;

	function update() {
		const scrollableHeight = documentElement.scrollHeight - viewport.innerHeight;
		const progress =
			scrollableHeight > 0 ? Math.min(1, Math.max(0, viewport.scrollY / scrollableHeight)) : 0;
		element.style.setProperty('--scroll-progress', String(progress));
	}

	viewport.addEventListener('scroll', update, { passive: true });
	viewport.addEventListener('resize', update);
	update();

	return () => {
		viewport.removeEventListener('scroll', update);
		viewport.removeEventListener('resize', update);
	};
}

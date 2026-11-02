function readMetrics(viewport: HTMLElement | Window): {
	scrollTop: number;
	scrollHeight: number;
	clientHeight: number;
} {
	if (typeof viewport === 'object' && 'scrollHeight' in viewport) {
		return {
			scrollTop: viewport.scrollTop,
			scrollHeight: viewport.scrollHeight,
			clientHeight: viewport.clientHeight,
		};
	}
	return {
		scrollTop: window.scrollY,
		scrollHeight: document.documentElement.scrollHeight,
		clientHeight: window.innerHeight,
	};
}

export function bindScrollProgress(
	element: HTMLElement,
	viewport: HTMLElement | Window = window
): () => void {
	let raf = 0;

	function update() {
		raf = 0;
		const { scrollTop, scrollHeight, clientHeight } = readMetrics(viewport);
		const max = scrollHeight - clientHeight;
		const progress = max > 0 ? Math.min(1, Math.max(0, scrollTop / max)) : 0;
		element.style.setProperty('--scroll-progress', String(progress));
	}

	function onScroll() {
		if (!raf) raf = requestAnimationFrame(update);
	}

	viewport.addEventListener('scroll', onScroll, { passive: true });
	viewport.addEventListener('resize', onScroll, { passive: true });
	update();

	return () => {
		if (raf) cancelAnimationFrame(raf);
		viewport.removeEventListener('scroll', onScroll);
		viewport.removeEventListener('resize', onScroll);
	};
}

/**
 * Typewriter effect (Ania #12).
 * Types text character-by-character via rAF.
 * Static fallback under reduced-motion (full text appears instantly).
 */

export interface TypewriterBinding {
	destroy(): void;
}

export function bindTypewriter(
	element: HTMLElement,
	text: string,
	options: { delay?: number; startDelay?: number } = {}
): TypewriterBinding {
	const { delay = 60, startDelay = 400 } = options;
	const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

	if (reducedMotion.matches) {
		element.textContent = text;
		return { destroy() {} };
	}

	let index = 0;
	let raf = 0;
	let timeout: ReturnType<typeof setTimeout>;
	let lastTime = 0;

	function tick(now: number) {
		if (now - lastTime >= delay) {
			lastTime = now;
			index++;
			element.textContent = text.slice(0, index);
			if (index >= text.length) return;
		}
		raf = requestAnimationFrame(tick);
	}

	timeout = setTimeout(() => {
		raf = requestAnimationFrame(tick);
	}, startDelay);

	return {
		destroy() {
			clearTimeout(timeout);
			if (raf) cancelAnimationFrame(raf);
			element.textContent = text;
		},
	};
}

/**
 * Interactive 3D card tilt (Ania #11).
 * Pointer-based, max 8° rotation, disabled under reduced-motion and on touch.
 * Uses rAF + transform only (compositor-friendly, Apple rule §11).
 */

const MAX_DEG = 8;

export interface TiltBinding {
	destroy(): void;
}

export function bindTilt(element: HTMLElement): TiltBinding {
	const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
	const isTouch = window.matchMedia('(pointer: coarse)').matches;

	if (reducedMotion.matches || isTouch) {
		return { destroy() {} };
	}

	let targetX = 0;
	let targetY = 0;
	let raf = 0;

	function apply() {
		raf = 0;
		element.style.transform = `perspective(800px) rotateX(${targetY}deg) rotateY(${targetX}deg)`;
	}

	function onPointerMove(e: PointerEvent) {
		const rect = element.getBoundingClientRect();
		const px = (e.clientX - rect.left) / rect.width - 0.5;
		const py = (e.clientY - rect.top) / rect.height - 0.5;
		targetX = px * MAX_DEG * 2;
		targetY = -py * MAX_DEG * 2;
		if (!raf) raf = requestAnimationFrame(apply);
	}

	function onPointerLeave() {
		targetX = 0;
		targetY = 0;
		if (!raf) raf = requestAnimationFrame(apply);
	}

	element.addEventListener('pointermove', onPointerMove);
	element.addEventListener('pointerleave', onPointerLeave);

	return {
		destroy() {
			if (raf) cancelAnimationFrame(raf);
			element.removeEventListener('pointermove', onPointerMove);
			element.removeEventListener('pointerleave', onPointerLeave);
			element.style.transform = '';
		},
	};
}

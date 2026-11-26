/**
 * Interactive 3D card tilt (Ania #11).
 * Pointer-based, max 8° rotation, disabled under reduced-motion and on touch.
 * Uses rAF + transform only (compositor-friendly, Apple rule §11).
 * The rotation follows the pointer through a critically-damped spring so the
 * card feels alive instead of glued to the cursor.
 */

const MAX_DEG = 8;
// Spring smoothing factor per frame (~60fps). Higher = snappier, lower = floatier.
const SPRING = 0.18;
const SETTLE = 0.01;

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
	let currentX = 0;
	let currentY = 0;
	let raf = 0;

	function step() {
		currentX += (targetX - currentX) * SPRING;
		currentY += (targetY - currentY) * SPRING;

		if (Math.abs(targetX - currentX) < SETTLE && Math.abs(targetY - currentY) < SETTLE) {
			currentX = targetX;
			currentY = targetY;
		}

		element.style.transform = `perspective(800px) rotateX(${currentY}deg) rotateY(${currentX}deg)`;

		if (currentX === targetX && currentY === targetY) {
			raf = 0;
			return;
		}
		raf = requestAnimationFrame(step);
	}

	function kick() {
		if (!raf) raf = requestAnimationFrame(step);
	}

	function onPointerMove(e: PointerEvent) {
		const rect = element.getBoundingClientRect();
		const px = (e.clientX - rect.left) / rect.width - 0.5;
		const py = (e.clientY - rect.top) / rect.height - 0.5;
		targetX = px * MAX_DEG * 2;
		targetY = -py * MAX_DEG * 2;
		kick();
	}

	function onPointerLeave() {
		targetX = 0;
		targetY = 0;
		kick();
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

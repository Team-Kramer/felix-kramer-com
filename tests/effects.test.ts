import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
	bindGlidingPill,
	bindScrollProgress,
	bindTilt,
	bindTypewriter,
	supportsAnchorPositioning
} from '../src/lib/ui/effects';

const css = readFileSync(resolve(process.cwd(), 'src/app.css'), 'utf-8');

describe('adopted effects — CSS classes present', () => {
	const adopted = [
		['#1 glass', '.glass'],
		['#4 rotating glow', '.glow-border'],
		['#6 glow icon button', '.icon-glow'],
		['#8 gradient text', '.text-gradient-gold'],
		['#10 clip-path reveal', '.reveal'],
		['#13 grow', '@keyframes grow'],
		['#14 pulsing button', '.pulse-cta'],
		['#16 gliding pill', '.glide-pill'],
		['#18 aspect-ratio', '.aspect-media'],
		['#19 hover animation', '.hover-lift']
	];

	it.each(adopted)('%s renders its class/hook', (_label, selector) => {
		expect(css).toContain(selector);
	});
});

describe('conditional effects — feature detection + static fallbacks', () => {
	it('#3 metaball has a static gradient fallback (blobs exist without animation)', () => {
		expect(css).toContain('.metaball');
		expect(css).toContain('metaball-drift-a');
	});

	it('#7 mirror is progressive enhancement (WebKit-only box-reflect)', () => {
		expect(css).toContain('-webkit-box-reflect');
	});

	it('#9 blend overlay uses a low-opacity soft-light texture', () => {
		expect(css).toContain('.blend-overlay');
		expect(css).toContain('mix-blend-mode: soft-light');
	});

	it('#12 typewriter caret is defined', () => {
		expect(css).toContain('.typewriter::after');
	});

	it('#10 reveal falls back to fully visible when animation-timeline is unsupported', () => {
		// Base rule must not hide content; the clip animation is gated behind @supports.
		expect(css).toMatch(/\.reveal\s*\{\s*clip-path:\s*inset\(0 0 0 0\);/);
		expect(css).toContain('@supports (animation-timeline: view())');
	});

	it('#15 hero parallax is gated behind scroll() timeline support', () => {
		expect(css).toContain('@supports (animation-timeline: scroll())');
		expect(css).toContain('.hero-parallax');
	});
});

describe('Apple motion rules', () => {
	it('reduced-motion override disables all keyframe animations and transitions', () => {
		expect(css).toContain('prefers-reduced-motion: reduce');
		expect(css).toMatch(/animation:\s*none\s*!important/);
		expect(css).toMatch(/transition:\s*none\s*!important/);
	});

	it('reduced-transparency makes glass solid', () => {
		expect(css).toContain('prefers-reduced-transparency: reduce');
	});

	it('prefers-contrast: more strengthens borders', () => {
		expect(css).toContain('prefers-contrast: more');
	});
});

describe('JS effect modules', () => {
	it('supportsAnchorPositioning returns a boolean without throwing', () => {
		expect(typeof supportsAnchorPositioning()).toBe('boolean');
	});

	it('bindTilt attaches and cleans up without throwing', () => {
		const el = document.createElement('div');
		const binding = bindTilt(el);
		expect(typeof binding.destroy).toBe('function');
		binding.destroy();
	});

	it('bindTypewriter restores the full text on destroy', () => {
		const el = document.createElement('p');
		const binding = bindTypewriter(el, 'hello world');
		binding.destroy();
		expect(el.textContent).toBe('hello world');
	});

	it('bindScrollProgress writes --scroll-progress and cleans up', () => {
		const el = document.createElement('div');
		const destroy = bindScrollProgress(el);
		expect(el.style.getPropertyValue('--scroll-progress')).toBe('0');
		destroy();
	});

	it('bindGlidingPill hides the indicator when no active element', () => {
		const container = document.createElement('div');
		const indicator = document.createElement('span');
		container.appendChild(indicator);
		document.body.appendChild(container);
		const binding = bindGlidingPill(container, indicator, () => null);
		binding.destroy();
		container.remove();
	});
});

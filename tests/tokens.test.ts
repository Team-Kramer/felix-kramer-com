import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(resolve(process.cwd(), 'src/app.css'), 'utf-8');

function token(name: string): string {
	const match = css.match(new RegExp(`--${name}:\\s*([^;]+);`));
	expect(match, `token --${name} must exist`).not.toBeNull();
	return match![1].trim();
}

function hexToRgb(hex: string): [number, number, number] {
	const h = hex.replace('#', '');
	return [
		parseInt(h.slice(0, 2), 16),
		parseInt(h.slice(2, 4), 16),
		parseInt(h.slice(4, 6), 16)
	];
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
	const channel = (v: number) => {
		const s = v / 255;
		return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
	};
	return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrast(hexA: string, hexB: string): number {
	const la = relativeLuminance(hexToRgb(hexA));
	const lb = relativeLuminance(hexToRgb(hexB));
	const [lighter, darker] = la > lb ? [la, lb] : [lb, la];
	return (lighter + 0.05) / (darker + 0.05);
}

describe('Green Deck tokens (copied from felix-kramer-saas)', () => {
	it('keeps the core palette', () => {
		expect(token('color-stage')).toBe('#121212');
		expect(token('color-surface')).toBe('#181818');
		expect(token('color-surface-elevated')).toBe('#282828');
		expect(token('color-ink')).toBe('#ffffff');
		expect(token('color-ink-secondary')).toBe('#a7a7a7');
		expect(token('color-accent')).toBe('#1db954');
		expect(token('color-accent-hover')).toBe('#1ed760');
		expect(token('color-coral')).toBe('#e22134');
	});

	it('keeps the type scale', () => {
		expect(token('text-display')).toBe('64px');
		expect(token('text-headline-lg')).toBe('32px');
		expect(token('text-body-md')).toBe('14px');
		expect(token('font-sans')).toContain('DM Sans');
		expect(token('font-mono')).toContain('JetBrains Mono');
	});

	it('keeps the radius scale', () => {
		expect(token('radius-sm')).toBe('2px');
		expect(token('radius-md')).toBe('4px');
		expect(token('radius-lg')).toBe('8px');
		expect(token('radius-xl')).toBe('12px');
		expect(token('radius-round')).toBe('9999px');
	});
});

describe('homepage additions', () => {
	it('defines pitch, glow and glass tokens', () => {
		expect(token('color-pitch')).toBe('#0b3d2e');
		expect(token('color-pitch-deep')).toBe('#072a20');
		expect(token('glass-blur')).toBe('20px');
		expect(token('glass-saturate')).toBe('180%');
	});

	it('--color-on-green has WCAG AA contrast (>= 4.5:1) on the accent', () => {
		const onGreen = token('color-on-green');
		const accent = token('color-accent');
		const ratio = contrast(onGreen, accent);
		expect(ratio).toBeGreaterThanOrEqual(4.5);
	});
});

describe('Apple motion tokens', () => {
	it('defines spring curves and durations', () => {
		expect(token('spring-ui')).toContain('cubic-bezier');
		expect(token('spring-momentum')).toContain('cubic-bezier');
		expect(token('spring-duration-fast')).toBe('200ms');
		expect(token('spring-duration-base')).toBe('350ms');
	});

	it('respects prefers-reduced-motion', () => {
		expect(css).toContain('prefers-reduced-motion: reduce');
	});

	it('respects prefers-reduced-transparency for glass', () => {
		expect(css).toContain('prefers-reduced-transparency: reduce');
	});
});

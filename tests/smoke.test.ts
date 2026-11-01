import { render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { describe, expect, it } from 'vitest';
import Index from '../src/routes/+page.svelte';
import Layout from '../src/routes/+layout.svelte';

describe('index page', () => {
	it('renders the hero headline', () => {
		render(Index);
		expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
			'Entdecke die Welt des Fußballs'
		);
	});

	it('links to all five simulators', () => {
		render(Index);
		for (const href of ['/match', '/tournament', '/league', '/bracket', '/draft']) {
			expect(document.querySelector(`a[href="${href}"]`)).not.toBeNull();
		}
	});

	it('renders the stats strip', () => {
		render(Index);
		expect(screen.getByText('211')).toBeDefined();
		expect(screen.getByText('0')).toBeDefined();
	});

	it('renders the primary CTA', () => {
		render(Index);
		expect(screen.getByRole('link', { name: 'Simulator starten' })).toBeDefined();
	});
});

describe('layout', () => {
	it('renders the site navigation', () => {
		render(Layout, {
			props: { children: createRawSnippet(() => ({ render: () => '<span></span>' })) }
		});
		expect(screen.getByRole('navigation', { name: 'Hauptnavigation' })).toBeDefined();
	});
});

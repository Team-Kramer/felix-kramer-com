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

import Match from '../src/routes/match/+page.svelte';
import { createMinimalDataset } from '$lib/engine/dataset/fixture';
import { datasetStore } from '$lib/engine/dataset/store.svelte';
import { simulateN } from '$lib/engine/monte-carlo';
import { toEngineTeams } from '$lib/engine/dataset/adapter';

describe('simulator route during worker activity', () => {
	it('keeps the match route renderable and the stored dataset intact', async () => {
		const previous = datasetStore.dataset;
		const source = createMinimalDataset();
		datasetStore.dataset = source;
		const before = JSON.stringify(source);
		let active = true;
		const worker = {
			postMessage() {
				setTimeout(() => {
					simulateN('single', toEngineTeams(source), 20, 'route-smoke');
					active = false;
				}, 0);
			},
			terminate() {
				active = false;
			}
		};
		worker.postMessage();
		render(Match);
		expect(screen.getByText('Match-Simulation')).toBeInTheDocument();
		expect(active).toBe(true);
		await new Promise((resolve) => setTimeout(resolve, 10));
		expect(active).toBe(false);
		expect(JSON.stringify(datasetStore.dataset)).toBe(before);
		datasetStore.dataset = previous;
	});
});

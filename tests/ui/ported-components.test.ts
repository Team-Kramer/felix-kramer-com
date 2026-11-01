import { render, screen, fireEvent } from '@testing-library/svelte';
import axe from 'axe-core';
import { describe, expect, it, vi } from 'vitest';

import Spinner from '$lib/ui/spinner/spinner.svelte';
import Table from '$lib/ui/table/table.svelte';
import StatusBadge from '$lib/ui/status-badge/status-badge.svelte';
import Progress from '$lib/ui/progress/progress.svelte';
import Skeleton from '$lib/ui/skeleton/skeleton.svelte';
import EmptyState from '$lib/ui/empty-state/empty-state.svelte';
import ConfirmPanel from '$lib/ui/confirm-panel/confirm-panel.svelte';

import ButtonWithLabel from './fixtures/button-with-label.svelte';
import CardWithContent from './fixtures/card-with-content.svelte';
import TabsWithPanels from './fixtures/tabs-with-panels.svelte';
import ListItemWithContent from './fixtures/list-item-with-content.svelte';

describe('button', () => {
	it('renders label and fires onclick', () => {
		const onclick = vi.fn();
		render(ButtonWithLabel, { props: { label: 'Start', onclick } });
		const button = screen.getByRole('button', { name: 'Start' });
		fireEvent.click(button);
		expect(onclick).toHaveBeenCalledTimes(1);
	});

	it('shows a spinner and disables while busy', () => {
		render(ButtonWithLabel, { props: { label: 'Save', busy: true } });
		const button = screen.getByRole('button', { name: 'Save' });
		expect(button).toBeDisabled();
		expect(button).toHaveAttribute('aria-busy', 'true');
	});

	it('has no axe violations', async () => {
		const { container } = render(ButtonWithLabel, { props: { label: 'Play' } });
		const results = await axe.run(container);
		expect(results.violations).toEqual([]);
	});
});

describe('spinner', () => {
	it('exposes a status role with label', () => {
		render(Spinner, { props: { label: 'Simulating' } });
		expect(screen.getByRole('status', { name: 'Simulating' })).toBeDefined();
	});

	it('is hidden from assistive tech when decorative', () => {
		render(Spinner, { props: { decorative: true } });
		expect(screen.queryByRole('status')).toBeNull();
	});
});

describe('card', () => {
	it('renders title and content', () => {
		render(CardWithContent, { props: { title: 'Gruppe A', body: 'Content' } });
		expect(screen.getByRole('heading', { name: 'Gruppe A' })).toBeDefined();
		expect(screen.getByText('Content')).toBeDefined();
	});

	it('renders an interactive card as a button with pressed state', () => {
		const onactivate = vi.fn();
		render(CardWithContent, {
			props: { title: 'Option', interactive: true, selected: true, onactivate, body: 'Body' }
		});
		const button = screen.getByRole('button', { name: 'Option' });
		expect(button).toHaveAttribute('aria-pressed', 'true');
		fireEvent.click(button);
		expect(onactivate).toHaveBeenCalledTimes(1);
	});
});

describe('tabs', () => {
	it('shows the active panel and switches on click', () => {
		render(TabsWithPanels, { props: { initial: 'a' } });
		expect(screen.getByText('Panel A')).toBeVisible();
		expect(screen.getByText('Panel B')).not.toBeVisible();
		fireEvent.click(screen.getByRole('tab', { name: /Zweite/ }));
		expect(screen.getByText('Panel B')).toBeVisible();
		expect(screen.getByText('Panel A')).not.toBeVisible();
	});

	it('marks the active tab with aria-selected', () => {
		render(TabsWithPanels, { props: { initial: 'b' } });
		expect(screen.getByRole('tab', { name: /Zweite/ })).toHaveAttribute('aria-selected', 'true');
		expect(screen.getByRole('tab', { name: 'Erste' })).toHaveAttribute('aria-selected', 'false');
	});
});

describe('table', () => {
	const columns = [
		{ key: 'name', label: 'Name' },
		{ key: 'points', label: 'Pkt', align: 'right' as const }
	];
	const rows = [
		{ id: 1, name: 'Deutschland', points: 9 },
		{ id: 2, name: 'Brasilien', points: 6 }
	];

	it('renders header and rows', () => {
		render(Table, { props: { columns, rows, label: 'Tabelle' } });
		expect(screen.getByRole('columnheader', { name: 'Name' })).toBeDefined();
		expect(screen.getByText('Deutschland')).toBeDefined();
		expect(screen.getByText('9')).toBeDefined();
	});

	it('selects rows on click when interactive', () => {
		const onrowselect = vi.fn();
		render(Table, { props: { columns, rows, interactive: true, onrowselect } });
		fireEvent.click(screen.getByText('Brasilien'));
		expect(onrowselect).toHaveBeenCalledWith(rows[1]);
	});

	it('falls back to empty state without rows', () => {
		render(Table, { props: { columns, rows: [], emptyTitle: 'Keine Daten' } });
		expect(screen.getByRole('heading', { name: 'Keine Daten' })).toBeDefined();
	});
});

describe('list-item', () => {
	it('renders static content', () => {
		render(ListItemWithContent, { props: { body: 'Eintrag' } });
		expect(screen.getByText('Eintrag')).toBeDefined();
	});

	it('fires onactivate when interactive', () => {
		const onactivate = vi.fn();
		render(ListItemWithContent, {
			props: { body: 'Wählen', label: 'Wählen', interactive: true, selected: true, onactivate }
		});
		const button = screen.getByRole('button', { name: 'Wählen' });
		expect(button).toHaveAttribute('aria-pressed', 'true');
		fireEvent.click(button);
		expect(onactivate).toHaveBeenCalledTimes(1);
	});
});

describe('status-badge', () => {
	it('renders the label', () => {
		render(StatusBadge, { props: { label: 'Aktiv' } });
		expect(screen.getByText('Aktiv')).toBeDefined();
	});

	it('renders a dot when requested', () => {
		const { container } = render(StatusBadge, { props: { label: 'Live', dot: true } });
		expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull();
	});
});

describe('progress', () => {
	it('exposes progressbar semantics with value', () => {
		render(Progress, { props: { value: 30, label: 'Fortschritt' } });
		const bar = screen.getByRole('progressbar', { name: 'Fortschritt' });
		expect(bar).toHaveAttribute('aria-valuenow', '30');
		expect(bar).toHaveAttribute('aria-valuemax', '100');
	});

	it('clamps values above max', () => {
		render(Progress, { props: { value: 150, max: 100, label: 'Fortschritt' } });
		expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
	});
});

describe('skeleton', () => {
	it('renders the requested number of rows', () => {
		const { container } = render(Skeleton, { props: { rows: 4 } });
		expect(container.querySelectorAll('.skeleton')).toHaveLength(4);
	});

	it('is hidden from assistive tech', () => {
		const { container } = render(Skeleton, { props: { rows: 1 } });
		expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
	});
});

describe('empty-state', () => {
	it('renders default title for no-data', () => {
		render(EmptyState, { props: { kind: 'no-data' } });
		expect(screen.getByRole('heading', { name: 'Nothing here yet' })).toBeDefined();
	});

	it('fires onaction from the action button', () => {
		const onaction = vi.fn();
		render(EmptyState, { props: { kind: 'no-results', actionLabel: 'Filter zurücksetzen', onaction } });
		fireEvent.click(screen.getByRole('button', { name: 'Filter zurücksetzen' }));
		expect(onaction).toHaveBeenCalledTimes(1);
	});
});

describe('confirm-panel', () => {
	it('opens a modal dialog and confirms', () => {
		const onconfirm = vi.fn();
		const oncancel = vi.fn();
		render(ConfirmPanel, {
			props: { open: true, title: 'Löschen?', message: 'Unwiderruflich.', onconfirm, oncancel }
		});
		const dialog = screen.getByRole('dialog', { name: 'Löschen?' });
		expect(dialog).toBeVisible();
		fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
		expect(onconfirm).toHaveBeenCalledTimes(1);
	});

	it('renders nothing visible when closed', () => {
		const onconfirm = vi.fn();
		const oncancel = vi.fn();
		render(ConfirmPanel, {
			props: { open: false, title: 'Löschen?', onconfirm, oncancel }
		});
		expect(screen.queryByRole('dialog')).toBeNull();
	});
});

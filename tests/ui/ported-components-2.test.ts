import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';

import FormField from '$lib/ui/form-field/form-field.svelte';
import Select from '$lib/ui/select/select.svelte';
import CheckboxSwitch from '$lib/ui/checkbox-switch/checkbox-switch.svelte';
import ChipInput from '$lib/ui/chip-input/chip-input.svelte';
import Banner from '$lib/ui/banner/banner.svelte';
import Divider from '$lib/ui/divider/divider.svelte';
import SectionTitle from '$lib/ui/section-title/section-title.svelte';
import Logo from '$lib/ui/logo/logo.svelte';
import Icon, { ACTION_ICONS } from '$lib/ui/icon.svelte';
import Toast from '$lib/ui/toast/toast.svelte';
import { showToast, dismissToast, toastStore, clearToasts } from '$lib/ui/toast/toast.store';

describe('form-field', () => {
	it('renders label, hint and error with aria wiring', () => {
		render(FormField, {
			props: { id: 'name', label: 'Name', hint: 'Vor- und Nachname', error: 'Pflichtfeld' }
		});
		const input = screen.getByLabelText(/Name/);
		expect(input).toHaveAttribute('aria-invalid', 'true');
		expect(input).toHaveAttribute('aria-describedby', 'name-hint name-error');
		expect(screen.getByText('Pflichtfeld')).toBeDefined();
	});

	it('binds value and reports input', () => {
		const oninput = vi.fn();
		render(FormField, { props: { id: 'age', label: 'Alter', value: '25', oninput } });
		const input = screen.getByLabelText('Alter');
		expect(input).toHaveValue('25');
		fireEvent.input(input, { target: { value: '26' } });
		expect(oninput).toHaveBeenCalledWith('26');
	});
});

describe('select', () => {
	const options = [
		{ value: 'ger', label: 'Deutschland' },
		{ value: 'bra', label: 'Brasilien', disabled: true }
	];

	it('renders options and reports change', () => {
		const onchange = vi.fn();
		render(Select, { props: { id: 'team', label: 'Team', options, value: 'ger', onchange } });
		const select = screen.getByLabelText('Team');
		expect(select).toHaveValue('ger');
		fireEvent.change(select, { target: { value: 'bra' } });
		expect(onchange).toHaveBeenCalledWith('bra');
	});

	it('disables the option flagged as disabled', () => {
		render(Select, { props: { id: 'team', label: 'Team', options } });
		const select = screen.getByLabelText('Team') as HTMLSelectElement;
		const disabledOption = Array.from(select.options).find((o) => o.value === 'bra');
		expect(disabledOption?.disabled).toBe(true);
	});
});

describe('checkbox-switch', () => {
	it('toggles and reports change', () => {
		const onchange = vi.fn();
		render(CheckboxSwitch, { props: { id: 'opt', label: 'Option', checked: false, onchange } });
		const box = screen.getByLabelText('Option');
		fireEvent.change(box, { target: { checked: true } });
		expect(onchange).toHaveBeenCalledWith(true);
	});

	it('uses switch role for kind switch', () => {
		render(CheckboxSwitch, { props: { id: 'sw', label: 'Schalter', kind: 'switch' } });
		expect(screen.getByRole('switch', { name: 'Schalter' })).toBeDefined();
	});
});

describe('chip-input', () => {
	it('adds a token on Enter', () => {
		const onchange = vi.fn();
		render(ChipInput, { props: { id: 'tags', label: 'Tags', value: [], onchange } });
		const input = screen.getByLabelText('Tags');
		fireEvent.input(input, { target: { value: 'fussball' } });
		fireEvent.keyDown(input, { key: 'Enter' });
		expect(onchange).toHaveBeenCalledWith(['fussball']);
	});

	it('shows a validation error', () => {
		render(ChipInput, {
			props: {
				id: 'tags',
				label: 'Tags',
				value: [],
				validate: () => 'Ungültig'
			}
		});
		const input = screen.getByLabelText('Tags');
		fireEvent.input(input, { target: { value: 'x' } });
		fireEvent.keyDown(input, { key: 'Enter' });
		expect(screen.getByText('Ungültig')).toBeDefined();
		expect(input).toHaveAttribute('aria-invalid', 'true');
	});

	it('removes the last token on Backspace with empty draft', () => {
		const onchange = vi.fn();
		render(ChipInput, { props: { id: 'tags', label: 'Tags', value: ['a', 'b'], onchange } });
		const input = screen.getByLabelText('Tags');
		fireEvent.keyDown(input, { key: 'Backspace' });
		expect(onchange).toHaveBeenCalledWith(['a']);
	});
});

describe('banner', () => {
	it('renders message with status role', () => {
		render(Banner, { props: { message: 'Hinweis' } });
		expect(screen.getByRole('status')).toBeDefined();
		expect(screen.getByText('Hinweis')).toBeDefined();
	});

	it('uses alert role for error and fires action', () => {
		const onaction = vi.fn();
		render(Banner, { props: { message: 'Fehler', variant: 'error', actionLabel: 'Details', onaction } });
		expect(screen.getByRole('alert')).toBeDefined();
		fireEvent.click(screen.getByRole('button', { name: 'Details' }));
		expect(onaction).toHaveBeenCalledTimes(1);
	});
});

describe('divider', () => {
	it('renders a labelled horizontal divider', () => {
		render(Divider, { props: { label: 'Trenner' } });
		expect(screen.getByRole('separator', { name: 'Trenner' })).toBeDefined();
	});
});

describe('section-title', () => {
	it('renders emoji and title as heading', () => {
		render(SectionTitle, { props: { emoji: '⚽', title: 'Simulation' } });
		expect(screen.getByRole('heading', { name: /Simulation/ })).toBeDefined();
	});
});

describe('logo', () => {
	it('links to home with the label', () => {
		render(Logo, {});
		const link = screen.getByRole('link', { name: 'Felix Kramer' });
		expect(link).toHaveAttribute('href', '/');
	});

	it('hides the wordmark in compact variant', () => {
		render(Logo, { props: { variant: 'compact' } });
		expect(screen.queryByText(/Kramer/)).toBeNull();
	});
});

describe('icon', () => {
	it('is decorative by default', () => {
		render(Icon, { props: { name: 'visibility' } });
		expect(screen.queryByRole('img')).toBeNull();
	});

	it('exposes an img role with label', () => {
		render(Icon, { props: { name: ACTION_ICONS.delete, label: 'Löschen' } });
		expect(screen.getByRole('img', { name: 'Löschen' })).toBeDefined();
	});
});

describe('toast', () => {
	it('renders message and dismiss button', () => {
		const ondismiss = vi.fn();
		render(Toast, {
			props: { toast: { id: 1, message: 'Gespeichert', kind: 'success', exiting: false }, ondismiss }
		});
		expect(screen.getByRole('status')).toBeDefined();
		expect(screen.getByText('Gespeichert')).toBeDefined();
		fireEvent.click(screen.getByRole('button', { name: 'Dismiss notification' }));
		expect(ondismiss).toHaveBeenCalledTimes(1);
	});

	it('uses alert role for errors', () => {
		render(Toast, {
			props: { toast: { id: 2, message: 'Fehler', kind: 'error', exiting: false }, ondismiss: () => {} }
		});
		expect(screen.getByRole('alert')).toBeDefined();
	});
});

describe('toast store', () => {
	it('adds and dismisses toasts', () => {
		let current: unknown[] = [];
		const unsubscribe = toastStore.subscribe((messages) => (current = messages));
		const id = showToast('Hallo', 'info', 0);
		expect(current).toHaveLength(1);
		dismissToast(id);
		expect(current).toHaveLength(0);
		clearToasts();
		unsubscribe();
	});

	it('rejects empty messages', () => {
		expect(() => showToast('   ')).toThrow();
	});
});

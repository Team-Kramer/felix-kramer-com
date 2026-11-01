import { de, type Catalog } from './de.js';
import { en } from './en.js';

export type Lang = 'de' | 'en';

const catalogs: Record<Lang, Catalog> = { de, en };
const STORAGE_KEY = 'felix-lang';

/**
 * Module-level rune store. SSR always renders German; on the client the
 * stored / `?lang=` preference is applied in a `$effect` after hydration,
 * so there is no hydration mismatch.
 */
let lang = $state<Lang>('de');

function syncHtml() {
	if (typeof document !== 'undefined') document.documentElement.lang = lang;
}

function setLang(next: Lang) {
	if (next !== 'de' && next !== 'en') return;
	lang = next;
	if (typeof window !== 'undefined') {
		localStorage.setItem(STORAGE_KEY, next);
		const url = new URL(window.location.href);
		url.searchParams.set('lang', next);
		window.history.replaceState({}, '', url);
	}
	syncHtml();
}

function t(key: string): string {
	let node: unknown = catalogs[lang];
	for (const part of key.split('.')) {
		if (node && typeof node === 'object' && part in (node as Record<string, unknown>)) {
			node = (node as Record<string, unknown>)[part];
		} else {
			return key;
		}
	}
	return typeof node === 'string' ? node : key;
}

/**
 * Rune-based i18n store. Call at the top level of a component:
 *
 *   const i18n = useI18n();
 *   {i18n.t('nav.match')}
 *
 * `t()` reads the reactive `lang` state, so any template that calls it
 * re-renders when the language changes.
 */
export function useI18n() {
	// Client-only: apply the persisted / URL language preference once.
	$effect(() => {
		if (typeof window === 'undefined') return;
		const fromUrl = new URLSearchParams(window.location.search).get('lang');
		const stored = localStorage.getItem(STORAGE_KEY);
		const next: Lang =
			fromUrl === 'de' || fromUrl === 'en'
				? fromUrl
				: stored === 'de' || stored === 'en'
					? stored
					: 'de';
		if (next !== lang) setLang(next);
	});

	return {
		get lang(): Lang {
			return lang;
		},
		setLang,
		t
	};
}

<script lang="ts">
	import '../app.css';
	import { useI18n } from '$lib/i18n';

	let { children } = $props();

	const i18n = useI18n();

	let scrolled = $state(false);
	$effect(() => {
		const onScroll = () => {
			scrolled = window.scrollY > 8;
		};
		onScroll();
		window.addEventListener('scroll', onScroll, { passive: true });
		return () => window.removeEventListener('scroll', onScroll);
	});

	let menuOpen = $state(false);
	let menuClosing = $state(false);
	let closeTimer: ReturnType<typeof setTimeout> | undefined;

	function closeMenu() {
		menuOpen = false;
		menuClosing = true;
		clearTimeout(closeTimer);
		closeTimer = setTimeout(() => (menuClosing = false), 260);
	}

	// Escape closes the menu
	$effect(() => {
		if (!menuOpen) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') closeMenu();
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	});

	// Close the menu when the viewport grows into the desktop breakpoint
	$effect(() => {
		const mq = window.matchMedia('(min-width: 768px)');
		const onChange = () => {
			if (mq.matches) {
				menuOpen = false;
				menuClosing = false;
			}
		};
		mq.addEventListener('change', onChange);
		return () => mq.removeEventListener('change', onChange);
	});

	const nav = [
		{ href: '/match', key: 'nav.match' },
		{ href: '/tournament', key: 'nav.tournament' },
		{ href: '/league', key: 'nav.league' },
		{ href: '/bracket', key: 'nav.bracket' },
		{ href: '/draft', key: 'nav.draft' },
		{ href: '/players', key: 'nav.players' },
		{ href: '/editor', key: 'nav.editor' },
		{ href: '/blog', key: 'nav.blog' },
		{ href: '/about', key: 'nav.about' }
	];
</script>

<div class="min-h-screen bg-stage text-ink">
	<a
		href="#main"
		class="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-accent focus:px-4 focus:py-2 focus:text-stage"
	>
		Zum Inhalt springen
	</a>

	<header class="glass header-edge sticky top-0 z-40" data-scrolled={scrolled}>
		<nav
			aria-label="Hauptnavigation"
			class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3"
		>
			<a href="/" class="flex items-center gap-2 font-bold tracking-tight">
				<span class="material-symbols-outlined text-accent" aria-hidden="true"
					>sports_soccer</span
				>
				Felix Kramer
			</a>
			<ul class="hidden items-center gap-1 md:flex">
				{#each nav as item}
					<li>
						<a
							href={item.href}
							class="rounded-full px-3 py-1.5 text-sm text-ink-secondary transition-colors duration-150 hover:bg-surface-elevated hover:text-ink"
						>
							{i18n.t(item.key)}
						</a>
					</li>
				{/each}
			</ul>
			<div class="flex items-center gap-2">
				<div class="flex items-center gap-0.5 rounded-full border border-line p-0.5" role="group"
					aria-label={i18n.t('common.language')}>
					<button
						type="button"
						class="rounded-full px-2.5 py-1 text-xs font-bold transition-colors duration-150 {i18n.lang === 'de'
							? 'bg-surface-elevated text-ink'
							: 'text-ink-secondary hover:text-ink'}"
						aria-pressed={i18n.lang === 'de'}
						onclick={() => i18n.setLang('de')}
					>
						DE
					</button>
					<button
						type="button"
						class="rounded-full px-2.5 py-1 text-xs font-bold transition-colors duration-150 {i18n.lang === 'en'
							? 'bg-surface-elevated text-ink'
							: 'text-ink-secondary hover:text-ink'}"
						aria-pressed={i18n.lang === 'en'}
						onclick={() => i18n.setLang('en')}
					>
						EN
					</button>
				</div>
				<a
					href="/match"
					class="hidden rounded-full bg-accent px-4 py-1.5 text-sm font-bold text-on-green transition-colors duration-150 hover:bg-accent-hover sm:inline-block"
				>
					{i18n.t('nav.start')}
				</a>
			</div>
			<button
				type="button"
				class="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line text-ink transition-colors duration-150 hover:bg-surface-elevated md:hidden"
				aria-expanded={menuOpen}
				aria-controls="mobile-menu"
				aria-label={i18n.t('nav.menu')}
				onclick={() => (menuOpen ? closeMenu() : (menuOpen = true))}
			>
				{#if menuOpen}
					<svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
						stroke-linecap="round" aria-hidden="true">
						<path d="M6 6l12 12M18 6L6 18" />
					</svg>
				{:else}
					<svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
						stroke-linecap="round" aria-hidden="true">
						<path d="M4 7h16M4 12h16M4 17h16" />
					</svg>
				{/if}
			</button>
		</nav>
	</header>

	<!-- Mobile menu: slide-down sheet, transition-based (interruptible) -->
	{#if menuOpen || menuClosing}
		<div
			id="mobile-menu"
			class="fixed inset-x-0 top-16 z-30 border-b border-line bg-surface/95 backdrop-blur-md transition-[opacity,transform] duration-200 ease-[var(--ease-out)] md:hidden {menuOpen
				? 'translate-y-0 opacity-100'
				: '-translate-y-2 opacity-0'}"
			role="dialog"
			aria-label={i18n.t('nav.menu')}
		>
			<ul class="flex flex-col gap-1 px-4 py-4">
				{#each nav as item}
					<li>
						<a
							href={item.href}
							class="block rounded-lg px-3 py-2.5 text-base font-semibold text-ink transition-colors duration-150 hover:bg-surface-elevated"
							onclick={closeMenu}
						>
							{i18n.t(item.key)}
						</a>
					</li>
				{/each}
				<li class="mt-2 border-t border-line pt-3">
					<a
						href="/match"
						class="block rounded-full bg-accent px-4 py-2.5 text-center text-sm font-bold text-on-green transition-colors duration-150 hover:bg-accent-hover"
						onclick={closeMenu}
					>
						{i18n.t('nav.start')}
					</a>
				</li>
			</ul>
		</div>
	{/if}

	<main id="main">
		{@render children()}
	</main>

	<!-- Honeypot strip: consistent SaaS CTA on every page -->
	<section aria-label="Felix SaaS" class="mx-auto max-w-6xl px-4 pb-16">
		<div class="glow-border rounded-2xl bg-surface p-8 text-center md:p-10">
			<h2 class="text-headline-lg">Du willst mehr als simulieren?</h2>
			<p class="mx-auto mt-3 max-w-xl text-ink-secondary">
				Felix ist auch eine Fußball-Intelligenz-Plattform im Aufbau: eigene Teams,
				Szenarien und Analysen. Melde dich, wenn du früh dabei sein willst.
			</p>
			<a
				href="mailto:hello@felix-kramer.com"
				class="pulse-cta mt-6 inline-block rounded-full bg-accent px-8 py-3 font-bold text-on-green transition-colors duration-150 hover:bg-accent-hover"
			>
				Kontakt aufnehmen
			</a>
		</div>
	</section>

	<footer class="border-t border-line">
		<div
			class="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-ink-secondary md:flex-row"
		>
			<p>© {new Date().getFullYear()} Felix Kramer — {i18n.t('footer.tagline')}</p>
			<p class="flex items-center gap-4">
				<a href="/blog" class="transition-colors duration-150 hover:text-ink"
					>{i18n.t('footer.blog')}</a
				>
				<a href="/about" class="transition-colors duration-150 hover:text-ink"
					>{i18n.t('footer.about')}</a
				>
				<a href="/impressum" class="transition-colors duration-150 hover:text-ink"
					>{i18n.t('footer.impressum')}</a
				>
				<a href="/datenschutz" class="transition-colors duration-150 hover:text-ink"
					>{i18n.t('footer.datenschutz')}</a
				>
				<a
					href="https://github.com/Team-Kramer"
					class="transition-colors duration-150 hover:text-ink"
				>
					{i18n.t('footer.github')}
				</a>
			</p>
		</div>
	</footer>
</div>

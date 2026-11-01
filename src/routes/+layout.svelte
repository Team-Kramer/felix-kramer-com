<script lang="ts">
	import '../app.css';

	let { children } = $props();

	const nav = [
		{ href: '/match', label: 'Match' },
		{ href: '/tournament', label: 'Turnier' },
		{ href: '/league', label: 'Liga' },
		{ href: '/bracket', label: 'K.-o.' },
		{ href: '/draft', label: 'Draft' },
		{ href: '/blog', label: 'Blog' },
		{ href: '/about', label: 'Über mich' }
	];
</script>

<div class="min-h-screen bg-stage text-ink">
	<a
		href="#main"
		class="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-accent focus:px-4 focus:py-2 focus:text-stage"
	>
		Zum Inhalt springen
	</a>

	<header class="glass sticky top-0 z-40">
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
							{item.label}
						</a>
					</li>
				{/each}
			</ul>
			<a
				href="/match"
				class="rounded-full bg-accent px-4 py-1.5 text-sm font-bold text-on-green transition-colors duration-150 hover:bg-accent-hover"
			>
				Simulator starten
			</a>
		</nav>
	</header>

	<main id="main">
		{@render children()}
	</main>

	<footer class="mt-24 border-t border-line">
		<div
			class="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-ink-secondary md:flex-row"
		>
			<p>© {new Date().getFullYear()} Felix Kramer — Fußball-Intelligenz</p>
			<p class="flex items-center gap-4">
				<a href="/blog" class="transition-colors duration-150 hover:text-ink">Blog</a>
				<a href="/about" class="transition-colors duration-150 hover:text-ink">Über mich</a>
				<a
					href="https://github.com/Team-Kramer"
					class="transition-colors duration-150 hover:text-ink"
				>
					GitHub
				</a>
			</p>
		</div>
	</footer>
</div>

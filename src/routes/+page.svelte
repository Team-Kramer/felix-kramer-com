<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { latestPosts } from '$lib/blog';
	import { bindTilt, bindTypewriter, type TiltBinding, type TypewriterBinding } from '$lib/ui/effects';

	const posts = latestPosts(3);

	const tagline =
		'Simuliere Matches, Turniere und komplette Ligen. Echte Wahrscheinlichkeiten, berechnet direkt in deinem Browser.';

	let taglineEl: HTMLParagraphElement | undefined;
	let typewriter: TypewriterBinding | undefined;
	onMount(() => {
		if (taglineEl) typewriter = bindTypewriter(taglineEl, tagline);
	});
	onDestroy(() => typewriter?.destroy());

	function tilt(node: HTMLElement): { destroy(): void } {
		const binding: TiltBinding = bindTilt(node);
		return { destroy: binding.destroy };
	}

	const simulators = [
		{
			href: '/match',
			icon: 'sports_soccer',
			title: 'Match-Simulation',
			text: 'Zwei Teams, 10.000 Monte-Carlo-Läufe. Echte Wahrscheinlichkeiten statt Bauchgefühl.'
		},
		{
			href: '/tournament',
			icon: 'emoji_events',
			title: 'Turnier-Simulation',
			text: 'Von der Gruppenphase bis zum Finale — 211 Nationen, ein Pokal.'
		},
		{
			href: '/league',
			icon: 'leaderboard',
			title: 'Liga-Simulation',
			text: 'Eine komplette Saison: Tabelle, Formkurven, Auf- und Abstieg.'
		},
		{
			href: '/bracket',
			icon: 'account_tree',
			title: 'K.-o.-Baum',
			text: '4 bis 64 Teams im K.-o.-System. Wer übersteht die K.o.-Runde?'
		},
		{
			href: '/draft',
			icon: 'how_to_reg',
			title: 'Draft',
			text: 'Baue dein Team im Draft — mit fairem Pick-Order und Team-Chemie.'
		}
	];

	const features = [
		{
			icon: 'science',
			title: 'Monte-Carlo, kein Zufall',
			text: 'Jede Simulation läuft 10.000 Mal. Das Ergebnis ist eine Wahrscheinlichkeit — reproduzierbar und nachvollziehbar.',
			detail: 'Poisson-Verteilung für Tore, Elo-basierte Teamstärken, 8 Taktikformationen.'
		},
		{
			icon: 'public',
			title: '211 Nationen, 5 Ligen',
			text: 'Alle FIFA-Mitgliedsnationen und die großen europäischen Ligen — mit realistischen Teamstärken.',
			detail: 'Datenbasis: FIFA-Weltrangliste, ELO-Ratings, aktuelle Form.'
		},
		{
			icon: 'speed',
			title: 'Direkt im Browser',
			text: 'Kein Server, kein Account, keine Wartezeit. Die komplette Simulation läuft lokal in deinem Browser.',
			detail: 'Reine TypeScript-Engine, unter einer Sekunde für 10.000 Läufe.'
		},
		{
			icon: 'visibility',
			title: 'Offen & transparent',
			text: 'Der komplette Quellcode ist öffentlich. Jede Zahl im Ergebnis lässt sich nachrechnen.',
			detail: 'Open Source auf GitHub — lade dir den Code und prüf die Mathematik.'
		}
	];

	const stats = [
		{ value: '211', label: 'Nationen' },
		{ value: '5', label: 'Ligen' },
		{ value: '10.000', label: 'Simulationen pro Lauf' },
		{ value: '0', label: 'Accounts nötig' }
	];
</script>

<svelte:head>
	<title>Felix Kramer — Fußball-Intelligenz</title>
</svelte:head>

<!-- 1 · Hero -->
<section class="relative overflow-hidden">
	<div
		class="hero-parallax pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgb(29_185_84/12%),transparent_60%)]"
		aria-hidden="true"
	></div>
	<div class="metaball" aria-hidden="true"></div>
	<div class="relative mx-auto max-w-6xl px-4 pb-20 pt-24 text-center md:pt-32">
		<p class="mb-4 text-sm font-bold uppercase tracking-[0.1em] text-accent">
			Fußball-Intelligenz
		</p>
		<h1 class="text-display mx-auto max-w-3xl">
			Entdecke die Welt des Fußballs — <span class="text-gradient-gold">mit Felix</span>
		</h1>
		<p bind:this={taglineEl} class="typewriter mx-auto mt-6 max-w-xl text-lg text-ink-secondary"></p>
		<div class="mt-10 flex flex-wrap items-center justify-center gap-4">
			<a
				href="/match"
				class="pulse-cta rounded-full bg-accent px-8 py-3 font-bold text-on-green transition-colors duration-150 hover:bg-accent-hover"
			>
				Simulator starten
			</a>
			<a
				href="#profile"
				class="rounded-full border border-line-strong px-8 py-3 font-bold text-ink transition-colors duration-150 hover:bg-surface-elevated"
			>
				Mehr über mich
			</a>
		</div>
	</div>
</section>

<!-- 2 · Profile -->
<section id="profile" class="reveal border-y border-line bg-surface">
	<div class="mx-auto grid max-w-6xl gap-8 px-4 py-16 md:grid-cols-[auto_1fr] md:items-center">
		<div
			class="glow-border mx-auto flex h-32 w-32 items-center justify-center rounded-full bg-surface-elevated md:mx-0"
		>
			<span class="material-symbols-outlined text-5xl text-accent" aria-hidden="true"
				>person</span
			>
		</div>
		<div>
			<h2 class="text-headline-lg">Hallo, ich bin Felix</h2>
			<p class="mt-4 max-w-2xl text-ink-secondary">
				Ich baue Werkzeuge, die Fußball verständlich machen — mit Mathematik statt
				Magie. Diese Seite ist mein Labor: Hier entstehen Simulationen, die zeigen,
				was hinter einem Spiel wirklich steckt. Kein Hype, keine Tipps zum Wetten —
				nur Wahrscheinlichkeiten, die du selbst prüfen kannst.
			</p>
			<a
				href="/about"
				class="mt-6 inline-block font-bold text-accent transition-colors duration-150 hover:text-accent-hover"
			>
				Mehr über mich →
			</a>
		</div>
	</div>
</section>

<!-- 3 · Blog (latest 3) -->
<section class="reveal mx-auto max-w-6xl px-4 py-16">
	<div class="mb-8 flex items-end justify-between">
		<h2 class="text-headline-lg">Frisch aus dem Blog</h2>
		<a href="/blog" class="text-sm font-bold text-accent hover:text-accent-hover">
			Alle Beiträge →
		</a>
	</div>
	<div class="grid gap-4 md:grid-cols-3">
		{#each posts as post}
			<a
				href="/blog/{post.slug}"
				class="hover-lift rounded-xl border border-line bg-surface p-6"
			>
				<p class="text-xs font-bold uppercase tracking-[0.1em] text-ink-tertiary">
					{post.date}
				</p>
				<h3 class="mt-2 font-bold">{post.title}</h3>
				<p class="mt-2 line-clamp-3 text-sm text-ink-secondary">
					{post.body.slice(0, 140)}…
				</p>
			</a>
		{/each}
	</div>
</section>

<!-- 4 · Simulator showcase -->
<section class="reveal border-y border-line bg-surface">
	<div class="mx-auto max-w-6xl px-4 py-16">
		<h2 class="text-headline-lg">Fünf Simulatoren. Ein Ziel: Klarheit.</h2>
		<p class="mt-3 max-w-xl text-ink-secondary">
			Jeder Simulator beantwortet eine andere Frage — vom einzelnen Match bis zur
			ganzen Saison.
		</p>
		<div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each simulators as sim}
				<a
					href={sim.href}
					use:tilt
					class="group rounded-xl border border-line bg-stage p-6 transition-shadow duration-150 hover:shadow-[var(--shadow-teal-glow)]"
				>
					<span
						class="icon-glow inline-flex h-12 w-12 items-center justify-center rounded-lg bg-accent-light"
					>
						<span class="material-symbols-outlined text-2xl text-accent" aria-hidden="true"
							>{sim.icon}</span
						>
					</span>
					<h3 class="mt-4 font-bold group-hover:text-accent">{sim.title}</h3>
					<p class="mt-2 text-sm text-ink-secondary">{sim.text}</p>
				</a>
			{/each}
		</div>
	</div>
</section>

<!-- 5 · Feature sections (alternating) -->
{#each features as feature, i}
	<section class="reveal mx-auto max-w-6xl px-4 py-12">
		<div
			class="grid items-center gap-8 md:grid-cols-2"
			class:md:[direction:rtl]={i % 2 === 1}
		>
			<div class="md:[direction:ltr]">
				<span
					class="icon-glow inline-flex h-14 w-14 items-center justify-center rounded-xl bg-accent-light"
				>
					<span class="material-symbols-outlined text-3xl text-accent" aria-hidden="true"
						>{feature.icon}</span
					>
				</span>
				<h2 class="text-headline-md mt-4">{feature.title}</h2>
				<p class="mt-3 text-ink-secondary">{feature.text}</p>
			</div>
			<div
				class="rounded-xl border border-line bg-surface p-6 font-mono text-sm text-ink-secondary md:[direction:ltr]"
			>
				{feature.detail}
			</div>
		</div>
	</section>
{/each}

<!-- 6 · Stats strip -->
<section class="blend-overlay border-y border-line bg-pitch-deep">
	<div class="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-4 py-12 text-center md:grid-cols-4">
		{#each stats as stat}
			<div>
				<p class="text-headline-lg text-gradient-gold">{stat.value}</p>
				<p class="mt-1 text-sm text-ink-secondary">{stat.label}</p>
			</div>
		{/each}
	</div>
</section>


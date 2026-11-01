<script lang="ts">
	let { title, icon, description, features } = $props();
</script>

<svelte:head>
	<title>{title} — Felix Kramer</title>
</svelte:head>

<div class="mx-auto max-w-6xl px-4 py-16">
	<span
		class="icon-glow inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-light"
	>
		<span class="material-symbols-outlined text-4xl text-accent" aria-hidden="true"
			>{icon}</span
		></span
	>
	<h1 class="text-headline-lg mt-6">{title}</h1>
	<p class="mt-4 max-w-2xl text-lg text-ink-secondary">{description}</p>

	<div class="mt-10 rounded-xl border border-dashed border-line-strong bg-surface p-8 text-center">
		<span class="material-symbols-outlined text-3xl text-ink-tertiary" aria-hidden="true"
			>construction</span
		>
		<p class="mt-4 font-bold">In Entwicklung</p>
		<p class="mt-2 text-sm text-ink-secondary">
			Der {title}-Simulator ist in Arbeit. Die Simulation-Engine (Phase 2) kommt als
			nächstes — reine TypeScript, direkt im Browser.
		</p>
	</div>

	<h2 class="text-headline-md mt-12">Geplante Features</h2>
	<ul class="mt-4 grid gap-3 sm:grid-cols-2">
		{#each features as feature}
			<li class="flex items-start gap-3 rounded-lg border border-line bg-surface p-4">
				<span class="material-symbols-outlined text-accent" aria-hidden="true"
					>check_circle</span
				>
				<span class="text-sm">{feature}</span>
			</li>
		{/each}
	</ul>

	<a
		href="/"
		class="mt-12 inline-block rounded-full border border-line-strong px-6 py-2.5 font-bold transition-colors duration-150 hover:bg-surface-elevated"
	>
		← Zurück zur Startseite
	</a>
</div>

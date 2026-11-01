<script lang="ts">
	import { useI18n } from '$lib/i18n';

	const i18n = useI18n();
</script>

<svelte:head>
	<title>{i18n.t('about.title')} — Felix Kramer</title>
	<meta name="description" content={i18n.t('about.intro')} />
</svelte:head>

<div class="mx-auto max-w-3xl px-4 py-16">
	<h1 class="text-headline-lg">{i18n.t('about.title')}</h1>

	<div class="mt-8 space-y-6 text-ink-secondary">
		<p>{i18n.t('about.intro')}</p>
		<p>{i18n.t('about.fascination')}</p>
		<p>{i18n.t('about.simulations')}</p>
		<p>{i18n.t('about.noBetting')}</p>
	</div>

	<div class="mt-12 rounded-xl border border-line bg-surface p-6">
		<h2 class="font-bold">{i18n.t('about.contact')}</h2>
		<p class="mt-2 text-sm text-ink-secondary">{i18n.t('about.contactHint')}</p>
		<a
			href="mailto:hello@felix-kramer.com"
			class="mt-4 inline-block rounded-full bg-accent px-6 py-2.5 font-bold text-on-green transition-colors duration-150 hover:bg-accent-hover"
		>
			hello@felix-kramer.com
		</a>
	</div>

	<div class="glow-border mt-6 rounded-xl bg-surface p-6">
		<h2 class="font-bold">{i18n.t('about.saasCta')}</h2>
		<p class="mt-2 text-sm text-ink-secondary">{i18n.t('about.saasCtaHint')}</p>
		<a
			href="mailto:hello@felix-kramer.com?subject=Felix%20SaaS"
			class="pulse-cta mt-4 inline-block rounded-full bg-accent px-6 py-2.5 font-bold text-on-green transition-colors duration-150 hover:bg-accent-hover"
		>
			{i18n.t('about.contact')} →
		</a>
	</div>
</div>

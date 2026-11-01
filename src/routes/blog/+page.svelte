<script lang="ts">
	import { allPosts } from '$lib/blog';
	import { plainText } from '$lib/markdown';
	import { useI18n } from '$lib/i18n';

	const i18n = useI18n();
	const posts = allPosts();
</script>

<svelte:head>
	<title>{i18n.t('blog.title')} — Felix Kramer</title>
	<meta name="description" content={i18n.t('blog.subtitle')} />
</svelte:head>

<div class="mx-auto max-w-3xl px-4 py-16">
	<h1 class="text-headline-lg">{i18n.t('blog.title')}</h1>
	<p class="mt-3 text-ink-secondary">{i18n.t('blog.subtitle')}</p>

	<div class="mt-10 space-y-4">
		{#each posts as post}
			<a
				href="/blog/{post.slug}"
				class="hover-lift block rounded-xl border border-line bg-surface p-6"
			>
				<p class="text-xs font-bold uppercase tracking-[0.1em] text-ink-tertiary">
					{post.date}
				</p>
				<h2 class="mt-2 font-bold">{post.title}</h2>
				<p class="mt-2 line-clamp-2 text-sm text-ink-secondary">
					{plainText(post.body)}
				</p>
			</a>
		{/each}
	</div>
</div>

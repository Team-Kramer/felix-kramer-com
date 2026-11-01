<script lang="ts">
	import { allPosts } from '$lib/blog';

	export function getStaticPaths() {
		return allPosts().map((post) => ({
			params: { slug: post.slug },
			data: { post }
		}));
	}

	let { data } = $props();
	const post = data.post;

	// Minimal markdown: paragraphs
	const paragraphs = post.body
		.split(/\n{2,}/)
		.map((p: string) => p.trim())
		.filter(Boolean);
</script>

<svelte:head>
	<title>{post.title} — Felix Kramer</title>
	<meta name="description" content={post.body.slice(0, 150)} />
</svelte:head>

<article class="mx-auto max-w-3xl px-4 py-16">
	<p class="text-xs font-bold uppercase tracking-[0.1em] text-ink-tertiary">
		{post.date}
	</p>
	<h1 class="text-headline-lg mt-3">{post.title}</h1>

	<div class="mt-8 space-y-5 text-ink-secondary">
		{#each paragraphs as para}
			<p class="whitespace-pre-line">{para}</p>
		{/each}
	</div>

	<a
		href="/blog"
		class="mt-12 inline-block rounded-full border border-line-strong px-6 py-2.5 font-bold transition-colors duration-150 hover:bg-surface-elevated"
	>
		← Alle Beiträge
	</a>
</article>

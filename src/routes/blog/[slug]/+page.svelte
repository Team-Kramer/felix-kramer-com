<script lang="ts">
	import { MarkdownView } from '$lib/ui';
	import { plainText } from '$lib/markdown';
	import { useI18n } from '$lib/i18n';

	let { data }: { data: { post: { slug: string; title: string; date: string; body: string } } } =
		$props();
	const post = $derived(data.post);
	const i18n = useI18n();
	const excerpt = $derived(plainText(post.body, 150));
</script>

<svelte:head>
	<title>{post.title} — Felix Kramer</title>
	<meta name="description" content={excerpt} />
	<meta property="og:type" content="article" />
	<meta property="og:title" content={post.title} />
	<meta property="og:description" content={excerpt} />
	<meta property="og:url" content="https://felix-kramer.com/blog/{post.slug}" />
	<meta property="article:published_time" content={post.date} />
</svelte:head>

<article class="mx-auto max-w-3xl px-4 py-16">
	<p class="text-xs font-bold uppercase tracking-[0.1em] text-ink-tertiary">
		{post.date}
	</p>
	<h1 class="mt-3 text-headline-lg tracking-tight">{post.title}</h1>

	<div class="mt-8">
		<MarkdownView markdown={post.body} />
	</div>

	<a
		href="/blog"
		class="mt-12 inline-block rounded-full border border-line-strong px-6 py-2.5 font-bold transition-colors duration-150 hover:bg-surface-elevated"
	>
		← {i18n.t('blog.backToBlog')}
	</a>
</article>

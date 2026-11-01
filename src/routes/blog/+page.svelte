<script lang="ts">
	import { allPosts } from '$lib/blog';

	const posts = allPosts();
</script>

<svelte:head>
	<title>Blog — Felix Kramer</title>
</svelte:head>

<div class="mx-auto max-w-3xl px-4 py-16">
	<h1 class="text-headline-lg">Blog</h1>
	<p class="mt-3 text-ink-secondary">
		Notizen aus dem Fußball-Simulations-Labor: Mathematik, Design und alles, was
		dazwischen liegt.
	</p>

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
					{post.body.slice(0, 160)}…
				</p>
			</a>
		{/each}
	</div>
</div>

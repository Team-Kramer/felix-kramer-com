import { error } from '@sveltejs/kit';
import { allPosts, getPost } from '$lib/blog';

export function entries() {
	return allPosts().map((post) => ({ slug: post.slug }));
}

export function load({ params }) {
	const post = getPost(params.slug);
	if (!post) error(404, 'Post not found');
	return { post };
}

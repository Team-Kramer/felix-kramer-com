import { error } from '@sveltejs/kit';
import { getPost } from '$lib/blog';

export function load({ params }) {
	const post = getPost(params.slug);
	if (!post) error(404, 'Beitrag nicht gefunden');
	return { post };
}

import { allPosts } from '$lib/blog';

export const prerender = true;

const publicRoutes = ['', '/match', '/tournament', '/league', '/bracket', '/draft', '/blog', '/about', '/impressum', '/datenschutz'];

function escapeXml(value: string): string {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&apos;');
}

export function GET() {
	const urls = [
		...publicRoutes.map((route) => ({
			loc: `https://felix-kramer.com${route}`,
			lastmod: undefined
		})),
		...allPosts().map((post) => ({
			loc: `https://felix-kramer.com/blog/${post.slug}`,
			lastmod: post.date
		}))
	];
	const entries = urls
		.map(
			({ loc, lastmod }) =>
				`<url><loc>${escapeXml(loc)}</loc>${lastmod ? `<lastmod>${escapeXml(lastmod)}</lastmod>` : ''}</url>`
		)
		.join('');
	const body =
		'<?xml version="1.0" encoding="UTF-8"?>' +
		'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
		entries +
		'</urlset>';

	return new Response(body, {
		headers: { 'Content-Type': 'application/xml; charset=utf-8' }
	});
}

import warum from '../../content/blog/warum-ich-fussball-simulationen-baue.md?raw';

export interface BlogPost {
	slug: string;
	title: string;
	date: string;
	body: string;
}

const posts: Record<string, string> = {
	'warum-ich-fussball-simulationen-baue': warum
};

function parse(raw: string, slug: string): BlogPost {
	const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
	const meta = match?.[1] ?? '';
	const body = match?.[2] ?? raw;
	const title = meta.match(/^title:\s*(.+)$/m)?.[1]?.trim() ?? slug;
	const date = meta.match(/^date:\s*(.+)$/m)?.[1]?.trim() ?? '';
	return { slug, title, date, body: body.trim() };
}

export function allPosts(): BlogPost[] {
	return Object.entries(posts)
		.map(([slug, raw]) => parse(raw, slug))
		.sort((a, b) => b.date.localeCompare(a.date));
}

export function latestPosts(count: number): BlogPost[] {
	return allPosts().slice(0, count);
}

export function getPost(slug: string): BlogPost | undefined {
	return allPosts().find((p) => p.slug === slug);
}

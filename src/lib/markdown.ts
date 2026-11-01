/**
 * Minimal markdown renderer for blog posts.
 *
 * Supports: headings (#..######), paragraphs, unordered/ordered lists,
 * fenced code blocks, blockquotes, horizontal rules, and inline
 * **bold**, *italic*, `code`, [text](url) links.
 *
 * Output is a flat list of blocks; the Svelte page renders them with
 * proper elements (no innerHTML), so there is no XSS surface.
 */

export type Inline =
	| { type: 'text'; text: string }
	| { type: 'bold'; text: string }
	| { type: 'italic'; text: string }
	| { type: 'code'; text: string }
	| { type: 'link'; text: string; href: string };

export type Block =
	| { type: 'heading'; level: number; inlines: Inline[] }
	| { type: 'paragraph'; inlines: Inline[] }
	| { type: 'list'; ordered: boolean; items: Inline[][] }
	| { type: 'code'; lang: string; code: string }
	| { type: 'quote'; inlines: Inline[] }
	| { type: 'hr' };

const INLINE_RE =
	/(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(`([^`]+)`)|(\[([^\]]+)\]\(([^)\s]+)\))/;

function parseInline(text: string): Inline[] {
	const inlines: Inline[] = [];
	let rest = text;
	while (rest.length > 0) {
		const match = INLINE_RE.exec(rest);
		if (!match || match.index === undefined) {
			inlines.push({ type: 'text', text: rest });
			break;
		}
		if (match.index > 0) {
			inlines.push({ type: 'text', text: rest.slice(0, match.index) });
		}
		if (match[1]) inlines.push({ type: 'bold', text: match[2] });
		else if (match[3]) inlines.push({ type: 'italic', text: match[4] });
		else if (match[5]) inlines.push({ type: 'code', text: match[6] });
		else if (match[7]) inlines.push({ type: 'link', text: match[8], href: match[9] });
		rest = rest.slice(match.index + match[0].length);
	}
	return inlines;
}

function isSafeUrl(url: string): boolean {
	return /^(https?:|mailto:|#|\/)/.test(url);
}

export function renderMarkdown(source: string): Block[] {
	const lines = source.replace(/\r\n/g, '\n').split('\n');
	const blocks: Block[] = [];
	let i = 0;

	while (i < lines.length) {
		const line = lines[i];

		if (!line.trim()) {
			i++;
			continue;
		}

		// Fenced code block
		const fence = line.match(/^```(\w*)\s*$/);
		if (fence) {
			const code: string[] = [];
			i++;
			while (i < lines.length && !/^```\s*$/.test(lines[i])) {
				code.push(lines[i]);
				i++;
			}
			i++; // closing fence
			blocks.push({ type: 'code', lang: fence[1], code: code.join('\n') });
			continue;
		}

		// Heading
		const heading = line.match(/^(#{1,6})\s+(.*)$/);
		if (heading) {
			blocks.push({
				type: 'heading',
				level: heading[1].length,
				inlines: parseInline(heading[2])
			});
			i++;
			continue;
		}

		// Horizontal rule
		if (/^(-{3,}|\*{3,})\s*$/.test(line.trim())) {
			blocks.push({ type: 'hr' });
			i++;
			continue;
		}

		// Blockquote
		if (line.startsWith('>')) {
			const quoteLines: string[] = [];
			while (i < lines.length && lines[i].startsWith('>')) {
				quoteLines.push(lines[i].replace(/^>\s?/, ''));
				i++;
			}
			blocks.push({ type: 'quote', inlines: parseInline(quoteLines.join(' ')) });
			continue;
		}

		// Lists
		const listMatch = line.match(/^(\s*)([-*+]|\d+\.)\s+(.*)$/);
		if (listMatch) {
			const ordered = /\d+\./.test(listMatch[2]);
			const items: Inline[][] = [];
			while (i < lines.length) {
				const m = lines[i].match(/^(\s*)([-*+]|\d+\.)\s+(.*)$/);
				if (!m) break;
				items.push(parseInline(m[3]));
				i++;
			}
			blocks.push({ type: 'list', ordered, items });
			continue;
		}

		// Paragraph: collect until blank line or block start
		const paraLines: string[] = [line];
		i++;
		while (
			i < lines.length &&
			lines[i].trim() &&
			!/^#{1,6}\s/.test(lines[i]) &&
			!/^```/.test(lines[i]) &&
			!/^(\s*)([-*+]|\d+\.)\s+/.test(lines[i]) &&
			!/^>/.test(lines[i])
		) {
			paraLines.push(lines[i]);
			i++;
		}
		blocks.push({ type: 'paragraph', inlines: parseInline(paraLines.join(' ')) });
	}

	return blocks.map(sanitize);
}

function sanitize(block: Block): Block {
	if (block.type === 'heading' || block.type === 'paragraph' || block.type === 'quote') {
		return { ...block, inlines: block.inlines.map(sanitizeInline) };
	}
	if (block.type === 'list') {
		return { ...block, items: block.items.map((item) => item.map(sanitizeInline)) };
	}
	return block;
}

function sanitizeInline(inline: Inline): Inline {
	if (inline.type === 'link' && !isSafeUrl(inline.href)) {
		return { type: 'text', text: inline.text };
	}
	return inline;
}

/** Plain-text excerpt (for meta descriptions), markdown stripped. */
export function plainText(source: string, max = 160): string {
	const text = source
		.replace(/^---\n[\s\S]*?\n---\n/, '')
		.replace(/```[\s\S]*?```/g, ' ')
		.replace(/^#{1,6}\s+/gm, '')
		.replace(/^>\s?/gm, '')
		.replace(/^(\s*)([-*+]|\d+\.)\s+/gm, '')
		.replace(/\*\*([^*]+)\*\*/g, '$1')
		.replace(/\*([^*]+)\*/g, '$1')
		.replace(/`([^`]+)`/g, '$1')
		.replace(/\[([^\]]+)\]\([^)\s]+\)/g, '$1')
		.replace(/\s+/g, ' ')
		.trim();
	return text.length > max ? text.slice(0, max).trimEnd() + '…' : text;
}

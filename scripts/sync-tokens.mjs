#!/usr/bin/env node
/**
 * sync-tokens: compares the Green Deck @theme tokens in this repo's app.css
 * against the source of truth (felix-kramer-saas/frontend/src/app.css).
 * Warn-only: drift is reported, never auto-fixed.
 *
 * Usage: node scripts/sync-tokens.mjs [path-to-saas-app.css]
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const localCss = readFileSync(resolve(import.meta.dirname, '../src/app.css'), 'utf-8');
const saasPath =
	process.argv[2] ??
	resolve(import.meta.dirname, '../../felix-kramer-saas/frontend/src/app.css');

let saasCss;
try {
	saasCss = readFileSync(saasPath, 'utf-8');
} catch {
	console.warn(`⚠️  sync-tokens: SaaS app.css not found at ${saasPath}`);
	console.warn('   Pass the path as first argument: node scripts/sync-tokens.mjs <path>');
	process.exit(0);
}

function themeTokens(css) {
	const block = css.match(/@theme\s*\{([\s\S]*?)\n\}/);
	if (!block) return new Map();
	const tokens = new Map();
	for (const m of block[1].matchAll(/(--[\w-]+):\s*([^;]+);/g)) {
		tokens.set(m[1], m[2].trim());
	}
	return tokens;
}

const saas = themeTokens(saasCss);
const local = themeTokens(localCss);

const missing = [...saas.keys()].filter((k) => !local.has(k));
const drifted = [...saas.keys()].filter(
	(k) => local.has(k) && local.get(k) !== saas.get(k)
);
const extra = [...local.keys()].filter((k) => !saas.has(k));

console.log(`Green Deck token sync: ${saas.size} source tokens, ${local.size} local tokens`);

if (missing.length) {
	console.warn(`\n⚠️  Missing locally (${missing.length}):`);
	for (const k of missing) console.warn(`   ${k}: ${saas.get(k)}`);
}
if (drifted.length) {
	console.warn(`\n⚠️  Drifted from source (${drifted.length}):`);
	for (const k of drifted) {
		console.warn(`   ${k}: local=${local.get(k)} source=${saas.get(k)}`);
	}
}
if (extra.length) {
	console.log(`\nℹ️  Homepage-only tokens (${extra.length}): ${extra.join(', ')}`);
}

if (missing.length || drifted.length) {
	console.warn('\nToken drift detected. Review before the next SaaS design update.');
	process.exit(1);
}
console.log('✅ All Green Deck tokens in sync.');

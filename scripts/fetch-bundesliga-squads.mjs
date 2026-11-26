#!/usr/bin/env node
/**
 * Fetches current first-team squads for all 18 Bundesliga 2026/27 clubs from
 * the English Wikipedia club articles (CC BY-SA 4.0).
 *
 * Output: tmp/bundesliga-2026-27-real/squads.json
 *   {
 *     retrievedAt: 'YYYY-MM-DD',
 *     source: 'https://en.wikipedia.org (CC BY-SA 4.0)',
 *     squads: [
 *       { teamId, article, updated: '<Fs updated note or null>',
 *         players: [ { no, pos, nat, name } ] }
 *     ]
 *   }
 *
 * Usage: node scripts/fetch-bundesliga-squads.mjs [--output=DIR]
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_OUTPUT = join(__dirname, '..', 'tmp', 'bundesliga-2026-27-real');

// teamId (must match TEAM_MAP in build-bundesliga-real.mjs) -> Wikipedia article title
const CLUBS = [
	['team-fc-augsburg', 'FC Augsburg'],
	['team-fc-bayern-muenchen', 'FC Bayern Munich'],
	['team-borussia-dortmund', 'Borussia Dortmund'],
	['team-eintracht-frankfurt', 'Eintracht Frankfurt'],
	['team-sv-07-elversberg', 'SV Elversberg'],
	['team-1-fc-koeln', '1. FC Köln'],
	['team-sc-freiburg', 'SC Freiburg'],
	['team-hamburger-sv', 'Hamburger SV'],
	['team-tsg-1899-hoffenheim', 'TSG 1899 Hoffenheim'],
	['team-bayer-04-leverkusen', 'Bayer 04 Leverkusen'],
	['team-borussia-moenchengladbach', 'Borussia Mönchengladbach'],
	['team-1-fsv-mainz-05', '1. FSV Mainz 05'],
	['team-sc-paderborn-07', 'SC Paderborn 07'],
	['team-rb-leipzig', 'RB Leipzig'],
	['team-fc-schalke-04', 'FC Schalke 04'],
	['team-vfb-stuttgart', 'VfB Stuttgart'],
	['team-1-fc-union-berlin', '1. FC Union Berlin'],
	['team-sv-werder-bremen', 'SV Werder Bremen'],
];

const USER_AGENT = 'felix-kramer-com-data-research/1.0 (contact: felix-kramer.com)';

function argValue(flag, fallback) {
	const prefix = `${flag}=`;
	const arg = process.argv.find((a) => a.startsWith(prefix));
	return arg ? arg.slice(prefix.length) : fallback;
}

async function fetchRawWikitext(title) {
	const url = `https://en.wikipedia.org/w/index.php?title=${encodeURIComponent(title)}&action=raw`;
	const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
	if (!response.ok) throw new Error(`HTTP ${response.status} for ${title}`);
	return response.text();
}

/** Extract a single named parameter from a `{{Fs player|...}}` template line, order-independent. */
function fsParam(line, key) {
	const match = line.match(new RegExp(`\\|${key}=([^|}]*)`));
	return match ? match[1].trim() : null;
}

/** Extract the first "Current squad" block (between ===Current squad=== and the next === heading). */
function extractCurrentSquad(wikitext) {
	const lines = wikitext.split('\n');
	let start = -1;
	for (let i = 0; i < lines.length; i++) {
		if (/^===\s*Current squad\s*===/i.test(lines[i])) {
			start = i;
			break;
		}
	}
	if (start === -1) return null;

	let updated = null;
	const players = [];
	for (let i = start + 1; i < lines.length; i++) {
		const line = lines[i];
		if (/^===[^=]/.test(line)) break; // next sub-section (e.g. ===Bayern Munich II...)
		const updatedMatch = line.match(/{{Updated\|([^|}]*)\|/i);
		if (updatedMatch && !updated) updated = updatedMatch[1].trim();
		if (!line.includes('{{Fs player')) continue;
		const no = fsParam(line, 'no');
		const pos = fsParam(line, 'pos');
		const nat = fsParam(line, 'nat');
		const nameRaw = fsParam(line, 'name');
		// name is a wiki link: [[Display Name]] or [[Target|Display]]
		const name = nameRaw ? nameRaw.replace(/^\[\[|\]\]$/g, '').split('|').pop().trim() : null;
		if (!name || !pos) continue;
		players.push({
			no: no ? Number(no) : null,
			pos,
			nat: nat || 'UNK',
			name,
		});
	}
	return { updated, players };
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
	const outputDir = argValue('--output', DEFAULT_OUTPUT);
	const retrievedAt = new Date().toISOString().slice(0, 10);
	const squads = [];
	const failures = [];

	for (const [teamId, article] of CLUBS) {
		try {
			const wikitext = await fetchRawWikitext(article);
			const squad = extractCurrentSquad(wikitext);
			if (!squad || squad.players.length === 0) {
				failures.push({ teamId, article, reason: 'no current squad found' });
				console.warn(`WARN ${article}: no current squad found`);
			} else {
				squads.push({ teamId, article, updated: squad.updated, players: squad.players });
				console.log(`OK   ${article}: ${squad.players.length} players`);
			}
		} catch (error) {
			failures.push({ teamId, article, reason: error.message });
			console.warn(`FAIL ${article}: ${error.message}`);
		}
		await sleep(1000); // be polite to the Wikipedia API
	}

	const result = {
		retrievedAt,
		source: 'https://en.wikipedia.org (CC BY-SA 4.0)',
		squads,
		failures,
	};
	mkdirSync(outputDir, { recursive: true });
	const outPath = join(outputDir, 'squads.json');
	writeFileSync(outPath, `${JSON.stringify(result, null, 2)}\n`);

	const total = squads.reduce((sum, squad) => sum + squad.players.length, 0);
	console.log(`\nFetched ${squads.length}/${CLUBS.length} squads, ${total} players -> ${outPath}`);
	if (failures.length > 0) {
		console.log('Failures:', JSON.stringify(failures, null, 2));
		process.exitCode = 1;
	}
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});

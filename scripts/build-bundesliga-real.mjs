#!/usr/bin/env node
/**
 * Build the real Bundesliga 2026/27 dataset (batch 2: teams + results + players).
 *
 * Sources (see provenance in the generated dataset):
 *   - football-data.co.uk D1.csv  -> finished results, xG, shots, cards (primary)
 *   - openfootball de.1.json       -> public-domain schedule + canonical names
 *   - Wikipedia club articles      -> first-team squads (players, memberships)
 *
 * The output is a schema-valid canonical FootballDataset (batch 2). Player
 * identities, memberships and identity-level snapshots come from the Wikipedia
 * squad tables (CC BY-SA 4.0). Detailed attributes, heatmaps and tracking are
 * added in later batches. Team strength (elo / attack / defense) is DERIVED
 * from the real results, never invented.
 *
 * Examples:
 *   node --experimental-strip-types scripts/build-bundesliga-real.mjs
 *   node --experimental-strip-types scripts/build-bundesliga-real.mjs \
 *     --csv=/tmp/d1.csv --openfootball=/tmp/openfootball-de1.json \
 *     --squads=tmp/bundesliga-2026-27-real/squads.json \
 *     --output=tmp/bundesliga-2026-27-real
 *
 * Run with --experimental-strip-types so the script can import the real
 * validateDataset() from src/ and validate its own output.
 */

import { brotliCompressSync, gzipSync } from 'node:zlib';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(new URL('..', import.meta.url)));

const DEFAULTS = {
	csv: '/tmp/d1.csv',
	openfootball: '/tmp/openfootball-de1.json',
	squads: join(ROOT, 'tmp', 'bundesliga-2026-27-real', 'squads.json'),
	output: join(ROOT, 'tmp', 'bundesliga-2026-27-real'),
	retrievedAt: new Date().toISOString().slice(0, 10),
};

const COMPETITION_ID = 'competition-bundesliga';
const SEASON_ID = 'season-bundesliga-2026-27';
const SEASON_START = '2026-08-01';
const SEASON_END = '2027-05-31';
const SOURCE_FDCO_UK = 'source-football-data-cou-uk';
const SOURCE_OPENFOOTBALL = 'source-openfootball';
const SOURCE_ELO = 'source-elo-derivation';
const SOURCE_WIKI_SQUADS = 'source-wikipedia-squads';

// CSV short name -> [canonical German name, stable id, short, primary, secondary]
// Canonical names mirror openfootball (public domain). IDs are distinct from the
// synthetic seed so the two datasets can coexist without collisions.
const TEAM_MAP = {
	'Augsburg': ['FC Augsburg', 'team-fc-augsburg', 'FCA', '#ba0c2f', '#ffffff'],
	'Bayern Munich': ['FC Bayern München', 'team-fc-bayern-muenchen', 'FCB', '#dc052d', '#0066b2'],
	'Dortmund': ['Borussia Dortmund', 'team-borussia-dortmund', 'BVB', '#fde100', '#000000'],
	'Ein Frankfurt': ['Eintracht Frankfurt', 'team-eintracht-frankfurt', 'SGE', '#e1000f', '#000000'],
	'Elversberg': ['SV 07 Elversberg', 'team-sv-07-elversberg', 'SV07', '#e30613', '#ffffff'],
	'FC Koln': ['1. FC Köln', 'team-1-fc-koeln', 'KOE', '#ed1c24', '#ffffff'],
	'Freiburg': ['SC Freiburg', 'team-sc-freiburg', 'SCF', '#e2001a', '#000000'],
	'Hamburg': ['Hamburger SV', 'team-hamburger-sv', 'HSV', '#000000', '#ffffff'],
	'Hoffenheim': ['TSG 1899 Hoffenheim', 'team-tsg-1899-hoffenheim', 'TSG', '#1961ad', '#ffffff'],
	'Leverkusen': ['Bayer 04 Leverkusen', 'team-bayer-04-leverkusen', 'B04', '#e32221', '#000000'],
	"M'gladbach": ['Borussia Mönchengladbach', 'team-borussia-moenchengladbach', 'BMG', '#ffffff', '#000000'],
	'Mainz': ['1. FSV Mainz 05', 'team-1-fsv-mainz-05', 'M05', '#c8102e', '#ffffff'],
	'Paderborn': ['SC Paderborn 07', 'team-sc-paderborn-07', 'SCP', '#000000', '#ffffff'],
	'RB Leipzig': ['RB Leipzig', 'team-rb-leipzig', 'RBL', '#dd0741', '#ffffff'],
	'Schalke 04': ['FC Schalke 04', 'team-fc-schalke-04', 'S04', '#001f5f', '#ffffff'],
	'Stuttgart': ['VfB Stuttgart', 'team-vfb-stuttgart', 'VfB', '#ffffff', '#e32221'],
	'Union Berlin': ['1. FC Union Berlin', 'team-1-fc-union-berlin', 'FCU', '#eb1923', '#ffffff'],
	'Werder Bremen': ['SV Werder Bremen', 'team-sv-werder-bremen', 'SVW', '#1d9053', '#ffffff'],
};

function parseArgs(argv) {
	const options = { ...DEFAULTS };
	for (const argument of argv) {
		if (!argument.startsWith('--')) continue;
		const separator = argument.indexOf('=');
		const key = separator === -1 ? argument.slice(2) : argument.slice(2, separator);
		const value = separator === -1 ? 'true' : argument.slice(separator + 1);
		if (key in options) options[key] = value;
	}
	return options;
}

// --- Player batch (squads from Wikipedia, CC BY-SA 4.0) ----------------------

function slugify(name) {
	return name
		.toLowerCase()
		.normalize('NFKD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

// Wikipedia disambiguation suffixes like "(footballer, born 1997)" are not part
// of the display name.
function displayPlayerName(name) {
	return name.replace(/\s*\([^)]*\)\s*$/, '').trim();
}

const POS_TO_POSITIONS = {
	GK: ['GK'],
	DF: ['DF'],
	MF: ['MF'],
	FW: ['FW'],
};

// Wikipedia squad tables use FIFA/IOC flag codes. Normalise to ISO 3166-1
// alpha-3 so the dataset uses one standard. Codes without an ISO country
// (e.g. Kosovo) keep the FIFA code.
const NATION_NORMALIZE = {
	GER: 'DEU',
	SUI: 'CHE',
	NED: 'NLD',
	ALG: 'DZA',
	GRE: 'GRC',
	BUL: 'BGR',
	ENG: 'GBR',
	SCO: 'GBR',
	WAL: 'GBR',
	IRL: 'IRL',
	NGR: 'NGA',
	GUI: 'GIN',
	GAM: 'GMB',
	KVX: 'KOS',
	PHI: 'PHL',
	HAI: 'HTI',
	ZAM: 'ZMB',
};

function normalizeNation(code) {
	return NATION_NORMALIZE[code] ?? code;
}

function buildPlayerBatch(squads) {
	const players = [];
	const memberships = [];
	const playerSnapshots = [];
	const seenIds = new Set();

	for (const squad of squads) {
		for (const raw of squad.players) {
			const name = displayPlayerName(raw.name);
			const playerId = `player-${slugify(name)}`;
			if (seenIds.has(playerId)) {
				throw new Error(`Duplicate player id ${playerId} (${name}) in ${squad.teamId}`);
			}
			seenIds.add(playerId);

			players.push({
				id: playerId,
				canonicalName: name,
				nationalityCodes: [normalizeNation(raw.nat)],
				positions: POS_TO_POSITIONS[raw.pos] ?? ['MF'],
				status: 'active',
			});

			memberships.push({
				id: `membership-${playerId}-${squad.teamId}`,
				playerId,
				teamId: squad.teamId,
				role: 'player',
				contractType: 'permanent',
				squadNumber: raw.no ?? undefined,
				validFrom: SEASON_START,
				validTo: null,
			});

			// Minimal snapshot: identity-level data only. No invented ratings —
			// detailed attributes arrive with the internal tool (PLAN.md Phase 3).
			playerSnapshots.push({
				id: `player-snapshot-${playerId}-${SEASON_ID}`,
				playerId,
				validFrom: SEASON_START,
				validTo: null,
				scale: { min: 1, max: 20 },
				attributes: {},
				assessmentType: 'imported',
				sourceRefs: [SOURCE_WIKI_SQUADS],
			});
		}
	}
	return { players, memberships, playerSnapshots };
}

// --- CSV parsing (BOM-aware, dd/mm/yyyy) -------------------------------------

function parseCsv(text) {
	const clean = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
	const lines = clean.split(/\r?\n/).filter((line) => line.trim().length > 0);
	const header = lines[0].split(',');
	return lines.slice(1).map((line) => {
		const cells = line.split(',');
		const row = {};
		header.forEach((name, index) => {
			row[name] = cells[index];
		});
		return row;
	});
}

function parseFtDate(value) {
	// "28/08/2026" -> "2026-08-28"
	const [day, month, year] = value.split('/');
	return `${year}-${month}-${day}`;
}

function matchDateTime(date, time) {
	// Summer 2026 is CEST (UTC+2).
	return `${parseFtDate(date)}T${time}:00+02:00`;
}

const toInt = (value) => {
	const parsed = Number.parseInt(value, 10);
	return Number.isFinite(parsed) ? parsed : 0;
};
const toFloat = (value) => {
	const parsed = Number.parseFloat(value);
	return Number.isFinite(parsed) ? parsed : 0;
};
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

// --- Derived team strength from real results --------------------------------

function computeElo(teamIds, matches) {
	const elo = Object.fromEntries(teamIds.map((id) => [id, 1500]));
	const K = 32;
	for (const match of matches) {
		const eh = elo[match.homeTeamId];
		const ea = elo[match.awayTeamId];
		const expectedHome = 1 / (1 + 10 ** ((ea - eh) / 400));
		const expectedAway = 1 - expectedHome;
		const scoreHome =
			match.score.home > match.score.away ? 1 : match.score.home === match.score.away ? 0.5 : 0;
		const scoreAway =
			match.score.away > match.score.home ? 1 : match.score.home === match.score.away ? 0.5 : 0;
		elo[match.homeTeamId] += K * (scoreHome - expectedHome);
		elo[match.awayTeamId] += K * (scoreAway - expectedAway);
	}
	return elo;
}

function computeStandings(teamIds, matches) {
	const table = Object.fromEntries(teamIds.map((id) => [id, { points: 0, played: 0, gf: 0, ga: 0, gd: 0 }]));
	for (const match of matches) {
		const home = table[match.homeTeamId];
		const away = table[match.awayTeamId];
		home.played += 1;
		away.played += 1;
		home.gf += match.score.home;
		home.ga += match.score.away;
		away.gf += match.score.away;
		away.ga += match.score.home;
		if (match.score.home > match.score.away) home.points += 3;
		else if (match.score.home < match.score.away) away.points += 3;
		else {
			home.points += 1;
			away.points += 1;
		}
	}
	for (const id of teamIds) table[id].gd = table[id].gf - table[id].ga;
	return table;
}

// --- Dataset construction ----------------------------------------------------

function buildDataset(options) {
	const csvText = readFileSync(options.csv, 'utf8');
	const openFootball = JSON.parse(readFileSync(options.openfootball, 'utf8'));
	const squads = JSON.parse(readFileSync(options.squads, 'utf8'));
	const rows = parseCsv(csvText);

	const teamIds = Object.values(TEAM_MAP).map(([, id]) => id);
	const teamById = new Map(Object.values(TEAM_MAP).map(([, id]) => [id, null]));

	// Cross-check: every CSV team must be mapped; every openfootball team must
	// appear in the 18 mapped clubs.
	const csvTeamNames = new Set(rows.map((row) => row.HomeTeam).concat(rows.map((row) => row.AwayTeam)));
	const unmapped = [...csvTeamNames].filter((name) => !TEAM_MAP[name]);
	if (unmapped.length > 0) {
		throw new Error(`Unmapped CSV team name(s): ${unmapped.join(', ')}`);
	}
	const openFootballTeams = new Set(
		openFootball.matches.flatMap((match) => [match.team1, match.team2])
	);
	const canonicalNames = new Set(Object.values(TEAM_MAP).map(([name]) => name));
	const missingInOpenFootball = [...canonicalNames].filter((name) => !openFootballTeams.has(name));

	const teams = Object.values(TEAM_MAP).map(([canonicalName, id, shortName, primary, secondary]) => ({
		id,
		canonicalName,
		shortName,
		countryCode: 'DE',
		aliases: [],
		colors: { primary, secondary },
	}));

	// Player batch: every squad teamId must be one of the 18 mapped clubs.
	const teamIdSet = new Set(teams.map((team) => team.id));
	const unmappedSquadTeams = [...new Set(squads.squads.map((s) => s.teamId))].filter(
		(id) => !teamIdSet.has(id)
	);
	if (unmappedSquadTeams.length > 0) {
		throw new Error(`Squad teamId(s) not in TEAM_MAP: ${unmappedSquadTeams.join(', ')}`);
	}
	const { players, memberships, playerSnapshots } = buildPlayerBatch(squads.squads);

	// Matches in chronological order (drives elo + standings).
	const matches = rows
		.map((row) => {
			const homeName = row.HomeTeam;
			const awayName = row.AwayTeam;
			const homeTeamId = TEAM_MAP[homeName][1];
			const awayTeamId = TEAM_MAP[awayName][1];
			return {
				homeTeamId,
				awayTeamId,
				dateTime: matchDateTime(row.Date, row.Time),
				sortKey: `${parseFtDate(row.Date)}T${row.Time}`,
				score: { home: toInt(row.FTHG), away: toInt(row.FTAG) },
				homeStats: {
					xg: toFloat(row.HxG),
					shots: toInt(row.HS),
					shotsOnTarget: toInt(row.HST),
					fouls: toInt(row.HF),
					corners: toInt(row.HC),
					yellowCards: toInt(row.HY),
					redCards: toInt(row.HR),
				},
				awayStats: {
					xg: toFloat(row.AxG),
					shots: toInt(row.AS),
					shotsOnTarget: toInt(row.AST),
					fouls: toInt(row.AF),
					corners: toInt(row.AC),
					yellowCards: toInt(row.AY),
					redCards: toInt(row.AR),
				},
			};
		})
		.sort((a, b) => (a.sortKey < b.sortKey ? -1 : a.sortKey > b.sortKey ? 1 : 0));

	const elo = computeElo(teamIds, matches);
	const standings = computeStandings(teamIds, matches);
	const standingsOrder = [...teamIds].sort((a, b) => {
		const sa = standings[a];
		const sb = standings[b];
		return sb.points - sa.points || sb.gd - sa.gd || sb.gf - sa.gf || a.localeCompare(b);
	});

	const competitions = [
		{
			id: COMPETITION_ID,
			type: 'league',
			countryCode: 'DE',
			name: 'Bundesliga',
			shortName: 'BL',
			level: 1,
			gender: 'male',
			seasonIds: [SEASON_ID],
		},
	];
	const seasons = [
		{
			id: SEASON_ID,
			competitionId: COMPETITION_ID,
			name: '2026/27',
			startDate: SEASON_START,
			endDate: SEASON_END,
		},
	];

	const teamParticipations = standingsOrder.map((teamId, index) => ({
		id: `participation-${SEASON_ID}-${teamId}`,
		competitionId: COMPETITION_ID,
		seasonId: SEASON_ID,
		teamId,
		status: 'active',
		position: index + 1,
		points: standings[teamId].points,
		validFrom: SEASON_START,
		validTo: null,
	}));

	const teamSnapshots = teams.map((team) => {
		const table = standings[team.id];
		const gfp = table.gf / Math.max(1, table.played);
		const gap = table.ga / Math.max(1, table.played);
		return {
			id: `team-snapshot-${team.id}-${SEASON_ID}`,
			teamId: team.id,
			validFrom: SEASON_START,
			validTo: null,
			rating: {
				elo: Math.round(elo[team.id]),
				attack: clamp(Math.round(50 + gfp * 15), 40, 95),
				defense: clamp(Math.round(95 - gap * 15), 40, 95),
				overall: clamp(Math.round((elo[team.id] - 1500) / 8 + 70), 40, 95),
			},
			sourceRefs: [SOURCE_ELO, SOURCE_FDCO_UK],
		};
	});

	const matchRecords = matches.map((match, index) => ({
		id: `match-${SEASON_ID}-${String(index + 1).padStart(3, '0')}`,
		competitionId: COMPETITION_ID,
		seasonId: SEASON_ID,
		dateTime: match.dateTime,
		homeTeamId: match.homeTeamId,
		awayTeamId: match.awayTeamId,
		status: 'finished',
		score: match.score,
	}));

	// Team-level match stats (xG, shots, cards) as typed events. No player
	// attribution yet — that arrives with the player batch.
	const events = matches.flatMap((match, index) => {
		const matchId = matchRecords[index].id;
		const statsEvent = (teamId, stats) => ({
			id: `event-team-stats-${matchId}-${teamId}`,
			matchId,
			teamId,
			type: 'team-stats',
			xg: stats.xg,
			shots: stats.shots,
			shotsOnTarget: stats.shotsOnTarget,
			fouls: stats.fouls,
			corners: stats.corners,
			yellowCards: stats.yellowCards,
			redCards: stats.redCards,
		});
		return [statsEvent(match.homeTeamId, match.homeStats), statsEvent(match.awayTeamId, match.awayStats)];
	});

	const provenance = [
		{
			id: SOURCE_FDCO_UK,
			type: 'imported',
			provider: 'football-data.co.uk',
			name: 'Bundesliga 2026/27 finished matches (D1.csv)',
			retrievedAt: options.retrievedAt,
			license:
				'Free to use per site; no explicit license text found at retrieval — review before redistribution.',
			method: 'CSV parse of Div=D1 rows (results, xG, shots, cards).',
			sourceUrl: 'https://www.football-data.co.uk/mmz4281/2627/oD1.csv',
			notes: 'Primary source for results and team match stats.',
		},
		{
			id: SOURCE_OPENFOOTBALL,
			type: 'imported',
			provider: 'openfootball',
			name: 'Deutsche Bundesliga 2026/27 (de.1.json)',
			retrievedAt: options.retrievedAt,
			license: 'Public domain (openfootball football.json).',
			method: 'JSON parse; used to confirm the 18 clubs and canonical German names.',
			sourceUrl: 'https://github.com/openfootball/football.json/blob/master/de/1.json',
			notes: `Cross-check: ${openFootballTeams.size} unique clubs in source; ${missingInOpenFootball.length} mapped club name(s) not found in openfootball.`,
		},
		{
			id: SOURCE_ELO,
			type: 'derived',
			provider: 'build-bundesliga-real.mjs',
			name: 'Team elo / attack / defense derivation',
			retrievedAt: options.retrievedAt,
			license: 'CC0-1.0',
			method:
				'Elo (K=32, base 1500) updated per finished match; attack/defense scaled from goals for/against per match.',
			notes: 'Derived from the real results above; not an independent measurement.',
		},
		{
			id: SOURCE_WIKI_SQUADS,
			type: 'imported',
			provider: 'Wikipedia (en.wikipedia.org)',
			name: 'Bundesliga 2026/27 first-team squads (18 club articles)',
			retrievedAt: options.retrievedAt,
			license: 'CC BY-SA 4.0 (attribution required; see each club article).',
			method:
				'Parsed the "Current squad" section of each club article (number, position, nationality, name). Nationality flag codes normalised to ISO 3166-1 alpha-3 (FIFA codes without an ISO country, e.g. Kosovo, kept).',
			sourceUrl: 'https://en.wikipedia.org/wiki/2026%E2%80%9327_Bundesliga',
			notes:
				'Player identities, squad numbers, positions and nationalities. No ratings or attributes are imported from this source — playerSnapshots carry identity-level data only.',
		},
	];

	return {
		$schema: 'https://felix-kramer.com/schemas/football-dataset-v1.json',
		dataset: {
			id: 'bundesliga-2026-27-real',
			name: 'Bundesliga 2026/27 (real results)',
			schemaVersion: '1.0.0',
			datasetVersion: '1.0.0',
			createdAt: `${options.retrievedAt}T00:00:00Z`,
			updatedAt: `${options.retrievedAt}T00:00:00Z`,
			sourceType: 'imported',
			defaultTimeZone: 'Europe/Berlin',
			defaultCoordinateSystem: 'normalized-pitch',
			units: { distance: 'km', speed: 'kmh', duration: 'minutes' },
		},
		competitions,
		seasons,
		teams,
		teamParticipations,
		players,
		memberships,
		teamSnapshots,
		playerSnapshots,
		tacticalProfiles: [],
		matches: matchRecords,
		matchAppearances: [],
		events,
		heatmaps: [],
		tracking: [],
		chemistry: [],
		provenance,
	};
}

// --- Validation + smoke test -------------------------------------------------

async function validateAndSmokeTest(dataset) {
	const { validateDataset } = await import('../src/lib/engine/dataset/schema.ts');
	validateDataset(dataset);

	const { toEngineTeams, teamsForCompetition } = await import('../src/lib/engine/dataset/adapter.ts');
	const asOf = dataset.dataset.updatedAt.slice(0, 10);
	const engineTeams = toEngineTeams(dataset, { asOf });
	const competitionTeams = teamsForCompetition(dataset, COMPETITION_ID, SEASON_ID);
	const unresolved = competitionTeams.filter((team) => !Number.isFinite(team.elo) || team.elo <= 0);
	if (unresolved.length > 0) {
		throw new Error(`Teams without a usable elo: ${unresolved.map((t) => t.name).join(', ')}`);
	}
	return { engineTeamCount: engineTeams.length, competitionTeamCount: competitionTeams.length };
}

function bytes(value) {
	return `${(Buffer.byteLength(value) / 1024 / 1024).toFixed(3)} MiB`;
}

function writeOutput(dataset, options, smoke, elapsedMs) {
	const outputDir = options.output.startsWith('/') ? options.output : join(ROOT, options.output);
	mkdirSync(outputDir, { recursive: true });

	const compact = JSON.stringify(dataset);
	const pretty = JSON.stringify(dataset, null, 2);
	const report = {
		generatedAt: new Date().toISOString(),
		script: 'build-bundesliga-real.mjs',
		batch: '2 (teams + real results + derived strength + player identities/memberships)',
		sources: {
			csv: options.csv,
			openfootball: options.openfootball,
			squads: options.squads,
			retrievedAt: options.retrievedAt,
		},
		generationMs: Math.round(elapsedMs),
		records: Object.fromEntries(
			Object.entries(dataset)
				.filter(([, value]) => Array.isArray(value))
				.map(([key, value]) => [key, value.length])
		),
		sizes: {
			compactJson: bytes(compact),
			prettyJson: bytes(pretty),
			gzip: bytes(gzipSync(compact, { level: 9 })),
			brotli: bytes(brotliCompressSync(compact)),
		},
		smokeTest: smoke,
		gaps: [
			'Player snapshots carry identity-level data only (no ratings/attributes) — detailed attributes arrive with the internal tool.',
			'No dateOfBirth or preferredFoot yet (not in the Wikipedia squad tables).',
			'No heatmaps, tracking, chemistry, or tactical profiles yet.',
			'midfield rating omitted (no midfield-specific metric in source).',
		],
	};

	writeFileSync(join(outputDir, 'dataset.json'), compact);
	writeFileSync(join(outputDir, 'dataset.pretty.json'), `${pretty}\n`);
	writeFileSync(join(outputDir, 'size-report.json'), `${JSON.stringify(report, null, 2)}\n`);

	console.log(`Wrote real Bundesliga 2026/27 dataset (batch 2) to ${outputDir}`);
	console.log(`Records: ${JSON.stringify(report.records)}`);
	console.log(`Sizes: ${JSON.stringify(report.sizes)}`);
	console.log(`Smoke test: ${JSON.stringify(smoke)}`);
	console.log(`Generation time: ${report.generationMs} ms`);
}

const options = parseArgs(process.argv.slice(2));
const startedAt = performance.now();
const dataset = buildDataset(options);
const smoke = await validateAndSmokeTest(dataset);
writeOutput(dataset, options, smoke, performance.now() - startedAt);

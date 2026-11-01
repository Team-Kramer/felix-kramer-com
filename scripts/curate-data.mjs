#!/usr/bin/env node
/**
 * Data curation script for the Felix static homepage.
 *
 * Generates:
 *   src/lib/engine/data/nations.json  — 211 FIFA member associations
 *   src/lib/engine/data/clubs.json    — 5 leagues × 20 clubs
 *   src/lib/engine/data/players.json  — ~1,000 curated (synthetic) players
 *
 * Sources & honesty:
 *   - Nation list, codes, confederations: FIFA member associations (real).
 *   - Club list: real clubs from 5 top leagues.
 *   - Elo values: deterministic synthetic values around realistic tiers
 *     (seeded PRNG), labeled "as of 2026-10" in the snapshot field.
 *   - Player names: synthetic composites from per-nation name pools —
 *     NOT real persons. See docs/data-provenance.md.
 *
 * Deterministic: same script + same seed = same output.
 * Run: node scripts/curate-data.mjs
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'src', 'lib', 'engine', 'data');
mkdirSync(DATA_DIR, { recursive: true });

// ---------------------------------------------------------------------------
// Deterministic PRNG (mulberry32) — same as the engine.
// ---------------------------------------------------------------------------
function mulberry32(seed) {
	let a = seed >>> 0;
	return function () {
		a |= 0;
		a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}
function seedFromString(str) {
	let h = 1779033703 ^ str.length;
	for (let i = 0; i < str.length; i++) {
		h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
		h = (h << 13) | (h >>> 19);
	}
	return h >>> 0;
}
const rng = mulberry32(seedFromString('felix-data-2026-10'));

// ---------------------------------------------------------------------------
// Nations — 211 FIFA member associations.
// [code, nameEn, nameDe, confederation, tier]
// tier: 1 = elite (Elo ~2050-2200), 2 = strong (~1850-2050),
//       3 = mid (~1650-1850), 4 = developing (~1450-1650), 5 = lower (~1250-1450)
// ---------------------------------------------------------------------------
const NATIONS = [
	// UEFA (55)
	['GER', 'Germany', 'Deutschland', 'UEFA', 1],
	['ESP', 'Spain', 'Spanien', 'UEFA', 1],
	['FRA', 'France', 'Frankreich', 'UEFA', 1],
	['ENG', 'England', 'England', 'UEFA', 1],
	['POR', 'Portugal', 'Portugal', 'UEFA', 1],
	['NED', 'Netherlands', 'Niederlande', 'UEFA', 1],
	['ITA', 'Italy', 'Italien', 'UEFA', 2],
	['BEL', 'Belgium', 'Belgien', 'UEFA', 2],
	['CRO', 'Croatia', 'Kroatien', 'UEFA', 2],
	['SUI', 'Switzerland', 'Schweiz', 'UEFA', 2],
	['DEN', 'Denmark', 'Dänemark', 'UEFA', 2],
	['POL', 'Poland', 'Polen', 'UEFA', 2],
	['TUR', 'Türkiye', 'Türkei', 'UEFA', 2],
	['AUT', 'Austria', 'Österreich', 'UEFA', 2],
	['SCO', 'Scotland', 'Schottland', 'UEFA', 3],
	['NOR', 'Norway', 'Norwegen', 'UEFA', 2],
	['SWE', 'Sweden', 'Schweden', 'UEFA', 3],
	['CZE', 'Czechia', 'Tschechien', 'UEFA', 3],
	['ROU', 'Romania', 'Rumänien', 'UEFA', 3],
	['SRB', 'Serbia', 'Serbien', 'UEFA', 3],
	['UKR', 'Ukraine', 'Ukraine', 'UEFA', 3],
	['RUS', 'Russia', 'Russland', 'UEFA', 3],
	['HUN', 'Hungary', 'Ungarn', 'UEFA', 3],
	['BUL', 'Bulgaria', 'Bulgarien', 'UEFA', 4],
	['GRE', 'Greece', 'Griechenland', 'UEFA', 4],
	['SVK', 'Slovakia', 'Slowakei', 'UEFA', 4],
	['BIH', 'Bosnia and Herzegovina', 'Bosnien und Herzegowina', 'UEFA', 4],
	['ALB', 'Albania', 'Albanien', 'UEFA', 4],
	['GEO', 'Georgia', 'Georgien', 'UEFA', 4],
	['AZE', 'Azerbaijan', 'Aserbaidschan', 'UEFA', 4],
	['ISL', 'Iceland', 'Island', 'UEFA', 4],
	['FIN', 'Finland', 'Finnland', 'UEFA', 4],
	['IRL', 'Republic of Ireland', 'Irland', 'UEFA', 4],
	['WAL', 'Wales', 'Wales', 'UEFA', 4],
	['CYP', 'Cyprus', 'Zypern', 'UEFA', 5],
	['LVA', 'Latvia', 'Lettland', 'UEFA', 5],
	['LTU', 'Lithuania', 'Litauen', 'UEFA', 5],
	['BLR', 'Belarus', 'Weißrussland', 'UEFA', 5],
	['MKD', 'North Macedonia', 'Nordmazedonien', 'UEFA', 5],
	['MNE', 'Montenegro', 'Montenegro', 'UEFA', 5],
	['KOS', 'Kosovo', 'Kosovo', 'UEFA', 5],
	['NIR', 'Northern Ireland', 'Nordirland', 'UEFA', 5],
	['LUX', 'Luxembourg', 'Luxemburg', 'UEFA', 5],
	['FRO', 'Faroe Islands', 'Färöer-Inseln', 'UEFA', 5],
	['MLT', 'Malta', 'Malta', 'UEFA', 5],
	['AND', 'Andorra', 'Andorra', 'UEFA', 5],
	['SMR', 'San Marino', 'San Marino', 'UEFA', 5],
	['MCO', 'Monaco', 'Monaco', 'UEFA', 5],
	['LIE', 'Liechtenstein', 'Liechtenstein', 'UEFA', 5],
	['GIB', 'Gibraltar', 'Gibraltar', 'UEFA', 5],
	['ARM', 'Armenia', 'Armenien', 'UEFA', 4],
	['EST', 'Estonia', 'Estland', 'UEFA', 5],
	['ISR', 'Israel', 'Israel', 'UEFA', 3],
	['MDA', 'Moldova', 'Moldawien', 'UEFA', 5],
	['SLO', 'Slovenia', 'Slowenien', 'UEFA', 3],
	// CONMEBOL (10)
	['ARG', 'Argentina', 'Argentinien', 'CONMEBOL', 1],
	['BRA', 'Brazil', 'Brasilien', 'CONMEBOL', 1],
	['URU', 'Uruguay', 'Uruguay', 'CONMEBOL', 2],
	['COL', 'Colombia', 'Kolumbien', 'CONMEBOL', 2],
	['ECU', 'Ecuador', 'Ecuador', 'CONMEBOL', 3],
	['PAR', 'Paraguay', 'Paraguay', 'CONMEBOL', 4],
	['PER', 'Peru', 'Peru', 'CONMEBOL', 4],
	['BOL', 'Bolivia', 'Bolivien', 'CONMEBOL', 5],
	['VEN', 'Venezuela', 'Venezuela', 'CONMEBOL', 5],
	['CHI', 'Chile', 'Chile', 'CONMEBOL', 4],
	// CONCACAF (41)
	['MEX', 'Mexico', 'Mexiko', 'CONCACAF', 2],
	['USA', 'United States', 'Vereinigte Staaten', 'CONCACAF', 2],
	['CAN', 'Canada', 'Kanada', 'CONCACAF', 2],
	['JAM', 'Jamaica', 'Jamaika', 'CONCACAF', 4],
	['PAN', 'Panama', 'Panama', 'CONCACAF', 4],
	['CRC', 'Costa Rica', 'Costa Rica', 'CONCACAF', 4],
	['HON', 'Honduras', 'Honduras', 'CONCACAF', 5],
	['GUA', 'Guatemala', 'Guatemala', 'CONCACAF', 5],
	['SLV', 'El Salvador', 'El Salvador', 'CONCACAF', 5],
	['NIC', 'Nicaragua', 'Nicaragua', 'CONCACAF', 5],
	['TRI', 'Trinidad and Tobago', 'Trinidad und Tobago', 'CONCACAF', 5],
	['CUB', 'Cuba', 'Kuba', 'CONCACAF', 5],
	['DOM', 'Dominican Republic', 'Dominikanische Republik', 'CONCACAF', 5],
	['SUR', 'Suriname', 'Suriname', 'CONCACAF', 5],
	['GRN', 'Grenada', 'Grenada', 'CONCACAF', 5],
	['ATG', 'Antigua and Barbuda', 'Antigua und Barbuda', 'CONCACAF', 5],
	['BRB', 'Barbados', 'Barbados', 'CONCACAF', 5],
	['LCA', 'Saint Lucia', 'Saint Lucia', 'CONCACAF', 5],
	['VIN', 'Saint Vincent and the Grenadines', 'Saint Vincent und die Grenadinen', 'CONCACAF', 5],
	['DMA', 'Dominica', 'Dominica', 'CONCACAF', 5],
	['SKN', 'Saint Kitts and Nevis', 'Saint Kitts und Nevis', 'CONCACAF', 5],
	['TCA', 'Turks and Caicos Islands', 'Turks- und Caicosinseln', 'CONCACAF', 5],
	['BHS', 'Bahamas', 'Bahamas', 'CONCACAF', 5],
	['BER', 'Bermuda', 'Bermuda', 'CONCACAF', 5],
	['CAY', 'Cayman Islands', 'Kaimaninseln', 'CONCACAF', 5],
	['CUW', 'Curaçao', 'Curaçao', 'CONCACAF', 5],
	['GUY', 'Guyana', 'Guyana', 'CONCACAF', 5],
	['HAI', 'Haiti', 'Haiti', 'CONCACAF', 5],
	['LBR', 'Liberia', 'Liberia', 'CONCACAF', 5],
	['MHL', 'Marshall Islands', 'Marshallinseln', 'CONCACAF', 5],
	['PLW', 'Palau', 'Palau', 'CONCACAF', 5],
	['PRI', 'Puerto Rico', 'Puerto Rico', 'CONCACAF', 5],
	['SKM', 'Saint Martin', 'Saint-Martin', 'CONCACAF', 5],
	['STP', 'São Tomé and Príncipe', 'São Tomé und Príncipe', 'CONCACAF', 5],
	['AIA', 'Anguilla', 'Anguilla', 'CONCACAF', 5],
	['ABW', 'Aruba', 'Aruba', 'CONCACAF', 5],
	['VGB', 'British Virgin Islands', 'Britanische Jungferninseln', 'CONCACAF', 5],
	['USV', 'United States Virgin Islands', 'Amerikanische Jungferninseln', 'CONCACAF', 5],
	// AFC (47)
	['JPN', 'Japan', 'Japan', 'AFC', 2],
	['KOR', 'South Korea', 'Südkorea', 'AFC', 2],
	['IRN', 'Iran', 'Iran', 'AFC', 2],
	['AUS', 'Australia', 'Australien', 'AFC', 2],
	['SAU', 'Saudi Arabia', 'Saudi-Arabien', 'AFC', 3],
	['UAE', 'United Arab Emirates', 'Vereinigte Arabische Emirate', 'AFC', 3],
	['QAT', 'Qatar', 'Katar', 'AFC', 3],
	['IRQ', 'Iraq', 'Irak', 'AFC', 3],
	['OMN', 'Oman', 'Oman', 'AFC', 4],
	['JOR', 'Jordan', 'Jordanien', 'AFC', 4],
	['UZB', 'Uzbekistan', 'Usbekistan', 'AFC', 4],
	['KAZ', 'Kazakhstan', 'Kasachstan', 'AFC', 4],
	['SYR', 'Syria', 'Syrien', 'AFC', 4],
	['KGZ', 'Kyrgyzstan', 'Kirgisistan', 'AFC', 5],
	['TJK', 'Tajikistan', 'Tadschikistan', 'AFC', 5],
	['PRK', 'North Korea', 'Nordkorea', 'AFC', 5],
	['BHR', 'Bahrain', 'Bahrain', 'AFC', 5],
	['PLE', 'Palestine', 'Palästina', 'AFC', 5],
	['IDN', 'Indonesia', 'Indonesien', 'AFC', 5],
	['THA', 'Thailand', 'Thailand', 'AFC', 4],
	['VIE', 'Vietnam', 'Vietnam', 'AFC', 4],
	['MYS', 'Malaysia', 'Malaysia', 'AFC', 5],
	['PHI', 'Philippines', 'Philippinen', 'AFC', 5],
	['IND', 'India', 'Indien', 'AFC', 5],
	['CHN', 'China', 'China', 'AFC', 4],
	['TPE', 'Chinese Taipei', 'Chinesisch Taipeh', 'AFC', 5],
	['MYA', 'Myanmar', 'Myanmar', 'AFC', 5],
	['SIN', 'Singapore', 'Singapur', 'AFC', 5],
	['BAN', 'Bangladesh', 'Bangladesch', 'AFC', 5],
	['NEP', 'Nepal', 'Nepal', 'AFC', 5],
	['BRN', 'Brunei', 'Brunei', 'AFC', 5],
	['CAM', 'Cambodia', 'Kambodscha', 'AFC', 5],
	['LAO', 'Laos', 'Laos', 'AFC', 5],
	['MDV', 'Maldives', 'Malediven', 'AFC', 5],
	['MNG', 'Mongolia', 'Mongolei', 'AFC', 5],
	['PAK', 'Pakistan', 'Pakistan', 'AFC', 5],
	['KUW', 'Kuwait', 'Kuwait', 'AFC', 5],
	['BHU', 'Bhutan', 'Bhutan', 'AFC', 5],
	['TLS', 'Timor-Leste', 'Osttimor', 'AFC', 5],
	['AFG', 'Afghanistan', 'Afghanistan', 'AFC', 5],
	['LIB', 'Lebanon', 'Libanon', 'AFC', 5],
	['GUM', 'Guam', 'Guam', 'AFC', 5],
	['TKM', 'Turkmenistan', 'Turkmenistan', 'AFC', 5],
	['YEM', 'Yemen', 'Jemen', 'AFC', 5],
	// CAF (54)
	['EGY', 'Egypt', 'Ägypten', 'CAF', 2],
	['MAR', 'Morocco', 'Marokko', 'CAF', 1],
	['SEN', 'Senegal', 'Senegal', 'CAF', 2],
	['NGA', 'Nigeria', 'Nigeria', 'CAF', 2],
	['CMR', 'Cameroon', 'Kamerun', 'CAF', 3],
	['GHA', 'Ghana', 'Ghana', 'CAF', 3],
	['ALG', 'Algeria', 'Algerien', 'CAF', 3],
	['TUN', 'Tunisia', 'Tunesien', 'CAF', 3],
	['CIV', "Côte d'Ivoire", 'Elfenbeinküste', 'CAF', 3],
	['COD', 'DR Congo', 'DR Kongo', 'CAF', 4],
	['ZAM', 'Zambia', 'Sambia', 'CAF', 4],
	['BFA', 'Burkina Faso', 'Burkina Faso', 'CAF', 4],
	['GUI', 'Guinea', 'Guinea', 'CAF', 4],
	['MALI', 'Mali', 'Mali', 'CAF', 4],
	['RWA', 'Rwanda', 'Ruanda', 'CAF', 4],
	['TAN', 'Tanzania', 'Tansania', 'CAF', 4],
	['UGA', 'Uganda', 'Uganda', 'CAF', 5],
	['ZIM', 'Zimbabwe', 'Simbabwe', 'CAF', 5],
	['MOZ', 'Mozambique', 'Mosambik', 'CAF', 5],
	['MDG', 'Madagascar', 'Madagaskar', 'CAF', 5],
	['BEN', 'Benin', 'Benin', 'CAF', 5],
	['TGO', 'Togo', 'Togo', 'CAF', 5],
	['NER', 'Niger', 'Niger', 'CAF', 5],
	['DJI', 'Djibouti', 'Dschibuti', 'CAF', 5],
	['SOM', 'Somalia', 'Somalia', 'CAF', 5],
	['ERI', 'Eritrea', 'Eritrea', 'CAF', 5],
	['SUD', 'Sudan', 'Sudan', 'CAF', 5],
	['SSD', 'South Sudan', 'Südsudan', 'CAF', 5],
	['CHA', 'Chad', 'Tschad', 'CAF', 5],
	['GNB', 'Guinea-Bissau', 'Guinea-Bissau', 'CAF', 5],
	['LBA', 'Libya', 'Libyen', 'CAF', 5],
	['MAW', 'Mauritania', 'Mauretanien', 'CAF', 5],
	['MWI', 'Malawi', 'Malawi', 'CAF', 5],
	['NAM', 'Namibia', 'Namibia', 'CAF', 5],
	['SEY', 'Seychelles', 'Seychellen', 'CAF', 5],
	['SWZ', 'Eswatini', 'Swasiland', 'CAF', 5],
	['COM', 'Comoros', 'Komoren', 'CAF', 5],
	['CAP', 'Cape Verde', 'Kap Verde', 'CAF', 5],
	['GAM', 'Gambia', 'Gambia', 'CAF', 5],
	['KEN', 'Kenya', 'Kenia', 'CAF', 5],
	['ANG', 'Angola', 'Angola', 'CAF', 5],
	['BOT', 'Botswana', 'Botswana', 'CAF', 5],
	['LES', 'Lesotho', 'Lesotho', 'CAF', 5],
	['SLE', 'Sierra Leone', 'Sierra Leone', 'CAF', 5],
	['BDI', 'Burundi', 'Burundi', 'CAF', 5],
	['CAF', 'Central African Republic', 'Zentralafrikanische Republik', 'CAF', 5],
	['COG', 'Congo', 'Kongo', 'CAF', 5],
	['GNQ', 'Equatorial Guinea', 'Äquatorialguinea', 'CAF', 5],
	['ETH', 'Ethiopia', 'Äthiopien', 'CAF', 4],
	['GAB', 'Gabon', 'Gabun', 'CAF', 4],
	['MRI', 'Mauritius', 'Mauritius', 'CAF', 5],
	['RSA', 'South Africa', 'Südafrika', 'CAF', 3],
	// OFC (11)
	['NZL', 'New Zealand', 'Neuseeland', 'OFC', 4],
	['FJI', 'Fiji', 'Fidschi', 'OFC', 5],
	['TAS', 'Tahiti', 'Tahiti', 'OFC', 5],
	['SOL', 'Solomon Islands', 'Salomonen', 'OFC', 5],
	['VAN', 'Vanuatu', 'Vanuatu', 'OFC', 5],
	['SAM', 'Samoa', 'Samoa', 'OFC', 5],
	['PNG', 'Papua New Guinea', 'Papua-Neuguinea', 'OFC', 5],
	['NCL', 'New Caledonia', 'Neukaledonien', 'OFC', 5],
	['KIR', 'Kiribati', 'Kiribati', 'OFC', 5],
	['ASA', 'American Samoa', 'Amerikanisch-Samoa', 'OFC', 5],
	['COK', 'Cook Islands', 'Cookinseln', 'OFC', 5],
	['TGA', 'Tonga', 'Tonga', 'OFC', 5],
];

const TIER_ELO = {
	1: [2050, 2200],
	2: [1850, 2050],
	3: [1650, 1850],
	4: [1450, 1650],
	5: [1250, 1450],
};

const NATION_COLORS = [
	'#1d4ed8', '#dc2626', '#16a34a', '#f59e0b', '#7c3aed',
	'#0891b2', '#db2777', '#4b5563', '#ea580c', '#0d9488',
];

// Deduplicate by code (a few entries above are placeholders to reach 211).
const seenCodes = new Set();
const nations = [];
for (const [code, nameEn, nameDe, conf, tier] of NATIONS) {
	if (seenCodes.has(code)) continue;
	seenCodes.add(code);
	const [lo, hi] = TIER_ELO[tier];
	const elo = Math.round(lo + rng() * (hi - lo));
	nations.push({
		id: code.toLowerCase(),
		code,
		name: { en: nameEn, de: nameDe },
		elo,
		confederation: conf,
		pot: tier,
		color: NATION_COLORS[Math.floor(rng() * NATION_COLORS.length)],
	});
}

// Top-N pot refinement: pot 1 = top 56 by Elo, etc. (4 pots of ~53).
nations.sort((a, b) => b.elo - a.elo);
nations.forEach((n, i) => {
	n.pot = Math.min(4, Math.floor(i / 53) + 1);
});

const nationsJson = {
	snapshot: 'as of 2026-10',
	source: 'FIFA member associations; Elo values are deterministic synthetic tiers (see docs/data-provenance.md)',
	count: nations.length,
	nations,
};

// ---------------------------------------------------------------------------
// Clubs — 5 leagues × 20 clubs (real club names, synthetic Elo).
// ---------------------------------------------------------------------------
const LEAGUES = {
	bundesliga: [
		'Bayern München', 'Borussia Dortmund', 'Bayer Leverkusen', 'RB Leipzig',
		'VfB Stuttgart', 'Eintracht Frankfurt', 'VfL Wolfsburg', 'SC Freiburg',
		'Borussia Mönchengladbach', 'FC Augsburg', 'Werder Bremen', 'Mainz 05',
		'Hoffenheim', 'FC Köln', '1. FC Union Berlin', '1. FSV Mainz 05',
		'VfL Bochum', 'FC St. Pauli', 'Hamburger SV', '1. FC Heidenheim',
	],
	premier_league: [
		'Manchester City', 'Arsenal', 'Liverpool', 'Chelsea',
		'Tottenham Hotspur', 'Manchester United', 'Newcastle United', 'Aston Villa',
		'Brighton & Hove Albion', 'West Ham United', 'Crystal Palace', 'Everton',
		'Fulham', 'Brentford', 'Nottingham Forest', 'Wolverhampton Wanderers',
		'Bournemouth', 'Burnley', 'Leicester City', 'Southampton',
	],
	la_liga: [
		'Real Madrid', 'FC Barcelona', 'Atlético Madrid', 'Athletic Club',
		'Real Sociedad', 'Villarreal', 'Real Betis', 'Sevilla',
		'Girona', 'Celta Vigo', 'Osasuna', 'Rayo Vallecano',
		'Getafe', 'Mallorca', 'Valencia', 'Espanyol',
		'Alavés', 'Leganés', 'Gimnàstic', 'Las Palmas',
	],
	serie_a: [
		'Inter', 'Milan', 'Juventus', 'Napoli',
		'Atalanta', 'Roma', 'Lazio', 'Fiorentina',
		'Bologna', 'Torino', 'Udinese', 'Genoa',
		'Cagliari', 'Lecce', 'Empoli', 'Como',
		'Parma', 'Venezia', 'Monza', 'Verona',
	],
	ligue_1: [
		'Paris Saint-Germain', 'Monaco', 'Marseille', 'Lille',
		'Lyon', 'Nice', 'Lens', 'Rennes',
		'Strasbourg', 'Toulouse', 'Brest', 'Reims',
		'Nantes', 'Montpellier', 'Auxerre', 'Angers',
		'Saint-Étienne', 'Le Havre', 'Bordeaux', 'Metz',
	],
};

const clubs = [];
let clubN = 0;
for (const [league, names] of Object.entries(LEAGUES)) {
	names.forEach((name, i) => {
		clubN += 1;
		const elo = Math.round(1500 + (20 - i) * 25 + rng() * 40);
		clubs.push({
			id: `club-${String(clubN).padStart(3, '0')}`,
			name,
			league,
			elo,
			color: NATION_COLORS[clubN % NATION_COLORS.length],
		});
	});
}

const clubsJson = {
	snapshot: 'as of 2026-10',
	source: 'Real club names from 5 top leagues; Elo values are deterministic synthetic tiers (see docs/data-provenance.md)',
	count: clubs.length,
	clubs,
};

// ---------------------------------------------------------------------------
// Players — ~1,000 synthetic players across top nations × WC years.
// Names are composites from per-nation pools — NOT real persons.
// ---------------------------------------------------------------------------
const WC_YEARS = [1998, 2002, 2006, 2010, 2014, 2018, 2022];

const NAME_POOLS = {
	GER: { first: ['Lukas', 'Jonas', 'Felix', 'Maximilian', 'Leon', 'Paul', 'Niklas', 'Tim', 'Jan', 'Moritz'], last: ['Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Wagner', 'Becker', 'Hoffmann', 'Koch', 'Bauer'] },
	BRA: { first: ['Lucas', 'Gabriel', 'Matheus', 'Rafael', 'Bruno', 'Thiago', 'Diego', 'Felipe', 'Caio', 'Pedro'], last: ['Silva', 'Santos', 'Oliveira', 'Souza', 'Lima', 'Pereira', 'Costa', 'Almeida', 'Ferreira', 'Rocha'] },
	ARG: { first: ['Julián', 'Mateo', 'Santiago', 'Thiago', 'Nicolás', 'Facundo', 'Agustín', 'Tomás', 'Emiliano', 'Lautaro'], last: ['González', 'Rodríguez', 'Fernández', 'López', 'Martínez', 'Sánchez', 'Pérez', 'Romero', 'Torres', 'Vargas'] },
	FRA: { first: ['Hugo', 'Lucas', 'Antoine', 'Kylian', 'Ousmane', 'Aurélien', 'Adrien', 'Théo', 'Jules', 'Eduardo'], last: ['Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit', 'Moreau', 'Laurent', 'Girard'] },
	ESP: { first: ['Pablo', 'Sergio', 'Álvaro', 'Marco', 'Iker', 'Dani', 'Rodri', 'Mikel', 'Aitor', 'Unai'], last: ['García', 'González', 'Rodríguez', 'López', 'Martínez', 'Hernández', 'Pérez', 'Sánchez', 'Ramírez', 'Torres'] },
	ENG: { first: ['Harry', 'Jack', 'Marcus', 'Jude', 'Bukayo', 'Phil', 'Declan', 'Cole', 'Reece', 'Conor'], last: ['Smith', 'Jones', 'Taylor', 'Brown', 'Wilson', 'Johnson', 'Walker', 'Wright', 'Clarke', 'Hughes'] },
	ITA: { first: ['Lorenzo', 'Matteo', 'Federico', 'Niccolò', 'Davide', 'Alessandro', 'Marco', 'Andrea', 'Gianluca', 'Stefano'], last: ['Rossi', 'Russo', 'Ferrari', 'Esposito', 'Bianchi', 'Romano', 'Colombo', 'Ricci', 'Marino', 'Greco'] },
	POR: { first: ['João', 'Rúben', 'Diogo', 'Bruno', 'Gonçalo', 'Rafael', 'Pedro', 'Nuno', 'Tiago', 'André'], last: ['Silva', 'Santos', 'Ferreira', 'Pereira', 'Costa', 'Martins', 'Sousa', 'Oliveira', 'Carvalho', 'Ribeiro'] },
	NED: { first: ['Cody', 'Virgil', 'Frenkie', 'Memphis', 'Davy', 'Luk de', 'Steven', 'Quincy', 'Donyell', 'Jeremie'], last: ['de Jong', 'van Dijk', 'de Vries', 'Jansen', 'Bakker', 'Visser', 'Smit', 'Meijer', 'Bos', 'de Boer'] },
	URU: { first: ['Darwin', 'Fede', 'Mathías', 'Nicolás', 'Facundo', 'Aguirre', 'Valentín', 'Sebastián', 'Matías', 'Gastón'], last: ['Silva', 'González', 'Pereira', 'Rodríguez', 'Fernández', 'Santos', 'Díaz', 'Herrera', 'Molina', 'Cardoso'] },
	COL: { first: ['Jhon', 'Dávinson', 'Luis', 'Jaramillo', 'Santiago', 'Richard', 'Jhonny', 'Cristian', 'Mauricio', 'Yerfson'], last: ['Rodríguez', 'Hernández', 'López', 'González', 'Martínez', 'Torres', 'Ramírez', 'Ortiz', 'Gómez', 'Flores'] },
	MEX: { first: ['Hirving', 'Edson', 'Alexis', 'Guillermo', 'César', 'Orbelín', 'Luis', 'Julián', 'Eduardo', 'Iker'], last: ['Hernández', 'García', 'López', 'Martínez', 'Rodríguez', 'Sánchez', 'Torres', 'Ramírez', 'Flores', 'Cruz'] },
	JPN: { first: ['Kaoru', 'Takefusa', 'Daichi', 'Ritsu', 'Ao', 'Wataru', 'Junya', 'Sota', 'Reo', 'Mao'], last: ['Mitoma', 'Kubo', 'Endo', 'Dōan', 'Tanaka', 'Endo', 'Kobayashi', 'Suzuki', 'Watanabe', 'Yamamoto'] },
	KOR: { first: ['Son', 'Hwang', 'Lee', 'Jae', 'Min', 'Woo', 'Seung', 'Jin', 'Hyun', 'Dae'], last: ['Heung-min', 'In-beom', 'Kang-in', 'Sung-ho', 'Gyu', 'Jae', 'Ho', 'Woo', 'Jun', 'Hyuk'] },
	GER2: null,
};

// Fallback generic pool for nations without a specific pool.
const GENERIC = { first: ['Adam', 'Ben', 'Chris', 'David', 'Erik', 'Finn', 'Gustav', 'Henrik', 'Ivan', 'Jon'], last: ['Anderson', 'Baker', 'Carter', 'Dawson', 'Ellis', 'Foster', 'Grant', 'Hart', 'Iversen', 'Jensen'] };

// 40 top nations × 7 WC years × ~4 players ≈ 1,120 → trim to ~1,000.
const PLAYER_NATIONS = [
	'GER', 'BRA', 'ARG', 'FRA', 'ESP', 'ENG', 'ITA', 'POR', 'NED', 'URU',
	'COL', 'MEX', 'JPN', 'KOR', 'MAR', 'SEN', 'EGY', 'NGA', 'GHA', 'CRO',
	'BEL', 'SUI', 'DEN', 'POL', 'TUR', 'AUT', 'SCO', 'NOR', 'SWE', 'CZE',
	'ROU', 'SRB', 'UKR', 'RUS', 'HUN', 'USA', 'CAN', 'AUS', 'IRN', 'SAU',
];

const POSITION_CYCLE = ['GK', 'DEF', 'DEF', 'MID', 'MID', 'FWD', 'FWD', 'DEF'];

const players = [];
let playerN = 0;
for (const code of PLAYER_NATIONS) {
	const pool = NAME_POOLS[code] ?? GENERIC;
	for (const wcYear of WC_YEARS) {
		const perYear = 4;
		for (let k = 0; k < perYear; k++) {
			playerN += 1;
			const first = pool.first[Math.floor(rng() * pool.first.length)];
			const last = pool.last[Math.floor(rng() * pool.last.length)];
			const position = POSITION_CYCLE[(playerN + k) % POSITION_CYCLE.length];
			// Rating: 62–92, slightly higher for later WC years (modern era).
			const yearBoost = (wcYear - 1998) / 24 * 6;
			const rating = Math.round(62 + rng() * 24 + yearBoost);
			players.push({
				id: `pl-${String(playerN).padStart(4, '0')}`,
				name: `${first} ${last}`,
				nation: code.toLowerCase(),
				wcYear,
				position,
				rating: Math.min(95, rating),
				// Formation eligibility by position.
				eligible:
					position === 'GK' ? ['GK'] :
					position === 'DEF' ? ['DEF', 'MID'] :
					position === 'MID' ? ['MID', 'FWD'] :
					['FWD'],
			});
		}
	}
}

const playersJson = {
	snapshot: 'as of 2026-10',
	source: 'Synthetic player names (composites from per-nation pools) — NOT real persons. See docs/data-provenance.md.',
	count: players.length,
	players,
};

// ---------------------------------------------------------------------------
// Write files
// ---------------------------------------------------------------------------
const out = (name, obj) => {
	const p = join(DATA_DIR, name);
	writeFileSync(p, JSON.stringify(obj, null, '\t') + '\n');
	console.log(`wrote ${p} (${obj.count} entries)`);
};

out('nations.json', nationsJson);
out('clubs.json', clubsJson);
out('players.json', playersJson);

console.log(
	`\nnations: ${nations.length} (target 211)\n` +
	`clubs: ${clubs.length} (target 100)\n` +
	`players: ${players.length} (target ~1000)`
);

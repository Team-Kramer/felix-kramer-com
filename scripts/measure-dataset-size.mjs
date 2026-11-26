#!/usr/bin/env node
/**
 * Measure browser-facing dataset tiers using the production JSON representation.
 * This deliberately measures bytes and JSON.parse cost instead of extrapolating
 * from record counts. Fixture data is synthetic and is never shipped.
 *
 * Usage: node --expose-gc scripts/measure-dataset-size.mjs
 */

import { brotliCompressSync, gzipSync } from 'node:zlib';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = join(SCRIPT_DIR, '..');
const REAL_DATASET = join(ROOT, 'data', 'bundesliga-2026-27-real', 'dataset.json');
const OUTPUT_DIR = join(ROOT, 'tmp', 'm8-size-measurement');
const GENERATOR = join(SCRIPT_DIR, 'generate-dataset-fixture.mjs');
const TRACKING_BYTES_PER_POINT = 40;
const PARSE_RUNS = 5;

function mib(bytes) { return `${(bytes / 1024 / 1024).toFixed(3)} MiB`; }
function round(value) { return Math.round(value * 100) / 100; }
function jsonBytes(text) { return Buffer.byteLength(text, 'utf8'); }
function collectGarbage() { if (typeof global.gc === 'function') global.gc(); }

function parseDataset(text) {
	collectGarbage();
	const before = process.memoryUsage().heapUsed;
	const started = performance.now();
	const value = JSON.parse(text);
	const elapsed = performance.now() - started;
	const after = process.memoryUsage().heapUsed;
	return { value, elapsed, heapDelta: Math.max(0, after - before) };
}

function measure(name, filePath, metadata = {}) {
	const compact = readFileSync(filePath, 'utf8');
	const parseSamples = [];
	const heapSamples = [];
	for (let run = 0; run < PARSE_RUNS; run += 1) {
		const parsed = parseDataset(compact);
		parseSamples.push(parsed.elapsed);
		heapSamples.push(parsed.heapDelta);
		void parsed.value;
		collectGarbage();
	}
	const gzip = gzipSync(compact, { level: 9 });
	const brotli = brotliCompressSync(compact);
	const parsed = JSON.parse(compact);
	const records = Object.fromEntries(Object.entries(parsed)
		.filter(([, value]) => Array.isArray(value))
		.map(([key, value]) => [key, value.length]));
	const trackingPoints = Array.isArray(parsed.tracking)
		? parsed.tracking.reduce((sum, item) => sum + (Number(item.pointCount) || 0), 0)
		: 0;
	return {
		name,
		file: relative(ROOT, filePath),
		records,
		sizes: {
			compactJson: mib(jsonBytes(compact)),
			prettyJson: null,
			gzip: mib(gzip.byteLength),
			brotli: mib(brotli.byteLength),
		},
		bytes: {
			compactJson: jsonBytes(compact),
			gzip: gzip.byteLength,
			brotli: brotli.byteLength,
		},
		parse: {
			runs: PARSE_RUNS,
			meanMs: round(parseSamples.reduce((sum, value) => sum + value, 0) / parseSamples.length),
			minMs: round(Math.min(...parseSamples)),
			heapDeltaMiB: round(Math.max(...heapSamples) / 1024 / 1024),
			heapMeasurement: typeof global.gc === 'function' ? 'Node heap delta with --expose-gc (browser proxy)' : 'Node heap delta without forced GC (browser proxy)',
		},
		tracking: {
			pointCount: trackingPoints,
			estimatedRawBytes: trackingPoints * TRACKING_BYTES_PER_POINT,
			estimatedRawSize: mib(trackingPoints * TRACKING_BYTES_PER_POINT),
			method: `${TRACKING_BYTES_PER_POINT} bytes/point estimate for JSONL coordinates/timestamp/metadata; no raw sidecar is generated`,
		},
		...metadata,
	};
}

function generateFixture(name, heatmaps) {
	const output = join(OUTPUT_DIR, name);
	mkdirSync(output, { recursive: true });
	if (!existsSync(join(output, 'dataset.json'))) {
		execFileSync(process.execPath, [GENERATOR,
			'--teams=18', '--playersPerTeam=28', '--seasons=3', '--matches=306',
			'--seed=m8-representative-scale', `--heatmaps=${heatmaps}`, `--output=${output}`,
		], { cwd: ROOT, stdio: 'ignore' });
	}
	return join(output, 'dataset.json');
}

mkdirSync(OUTPUT_DIR, { recursive: true });
const tiers = [
	measure('real-current-no-history', REAL_DATASET, { description: 'Committed Bundesliga 2026/27 dataset; current identities and team state, no history.' }),
	measure('fixture-history-aggregates', generateFixture('history-aggregates', 'none'), { description: 'Representative synthetic tier with 18 teams, 28 players/team, 3 seasons, 306 current-season matches plus prior-season history and aggregates.' }),
	measure('fixture-history-heatmap-aggregates', generateFixture('heatmap-aggregates', 'season'), { description: 'Same representative tier plus season heatmap aggregates.' }),
	measure('fixture-match-heatmaps', generateFixture('match-heatmaps', 'match'), { description: 'Same representative tier plus per-appearance match heatmaps.' }),
];

const report = {
	generatedAt: new Date().toISOString(),
	script: 'measure-dataset-size.mjs',
	method: {
		encoding: 'UTF-8 canonical compact JSON via JSON.stringify output',
		compression: 'gzip level 9 and Node Brotli defaults',
		parse: `JSON.parse in Node ${process.version}; ${typeof global.gc === 'function' ? '--expose-gc enabled' : '--expose-gc not enabled'}; ${PARSE_RUNS} runs per tier`,
		tracking: `Tracking sidecars are references only. Raw size is estimated at ${TRACKING_BYTES_PER_POINT} bytes per JSONL point from pointCount; sidecars are not generated by the fixture.`,
	},
	options: { teams: 18, playersPerTeam: 28, seasons: 3, matches: 306, heatmaps: ['none', 'season', 'match'] },
	trackingBytesPerPoint: TRACKING_BYTES_PER_POINT,
	tiers,
	// Keep the build script's top-level shape for consumers that only inspect sizes.
	sizes: tiers[0].sizes,
	records: tiers[0].records,
};
const reportPath = join(OUTPUT_DIR, 'size-report.json');
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);

console.log('Dataset size measurement (Node proxy for browser)');
console.log(`Tracking estimate: ${TRACKING_BYTES_PER_POINT} bytes/point JSONL; checksum/sidecar format is documented in docs/DATA_SIZE_DECISION.md`);
for (const tier of tiers) {
	console.log(`${tier.name}: ${tier.sizes.compactJson} compact | ${tier.sizes.gzip} gzip | ${tier.sizes.brotli} Brotli | parse ${tier.parse.meanMs} ms mean (heap +${tier.parse.heapDeltaMiB} MiB)`);
	if (tier.tracking.pointCount) console.log(`  tracking: ${tier.tracking.pointCount.toLocaleString()} points, ${tier.tracking.estimatedRawSize} raw estimate`);
}
console.log(`Report: ${relative(ROOT, reportPath)}`);

import { readFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';

const path = new URL('../data/bundesliga-2026-27-real/dataset.json', import.meta.url);
const raw = readFileSync(path, 'utf8');
if (globalThis.gc) globalThis.gc();
const heapBefore = process.memoryUsage().heapUsed;
const parseStart = performance.now();
const dataset = JSON.parse(raw);
const parseMs = performance.now() - parseStart;
const heapAfter = process.memoryUsage().heapUsed;

// Fixed-seed, rating-weighted league proxy: the same deterministic workload
// used to compare browser runtimes without requiring a Node-only engine path.
let state = 0x9e3779b9;
const random = () => {
  state ^= state << 13;
  state ^= state >>> 17;
  state ^= state << 5;
  return (state >>> 0) / 0x100000000;
};
const ratings = dataset.teams.slice(0, 18).map((team) => {
  const snapshot = dataset.teamSnapshots.find((item) => item.teamId === team.id && item.validTo === null) ?? dataset.teamSnapshots.find((item) => item.teamId === team.id);
  return snapshot?.rating.elo ?? 1500;
});
const simulationStart = performance.now();
const runs = 1000;
let checksum = 0;
for (let run = 0; run < runs; run += 1) {
  const table = ratings.map((rating, index) => ({ index, score: 0, rating }));
  for (let home = 0; home < table.length; home += 1) {
    for (let away = home + 1; away < table.length; away += 1) {
      const probability = 1 / (1 + 10 ** ((table[away].rating - table[home].rating) / 400));
      if (random() < probability) table[home].score += 3;
      else table[away].score += 3;
    }
  }
  checksum += table.sort((a, b) => b.score - a.score)[0].score;
}
const simulationMs = performance.now() - simulationStart;

console.log(JSON.stringify({
  dataset: path.pathname,
  bytes: Buffer.byteLength(raw),
  teams: ratings.length,
  runs,
  parseMs: Number(parseMs.toFixed(3)),
  heapDeltaMiB: Number(((heapAfter - heapBefore) / 1024 / 1024).toFixed(3)),
  simulationMs: Number(simulationMs.toFixed(3)),
  checksum,
}, null, 2));

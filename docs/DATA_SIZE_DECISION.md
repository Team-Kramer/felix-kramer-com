# Dataset size and distribution decision (M8)

Measured with `node --expose-gc scripts/measure-dataset-size.mjs` on Node v26.13.1. The fixture is deterministic synthetic data at 18 teams, 28 players/team, three seasons and 306 current-season matches; it is not shipped. JSON sizes are UTF-8 compact canonical JSON. Parse values are Node measurements and therefore a proxy for browser behavior.

| Tier | Compact JSON | gzip (level 9) | Brotli | JSON.parse mean | Max heap delta |
|---|---:|---:|---:|---:|---:|
| Real current state, no history | 0.381 MiB | 0.033 MiB | 0.022 MiB | 0.69 ms | 0.70 MiB |
| Synthetic history + aggregates | 15.928 MiB | 0.892 MiB | 0.579 MiB | 22.56 ms | 22.06 MiB |
| Synthetic history + season heatmap aggregates | 17.641 MiB | 1.279 MiB | 0.918 MiB | 24.58 ms | 24.48 MiB |
| Synthetic history + match heatmaps | 32.739 MiB | 4.389 MiB | 3.563 MiB | 52.39 ms | 45.28 MiB |

The fixture's tracking references describe 1,963,051,200 points at this scale. Raw tracking is measured separately as `pointCount × 40 bytes/point` (a documented JSONL coordinate/timestamp/metadata estimate): **78,522,048,000 bytes / 73.13 GiB**. The fixture does not generate that impractical sidecar; production sidecars must report their actual byte size and checksum.

## Decisions

### Single-file threshold and compression

The maximum acceptable **compact single-file browser import is 8 MiB**. This leaves headroom below a 32 MiB mobile heap allocation target for parsing, validation, and the running simulator. The real current dataset is only 0.381 MiB compact (0.033 MiB gzip, 0.022 MiB Brotli), so it is comfortably below the limit. The measured history tiers exceed 8 MiB uncompressed even though compressed packages are small.

A user-facing export remains **one JSON file at or below 8 MiB**: it is portable, stream-free, and matches the existing import/export API. A profile over 8 MiB uses a ZIP/package with the canonical JSON plus optional sidecars (and a manifest); this applies to historical or match-heatmap exports. Compression is a delivery optimization, not a reason to raise the parse threshold: browsers must parse the canonical JSON after decompression.

### Storage and IndexedDB

IndexedDB is required to persist the full dataset when it exceeds the existing `LOCAL_STORAGE_SIZE_LIMIT` of 2 MiB. `storage.ts` first uses localStorage for smaller serialized datasets, then uses `idb.ts` for larger values and clears the stale local copy. If IndexedDB is unavailable, the existing fallback attempts localStorage and must surface a `DatasetStorageError` when the browser cannot store the value; the UI should show an error state rather than silently dropping the import. IndexedDB is not required merely to import the 0.381 MiB real file in memory.

### Browser profiles

The exact definitions are those implemented by `projectDataset()` in `src/lib/engine/dataset/export.ts`:

- **`simulation` (public default):** current teams, competitions/seasons/participations, players, memberships, team/player snapshots (without source refs, weaknesses, or traits), and tactical profiles. It excludes matches, appearances, events, heatmaps, tracking, and chemistry.
- **`historical` (offline/shareable):** the simulation entities plus chemistry, heatmaps, tracking references, matches, match appearances, and events. Source refs are removed from projected snapshots/chemistry, but the history and spatial records remain.

Thus the public game does not pay for raw tracking or unnecessary match history. The current real data has no history/heatmaps/tracking, and its measured size is already far below the threshold.

### Sidecar integrity metadata

Every tracking or heatmap sidecar is accompanied by a manifest entry containing `path`, `format` (`jsonl` for tracking or canonical JSON for heatmaps), `byteSize`, `sha256`, and `compression` (`gzip`, `br`, or `none`). The entry also identifies the dataset/profile version and the referenced record/range. Import verifies byte size and SHA-256 after decompression before exposing a sidecar to the simulator; a mismatch rejects that sidecar and reports an integrity error.

### Fallbacks and budgets

- `<= 8 MiB` compact: single JSON import/export is allowed.
- `> 8 MiB` compact: require ZIP/package delivery; keep raw tracking out of `simulation`.
- `> 2 MiB` persistence: prefer IndexedDB through `storage.ts`/`idb.ts`.
- No usable storage: show the existing storage error state; do not claim persistence.
- **Mobile target:** keep parsed live data and simulator working set under 32 MiB heap delta. The real dataset is 0.70 MiB in the Node proxy and fits; the synthetic history tier is 22.06 MiB and fits the parse budget, while match heatmaps at 45.28 MiB do not and therefore require the historical/package path. Real-device measurement remains tracked under M3.5.

The Node parse benchmark is not an on-device or production-build measurement. UI-thread IndexedDB latency and worker transfer/copy behavior are also deferred to M3.5/runtime validation; the selected simulation profile is intentionally the small, worker-safe path.

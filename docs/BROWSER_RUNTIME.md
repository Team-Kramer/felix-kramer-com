# Browser-only runtime (M3.5)

## Profile loading

The store retains the validated internal-complete dataset. Routes project a
separate immutable working set before passing data to the engine:

| Mode | Working profile |
| --- | --- |
| match | `simulation-compact` |
| league, tournament, bracket | `simulation` |
| draft | `detailed` |
| editor | `internal-complete` |

`simulation-compact` is schema-valid and removes player attribute snapshots and
tactical profiles in addition to the history/spatial data excluded by
`simulation`. Projection is deep-copied and never mutates the stored dataset.

## Measurements

Measured with `node --expose-gc scripts/measure-runtime.mjs` against the committed
`data/bundesliga-2026-27-real/dataset.json` (399,850 bytes, 18 teams, 1,000
fixed-seed runs):

| Measurement | Node result |
| --- | ---: |
| JSON parse | 0.697 ms |
| Heap delta after parse | 0.696 MiB |
| Fixed-seed simulation | 6.456 ms |

These are Node measurements, not browser measurements. **Manual — to be run on
real devices:** on desktop and a low-memory mobile browser, use DevTools
Performance and Memory to record load/parse, heap growth after import, and a
1,000-run worker simulation. Repeat with Lighthouse's mobile profile and record
CPU throttling, long tasks, and peak heap. Do not treat the Node numbers as
mobile results.

## Offline verification

The runtime audit found no `fetch(`, `XMLHttpRequest`, `new WebSocket`, remote
dynamic import, or hardcoded API base URL in `src/` (the only `import(` match is
a type-only path used for a local profile type). SvelteKit uses
`@sveltejs/adapter-static`; data, engine code, and routes are bundled locally.

**Manual — to be run after a normal cached load:**

1. Open DevTools → Network and enable **Offline**.
2. Reload the page.
3. Smoke-test `/match`, `/league`, `/tournament`, `/bracket`, and `/draft`.
4. Open `/editor`, inspect/modify a dataset, and verify local import/export.
5. Run a worker simulation and reload to verify the persisted dataset remains
   available without network access.

## Service worker / PWA decision

**Defer a service worker/PWA layer.** The site is small, fully static, and has
no dynamic server content; adding a worker now would introduce cache
invalidation and deployment complexity without a meaningful benefit beyond
normal static-asset caching. Revisit if the asset or offline-cache requirements
grow.

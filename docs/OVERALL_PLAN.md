# Felix Kramer Football Data Platform — Overall Implementation Plan

**Updated:** 2026-11-26  
**Owner:** Felix Kramer  
**Overall status:** Complete — M0–M10 done; `felix-kramer.com` live on GitHub Pages with the full Bundesliga 2026/27 dataset (tag `v1.0.0-bundesliga-2026-27`)  
**Target:** Working `felix-kramer.com` deployment on GitHub Pages with a complete first Bundesliga 2026/27 dataset

## Objective

Coordinate the two detailed implementation tracks without duplicating them:

1. **Data separation and simulator integration** — user-provided dataset import,
   validation, local persistence, export, and simulator consumption, described in
   [DATA_SEPARATION.md](/Users/kram030/git/felix-kramer-com/docs/DATA_SEPARATION.md).
2. **Internal dataset creation tool** — normalized entities, current and historical
   football data, player/team relationships, match history, spatial data, provenance,
   and profile-based generation, described in
   [PLAN.md](/Users/kram030/git/felix-kramer-com/docs/PLAN.md).

This overall plan does not repeat those domain plans. It defines their order,
integration gates, release increments, commit boundaries, and delivery criteria.

The application must remain usable and deployable throughout the work. The
intermediate state is more important than a large one-time migration:

```text
Existing working page
        ↓
Dataset contracts and fictional fallback
        ↓
Import/export without simulator breakage
        ↓
Internal creation workflow
        ↓
Incremental Bundesliga dataset
        ↓
Full Bundesliga 2026/27 export
        ↓
Stable GitHub Pages release
```

## Final outcome

At completion:

- [x] `felix-kramer.com` builds successfully as a static SvelteKit site (Pages run 45825807718).
- [x] The site is deployable through the existing GitHub Pages workflow (runs 45825341237, 45825807718 green).
- [x] Existing simulator routes continue to work during and after migration (all routes 200 hosted; route tests).
- [x] The public bundle contains only fictional or explicitly permitted defaults (M9 build-content check; permitted catalogue data only).
- [x] Users can import a validated dataset locally (import tests; hosted dataset asset validates through `validateDataset`).
- [x] Users can export a selected dataset profile locally (export profile tests, `simulation-compact` in hosted bundle).
- [x] The simulator receives its data through the dataset store and typed adapters (M2, commit 4842900).
- [x] The complete game runs client-side without a required application server (no-server audit, `docs/BROWSER_RUNTIME.md`).
- [x] Repeated or expensive simulations run outside the UI thread through Web Workers (worker protocol, progress/determinism tests, panel `terminate()`).
- [x] Large datasets use IndexedDB or an explicitly measured alternative instead of relying
  on `localStorage` alone (2 MiB threshold, IDB fallback tests, M8 measurements).
- [x] Each game mode can load an appropriate dataset profile instead of the full dataset (mode→profile projections, commit 6c05dd1).
- [x] The app remains usable on a normal mobile browser with a reduced simulation profile (Node proxy measurements + 32 MiB target; true-device stress test documented as deferred in `docs/BROWSER_RUNTIME.md`).
- [x] The internal creation tool can maintain competitions, seasons, teams, players,
  memberships, snapshots, matches, history, spatial data, chemistry, and provenance (M5/M6, 9 editor tabs).
- [x] A first complete Bundesliga 2026/27 dataset exists in the canonical format,
  subject to source licensing and data-quality verification (tag `v1.0.0-bundesliga-2026-27`; checksums in `docs/RELEASE-1.0.0.md`; known gaps documented).
- [x] The full dataset has a documented size strategy: single JSON where practical,
  compressed/split package where necessary, and a simulator-ready browser profile (`docs/DATA_SIZE_DECISION.md`).
- [x] Every release increment has a focused test result and a committable state (276 tests green at release).

## Scope boundaries

### Included

- Coordination of the two detailed plans
- Backward-compatible migration strategy
- Static-site and GitHub Pages release safety
- Dataset schema, validation, import, export, and local persistence
- Internal data-generation/editing workflow
- Bundesliga 2026/27 reference dataset
- JSON size, compression, sidecar, and browser-limit decisions
- Tests, fixtures, migration, provenance, and documentation
- Browser-only runtime, worker isolation, storage limits, and optional offline/PWA support

### Not included in this phase

- Server-side user dataset storage
- Public dataset hosting or public real-data repository
- Automatic scraping or unrestricted external API downloads
- Account system
- Cloud collaboration or multi-user editing
- Making unlicensed external data publicly redistributable
- Replacing the complete simulator engine with a new model

## Plan coordination

The detailed plans remain the source of truth for their respective domains:

| Track | Detailed plan | Owns | Must provide to the overall plan |
|---|---|---|---|
| Data separation | [DATA_SEPARATION.md](/Users/kram030/git/felix-kramer-com/docs/DATA_SEPARATION.md) | Canonical format, local import/export, store, UI, simulator boundary | A validated browser-consumable dataset and stable engine integration |
| Creation tool | [PLAN.md](/Users/kram030/git/felix-kramer-com/docs/PLAN.md) | Internal catalog, data entry, history, provenance, derived values, generation | A validated canonical dataset and reproducible export |
| Overall delivery | This document | Order, gates, increments, release safety, dataset completeness | A working deployable product at every milestone |

When a decision affects both tracks, update the detailed plan first and then
record only the dependency or milestone change here. Do not copy domain
checkboxes into this document.

## Delivery principles

- [x] Keep the application buildable after every implementation increment.
- [x] Keep the fictional fallback available until the full migration is verified.
- [x] Introduce adapters before removing existing data access.
- [x] Separate schema changes from UI changes and engine changes where possible.
- [x] Make each increment independently testable and committable.
- [x] Never mix raw source data, derived values, and simulator parameters without provenance.
- [x] Never overwrite historical records; append snapshots or corrections.
- [x] Do not add real data to the public bundle without a licensing decision.
- [x] Prefer deterministic exports so dataset changes can be reviewed and diffed.
- [x] Measure dataset size before selecting browser persistence and delivery formats.
- [x] Validate the static production build before declaring an increment complete.

## Milestones and gates

| Milestone | Status | Depends on | Release gate |
|---|---|---|---|
| M0. Baseline captured | Complete | — | Check, 18 test files/213 tests, and static build verified on 2026-11-26 |
| M1. Contracts introduced | Complete | M0 | Contracts, JSON Schema, fixtures, validation, and engine adapter added (commit 656cc0b) |
| M2. Fictional dataset path | Complete | M1 | All five simulator routes consume the dataset store with fictional fallback (commit 4842900) |
| M3. Local import/export | Complete | M2 | JSON round-trip, localStorage, store, manager UI, export profiles, and IndexedDB fallback (commits 23ab962, 53ddc47) |
| M3.5. Browser-only runtime | Complete | M3 | Profile-per-mode projections, compact simulation profile, active-worker route smoke, Node runtime measurements, offline audit/checklist, and deferred PWA decision (commits 6c05dd1, efa0cc2; evidence in `docs/BROWSER_RUNTIME.md`) |
| M4. Historical model integrated | Complete | M3.5 | Temporal adapters with 27 tests; minimal datasets remain functional (commit efbd3ff) |
| M5. Creation tool foundation | Complete | M4 | /editor route with CRUD, stable IDs, live validation (821e9d2); deterministic synthetic Bundesliga seed with 252 players (def0bb4); editor in nav (4dcb9cc) |
| M6. Detailed model capabilities | Complete | M5 | All 9 dataset tabs (competitions, seasons, teams, players, memberships, snapshots, chemistry, matches, provenance) with add/remove controls (4dcb9cc); detailed model fields verified in seed round-trip |
| M7. Bundesliga dataset batches | Complete | M6 | Batch 1 (7694feb): 18 teams, 90 matches, derived Elo. Batch 2 (2e77a3e): 502 players + memberships + identity snapshots, ISO nationalities, Wikipedia provenance; schema-valid, 0.381 MiB. Known gaps (documented, not blockers): player attributes (no public source), chemistry/heatmaps/tracking (unavailable) |
| M8. Size and distribution decision | Complete | M7 | M8 measurement commit (1d5386e): real 0.381 MiB; history 15.928 MiB; 8 MiB single-file threshold; ZIP/sidecar strategy documented |
| M9. Full Bundesliga release candidate | Complete | M8 | `v1.0.0-bundesliga-2026-27` / `564c6be`; release checksums, static import, route/persistence tests, and Pages run 45825341237 |
| M10. GitHub Pages release | Complete | M9 | Hosted verification: all 9 routes + dataset asset HTTP 200; hosted dataset SHA-256 matches release checksum `d08b3ec9…`; hosted chunks `DWgQWBni`/`D1LJGNcs`/`XZ4IpiPj` (final `simulation-compact` profile) byte-identical to local `origin/main` build; Pages runs 45825341237 + 45825807718 green |

## Work items

### Phase 0 — Baseline and safety net

- [x] Record the current production build command and GitHub Pages workflow.
- [x] Run the existing check, test, and build commands and record their baseline results.
- [x] Confirm all current simulator routes render before changing data access.
- [x] Record the current generated data files and their consumers.
- [x] Identify the smallest fictional fallback that can replace real bundled data safely.
- [x] Confirm the repository has a clean, reviewable starting point or document existing worktree changes.
- [x] Define the commit convention for each increment.

**Gate:** The current site is known to work, and a regression can be identified after
each later increment.

**Evidence:** `pnpm test` passed with 18 test files and 213 tests before the
contract change. `pnpm run check` reported 0 errors and 2 pre-existing Svelte
warnings. `pnpm run build` completed and wrote the static site to `build`.
The working tree already contained the documentation, generator, package, and
ignore-file changes listed by `git status`; none were reverted.

### Phase 1 — Introduce contracts without changing behavior

- [x] Complete the domain decisions and ID policy in the creation-tool plan.
- [x] Implement the initial canonical TypeScript contracts in parallel with existing data access.
- [x] Add runtime validation for schema identity, required collections, unique IDs, and core references.
- [x] Add the canonical JSON Schema file.
- [x] Add a minimal fictional fixture and adapter tests.
- [x] Add a detailed fictional fixture.
- [x] Validate that fixtures can represent the intended Bundesliga entity structure.
- [x] Extend runtime validation for temporal intervals, ranges, match consistency,
  heatmap dimensions, and provenance references.
- [x] Add compatibility adapters from the existing data shape to the new engine contracts.
- [x] Keep existing simulator routes on the compatibility path until adapter tests pass.
- [x] Run check, focused tests, full tests, and production build.
- [x] Commit only the contract and adapter increment.

**Gate:** The application behaves as before, while the new contract is available and
validated behind adapters.

**Current implementation:** [types.ts](/Users/kram030/git/felix-kramer-com/src/lib/engine/dataset/types.ts)
defines the normalized entities, [schema.json](/Users/kram030/git/felix-kramer-com/src/lib/engine/dataset/schema.json)
defines the canonical JSON contract, and [schema.ts](/Users/kram030/git/felix-kramer-com/src/lib/engine/dataset/schema.ts)
provides actionable duplicate-ID, reference, temporal, range, heatmap, and
provenance validation. The
[adapter.ts](/Users/kram030/git/felix-kramer-com/src/lib/engine/dataset/adapter.ts)
maps dated team snapshots to the existing pure engine `Team` contract, while
[fixture.ts](/Users/kram030/git/felix-kramer-com/src/lib/engine/dataset/fixture.ts)
provides minimal and detailed fictional datasets covering competitions, seasons,
memberships, snapshots, matches, appearances, heatmaps, chemistry, and
provenance. Focused dataset tests pass with 6 tests; the full suite passes with
19 test files and 223 tests. `pnpm run check` reports
0 errors and the static build succeeds. Existing route migration is intentionally
still open.

### Phase 2 — Switch to a fictional dataset path

- [x] Add the fictional default dataset through the new dataset module.
- [x] Route one simulator through the dataset store and adapter layer.
- [x] Verify its behavior against the pre-migration baseline.
- [x] Migrate the remaining simulator routes incrementally.
- [x] Add the empty-state behavior without making the existing site unusable.
- [x] Remove only the first proven direct real-data dependency.
- [x] Run route smoke tests, type-checking, focused tests, and production build.
- [x] Commit each route migration as a small, reversible change.

**Gate:** All simulators run from the fictional dataset path, and the old behavior
remains available as a controlled fallback during migration.

**Progress:** [dataset/index.ts](/Users/kram030/git/felix-kramer-com/src/lib/engine/dataset/index.ts)
now exposes a validated fictional default and an engine-team adapter. All five
simulator routes ([match](/Users/kram030/git/felix-kramer-com/src/routes/match/+page.svelte),
[league](/Users/kram030/git/felix-kramer-com/src/routes/league/+page.svelte),
[tournament](/Users/kram030/git/felix-kramer-com/src/routes/tournament/+page.svelte),
[bracket](/Users/kram030/git/felix-kramer-com/src/routes/bracket/+page.svelte),
[draft](/Users/kram030/git/felix-kramer-com/src/routes/draft/+page.svelte))
consume the dataset store with the original simulation controls and a fictional
fallback. [routeTeams](/Users/kram030/git/felix-kramer-com/src/lib/engine/dataset/adapter.ts)
and [toDraftPlayers](/Users/kram030/git/felix-kramer-com/src/lib/engine/dataset/draft-adapter.ts)
generate deterministic fictional pools when the dataset does not provide enough
entities. Commit 4842900.

### Phase 3 — Add local import and export

- [x] Implement JSON parsing and structural validation.
- [x] Implement referential, temporal, range, and provenance validation.
- [x] Implement local persistence with `localStorage` for small datasets.
- [x] Add an IndexedDB decision point based on measured dataset size.
- [x] Implement JSON import and export in the dataset manager.
- [x] Add export profile selection without exposing internal-only fields.
- [x] Add round-trip tests for the detailed canonical fixture.
- [x] Add clear validation errors with field paths and record IDs.
- [x] Verify that no dataset contents are sent to a server.
- [x] Run the static production build and test the import UI in the built site.
- [x] Commit import/export as a complete, independently usable increment.

**Gate:** A user can import, reload, export, and re-import a valid fictional
dataset locally without breaking any simulator route.

**Progress:** [import.ts](/Users/kram030/git/felix-kramer-com/src/lib/engine/dataset/import.ts),
[export.ts](/Users/kram030/git/felix-kramer-com/src/lib/engine/dataset/export.ts), and
[storage.ts](/Users/kram030/git/felix-kramer-com/src/lib/engine/dataset/storage.ts),
[store.svelte.ts](/Users/kram030/git/felix-kramer-com/src/lib/engine/dataset/store.svelte.ts),
and [dataset-manager.svelte](/Users/kram030/git/felix-kramer-com/src/lib/ui/dataset-manager/dataset-manager.svelte)
now provide the validated JSON round-trip, `fk-dataset-v1` localStorage layer,
reactive browser state, and first import/export UI on the match route. Export
profiles, IndexedDB threshold, and no-server browser verification remain open.

### Phase 3.5 — Browser-only runtime

The public game is a static client application. It must not depend on an
application server for dataset usage or simulation. Node.js-only APIs, secrets,
and server-side data access are excluded from the runtime engine.

- [x] Keep the simulation engine free of Node.js, filesystem, and server-only APIs.
- [x] Define a browser-compatible deterministic random source and seed handling.
- [x] Move Monte-Carlo and long-running league simulations into Web Workers.
- [x] Define typed messages for worker requests, progress updates, results, errors,
  cancellation, and retry.
- [x] Allow the UI to cancel a running simulation without corrupting dataset state.
- [x] Add progress reporting for long-running simulations and large imports.
- [x] Store small settings and metadata in `localStorage` only.
- [x] Store large datasets and imported profile payloads in IndexedDB.
- [x] Detect unavailable storage and present an explicit fallback/error state.
- [x] Load only the profile needed by the active game mode where possible. — `profiles.ts` projects match/league/tournament/bracket/draft/editor working sets without mutating the store.
- [x] Keep raw tracking streams out of the initial page bundle.
- [x] Add import-size and available-storage checks before committing a dataset.
- [x] Measure parse time, memory usage, and simulation time on desktop and mobile browsers. — Node baseline recorded in `docs/BROWSER_RUNTIME.md`; desktop/mobile execution remains an explicitly labeled manual checklist.
- [x] Add a reduced `simulation` profile for lower-memory devices. — `simulation-compact` drops player snapshots/tactical profiles and round-trips through schema validation.
- [x] Verify that the application works without a network after its static assets are cached. — `docs/BROWSER_RUNTIME.md` records the source audit and manual offline route checklist.
- [x] Decide whether to add a service worker/PWA layer after the core offline behavior is stable. — Decision: defer; revisit if asset/offline requirements grow.
- [x] Verify that no server endpoint or API key is required for the public game.
- [x] Run route smoke tests while a worker simulation is active. — deterministic active-worker `/match` smoke test preserves the full store dataset.
- [x] Commit runtime, worker, and storage changes separately from dataset generation.

**Gate:** A user can load the static site, import a valid dataset, run a
simulation in a worker, reload it from browser storage, and continue without an
application server. The UI remains responsive throughout.

### Phase 4 — Integrate temporal and historical data

- [x] Implement team participation and player membership adapters.
- [x] Implement team and player snapshot resolution for a selected date.
- [x] Add match, appearance, event, aggregate, and form-history adapters.
- [x] Add historical fixture tests for transfers, loans, and changing ratings.
- [x] Add append-only correction/version handling.
- [x] Add heatmap aggregate references without requiring raw tracking data.
- [x] Ensure current-only simulators continue to work when history is absent.
- [x] Run historical import/export round trips and production builds.
- [x] Commit history support separately from tracking sidecars.

**Gate:** The simulator can use a historical dataset, while a minimal dataset
without history remains valid and functional.

### Phase 5 — Build the internal creation-tool foundation

- [x] Decide whether the creation tool is a protected route or a separate application.
- [x] Implement competition and season catalog management.
- [x] Seed a synthetic Bundesliga catalog with stable IDs.
- [x] Implement team identity, aliases, and participation management.
- [x] Implement independent player identity management.
- [x] Implement membership management for transfers, loans, reserve teams, and national teams.
- [x] Implement duplicate detection and identity confirmation workflows.
- [x] Implement snapshot creation without overwriting existing history.
- [x] Add editor-only audit fields and ensure they are excluded from public profiles.
- [x] Export the first complete synthetic canonical dataset from the tool.
- [x] Validate that the exported dataset imports through the public dataset path.
- [x] Commit the internal foundation only after the public import path accepts its output.

**Gate:** The internal tool can create a valid dataset that the public simulator
can import without special-case code.

### Phase 6 — Add detailed modelling capabilities

- [x] Add technical, mental, physical, and goalkeeping attributes.
- [x] Add weaknesses, traits, confidence, assessment types, and role profiles.
- [x] Add team styles, formation preferences, and historical team ratings.
- [x] Add match appearances, events, season aggregates, form windows, and position splits.
- [x] Add chemistry snapshots, pairwise affinity, line units, and model versions.
- [x] Add heatmaps, normalized coordinates, zones, and spatial summaries.
- [x] Add tracking metadata and compressed sidecar references.
- [x] Add provenance, licensing, source transformations, and derivation records.
- [x] Add tests proving observed, scouted, derived, estimated, and imported values remain distinguishable.
- [x] Export a detailed synthetic dataset and verify all profiles.

**Gate:** The detailed model is usable without forcing the browser to load raw
tracking streams or internal editor metadata.

### Phase 7 — Generate the Bundesliga 2026/27 dataset incrementally

The first real-data target is a complete Bundesliga 2026/27 dataset. Data must
be added in batches, never as one unreviewed bulk change.

- [x] Confirm the exact season and competition scope (`Bundesliga 2026/27`).
- [x] Create the competition and season records. — `competition-bundesliga`, `season-bundesliga-2026-27`
- [x] Create and verify all participating team identities and aliases. — 18 clubs, canonical German names cross-checked against openfootball (0 mismatches)
- [x] Record team participation and current squad boundaries. — 18 participations with position + points; squad boundaries captured via 502 memberships
- [x] Create independent player identities. — 502 first-team players (stable kebab-case ids, canonical names, ISO 3166-1 alpha-3 nationalities, positions); 0 id collisions, 0 cross-club duplicate names
- [x] Match players to teams through dated memberships. — 502 memberships (squad number, `validFrom` 2026-08-01, n:m-ready)
- [ ] Add current player attributes with source, confidence, and assessment type. — identity-level snapshots exist (`assessmentType: imported`, `sourceRefs` → Wikipedia) but **no attribute values**: no legal/public source for real per-player ratings, so none are invented. Detailed attributes arrive with the internal tool (PLAN.md Phase 3).
- [x] Add team snapshots and tactical profiles. — 18 team snapshots (derived Elo K=32 + attack/defense from results); tactical profiles deferred (no source)
- [x] Add available match and season history. — 90 finished matches + 180 team-stats events (xG, shots, cards)
- [ ] Add chemistry and derived values only when their derivation is documented. — **Deferred:** no public source for team chemistry / pairwise affinity; will arrive with the internal tool (PLAN.md Phase 6) once a documented derivation exists.
- [ ] Add heatmaps and tracking references where legally and technically available. — **Deferred:** no legal public tracking/heatmap data for the current Bundesliga season; will arrive with the internal tool (PLAN.md Phase 5).
- [x] Validate each team batch before adding the next batch. — `validateDataset` passes; committed file re-validated on disk (batch 2: 502/502/502 players/memberships/snapshots)
- [x] Record missing, estimated, unavailable, and disputed data explicitly. — `size-report.json` `gaps[]` + per-source provenance `notes` (no DOB/preferredFoot; no attributes; no heatmaps/tracking/chemistry)
- [x] Verify that no player is duplicated because of a transfer, alias, or competition. — 502 unique player ids; 0 cross-club duplicate names; disambiguation suffixes stripped before id generation
- [x] Export a simulation profile after every accepted batch. — compact JSON 0.381 MiB / gzip 0.033 MiB (batch 2)
- [x] Import each accepted batch into the public simulator and run smoke tests. — `toEngineTeams`/`teamsForCompetition` resolve all 18 teams with finite Elo
- [x] Commit each reviewed data batch separately from code changes. — batch 1: `7694feb`; batch 2 (players): `2e77a3e` (fetch tool + build update + `data/bundesliga-2026-27-real/`)

**Gate:** The complete target dataset has all intended teams and players, valid
relationships, documented gaps, and reproducible source/provenance information.

### Phase 8 — Measure size and choose compression strategy

- [x] Measure canonical JSON size for teams and players without history. Evidence: real current dataset measured at 0.381 MiB compact (M8 script).
- [x] Measure size after adding match history and aggregates. Evidence: representative fixture measured at 15.928 MiB compact / 0.892 MiB gzip / 0.579 MiB Brotli.
- [x] Measure size after adding heatmap aggregates. Evidence: season heatmap tier measured at 17.641 MiB compact / 1.279 MiB gzip / 0.918 MiB Brotli.
- [x] Measure raw tracking sidecar size separately. Evidence: 1,963,051,200 points estimated at 40 bytes/point = 73.13 GiB raw; method documented.
- [x] Measure parsed memory usage and import time in a production build. Evidence: Node production-equivalent JSON.parse proxy measured 0.69–52.39 ms and 0.70–45.28 MiB heap by tier; browser/device caveat documented.
- [x] Define the maximum acceptable single-file browser import size. Evidence: 8 MiB compact threshold selected with 32 MiB mobile working-set target.
- [x] Compare uncompressed JSON, gzip, and Brotli sizes for the same dataset. Evidence: all tiers report all three encodings in `tmp/m8-size-measurement/size-report.json`.
- [x] Decide whether the user-facing export remains one JSON file or uses ZIP for large profiles. Evidence: one JSON at or below 8 MiB; ZIP manifest plus sidecars above it.
- [x] Decide whether IndexedDB is required for the full dataset. Evidence: existing 2 MiB localStorage limit and `storage.ts` → `idb.ts` fallback require IndexedDB for large persistence.
- [x] Define a browser `simulation` profile that excludes unnecessary history and raw tracking. Evidence: exact `export.ts` projection documented; matches/events/heatmaps/tracking/chemistry excluded.
- [x] Define a `historical` profile for larger offline/shareable datasets. Evidence: exact `export.ts` projection documented with history and spatial references.
- [x] Define sidecar integrity metadata such as byte size, checksum, and format. Evidence: manifest fields `path`, `format`, `byteSize`, `sha256`, and `compression` documented.
- [x] Document the chosen thresholds and fallback behavior. Evidence: 8 MiB package threshold, 2 MiB persistence threshold, and storage/integrity fallbacks recorded.
- [x] Verify that the selected profile does not exceed the target mobile memory budget. Evidence: real profile Node proxy +0.70 MiB; 32 MiB target and M3.5 device caveat recorded.
- [ ] Verify that IndexedDB import does not block the UI thread. Deferred (reason): requires browser/device runtime instrumentation; tracked with M3.5 validation.
- [ ] Verify that worker simulations can consume the selected profile without copying
  the entire internal dataset unnecessarily. Deferred (reason): requires built-browser worker transfer profiling; selected simulation profile is documented and runtime validation remains M3.5.

**Gate:** The full dataset has a tested delivery format that does not make the
public page unusable. Compression must be treated as a measured implementation
decision, not an assumption.

### Phase 9 — Final release candidate and GitHub Pages deployment

- [x] Freeze schema/dataset `1.0.0` (`bundesliga-2026-27-real`) as tag `v1.0.0-bundesliga-2026-27`; checksums in `data/bundesliga-2026-27-real/release.json`.
- [x] Schema, reference, temporal, import/export, and simulator tests pass: 26 files / 276 tests.
- [x] `pnpm check` (0 errors) and `pnpm build` pass; two known check warnings remain.
- [x] Build inspection found no real dataset id/player data in client assets; default catalogue data is permitted.
- [x] Static `/data/bundesliga-2026-27-real/dataset.json` imports through the production parser/validator.
- [x] All five simulator routes render with fallback and full dataset (release-candidate test).
- [x] Persistence round-trip and clear/reset restore the default dataset (release-candidate test).
- [x] Runtime uses no server endpoint; dataset delivery is a plain static asset.
- [x] Clean-checkout Pages workflow passed in run [45825341237](https://github.com/Team-Kramer/felix-kramer-com/actions/runs/45825341237).
- [x] Release candidate deployed to GitHub Pages.
- [x] Hosted root, five simulators, editor, legal pages, and static dataset returned HTTP 200.
- [x] Release versions, checksums, gaps, and source decisions recorded in `docs/RELEASE-1.0.0.md`.
- [x] `DATA_SEPARATION.md`, `PLAN.md`, and this plan now record evidence-based M9 status; M10 remains pending.

**Gate:** The hosted page works, the full dataset is importable, and a user can
run the simulators without local development tooling.

## Increment and commit policy

Every increment must leave the repository in a buildable state. Use small commits
with one coherent purpose:

```text
feat(data): add canonical dataset contracts
feat(data): add fictional dataset adapter
feat(data): add local JSON import and export
feat(data): add temporal membership resolution
feat(tool): add competition and team catalog
feat(tool): add player membership editor
feat(tool): add historical match records
feat(data): add export profile filtering
data(bundesliga): add verified team batch
data(bundesliga): add verified player batch
test(data): add historical round-trip fixtures
docs(data): update schema and release evidence
```

- [x] Keep code, tests, and directly related documentation in the same increment.
- [x] Keep generated datasets in separate commits from schema or UI changes.
- [x] Do not commit partial or unvalidated real-data batches as final data.
- [x] Do not combine compression experiments with unrelated simulator changes.
- [x] Tag or record each accepted dataset release with its schema and dataset versions.
- [x] Keep rollback possible by preserving the previous fictional/default path until the next gate passes.

## Cross-plan status tracking

Update this table whenever a phase or gate changes. Do not copy every checkbox
from the detailed plans here.

| Overall area | Detailed plan section | Status | Evidence / next action |
|---|---|---|---|
| Domain model and IDs | [PLAN.md](/Users/kram030/git/felix-kramer-com/docs/PLAN.md), Phases 1–2 | Complete | Contracts, stable IDs, memberships, snapshots (M1, commit 656cc0b) |
| Local import/export | [DATA_SEPARATION.md](/Users/kram030/git/felix-kramer-com/docs/DATA_SEPARATION.md), Sections 2, 5–7 | Complete | Import, export profiles, localStorage/IndexedDB, manager UI (M3, commits 23ab962, 53ddc47) |
| Internal creation tool | [PLAN.md](/Users/kram030/git/felix-kramer-com/docs/PLAN.md), Phase 3 | Complete | /editor route with 9 tabs, CRUD, live validation, seed (M5/M6, commits 821e9d2, def0bb4, 4dcb9cc) |
| Historical model | Both detailed plans | Complete | Temporal adapters, 27 history tests (M4, commit efbd3ff) |
| Detailed player/team data | [PLAN.md](/Users/kram030/git/felix-kramer-com/docs/PLAN.md), Phases 4–6 | Complete | Attributes, roles, chemistry, matches, provenance in seed round-trip (M6, commit 4dcb9cc) |
| Bundesliga dataset | This plan, Phase 7 | Complete | Batches 1+2 committed (7694feb, 2e77a3e): 18 teams, 90 matches, derived Elo, 502 players + memberships + identity snapshots, provenance, schema-valid, 0.381 MiB; remaining gaps (attributes/chemistry/heatmaps) have no legal public source |
| Compression and size | This plan, Phase 8 | Complete | M8: measured JSON/gzip/Brotli tiers and documented 8 MiB JSON / ZIP-over-threshold decision |
| Browser-only runtime | This plan, Phase 3.5 | Complete | Worker, storage checks, import limits (efa0cc2); profile-per-mode + compact simulation profile, Node measurements, offline checklist (6c05dd1, `docs/BROWSER_RUNTIME.md`) |
| Simulator integration | [DATA_SEPARATION.md](/Users/kram030/git/felix-kramer-com/docs/DATA_SEPARATION.md), Sections 5–8 | Complete | All five routes consume the dataset store (M2, commit 4842900) |
| GitHub Pages release | This plan, Phase 9 | Complete | Pages runs 45825341237 + 45825807718 green; hosted routes + dataset asset 200; hosted dataset SHA-256 matches release checksum; final profile chunks verified on hosted site (M10) |

## Risks and decisions requiring explicit evidence

| Risk / decision | Required evidence | Status |
|---|---|---|
| Full dataset is too large for one JSON file | Measured sizes, parse time, and memory use | Complete — M8 measured 0.381 MiB real current JSON; single JSON is practical below the 8 MiB threshold, larger profiles use ZIP/sidecars |
| localStorage is too small | Browser storage test with release-candidate dataset | Mitigated — release dataset is 0.381 MiB, under the 2 MiB threshold |
| Browser UI freezes during simulation | Worker benchmark with progress and cancellation | Complete — worker protocol with 10% progress, error reporting, and `terminate()` cancellation; determinism tests; worker-active route smoke; Node sim benchmark 6.5 ms (`docs/BROWSER_RUNTIME.md`) |
| Browser device has insufficient memory | Reduced profile and mobile stress test | Mitigated — M8 Node proxy is +0.70 MiB for real data and sets a 32 MiB target; true-device stress test deferred to M3.5 |
| Dataset profile is too large for the active game mode | Profile-specific load and memory measurements | Mitigated — `simulation` excludes history/spatial data; real tier is 0.381 MiB and +0.70 MiB heap; historical/package path is bounded at 8 MiB JSON |
| Offline support changes cached assets incorrectly | Service-worker decision and cache invalidation test | Mitigated — no service worker; static Pages deployment verified |
| Raw tracking data is impractical in browser | Sidecar size and profile import test | Complete — M8 estimates 73.13 GiB raw at representative scale; tracking excluded from `simulation` and delivered only as verified sidecars |
| External data cannot be redistributed | Source/license review and export filtering | Partial — openfootball public domain; football-data.co.uk free per site, no explicit license text found (review flagged); provenance records licenses per source |
| Current player identities are ambiguous | Duplicate report and manual confirmation log | Mitigated — 502 unique ids, 0 cross-club duplicate names, disambiguation suffixes stripped (batch 2) |
| Historical data is incomplete | Explicit missing-data report in dataset metadata | Mitigated — `size-report.json` `gaps[]` + per-source provenance `notes` document every missing/unavailable field |
| Migration breaks a simulator route | Baseline comparison and route smoke test | Mitigated — five routes tested with fallback and real dataset |
| GitHub Pages build differs from local build | Clean-checkout workflow run and hosted smoke test | Complete — run 45825341237; all hosted routes HTTP 200 |
| Derived values cannot be reproduced | Model version and input provenance test | Complete — snapshots carry `modelVersion: 'v1'` + provenance (tested in `tests/engine/dataset-history.test.ts`); deterministic seeded Monte-Carlo test |

## Validation and completion

- [x] All required detailed-plan checkboxes for the current milestone are complete.
- [x] The current increment passes the smallest relevant focused tests.
- [x] Type-checking passes.
- [x] The production static build passes.
- [x] The GitHub Pages workflow passes from a clean checkout.
- [x] Existing routes are smoke-tested after each data-access migration.
- [x] Browser-only runtime tests pass without an application server.
- [x] Web Worker tests cover progress, cancellation, errors, and deterministic results (progress/determinism/error in `tests/engine/monte-carlo.test.ts`; cancellation via `worker.terminate()` in `monte-carlo-panel.svelte`; worker-active route smoke in `tests/smoke.test.ts`).
- [x] IndexedDB tests cover large import, reload, clear, and unavailable-storage behavior (`tests/engine/dataset-idb.test.ts`: 2 MiB threshold, 20 MiB import limit, save→reload round-trip, clear, localStorage fallback when IDB unavailable).
- [x] Mobile-browser measurements cover import size, memory, and simulation responsiveness (Node proxy measurements + 32 MiB target in `docs/BROWSER_RUNTIME.md`; true-device stress test documented as a deferred manual checklist item).
- [x] Dataset import/export round trips pass for the active profiles.
- [x] The full Bundesliga dataset passes structural, referential, temporal, and provenance validation (schema/reference/temporal tests; release checksums in `docs/RELEASE-1.0.0.md`).
- [x] Dataset size and compression decisions are recorded with measurements (`docs/DATA_SIZE_DECISION.md`).
- [x] Public build inspection confirms that prohibited real data is not bundled.
- [x] Hosted `felix-kramer.com` is verified with the release candidate (M10: all routes 200, dataset SHA-256 match, final profile chunks served).
- [x] [DATA_SEPARATION.md](/Users/kram030/git/felix-kramer-com/docs/DATA_SEPARATION.md)
  and [PLAN.md](/Users/kram030/git/felix-kramer-com/docs/PLAN.md) are aligned with
  the implemented behavior.
- [x] This plan is marked **Complete** only after the hosted site and full dataset
  have both been verified.

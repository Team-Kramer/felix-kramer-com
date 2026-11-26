# Felix Kramer Football Data Platform — Overall Implementation Plan

**Updated:** 2026-11-28  
**Owner:** Felix Kramer  
**Overall status:** In progress — M0–M6 complete, M3.5/M7 in progress  
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

- [ ] `felix-kramer.com` builds successfully as a static SvelteKit site.
- [ ] The site is deployable through the existing GitHub Pages workflow.
- [ ] Existing simulator routes continue to work during and after migration.
- [ ] The public bundle contains only fictional or explicitly permitted defaults.
- [ ] Users can import a validated dataset locally.
- [ ] Users can export a selected dataset profile locally.
- [ ] The simulator receives its data through the dataset store and typed adapters.
- [ ] The complete game runs client-side without a required application server.
- [ ] Repeated or expensive simulations run outside the UI thread through Web Workers.
- [ ] Large datasets use IndexedDB or an explicitly measured alternative instead of relying
  on `localStorage` alone.
- [ ] Each game mode can load an appropriate dataset profile instead of the full dataset.
- [ ] The app remains usable on a normal mobile browser with a reduced simulation profile.
- [ ] The internal creation tool can maintain competitions, seasons, teams, players,
  memberships, snapshots, matches, history, spatial data, chemistry, and provenance.
- [ ] A first complete Bundesliga 2026/27 dataset exists in the canonical format,
  subject to source licensing and data-quality verification.
- [ ] The full dataset has a documented size strategy: single JSON where practical,
  compressed/split package where necessary, and a simulator-ready browser profile.
- [ ] Every release increment has a focused test result and a committable state.

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

- [ ] Keep the application buildable after every implementation increment.
- [ ] Keep the fictional fallback available until the full migration is verified.
- [ ] Introduce adapters before removing existing data access.
- [ ] Separate schema changes from UI changes and engine changes where possible.
- [ ] Make each increment independently testable and committable.
- [ ] Never mix raw source data, derived values, and simulator parameters without provenance.
- [ ] Never overwrite historical records; append snapshots or corrections.
- [ ] Do not add real data to the public bundle without a licensing decision.
- [ ] Prefer deterministic exports so dataset changes can be reviewed and diffed.
- [ ] Measure dataset size before selecting browser persistence and delivery formats.
- [ ] Validate the static production build before declaring an increment complete.

## Milestones and gates

| Milestone | Status | Depends on | Release gate |
|---|---|---|---|
| M0. Baseline captured | Complete | — | Check, 18 test files/213 tests, and static build verified on 2026-11-26 |
| M1. Contracts introduced | Complete | M0 | Contracts, JSON Schema, fixtures, validation, and engine adapter added (commit 656cc0b) |
| M2. Fictional dataset path | Complete | M1 | All five simulator routes consume the dataset store with fictional fallback (commit 4842900) |
| M3. Local import/export | Complete | M2 | JSON round-trip, localStorage, store, manager UI, export profiles, and IndexedDB fallback (commits 23ab962, 53ddc47) |
| M3.5. Browser-only runtime | In progress | M3 | Worker, PRNG, storage fallback, import-size and storage-availability checks committed (efa0cc2); mobile measurement, reduced profile, and offline smoke test remain |
| M4. Historical model integrated | Complete | M3.5 | Temporal adapters with 27 tests; minimal datasets remain functional (commit efbd3ff) |
| M5. Creation tool foundation | Complete | M4 | /editor route with CRUD, stable IDs, live validation (821e9d2); deterministic synthetic Bundesliga seed with 252 players (def0bb4); editor in nav (4dcb9cc) |
| M6. Detailed model capabilities | Complete | M5 | All 9 dataset tabs (competitions, seasons, teams, players, memberships, snapshots, chemistry, matches, provenance) with add/remove controls (4dcb9cc); detailed model fields verified in seed round-trip |
| M7. Bundesliga dataset batches | In progress | M6 | Synthetic seed batch committed (def0bb4); real-data batches pending licensing review of sources (football-data.co.uk, openfootball reachable) |
| M8. Size and distribution decision | Not started | M7 | JSON, compressed package, sidecars, and browser profile are measured |
| M9. Full Bundesliga release candidate | Not started | M8 | Complete first dataset passes quality, licensing, and import/export gates |
| M10. GitHub Pages release | Not started | M9 | Production build and hosted site work with the final simulator profile |

## Work items

### Phase 0 — Baseline and safety net

- [x] Record the current production build command and GitHub Pages workflow.
- [x] Run the existing check, test, and build commands and record their baseline results.
- [ ] Confirm all current simulator routes render before changing data access.
- [x] Record the current generated data files and their consumers.
- [ ] Identify the smallest fictional fallback that can replace real bundled data safely.
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
- [ ] Load only the profile needed by the active game mode where possible.
- [x] Keep raw tracking streams out of the initial page bundle.
- [x] Add import-size and available-storage checks before committing a dataset.
- [ ] Measure parse time, memory usage, and simulation time on desktop and mobile browsers.
- [ ] Add a reduced `simulation` profile for lower-memory devices.
- [ ] Verify that the application works without a network after its static assets are cached.
- [ ] Decide whether to add a service worker/PWA layer after the core offline behavior is stable.
- [x] Verify that no server endpoint or API key is required for the public game.
- [ ] Run route smoke tests while a worker simulation is active.
- [x] Commit runtime, worker, and storage changes separately from dataset generation.

**Gate:** A user can load the static site, import a valid dataset, run a
simulation in a worker, reload it from browser storage, and continue without an
application server. The UI remains responsive throughout.

### Phase 4 — Integrate temporal and historical data

- [ ] Implement team participation and player membership adapters.
- [ ] Implement team and player snapshot resolution for a selected date.
- [ ] Add match, appearance, event, aggregate, and form-history adapters.
- [ ] Add historical fixture tests for transfers, loans, and changing ratings.
- [ ] Add append-only correction/version handling.
- [ ] Add heatmap aggregate references without requiring raw tracking data.
- [ ] Ensure current-only simulators continue to work when history is absent.
- [ ] Run historical import/export round trips and production builds.
- [ ] Commit history support separately from tracking sidecars.

**Gate:** The simulator can use a historical dataset, while a minimal dataset
without history remains valid and functional.

### Phase 5 — Build the internal creation-tool foundation

- [ ] Decide whether the creation tool is a protected route or a separate application.
- [ ] Implement competition and season catalog management.
- [ ] Seed a synthetic Bundesliga catalog with stable IDs.
- [ ] Implement team identity, aliases, and participation management.
- [ ] Implement independent player identity management.
- [ ] Implement membership management for transfers, loans, reserve teams, and national teams.
- [ ] Implement duplicate detection and identity confirmation workflows.
- [ ] Implement snapshot creation without overwriting existing history.
- [ ] Add editor-only audit fields and ensure they are excluded from public profiles.
- [ ] Export the first complete synthetic canonical dataset from the tool.
- [ ] Validate that the exported dataset imports through the public dataset path.
- [ ] Commit the internal foundation only after the public import path accepts its output.

**Gate:** The internal tool can create a valid dataset that the public simulator
can import without special-case code.

### Phase 6 — Add detailed modelling capabilities

- [ ] Add technical, mental, physical, and goalkeeping attributes.
- [ ] Add weaknesses, traits, confidence, assessment types, and role profiles.
- [ ] Add team styles, formation preferences, and historical team ratings.
- [ ] Add match appearances, events, season aggregates, form windows, and position splits.
- [ ] Add chemistry snapshots, pairwise affinity, line units, and model versions.
- [ ] Add heatmaps, normalized coordinates, zones, and spatial summaries.
- [ ] Add tracking metadata and compressed sidecar references.
- [ ] Add provenance, licensing, source transformations, and derivation records.
- [ ] Add tests proving observed, scouted, derived, estimated, and imported values remain distinguishable.
- [ ] Export a detailed synthetic dataset and verify all profiles.

**Gate:** The detailed model is usable without forcing the browser to load raw
tracking streams or internal editor metadata.

### Phase 7 — Generate the Bundesliga 2026/27 dataset incrementally

The first real-data target is a complete Bundesliga 2026/27 dataset. Data must
be added in batches, never as one unreviewed bulk change.

- [ ] Confirm the exact season and competition scope (`Bundesliga 2026/27`).
- [ ] Create the competition and season records.
- [ ] Create and verify all participating team identities and aliases.
- [ ] Record team participation and current squad boundaries.
- [ ] Create independent player identities.
- [ ] Match players to teams through dated memberships.
- [ ] Add current player attributes with source, confidence, and assessment type.
- [ ] Add team snapshots and tactical profiles.
- [ ] Add available match and season history.
- [ ] Add chemistry and derived values only when their derivation is documented.
- [ ] Add heatmaps and tracking references where legally and technically available.
- [ ] Validate each team batch before adding the next batch.
- [ ] Record missing, estimated, unavailable, and disputed data explicitly.
- [ ] Verify that no player is duplicated because of a transfer, alias, or competition.
- [ ] Export a simulation profile after every accepted batch.
- [ ] Import each accepted batch into the public simulator and run smoke tests.
- [ ] Commit each reviewed data batch separately from code changes.

**Gate:** The complete target dataset has all intended teams and players, valid
relationships, documented gaps, and reproducible source/provenance information.

### Phase 8 — Measure size and choose compression strategy

- [ ] Measure canonical JSON size for teams and players without history.
- [ ] Measure size after adding match history and aggregates.
- [ ] Measure size after adding heatmap aggregates.
- [ ] Measure raw tracking sidecar size separately.
- [ ] Measure parsed memory usage and import time in a production build.
- [ ] Define the maximum acceptable single-file browser import size.
- [ ] Compare uncompressed JSON, gzip, and Brotli sizes for the same dataset.
- [ ] Decide whether the user-facing export remains one JSON file or uses ZIP for large profiles.
- [ ] Decide whether IndexedDB is required for the full dataset.
- [ ] Define a browser `simulation` profile that excludes unnecessary history and raw tracking.
- [ ] Define a `historical` profile for larger offline/shareable datasets.
- [ ] Define sidecar integrity metadata such as byte size, checksum, and format.
- [ ] Document the chosen thresholds and fallback behavior.
- [ ] Verify that the selected profile does not exceed the target mobile memory budget.
- [ ] Verify that IndexedDB import does not block the UI thread.
- [ ] Verify that worker simulations can consume the selected profile without copying
  the entire internal dataset unnecessarily.

**Gate:** The full dataset has a tested delivery format that does not make the
public page unusable. Compression must be treated as a measured implementation
decision, not an assumption.

### Phase 9 — Final release candidate and GitHub Pages deployment

- [ ] Freeze the schema and dataset version for the first release candidate.
- [ ] Run all schema, reference, temporal, import/export, and simulator tests.
- [ ] Run the full type-check and production build.
- [ ] Verify that the build contains only permitted default data.
- [ ] Verify that the final Bundesliga dataset imports in the built static site.
- [ ] Verify that simulator routes work with both fictional fallback and full dataset.
- [ ] Verify that local persistence and clear/reset behavior work.
- [ ] Verify that no server endpoint is required for dataset usage.
- [ ] Verify the GitHub Actions Pages workflow from a clean checkout.
- [ ] Deploy the release candidate to GitHub Pages.
- [ ] Smoke-test the hosted `felix-kramer.com` page and every simulator route.
- [ ] Record release versions, dataset checksums, known gaps, and source decisions.
- [ ] Mark both detailed plans and this overall plan with evidence-based statuses.

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

- [ ] Keep code, tests, and directly related documentation in the same increment.
- [ ] Keep generated datasets in separate commits from schema or UI changes.
- [ ] Do not commit partial or unvalidated real-data batches as final data.
- [ ] Do not combine compression experiments with unrelated simulator changes.
- [ ] Tag or record each accepted dataset release with its schema and dataset versions.
- [ ] Keep rollback possible by preserving the previous fictional/default path until the next gate passes.

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
| Bundesliga dataset | This plan, Phase 7 | In progress | Synthetic seed committed (def0bb4); real-data batches pending licensing review |
| Compression and size | This plan, Phase 8 | Not started | Measure before choosing format |
| Browser-only runtime | This plan, Phase 3.5 | In progress | Worker, storage checks, import limits (efa0cc2); mobile measurement, reduced profile, offline smoke test remain |
| Simulator integration | [DATA_SEPARATION.md](/Users/kram030/git/felix-kramer-com/docs/DATA_SEPARATION.md), Sections 5–8 | Complete | All five routes consume the dataset store (M2, commit 4842900) |
| GitHub Pages release | This plan, Phase 9 | Not started | Validate clean checkout deployment |

## Risks and decisions requiring explicit evidence

| Risk / decision | Required evidence | Status |
|---|---|---|
| Full dataset is too large for one JSON file | Measured sizes, parse time, and memory use | Open |
| localStorage is too small | Browser storage test with release-candidate dataset | Open |
| Browser UI freezes during simulation | Worker benchmark with progress and cancellation | Open |
| Browser device has insufficient memory | Reduced profile and mobile stress test | Open |
| Dataset profile is too large for the active game mode | Profile-specific load and memory measurements | Open |
| Offline support changes cached assets incorrectly | Service-worker decision and cache invalidation test | Open |
| Raw tracking data is impractical in browser | Sidecar size and profile import test | Open |
| External data cannot be redistributed | Source/license review and export filtering | Open |
| Current player identities are ambiguous | Duplicate report and manual confirmation log | Open |
| Historical data is incomplete | Explicit missing-data report in dataset metadata | Open |
| Migration breaks a simulator route | Baseline comparison and route smoke test | Open |
| GitHub Pages build differs from local build | Clean-checkout workflow run and hosted smoke test | Open |
| Derived values cannot be reproduced | Model version and input provenance test | Open |

## Validation and completion

- [ ] All required detailed-plan checkboxes for the current milestone are complete.
- [ ] The current increment passes the smallest relevant focused tests.
- [ ] Type-checking passes.
- [ ] The production static build passes.
- [ ] The GitHub Pages workflow passes from a clean checkout.
- [ ] Existing routes are smoke-tested after each data-access migration.
- [ ] Browser-only runtime tests pass without an application server.
- [ ] Web Worker tests cover progress, cancellation, errors, and deterministic results.
- [ ] IndexedDB tests cover large import, reload, clear, and unavailable-storage behavior.
- [ ] Mobile-browser measurements cover import size, memory, and simulation responsiveness.
- [ ] Dataset import/export round trips pass for the active profiles.
- [ ] The full Bundesliga dataset passes structural, referential, temporal, and provenance validation.
- [ ] Dataset size and compression decisions are recorded with measurements.
- [ ] Public build inspection confirms that prohibited real data is not bundled.
- [ ] Hosted `felix-kramer.com` is verified with the final release candidate.
- [ ] [DATA_SEPARATION.md](/Users/kram030/git/felix-kramer-com/docs/DATA_SEPARATION.md)
  and [PLAN.md](/Users/kram030/git/felix-kramer-com/docs/PLAN.md) are aligned with
  the implemented behavior.
- [ ] This plan is marked **Complete** only after the hosted site and full dataset
  have both been verified.

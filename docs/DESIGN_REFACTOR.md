# Design Refactor — Apple Fluid Interfaces × Emil Design Engineering

**Updated:** 2026-07-24
**Owner:** AI agent (shockwavemk)
**Overall status:** In progress (Phases 1–6 complete, Phase 7 in progress)

## Objective

Full visual/motion/craft refactor of the felix-kramer.com site applying:

- **Apple fluid-interface principles** (springs, interruptibility, materials,
  scroll-edge effects, size-specific typography, reduced-motion cross-fades)
- **Emil Kowalski's design-engineering craft** (custom easings, durations < 300ms,
  `:active` feedback, transitions over keyframes for interruptible UI,
  `@starting-style` for enter states, origin-aware popovers, transform/opacity only)

**Scope assumption (stated):** this is a *visual/motion/typography/craft* refactor.
All functionality, routes, i18n (DE/EN), and the 276-test suite stay intact.
No structural or route changes. The dark "Green Deck" brand palette is kept.

## Success criteria

- [x] All motion uses the shared easing/duration token system (no ad-hoc `ease-in`, no `transition-all`)
- [x] Toast enter/exit is interruptible (transitions + `@starting-style`), ease-out both ways
- [x] `:active` feedback on all interactive controls; hover effects gated behind `hover:hover`
- [x] Sticky header uses a scroll-edge material effect instead of an always-on border
- [x] Mobile navigation exists (nav is currently hidden below `md` with no fallback)
- [x] `pnpm run check`, `pnpm test` (276 green), `pnpm run build` all pass
- [ ] Review table (Before / After / Why) delivered

## Current state and constraints

- **State:** SvelteKit 2 + Svelte 5, Tailwind v4, static GitHub Pages. Design system
  lives in `src/app.css` (648 lines). Audit complete — findings below.
- **Constraints (test-pinned, must not break):**
  - `tests/tokens.test.ts`: exact token values incl. `--spring-duration-fast: 200ms`,
    `--spring-duration-base: 350ms`, palette, type scale, radii, contrast checks.
  - `tests/effects.test.ts`: class names (`.glass`, `.glow-border`, `.icon-glow`,
    `.hover-lift`, `.metaball`, …), keyframe names, `@supports` gates, reveal base
    rule `clip-path: inset(0 0 0 0);`, and the reduced-motion blanket kill
    (`animation: none !important; transition: none !important`).
  - `tests/smoke.test.ts`: nav role `Hauptnavigation`, hero headline, 5 simulator links.
  - Toast tests: role status/alert + dismiss button only — no class assertions.

## Phases and status

| Phase | Status | Depends on | Outcome / notes |
|---|---|---|---|
| 1. Motion token system | Complete | — | Emil easing tokens + harmonized `--transition-*` in app.css |
| 2. Component motion fixes | Complete | Phase 1 | Toast (transitions + `@starting-style`), tabs, formation-builder, probability bars, spinner, monte-carlo buttons |
| 3. Materials & depth | Complete | Phase 1 | Hover gating behind `hover:hover`, scroll-edge header (`.header-edge` + `data-scrolled`) |
| 4. Typography pass | Complete | — | `text-wrap: balance` on display/headlines; optical sizing N/A (DM Sans static, no opsz axis) |
| 5. Layout & mobile nav | Complete | Phase 1 | Slide-down mobile menu (Escape + breakpoint close), tilt spring-smoothed, pulse-cta kept (reduced-motion covered) |
| 6. Validation | Complete | Phases 1–5 | check 0 errors, 276/276 tests, build green, dev-server markup verified |
| 7. PR + Pages verify | In progress | Phase 6 | Commit + PR + merge + Pages deploy |

## Work items

### Phase 1 — Motion token system (app.css)
- [x] Add `--ease-out: cubic-bezier(0.23,1,0.32,1)`, `--ease-in-out: cubic-bezier(0.77,0,0.175,1)`, `--ease-drawer: cubic-bezier(0.32,0.72,0,1)`
- [x] Harmonize `--transition-fast/base/panel/toast-in/toast-out` to use the new easings (toast-out is 250ms, not 300ms — UI < 300ms rule; store removal delay adjusted to 260ms)
- [x] Align `--transition-glide` easing with `--spring-ui` curve
- [x] Do NOT change `--spring-duration-fast` / `--spring-duration-base` (test-pinned)

**Done when:** tokens present, no test-pinned value changed, `pnpm test` green.

### Phase 2 — Component motion fixes
- [x] `ui-animations.css`: toast keyframes removed entirely (replaced by transitions; nothing referenced them, none test-pinned)
- [x] `toast.svelte`: enter/exit via transitions + `@starting-style`, ease-out both ways; exit driven by `data-exiting` attribute
- [x] `formation-builder.svelte:66`: `transition-all duration-300` → `transition-[left,top] duration-200`
- [x] `probability-bar.svelte:43` + `monte-carlo-panel.svelte` result bars: `duration-300` → `duration-200`
- [x] `tabs.svelte:105`: glide indicator → `ease-[var(--spring-ui)]` (350ms kept)
- [x] `spinner.svelte`: 700ms → 500ms
- [x] Audit remaining `duration-150` usages — color-only hovers are fine; monte-carlo Abbrechen/Simulieren buttons got explicit transition properties + `active:scale-95`

**Done when:** no `transition-all`, no `ease-in` on UI, no >300ms UI transitions; tests green.

### Phase 3 — Materials & depth
- [x] Gate `.icon-glow` / `.hover-lift` transform hovers behind `@media (hover:hover) and (pointer:fine)` (keep base classes for tests)
- [x] Scroll-edge effect under sticky header (`.header-edge::after` gradient fades in via `data-scrolled` on scroll) — replaces hard divider
- [x] Verify glass material vibrancy (text contrast over `.glass`) — base rule + reduced-transparency fallback intact

**Done when:** no sticky-hover artifacts on touch; header edge fades with scroll; tests green.

### Phase 4 — Typography pass
- [x] Verify size-specific tracking (already in tokens) is applied at usage sites
- [x] `font-optical-sizing: auto` — N/A: DM Sans is loaded as static weights (no `opsz` axis), so optical sizing has no effect
- [x] Body leading check (14px/22px already set) + added `text-wrap: balance` to `.text-display` / `.text-headline-lg` / `.text-headline-md`

**Done when:** no regressions; visual check in dev server.

### Phase 5 — Layout & mobile nav
- [x] Add mobile navigation — hamburger button (below `md`) opening a slide-down sheet with the 8 nav links + CTA; closes on link tap, Escape, and viewport ≥ `md`
- [x] CTA band craft check (pulse-cta kept — it's a rare/first-time marketing CTA, and reduced-motion kills the ring)
- [x] Homepage effect restraint audit — kept metaball/typewriter/parallax/reveal (marketing page = rare/first-time, justified); tilt now spring-smoothed instead of glued to the cursor

**Done when:** nav reachable on mobile viewport; smoke test green.

### Phase 6 — Validation
- [x] `pnpm run check` — 0 errors (2 pre-existing warnings, unrelated)
- [x] `pnpm test` — 276/276 green
- [x] `pnpm run build` — green (adapter-static → build/)
- [x] Dev-server markup pass — `header-edge`, `data-scrolled`, `aria-label="Menü"`, `Hauptnavigation` all render

**Done when:** all three commands pass; visual notes recorded.

### Phase 7 — PR + Pages verify
- [ ] Commit per phase (or squashed feature commit)
- [ ] Open PR, merge, verify GitHub Pages deploy

**Done when:** main updated, felix-kramer.com serving the refactor.

## Risks and open decisions

| Item | Impact / options | Owner | Status |
|---|---|---|---|
| Reduced-motion blanket kill is test-pinned | Gentler cross-fade approach can only supplement, not replace | agent | Accepted |
| Toast keyframe names may be referenced elsewhere | Verified: no references, none test-pinned — removed cleanly | agent | Resolved |
| Mobile nav pattern | Hamburger sheet (Apple-style) vs condensed pill row | agent | Resolved — hamburger sheet with slide-down panel |
| Homepage effect overload | Risk of "too much motion"; may disable one effect | agent | Resolved — effects kept (marketing page), tilt spring-smoothed |

## Validation and completion

- [x] `pnpm run check` passes (0 errors)
- [x] `pnpm test` — 276 tests green
- [x] `pnpm run build` succeeds
- [ ] All success criteria met and recorded above (review table pending)

# Felix UI Library

Token-driven Svelte 5 component library for the felix-kramer.com static homepage.
All components are built on the **Green Deck** design tokens (see `src/app.css`)
using Tailwind 4 utilities — no per-component `<style>` blocks.

## Conventions

- **Svelte 5 runes** — `$props`, `$state`, `$derived`, `$bindable`.
- **TypeScript** — every component uses `<script lang="ts">`.
- **Tailwind 4 utilities on Green Deck tokens** — `bg-surface`, `text-ink`,
  `border-line`, `rounded-lg`, `shadow-card`, `focus-visible:outline-accent`, etc.
- **Accessibility built in** — semantic roles, `aria-*` attributes, visible
  focus rings, keyboard operable.
- **No `<style>` blocks** — tokens + utilities only (exception: pseudo-element
  styling that cannot be expressed as a utility).

## Importing

Everything is re-exported from the barrel:

```ts
import { Button, Card, Tabs, LeagueTable, Bracket, toastStore } from '$lib/ui';
```

## Components

### Ported from `felix-kramer-saas` (token-driven, verbatim where possible)

| Component | File | Notes |
|---|---|---|
| `Button` | `button/button.svelte` | Variants: primary / secondary / destructive / icon-outline; `busy` shows a decorative spinner + `aria-busy` |
| `Spinner` | `spinner/spinner.svelte` | `decorative` (aria-hidden) or labelled `role="status"` |
| `Card` | `card/card.svelte` | `interactive` renders a `<button aria-pressed>`; otherwise a `<section role="region">` |
| `Tabs` | `tabs/tabs.svelte` | Gliding pill (`effects.ts`), `activeId` is `$bindable` (written back on selection) |
| `Table` | `table/table.svelte` | Generic column/row table |
| `ListItem` | `list-item/list-item.svelte` | `interactive` → `<button>`, `href` → `<a>`, else `<div>` |
| `ChipInput` | `chip-input/chip-input.svelte` | Tag input |
| `StatusBadge` | `status-badge/status-badge.svelte` | Status pill |
| `Progress` | `progress/progress.svelte` | Determinate + indeterminate |
| `Skeleton` | `skeleton/skeleton.svelte` | Loading placeholder |
| `Toast` / `ToastContainer` | `toast/` | `toastStore`, `showToast`, `dismissToast`, `clearToasts` |
| `ConfirmPanel` | `confirm-panel/confirm-panel.svelte` | Native `<dialog>` modal (SidePanel not ported) |
| `EmptyState` | `empty-state/empty-state.svelte` | Empty placeholder |
| `Icon` | `icon.svelte` | `ACTION_ICONS` set |
| `SectionTitle` | `section-title/section-title.svelte` | Section heading |
| `Logo` | `logo/logo.svelte` | Soccer wordmark |
| `FormField` | `form-field/form-field.svelte` | Label + control wrapper |
| `Select` | `select/select.svelte` | Styled select |
| `CheckboxSwitch` | `checkbox-switch/checkbox-switch.svelte` | Toggle |
| `Divider` | `divider/divider.svelte` | Rule |
| `Banner` | `banner/banner.svelte` | Notice banner |

### Football-specific (★)

| Component | File | Notes |
|---|---|---|
| `ProbabilityBar` | `probability-bar/probability-bar.svelte` | Segmented home/draw/away bar, monospace percentages |
| `MatchCard` | `match-card/match-card.svelte` | Two teams, crest, score, minute ticker, probability bar |
| `LeagueTable` | `league-table/league-table.svelte` | Rank, P/W/D/L, GF/GA/GD, Pts; zone colors |
| `GroupTable` | `group-table/group-table.svelte` | League table + qualification markers |
| `Bracket` | `bracket/bracket.svelte` | Single/double elim, 4–64; CSS grid; auto-advance |
| `FormationBuilder` | `formation-builder/formation-builder.svelte` | Pitch, 11 slots per formation, position-locked |
| `MonteCarloPanel` | `monte-carlo-panel/monte-carlo-panel.svelte` | Run selector, progress, title-probability ranking (Web Worker) |
| `ResultCard` | `result-card/result-card.svelte` | Shareable champion/record/rating card |
| `ChaosSlider` | `chaos-slider/chaos-slider.svelte` | 0–100 range, live probability update |

## Effects

`effects.ts` exports the motion helpers (Apple motion rules: springs,
interruptibility, velocity handoff):

- `bindGlidingPill` — gliding pill for tabs (anchor positioning + fallback)
- `bindScrollProgress` — scroll progress binding
- `supportsAnchorPositioning` — feature detection
- `type GlidingPillBinding`

## Testing

Component tests live in `tests/ui/`:

- `ported-components.test.ts`
- `ported-components-2.test.ts`
- `football-components.test.ts`

Svelte 5 snippets cannot be passed as plain functions in tests — use the
fixture components in `tests/ui/fixtures/` (e.g. `ButtonWithLabel`,
`CardWithContent`, `TabsWithPanels`, `ListItemWithContent`) which render the
target component with inline snippet content.

Run: `pnpm test`.

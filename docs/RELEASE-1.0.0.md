# Release 1.0.0 — Bundesliga 2026/27

**Status:** Release candidate deployed 2026-11-26

- **Release/tag:** `v1.0.0-bundesliga-2026-27`
- **Schema version:** `1.0.0`
- **Dataset version:** `1.0.0`
- **Dataset:** `bundesliga-2026-27-real`
- **Freeze commit:** `564c6be`
- **Pages workflow:** [run 45825341237](https://github.com/Team-Kramer/felix-kramer-com/actions/runs/45825341237)
- **Pull request:** [#3](https://github.com/Team-Kramer/felix-kramer-com/pull/3)

## Checksums

| File | SHA-256 |
|---|---|
| `dataset.json` | `d08b3ec97e1f488606a544d4a9b96a78db035df9888c1198b326410f5c50206a` |
| `dataset.pretty.json` | `62fc705d730353721aab944fc75b2e34476cbf0c04dcc911bfb05b8548b25522` |

## Validation

`pnpm check` passed with 0 errors (two pre-existing warnings), `pnpm test` passed with 26 files / 276 tests, and `pnpm build` passed. The release test imports the static asset through the existing parser/validator, renders all five simulator routes with both fallback and real datasets, and verifies persistence/reset.

The production bundle contains no `bundesliga-2026-27-real` or `Kane` reference in client assets. Bayern/Dortmund names remain in the permitted fictional/default catalogue. The real dataset is served only as `/data/bundesliga-2026-27-real/dataset.json`; no server endpoint is used.

Hosted smoke test after deployment: `/`, `/match`, `/league`, `/tournament`, `/bracket`, `/draft`, `/editor`, `/impressum`, `/datenschutz`, and the dataset URL all returned HTTP 200 at `https://felix-kramer.com`.

## Known gaps

Player snapshots contain identity data but no attributes/ratings; date of birth and preferred foot are unavailable; heatmaps, tracking, chemistry, and tactical profiles are not included; midfield rating is omitted. These gaps are recorded in `data/bundesliga-2026-27-real/size-report.json`.

## Source and licence decisions

Openfootball results are treated as public domain. Wikipedia squad data is used under CC BY-SA 4.0 with provenance recorded. football-data.co.uk is flagged because the site is free to use but no explicit licence text was found.

M10 remains pending for final hosted verification with the final simulator profile.

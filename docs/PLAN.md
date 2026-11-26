# Football Dataset Creation Tool — Implementation Plan

**Updated:** 2026-11-26  
**Owner:** Felix Kramer  
**Overall status:** Implemented through M9; final hosted profile verification pending

## Objective

Build an internal dataset creation tool and a versioned JSON export format for
football simulations. The tool must manage current and historical competitions,
teams, independent players, many-to-many team memberships, detailed player and
team attributes, team context, spatial data, match history, provenance, and
derived simulation values.

The public simulator must consume validated exports without receiving internal
editor metadata, raw source data, or server-side user data.

The design described in [DATA_SEPARATION.md](/Users/kram030/git/felix-kramer-com/docs/DATA_SEPARATION.md)
is the product and architecture baseline for this plan.

## Success criteria

- [ ] A versioned schema validates minimal, detailed, historical, and tracking-aware datasets.
- [ ] Competitions, seasons, teams, players, and stable IDs are managed independently.
- [ ] Player-to-team relationships support transfers, loans, national teams, and historical validity periods.
- [ ] Current and historical team/player values are append-only snapshots rather than overwritten state.
- [ ] Match appearances, events, aggregates, heatmaps, and optional tracking references can be exported.
- [ ] Team chemistry and tactical context are represented as derived, time-dependent data.
- [ ] Every imported, observed, estimated, or derived value can reference its provenance.
- [ ] The export can be imported by the simulator and reduced to a browser-appropriate profile.
- [ ] Invalid references, overlapping memberships, invalid ranges, and inconsistent time periods are rejected with actionable errors.
- [ ] Focused tests cover schema validation, historical relationships, export profiles, and round-trip import/export.

## Current state and constraints

- **State:** The data-separation proposal exists in
  [DATA_SEPARATION.md](/Users/kram030/git/felix-kramer-com/docs/DATA_SEPARATION.md).
  Existing generated data and simulator integrations still need to be migrated.
- **Constraints:** The public app must not hardcode real club or player data after migration.
- **Constraints:** User-provided datasets remain local to the browser; there is no account,
  central dataset repository, or automatic external data download in this phase.
- **Constraints:** Internal raw data and editor-only metadata must not be included in public exports.
- **Compatibility:** Small datasets must remain usable as one JSON file. Large tracking
  datasets may use referenced compressed sidecar files in a ZIP export.
- **Data governance:** Every external source must be reviewed for licensing, terms of use,
  attribution, and permitted redistribution before it is imported or exported.

## Target data architecture

The dataset must not be designed as a simple `teams[]` / `players[]` file. It is
a normalized, temporal dataset. Players are independent entities, teams and
competitions are independent entities, and relationships and changing values are
stored separately. This allows the tool to reconstruct the correct state for a
specific date without overwriting history.

The internal tool may contain much more information than the public simulator
needs. The export pipeline is therefore a deliberate boundary:

```text
Internal source data and editor
        ↓
Normalization and identity matching
        ↓
Validation and provenance checks
        ↓
Derived model values
        ↓
Profile-specific simulator export
        ↓
Local browser import
```

### Core product requirements

- [ ] Manage current competitions and league indexes, beginning with the Bundesliga.
- [ ] Manage stable team identities, aliases, colors, and historical names.
- [ ] Manage independent player identities without embedding a player inside a team.
- [ ] Support many-to-many player/team relationships over time.
- [ ] Support permanent transfers, loans, reserve teams, and national teams.
- [ ] Store detailed technical, mental, physical, goalkeeping, role, and weakness data.
- [ ] Store current and historical team ratings, styles, formations, and tactical profiles.
- [ ] Store team chemistry, player pair affinity, line-unit context, and role compatibility.
- [ ] Store match, season, rolling-window, opponent, and position-specific history.
- [ ] Store aggregated heatmaps and references to detailed movement/tracking data.
- [ ] Track source, license, confidence, transformation, and derivation information.
- [ ] Export a complete, validated dataset in JSON without relying on names as references.

### Stable IDs and names

Names are display data and must never be used as primary or foreign keys. A
team may be known as `Bayern München`, `FC Bayern`, or `Bayern Munich` while
retaining one stable ID. The same applies to players, competitions, and venues.

Recommended ID categories:

```text
dataset-bundesliga-2026-27
competition-bundesliga
season-bundesliga-2026-27
team-fcb
player-000123
membership-player-000123-team-fcb-2026
match-bl-2026-11-22-fcb-bvb
snapshot-player-000123-2026-11
heatmap-player-000123-season-2026-27
source-internal-scouting-2026-11
```

Aliases and historical names belong in explicit records with validity periods;
they must not create duplicate identities.

### Canonical JSON export envelope

The canonical export remains one JSON document for small and browser-sized
datasets. The top-level structure must separate master data, relationships,
snapshots, match data, spatial data, and provenance:

```json
{
  "$schema": "https://felix-kramer.com/schemas/football-dataset-v1.json",
  "dataset": {
    "id": "dataset-bundesliga-2026-27",
    "name": "Bundesliga 2026/27",
    "schemaVersion": "1.0.0",
    "datasetVersion": "1.4.0",
    "createdAt": "2026-11-24T12:00:00Z",
    "updatedAt": "2026-11-25T10:00:00Z",
    "sourceType": "internal-tool",
    "defaultTimeZone": "Europe/Berlin",
    "defaultCoordinateSystem": "normalized-pitch",
    "units": {
      "distance": "km",
      "speed": "kmh",
      "duration": "minutes"
    }
  },
  "competitions": [],
  "seasons": [],
  "teams": [],
  "players": [],
  "memberships": [],
  "teamSnapshots": [],
  "playerSnapshots": [],
  "matches": [],
  "matchAppearances": [],
  "events": [],
  "tracking": [],
  "heatmaps": [],
  "chemistry": [],
  "tacticalProfiles": [],
  "provenance": []
}
```

`schemaVersion` describes the contract. `datasetVersion` describes a particular
data release. They must evolve independently.

For large internal datasets, support an optional ZIP package:

```text
dataset-export.zip
├── manifest.json
├── competitions.json
├── seasons.json
├── teams.json
├── players.json
├── memberships.json
├── team-snapshots.json
├── player-snapshots.json
├── matches.json
├── events.json
├── tracking.json
├── chemistry.json
└── provenance.json
```

The internal tool may store split files and merge them for export. Raw tracking
points should be referenced as compressed sidecar files rather than embedded in
the default browser JSON.

### Competitions, seasons, and participation

The current league must not be represented only by a static array of team names.
Competition, season, and participation are separate entities so promotions,
relegations, historical leagues, and multiple competitions can be represented.

```json
{
  "id": "competition-bundesliga",
  "type": "league",
  "countryCode": "DE",
  "name": "Bundesliga",
  "shortName": "BL",
  "level": 1,
  "gender": "male",
  "seasonIds": [
    "season-bundesliga-2025-26",
    "season-bundesliga-2026-27"
  ]
}
```

```json
{
  "id": "participation-bl-2026-27-fcb",
  "competitionId": "competition-bundesliga",
  "seasonId": "season-bundesliga-2026-27",
  "teamId": "team-fcb",
  "status": "active",
  "position": null,
  "points": null,
  "validFrom": "2026-08-01",
  "validTo": "2027-06-30"
}
```

### Team identity and historical team snapshots

Team identity contains relatively stable data. Ratings and tactical state belong
in snapshots so that a simulation can reconstruct a historical team strength:

```json
{
  "id": "team-fcb",
  "canonicalName": "Bayern München",
  "shortName": "FCB",
  "countryCode": "DE",
  "aliases": [
    "FC Bayern München",
    "Bayern Munich"
  ],
  "colors": {
    "primary": "#DC052D",
    "secondary": "#FFFFFF"
  }
}
```

```json
{
  "id": "snapshot-team-fcb-2026-27",
  "teamId": "team-fcb",
  "validFrom": "2026-08-01",
  "validTo": null,
  "rating": {
    "elo": 1985,
    "attack": 88,
    "midfield": 86,
    "defense": 84,
    "goalkeeping": 85,
    "overall": 87
  },
  "style": {
    "possession": 0.64,
    "pressingIntensity": 0.78,
    "directness": 0.42,
    "defensiveLine": 0.81,
    "tempo": 0.74
  },
  "formationPreferences": [
    {
      "formation": "4-2-3-1",
      "usage": 0.58
    },
    {
      "formation": "4-3-3",
      "usage": 0.29
    }
  ],
  "sourceRefs": [
    "source-club-rating-2026-11"
  ]
}
```

### Independent players and many-to-many memberships

Player identity is stored once. Team membership is a separate temporal entity:

```json
{
  "id": "player-000123",
  "canonicalName": "Example Player",
  "dateOfBirth": "1993-07-28",
  "nationalityCodes": [
    "DE"
  ],
  "positions": [
    "ST",
    "CF"
  ],
  "preferredFoot": "right",
  "status": "active"
}
```

```json
{
  "id": "membership-player-000123-team-fcb-2026",
  "playerId": "player-000123",
  "teamId": "team-fcb",
  "role": "player",
  "contractType": "permanent",
  "squadNumber": 9,
  "validFrom": "2026-08-01",
  "validTo": null
}
```

The same player can have additional memberships for a former club, a loan,
reserve team, or national team. Memberships must carry their own validity period
and source references.

### Detailed and historical player data

Player attributes must be snapshots, not mutable fields on the player identity:

```json
{
  "id": "snapshot-player-000123-2026-11",
  "playerId": "player-000123",
  "validFrom": "2026-11-01",
  "validTo": null,
  "scale": {
    "min": 1,
    "max": 20
  },
  "ability": {
    "current": 18,
    "potential": 19,
    "confidence": 0.86
  },
  "attributes": {
    "technical": {
      "finishing": 18,
      "firstTouch": 16,
      "heading": 17,
      "passing": 15,
      "technique": 16
    },
    "mental": {
      "composure": 17,
      "decisions": 16,
      "offTheBall": 18,
      "positioning": 15,
      "teamwork": 14,
      "vision": 17,
      "workRate": 15
    },
    "physical": {
      "acceleration": 12,
      "pace": 11,
      "stamina": 14,
      "strength": 16,
      "jumpingReach": 15
    },
    "goalkeeping": null
  },
  "weaknesses": [
    {
      "type": "acceleration",
      "severity": 0.62,
      "confidence": 0.74
    }
  ],
  "traits": [
    "drops-deep",
    "likes-through-balls"
  ],
  "assessmentType": "scouted",
  "sourceRefs": [
    "source-internal-scouting-2026-11"
  ]
}
```

Every value must be classifiable as one of:

- `observed`: directly measured or observed in a match
- `scouted`: internal assessment
- `derived`: calculated from other data
- `estimated`: explicit estimate
- `imported`: copied from an external source

### Tactical role profiles

Global player attributes are not enough. A player can be excellent as a striker,
usable as an attacking midfielder, and unsuitable as a winger. Store role and
position-specific profiles:

```json
{
  "id": "tactical-profile-000123-advanced-forward-2026",
  "playerId": "player-000123",
  "validFrom": "2026-08-01",
  "validTo": null,
  "role": "advanced-forward",
  "position": "ST",
  "roleFit": 0.91,
  "attributes": {
    "pressing": 0.62,
    "linkUpPlay": 0.89,
    "boxPresence": 0.94,
    "runBehindDefense": 0.58,
    "holdUpPlay": 0.88,
    "counterAttack": 0.72
  },
  "preferredZones": [
    "central-attack",
    "left-half-space",
    "penalty-area"
  ]
}
```

### Chemistry, relationships, and team context

Chemistry must not be reduced to one unexplained team number. Store team-level
factors, pairwise relationships, line units, sample sizes, confidence, and model
versions. Chemistry is normally derived rather than directly observed.

```json
{
  "id": "chemistry-fcb-2026-11",
  "teamId": "team-fcb",
  "validFrom": "2026-11-01",
  "validTo": null,
  "overall": 0.82,
  "factors": {
    "familiarity": 0.88,
    "roleClarity": 0.79,
    "tacticalCoherence": 0.84,
    "leadership": 0.81,
    "morale": 0.76
  },
  "pairwise": [
    {
      "playerA": "player-000123",
      "playerB": "player-000456",
      "affinity": 0.87,
      "passingCompatibility": 0.91,
      "movementCompatibility": 0.83,
      "sampleSize": 24
    }
  ],
  "lineUnits": [
    {
      "unit": "attack",
      "playerIds": [
        "player-000123",
        "player-000456"
      ],
      "cohesion": 0.86
    }
  ],
  "modelVersion": "chemistry-0.1",
  "sourceRefs": [
    "source-derived-match-history-fcb-2026"
  ]
}
```

### Match history and player appearances

Matches are independent records linked to competition, season, and teams.
Player-level performance belongs in appearances:

```json
{
  "id": "match-bl-2026-11-22-fcb-bvb",
  "competitionId": "competition-bundesliga",
  "seasonId": "season-bundesliga-2026-27",
  "dateTime": "2026-11-22T18:30:00+01:00",
  "homeTeamId": "team-fcb",
  "awayTeamId": "team-bvb",
  "status": "finished",
  "score": {
    "home": 3,
    "away": 1
  }
}
```

```json
{
  "id": "appearance-000123-match-fcb-bvb",
  "matchId": "match-bl-2026-11-22-fcb-bvb",
  "playerId": "player-000123",
  "teamId": "team-fcb",
  "started": true,
  "minutes": 94,
  "position": "ST",
  "rating": 8.1,
  "stats": {
    "goals": 1,
    "assists": 0,
    "shots": 5,
    "shotsOnTarget": 3,
    "xg": 0.84,
    "xa": 0.12,
    "passesCompleted": 21,
    "distanceKm": 10.4,
    "sprints": 18
  },
  "heatmapRef": "heatmap-000123-match-fcb-bvb",
  "trackingRef": "tracking-000123-match-fcb-bvb"
}
```

The model must support season aggregates, rolling windows, opponent-specific
statistics, home/away splits, competition splits, position splits, and form
curves without losing the underlying match records.

### Spatial, heatmap, and tracking data

Aggregated heatmaps should be browser-friendly and use an explicit pitch
coordinate system and resolution:

```json
{
  "id": "heatmap-000123-season-2026-27",
  "subjectType": "player",
  "subjectId": "player-000123",
  "scope": "season",
  "seasonId": "season-bundesliga-2026-27",
  "coordinateSystem": "normalized-pitch",
  "resolution": {
    "width": 12,
    "height": 8
  },
  "cells": [
    [0.01, 0.02, 0.04, 0.08],
    [0.03, 0.06, 0.12, 0.18]
  ],
  "normalization": {
    "method": "minutes-weighted",
    "sum": 1.0
  }
}
```

Detailed movement data belongs in a referenced sidecar:

```json
{
  "id": "tracking-000123-match-fcb-bvb",
  "matchId": "match-bl-2026-11-22-fcb-bvb",
  "subjectType": "player",
  "subjectId": "player-000123",
  "coordinateSystem": "normalized-pitch",
  "samplingHz": 10,
  "pointCount": 183420,
  "storage": {
    "format": "jsonl",
    "path": "tracking/match-bl-2026-11-22-fcb-bvb/player-000123.jsonl",
    "compression": "gzip"
  }
}
```

The standard browser export should include heatmap aggregates and tracking
references, not huge raw point streams.

### Historical data and temporal semantics

The governing rule is:

> Never overwrite a historical value. A new assessment or observation creates a
> new snapshot, observation, or version.

This applies to team Elo, team ratings, player attributes, roles, memberships,
squad numbers, positions, chemistry, form, market values, match statistics,
heatmaps, and tracking data.

Use separate timestamps for separate meanings:

```json
{
  "observedAt": "2026-11-22T20:30:00Z",
  "validFrom": "2026-11-22",
  "validTo": "2026-11-29",
  "recordedAt": "2026-11-23T09:00:00Z"
}
```

- `observedAt`: when a performance or fact was observed
- `validFrom` / `validTo`: the period for which a value applies
- `recordedAt`: when the internal tool recorded the value

Correction imports must create a new record/version and retain the original
record with its correction status.

### Provenance and source records

Every imported, observed, estimated, or derived value must be traceable:

```json
{
  "id": "source-internal-scouting-2026-11",
  "type": "internal-observation",
  "provider": "internal-tool",
  "name": "Scouting Bewertung November 2026",
  "retrievedAt": "2026-11-24T12:00:00Z",
  "license": "internal",
  "method": "manual-review",
  "notes": "Interne Bewertung"
}
```

Source records should support URL/provider, retrieval time, license, original
field, normalized field, transformation steps, confidence, limitations, and
attribution requirements. Source licensing must be checked before data is
included in any shareable export.

### Export profiles

The tool must support profile-specific exports:

| Profile | Contents |
|---|---|
| `minimal` | Teams, competition context, Elo, and basic strengths |
| `simulation` | All values required by the simulation engine |
| `detailed` | Player attributes, weaknesses, roles, chemistry, and tactical context |
| `historical` | Matches, appearances, events, aggregates, and form windows |
| `tracking` | Heatmaps, spatial summaries, and tracking references |
| `internal-complete` | All internal data, provenance, source details, and raw references |

Public/user exports must exclude editor audit fields, internal notes, restricted
raw source data, and data that is not licensed for redistribution.

### Validation rules

Before export, the tool must reject or clearly flag:

- duplicate IDs,
- missing references,
- invalid `playerId`, `teamId`, or competition references,
- illegal overlapping exclusive memberships,
- appearances outside the player's valid team membership,
- matches whose teams do not participate in the competition/season,
- lineups outside the relevant squad period,
- heatmap cells that do not match the declared resolution,
- values outside declared numeric ranges,
- percentages outside `0..1`,
- invalid or reversed date intervals,
- unsupported schema versions,
- missing provenance for imported or derived values,
- missing licenses for shareable external data.

## Phases and status

| Phase | Status | Depends on | Outcome / notes |
|---|---|---|---|
| 1. Domain model and ID policy | Not started | — | Stable entities, references, temporal rules, and naming policy |
| 2. Schema and TypeScript contracts | Not started | Phase 1 | Validated canonical JSON format |
| 3. Internal catalog and editor foundation | Not started | Phase 2 | Manage competitions, seasons, teams, and players |
| 4. Memberships and historical snapshots | Not started | Phase 3 | Model transfers, roles, and time-dependent values |
| 5. Match, event, and spatial history | Not started | Phase 4 | Store detailed historical and spatial data |
| 6. Chemistry and derived simulation data | Not started | Phase 5 | Represent team context and derived values |
| 7. Import, validation, and export pipeline | Not started | Phase 2, Phase 6 | Produce safe export profiles and round-trip imports |
| 8. Simulator integration | Not started | Phase 7 | Consume datasets through the dataset store |
| 9. Test fixtures, migration, and documentation | Not started | Phase 7, Phase 8 | Verified rollout and maintainable examples |

## Work items

### Phase 1 — Domain model and ID policy

- [ ] Define the canonical top-level dataset envelope and metadata fields.
- [ ] Define stable ID formats for datasets, competitions, seasons, teams, players,
  memberships, matches, events, snapshots, heatmaps, and provenance records.
- [ ] Define which entities are immutable identity records and which are historical records.
- [ ] Define reference rules: IDs only for relationships; display names never as foreign keys.
- [ ] Define lifecycle states for records such as `active`, `retired`, `unknown`, and `archived`.
- [ ] Define temporal semantics for `validFrom`, `validTo`, `observedAt`, and `recordedAt`.
- [ ] Define whether intervals are inclusive or exclusive and use the rule consistently.
- [ ] Define how unknown, estimated, unavailable, and not-applicable values are represented.
- [ ] Define supported units and coordinate systems for distance, speed, time, and pitch data.
- [ ] Define the public/private boundary between internal editor records and simulator exports.

**Done when:** The entity catalogue, ID policy, relationship rules, temporal rules, and
public/private boundary are reviewed and recorded in the schema documentation.

### Phase 2 — Schema and TypeScript contracts

- [ ] Create the JSON Schema for the dataset envelope.
- [ ] Add schemas for `Competition` and `Season`.
- [ ] Add schemas for `Team`, aliases, colors, and team identity history.
- [ ] Add schemas for `TeamParticipation` and competition membership.
- [ ] Add schemas for `Player` and identity aliases.
- [ ] Add schemas for `PlayerMembership`, transfers, loans, and national-team relationships.
- [ ] Add schemas for `TeamSnapshot` and time-dependent team ratings/style data.
- [ ] Add schemas for `PlayerSnapshot`, attribute groups, weaknesses, traits, and confidence.
- [ ] Add schemas for tactical roles and position-specific player profiles.
- [ ] Add schemas for `Match`, lineups, `MatchAppearance`, and match events.
- [ ] Add schemas for season aggregates and player form windows.
- [ ] Add schemas for heatmaps, normalized pitch coordinates, and spatial summaries.
- [ ] Add schemas for optional tracking references and sidecar file metadata.
- [ ] Add schemas for chemistry snapshots, pairwise relationships, and line units.
- [ ] Add schemas for provenance, source licenses, transformations, and derivation methods.
- [ ] Generate or hand-maintain matching TypeScript types under the engine data layer.
- [ ] Define schema versioning and dataset versioning as separate concepts.
- [ ] Add compatibility rules for optional fields and future schema versions.

**Done when:** A minimal dataset and a fully detailed fixture both validate, and the
TypeScript contracts expose no untyped relationship or history fields.

### Phase 3 — Internal catalog and editor foundation

- [ ] Decide whether the internal tool is a route in this app or a separate protected tool.
- [ ] Create a competition catalogue with country, level, gender, aliases, and seasons.
- [ ] Create season records with start/end dates and competition references.
- [ ] Seed the initial Bundesliga competition and current team index.
- [ ] Add current Bundesliga teams such as Bayern München and Borussia Dortmund using stable IDs.
- [ ] Add team aliases and name history without using aliases as identifiers.
- [ ] Create independent player records separate from team records.
- [ ] Add player aliases, positions, nationality references, and identity status.
- [ ] Implement create, edit, archive, and search workflows for teams and players.
- [ ] Implement duplicate detection for teams and players.
- [ ] Add editor audit fields without exposing them in public exports.
- [ ] Add draft-save and unsaved-change handling to the editor.

**Done when:** An editor user can create and find competitions, seasons, teams, and players
without duplicating a player record when the player changes teams.

### Phase 4 — Memberships and historical snapshots

- [ ] Implement team participation records per competition and season.
- [ ] Implement player-to-team memberships with validity periods and role types.
- [ ] Support permanent transfers, loans, free agents, reserve teams, and national teams.
- [ ] Validate that exclusive club memberships do not overlap unlawfully.
- [ ] Allow a player to have valid memberships in different competition contexts.
- [ ] Implement team identity/name snapshots for historical changes.
- [ ] Implement team strength snapshots with Elo, attack, midfield, defense, and goalkeeper values.
- [ ] Implement player attribute snapshots with technical, mental, physical, and goalkeeping groups.
- [ ] Implement current ability, potential, confidence, and assessment type.
- [ ] Implement historical tactical role profiles and role-fit values.
- [ ] Prevent updates from overwriting snapshots that are already referenced by history.
- [ ] Add effective-date filtering to the editor and export pipeline.
- [ ] Add validation for gaps, overlaps, invalid dates, and future-dated records.

**Done when:** A player can be assigned to multiple teams over time and the application can
reconstruct the correct team, attributes, and role for any supported historical date.

### Phase 5 — Match, event, and spatial history

- [ ] Create match records independent of player records.
- [ ] Link matches to competitions, seasons, dates, teams, venues, and statuses.
- [ ] Create lineup and match-appearance records with team and player references.
- [ ] Record starts, substitutions, minutes, positions, roles, and formation context.
- [ ] Define a normalized event model for goals, assists, cards, shots, passes, and substitutions.
- [ ] Add event timestamps, periods, locations, actors, and related-player references.
- [ ] Add per-match player statistics including xG, xA, shots, passes, distance, and sprints.
- [ ] Add season, rolling-window, opponent, home/away, and competition aggregates.
- [ ] Define append-only correction/version rules for imported historical matches.
- [ ] Add player and team heatmap records for match, season, and rolling-window scopes.
- [ ] Add average positions, zones, movement summaries, and role-zone references.
- [ ] Define tracking sidecar references for large point streams.
- [ ] Define downsampling and aggregation rules for browser exports.
- [ ] Validate that appearances, events, teams, and memberships are temporally consistent.

**Done when:** A fixture containing multiple matches can produce player history, team history,
aggregates, heatmaps, and optional tracking references without embedding large raw streams
in the default browser export.

### Phase 6 — Chemistry and derived simulation data

- [ ] Define which chemistry values are observed, manually assessed, or derived.
- [ ] Add team chemistry snapshots with overall and factor-level scores.
- [ ] Add pairwise player affinity with sample size, confidence, and validity period.
- [ ] Add line-unit chemistry for goalkeeper, defense, midfield, and attack groups.
- [ ] Add tactical coherence, role clarity, familiarity, morale, and leadership factors.
- [ ] Add formation experience and player-role compatibility.
- [ ] Document derivation formulas and input references for every derived value.
- [ ] Keep derived values reproducible from source data where practical.
- [ ] Add model version fields so changes to formulas do not invalidate old exports.
- [ ] Prevent derived values from being mistaken for directly observed facts.

**Done when:** The dataset can express team context and chemistry for a historical date,
with enough metadata to distinguish measured, estimated, and model-generated values.

### Phase 7 — Import, validation, and export pipeline

- [ ] Implement canonical dataset parsing with explicit schema-version handling.
- [ ] Implement structural validation for JSON shape and required fields.
- [ ] Implement referential validation for every entity relationship.
- [ ] Implement temporal and domain validation for dates, intervals, ranges, and units.
- [ ] Implement provenance validation for imported, estimated, and derived values.
- [ ] Return actionable validation errors with JSON paths and record IDs.
- [ ] Implement browser import for a single JSON dataset.
- [ ] Implement optional ZIP import for split JSON and tracking sidecars.
- [ ] Implement export profiles: `minimal`, `simulation`, `detailed`, `historical`,
  `tracking`, and `internal-complete`.
- [ ] Exclude editor-only metadata and restricted raw source data from public profiles.
- [ ] Add deterministic export ordering for stable diffs and reproducible files.
- [ ] Add export metadata including dataset version, schema version, generated timestamp,
  profile, and source summary.
- [ ] Implement round-trip import/export tests.
- [ ] Define maximum browser export size and a clear fallback for larger datasets.

**Done when:** Valid datasets can be exported and re-imported without losing references,
history, or supported optional data, while invalid datasets fail clearly.

### Phase 8 — Simulator integration

- [ ] Add the validated dataset types to the engine data layer.
- [ ] Replace direct access to hardcoded real club data with dataset references.
- [ ] Add fictional defaults only for the public fallback dataset.
- [ ] Implement the dataset store and local persistence according to
  [DATA_SEPARATION.md](/Users/kram030/git/felix-kramer-com/docs/DATA_SEPARATION.md).
- [ ] Add import and export actions to the shared dataset manager UI.
- [ ] Add loaded dataset name, version, profile, and user-provided status to the UI.
- [ ] Add an empty state and import call-to-action when no usable dataset is loaded.
- [ ] Pass the active dataset explicitly to `/match`, `/league`, `/tournament`, `/bracket`,
  and `/draft` simulations.
- [ ] Ensure the engine consumes current values and history through typed adapters.
- [ ] Add model adapters for Elo, player ability, form, chemistry, and spatial inputs.
- [ ] Add a visible disclaimer and update the privacy text for local-only datasets.
- [ ] Verify that no real club or player data remains bundled in public defaults.

**Done when:** Every simulator works with a validated user dataset or fictional default,
and no simulator depends on an embedded real-club dataset.

### Phase 9 — Test fixtures, migration, and documentation

- [ ] Create a minimal fictional fixture with two teams and no players.
- [ ] Create a detailed fictional fixture with team and player snapshots.
- [ ] Create a transfer fixture proving many-to-many memberships and historical reconstruction.
- [ ] Create a match-history fixture with appearances, events, aggregates, and heatmaps.
- [ ] Create a chemistry fixture with pairwise and line-unit relationships.
- [ ] Create a tracking-reference fixture with a compressed sidecar declaration.
- [ ] Add tests for duplicate IDs and missing references.
- [ ] Add tests for overlapping memberships and invalid historical intervals.
- [ ] Add tests for invalid attribute ranges and heatmap dimensions.
- [ ] Add tests for provenance and license metadata requirements.
- [ ] Add tests for each export profile and restricted-field removal.
- [ ] Add tests for browser persistence and import/export round trips.
- [ ] Define migration from existing `clubs.json`, `players.json`, and `nations.json`.
- [ ] Convert only fictional or permitted data into public defaults.
- [ ] Document supported source types, licensing checks, and attribution requirements.
- [ ] Document how the internal tool produces a simulator-ready export.
- [ ] Update the data-separation proposal when implementation decisions differ.

**Done when:** The fixture suite covers the supported domain rules, migration is repeatable,
and the implementation documentation matches the shipped behavior.

## Risks and open decisions

| Item | Impact / options | Owner | Status |
|---|---|---|---|
| Internal tool location | Build inside this SvelteKit app or as a separate protected application | Owner | Open |
| Storage for detailed data | Browser JSON for small exports; ZIP/object storage for large tracking data | Owner | Open |
| Attribute scale | Use 1–20, 0–100, or store both raw and normalized values | Owner | Open |
| Tracking granularity | Store aggregates only or allow referenced raw point streams | Owner | Open |
| Chemistry model | Manual values first, derived model later, or both with model versions | Owner | Open |
| Current league catalogue | Manual seed, permitted import, or internal maintenance workflow | Owner | Open |
| Source licensing | Some public sources may not permit redistribution or automated retrieval | Owner | Open |
| Identity matching | Manual confirmation may be required for players with duplicate names | Owner | Open |
| Schema evolution | Maintain backward readers for v1 exports or require migrations | Owner | Open |
| Browser limits | Large datasets may require IndexedDB or sidecar files instead of localStorage | Owner | Open |

## Validation and completion

- [ ] Run the schema validator against minimal and detailed fixtures.
- [ ] Run type-checking and focused unit tests for the data layer.
- [ ] Run import/export round-trip tests for every supported profile.
- [ ] Run referential and temporal consistency tests.
- [ ] Run the simulator smoke tests with a fictional dataset.
- [ ] Run the simulator smoke tests with a detailed historical dataset.
- [ ] Verify that public builds contain no prohibited real-data bundle.
- [ ] Verify that browser persistence does not send dataset contents to a server.
- [ ] Review source licenses and attribution before adding any real external data.
- [ ] Update this plan with completed phases, evidence, and remaining risks.
- [ ] Mark the plan **Complete** only after all success criteria are verified.

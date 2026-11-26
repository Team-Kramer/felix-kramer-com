# Data Separation — User-Provided Datasets

**Status:** Implemented through M9; final hosted profile verification pending  
**Ziel:** Klare Trennung zwischen Simulations-Engine, internem Erstellungstool und realen Vereins-/Liga-Daten  
**Motivation:** Rechtliche Entkopplung, detaillierte mathematische Modelle und private Weitergabe von Nutzer-Datasets

Diese Dokumentation beschreibt die Produkt- und Architekturgrenzen. Die
verbindlichen Umsetzungsschritte stehen in
[PLAN.md](/Users/kram030/git/felix-kramer-com/docs/PLAN.md).

---

## 1. Zielbild

| Schicht | Verantwortung | Quelle |
|---|---|---|
| **Engine** | Reine Mathematik: Poisson, Elo, Monte-Carlo, Formationen, Draft-Logik, Form, Chemie | Repo (`src/lib/engine/`) |
| **Schema & Types** | Versioniertes JSON-Schema und TypeScript-Verträge | Repo |
| **Interner Katalog** | Wettbewerbe, Saisons, Teams, Spieler, Beziehungen und Historie pflegen | Internes Erstellungstool |
| **Default-Daten** | Kleine fiktive oder anonymisierte Beispiel-Ligen | Repo |
| **Reale Daten** | Vereinsnamen, Spieler, Stärken, Schwächen, Historie und Tracking | Nutzer / internes Tool |
| **Browser-Dataset** | Validierter Import, lokaler State und Simulator-Eingaben | Nutzergerät |
| **Sharing** | Private Datei-Links, zum Beispiel Drive, Dropbox oder OneDrive | Nutzer |

Die öffentliche Engine kennt keine hardcodierten realen Vereins- oder
Spielerdaten. Der Simulator erhält Daten ausschließlich über ein validiertes
Dataset.

Das Dataset ist kein einfaches `teams[]`-/`players[]`-Dokument, sondern ein
**normalisiertes, zeitabhängiges Dataset**:

- Identitäten werden unabhängig von Beziehungen gespeichert.
- Namen werden nie als Referenzen verwendet.
- Team- und Spielerwerte werden als historische Snapshots gespeichert.
- Beziehungen wie Spieler-Team-Zuordnungen besitzen Gültigkeitszeiträume.
- Match-, Spatial-, Chemie- und Quelleninformationen sind eigene Entitäten.
- Historische Werte werden nie überschrieben.

---

## 2. Canonical JSON-Format

### 2.1 Dataset-Hülle

Das Canonical Format ist für kleine und browsergeeignete Exporte eine einzelne
JSON-Datei:

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

`schemaVersion` beschreibt den technischen Vertrag. `datasetVersion` beschreibt
eine konkrete Datenveröffentlichung. Beide Versionen werden unabhängig erhöht.

### 2.2 Große Exporte

Für große interne Datasets ist zusätzlich ein ZIP-Format erlaubt:

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

Das interne Tool darf Daten getrennt verwalten und beim Export zu einer
Canonical-JSON-Datei zusammenführen. Große Tracking-Punktströme werden nicht in
den Standardexport eingebettet, sondern als komprimierte Sidecar-Dateien
referenziert.

### 2.3 Exportprofile

Der Exporter unterstützt Profile, damit der Simulator nicht unnötig interne oder
große Daten erhält:

| Profil | Inhalt |
|---|---|
| `minimal` | Teams, Wettbewerbskontext, Elo und Basisstärken |
| `simulation` | Alle für die Engine benötigten Werte |
| `detailed` | Spielerattribute, Schwächen, Rollen, Chemie und taktischer Kontext |
| `historical` | Matches, Aufstellungen, Events, Aggregate und Formfenster |
| `tracking` | Heatmaps, räumliche Zusammenfassungen und Tracking-Referenzen |
| `internal-complete` | Alle internen Daten einschließlich Provenance und Rohreferenzen |

Öffentliche oder mit anderen Personen geteilte Exporte enthalten niemals
Editor-Auditfelder, interne Notizen oder nicht zur Weitergabe freigegebene
Rohdaten.

---

## 3. Datenmodell

### 3.1 Stabile IDs

Namen sind reine Anzeigeinformationen und dürfen keine Primär- oder
Fremdschlüssel sein. Ein Team kann „Bayern München“, „FC Bayern“ oder
„Bayern Munich“ heißen, behält aber dieselbe ID.

Beispiele:

```text
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

Aliase und historische Namen werden als Daten mit Gültigkeitszeitraum
gespeichert; sie erzeugen keine neuen Identitäten.

### 3.2 Wettbewerbe, Saisons und Teilnahmen

Eine Liga wird nicht durch eine statische Liste aktueller Teams repräsentiert.
Wettbewerbe, Saisons und Teamteilnahmen sind getrennt:

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

Damit werden Auf- und Abstiege, historische Ligen und mehrere Wettbewerbe
korrekt abbildbar.

### 3.3 Teams und Team-Snapshots

Die Team-Identität enthält relativ konstante Stammdaten:

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

Elo, Stärken, Stil und bevorzugte Formationen gehören in einen zeitabhängigen
Snapshot:

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

### 3.4 Unabhängige Spieler und n:m-Beziehungen

Spieler werden einmalig definiert:

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

Die Teamzugehörigkeit wird separat und zeitabhängig verwaltet:

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

Weitere Memberships können frühere Vereine, Leihen, zweite Mannschaften und
Nationalmannschaften abbilden. So bleiben Transfers, historische Kader und
Mehrfachzuordnungen möglich, ohne Spieler zu duplizieren.

### 3.5 Spielerattribute und Rollen

Technische, mentale, physische und Torwartattribute werden als Snapshots
gespeichert. Jede Bewertung kann Herkunft, Confidence und Bewertungstyp tragen:

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

Rollenprofile ergänzen die globalen Werte, weil ein Spieler je nach Position
unterschiedlich geeignet sein kann:

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

Bewertungstypen werden unterschieden:

- `observed`: direkt beobachtet oder statistisch gemessen
- `scouted`: interne Bewertung
- `derived`: aus anderen Daten berechnet
- `estimated`: explizite Schätzung
- `imported`: aus externer Quelle übernommen

### 3.6 Teamchemie und taktischer Kontext

Chemie ist keine einzelne, unerklärte Zahl. Das Modell unterstützt Teamfaktoren,
Paarbeziehungen, Linien, Rollenkompatibilität, Stichprobengrößen, Confidence und
Modellversionen:

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

### 3.7 Match-, Saison- und Positionshistorie

Matches sind unabhängig von Spielern und werden mit Wettbewerb, Saison und Teams
verknüpft:

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

Spielerleistungen werden in eigenen Appearance-Records gespeichert:

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

Das Modell muss aus den Einzelspielen Saisonaggregate, Formfenster,
Gegnerstatistiken, Heim-/Auswärts-Splits, Wettbewerbs-Splits und
Positions-Splits erzeugen können, ohne die Einzelspiele zu entfernen.

### 3.8 Heatmaps, Laufwege und Tracking

Aggregierte Heatmaps sind browsergeeignet und deklarieren Koordinatensystem und
Auflösung:

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

Roh- oder hochauflösende Trackingdaten werden referenziert:

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

Der Standardexport enthält Aggregate und Referenzen, nicht große Punktströme.

### 3.9 Zeit und Historie

Die zentrale Regel lautet:

> Historische Werte werden niemals überschrieben. Jede neue Beobachtung,
> Bewertung oder Korrektur erzeugt einen neuen Snapshot bzw. eine neue Version.

Das betrifft Team-Elo, Teamstärken, Spielerattribute, Rollen,
Vereinszugehörigkeit, Kadernummer, Position, Chemie, Form, Marktwerte,
Matchstatistiken, Heatmaps und Trackingdaten.

Die Zeitfelder haben unterschiedliche Bedeutungen:

```json
{
  "observedAt": "2026-11-22T20:30:00Z",
  "validFrom": "2026-11-22",
  "validTo": "2026-11-29",
  "recordedAt": "2026-11-23T09:00:00Z"
}
```

- `observedAt`: Zeitpunkt der Beobachtung
- `validFrom` / `validTo`: Zeitraum, für den der Wert gilt
- `recordedAt`: Zeitpunkt der Erfassung im internen Tool

Korrekturen bleiben nachvollziehbar und erzeugen eine neue Version mit
Korrekturstatus, statt den ursprünglichen Datensatz still zu ersetzen.

### 3.10 Provenance und Quellen

Jeder importierte, beobachtete, geschätzte oder abgeleitete Wert muss auf eine
Quelle oder eine Berechnung verweisen:

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

Quellen können URL/Anbieter, Abrufzeitpunkt, Lizenz, Originalfeld,
normalisiertes Zielfeld, Transformationsschritte, Confidence, Einschränkungen
und Attributionsanforderungen dokumentieren. Eine Quelle muss vor der Aufnahme
in einen teilbaren Export auf Weitergaberechte geprüft werden.

---

## 4. Interne Module und Erstellungstool

Die öffentliche Engine bleibt von Rohdaten und Editorlogik getrennt:

```text
src/lib/engine/
├── data/
│   ├── defaults/
│   │   ├── fictional-league.json
│   │   └── example-nations.json
│   ├── schema.ts
│   └── index.ts
├── dataset/
│   ├── store.svelte.ts
│   ├── import.ts
│   ├── export.ts
│   ├── storage.ts
│   ├── validation.ts
│   └── types.ts
└── models/
    ├── team-rating.ts
    ├── player-ability.ts
    ├── form.ts
    ├── chemistry.ts
    └── spatial.ts
```

Das interne Erstellungstool benötigt zusätzlich Funktionen für:

- Wettbewerbs- und Saisonkataloge
- initiale Bundesliga-Teamindizes, zum Beispiel Bayern München und Borussia Dortmund
- Team-Aliase und historische Namen
- unabhängige Spieleridentitäten
- Transfers, Leihen, zweite Mannschaften und Nationalmannschaften
- Team- und Spieler-Snapshots
- Match-, Saison- und Positionshistorien
- Heatmaps und Tracking-Referenzen
- Chemie- und taktische Profile
- Quellen-, Lizenz- und Auditdaten
- profilbasierte Exporte

Ob das Tool als geschützte Route in dieser Anwendung oder als separate interne
Anwendung entsteht, bleibt eine offene Architekturentscheidung.

---

## 5. Persistenz und Browser-Store

- Primär: `localStorage` mit Key `fk-dataset-v1` für kleine Datasets
- Fallback für große Datasets: `IndexedDB`
- ZIP-/Sidecar-Import für Trackingdaten
- Beim App-Start: vorhandenes User-Dataset laden, sonst fiktiven Default laden
- Import: Datei lesen → Schema validieren → Referenzen und Zeiträume prüfen → speichern
- Export: aktives Dataset → ausgewähltes Exportprofil → JSON-Download
- Fehler werden mit JSON-Pfad und Record-ID sichtbar angezeigt

Beispiel für den Store:

```typescript
// src/lib/engine/dataset/store.svelte.ts
let currentDataset = $state<Dataset | null>(null);
let isUserDataset = $state(false);

export function loadDefault() { /* fictional default */ }
export function importDataset(file: File) { /* parse and validate */ }
export function exportDataset(profile: ExportProfile) { /* download */ }
export function clearDataset() { /* clear local state and storage */ }
```

---

## 6. Validierung

Vor dem Export bzw. beim Import müssen mindestens folgende Regeln geprüft werden:

- alle IDs sind eindeutig,
- alle Referenzen zeigen auf existierende Objekte,
- Spieler- und Teamreferenzen sind gültig,
- exklusive Membership-Zeiträume überschneiden sich nicht unzulässig,
- Auftritte liegen innerhalb der relevanten Teamzugehörigkeit,
- Matchteams nehmen am Wettbewerb und an der Saison teil,
- Aufstellungen passen zum historischen Kaderzeitraum,
- Heatmap-Auflösung und Zellanzahl stimmen überein,
- numerische Werte liegen in gültigen Bereichen,
- Prozentwerte liegen zwischen `0` und `1`,
- Datumsintervalle sind gültig und chronologisch,
- die Schema-Version wird unterstützt,
- importierte und abgeleitete Werte haben Provenance,
- teilbare externe Daten besitzen eine geprüfte Lizenz,
- Korrekturen überschreiben keine historischen Datensätze.

---

## 7. UI-Änderungen

Neue gemeinsame Komponente `DatasetManager.svelte`:

- Button **„JSON importieren“**
- optionaler Button **„ZIP importieren“**
- Auswahl des Exportprofils
- Button **„Aktuelle Liga exportieren“**
- Anzeige von Dataset-Name, Dataset-Version und Schema-Version
- Anzeige des Status „User-provided“
- Anzeige von Validierungsfehlern mit Feldpfad und Record-ID
- Empty-State mit Import-CTA, wenn kein gültiges Dataset geladen ist
- Hinweis zum privaten Teilen:

> Lade die exportierte JSON- oder ZIP-Datei in deinen privaten Google-Drive-,
> Dropbox-, iCloud- oder OneDrive-Ordner hoch und teile den Link nur mit den
> gewünschten Personen.

Alle Simulatoren (`/match`, `/league`, `/tournament`, `/bracket`, `/draft`)
erhalten den aktiven Datensatz ausschließlich über den Store.

---

## 8. Migration bestehender Daten

| Datei / Bereich | Aktion |
|---|---|
| `clubs.json` | Reale Clubs aus dem Bundle entfernen; nur fiktive oder zulässige Beispielteams als Default behalten |
| `nations.json` | Vorläufig nur als separat bewerteter Katalog verwenden; langfristig ebenfalls in das Dataset-Modell überführen |
| `players.json` | Synthetische Spieler in unabhängige `players` und `memberships` überführen |
| `scripts/curate-data.mjs` | Nur fiktive Defaults und zulässige Beispiel-Datasets erzeugen |
| bestehende Teamwerte | In `teamSnapshots` migrieren, nicht direkt auf `teams` hängen |
| bestehende Spielerwerte | In `playerSnapshots` und gegebenenfalls `tacticalProfiles` migrieren |
| bestehende Matchdaten | In `matches`, `matchAppearances`, `events` und Aggregate aufteilen |

Als erstes Referenzdataset dienen die Bundesliga, Bayern München,
Borussia Dortmund, drei bis fünf synthetische Spieler und zwei synthetische
historische Matches. Reale Daten werden erst nach Prüfung der Quelle und
Weitergaberechte verwendet.

---

## 9. Rechtliche und Produkttexte

### 9.1 Sichtbarer Disclaimer

> Dieser Simulator ist ein allgemeines Berechnungswerkzeug.
>
> Er enthält standardmäßig keine realen Vereins- oder Spielerdaten.
>
> Alle realen Namen, Werte und historischen Daten werden ausschließlich vom
> Nutzer selbst importiert und nur lokal im Browser verarbeitet.
>
> Der Betreiber stellt keine geschützten Daten bereit und lädt keine realen
> Daten automatisch von externen Quellen nach.

### 9.2 Impressum / Datenschutz

> Es werden keine zentralen Nutzer-Ligen, Vereins-, Spieler- oder
> Trackingdaten auf dem Server gespeichert. Importierte Datasets verbleiben
> ausschließlich im lokalen Speicher des Browsers des jeweiligen Nutzers.

Die Formulierung muss angepasst werden, falls später ein internes oder
serverseitiges Erstellungstool mit eigener Speicherung eingeführt wird.

---

## 10. Sharing-Flow

1. Nutzer erstellt oder importiert ein Dataset im internen Tool oder Browser.
2. Der Datensatz wird validiert.
3. Nutzer wählt ein Exportprofil, zum Beispiel `simulation` oder `detailed`.
4. Nutzer exportiert JSON oder bei großen Daten ZIP.
5. Datei wird in einen privaten Cloud-Ordner geladen.
6. Privater Freigabe-Link wird erzeugt.
7. Empfänger lädt die Datei herunter.
8. Empfänger importiert sie über `DatasetManager.svelte`.

Kein Account-System, kein öffentliches Dataset-Repository und keine zentrale
Haltung von Nutzer-Datasets sind Teil dieser Phase.

---

## 11. Implementierungsreihenfolge

Die detaillierten Checkboxen und Abhängigkeiten stehen in
[PLAN.md](/Users/kram030/git/felix-kramer-com/docs/PLAN.md). Die fachliche
Reihenfolge ist:

1. Domainmodell, stabile IDs und zeitliche Regeln
2. JSON-Schema und TypeScript-Typen
3. Wettbewerbs-, Saison-, Team- und Spielerkatalog
4. n:m-Memberships und historische Snapshots
5. Match-, Event-, Aggregat- und Positionshistorie
6. Heatmaps, Laufwege und Tracking-Referenzen
7. Chemie-, Rollen- und abgeleitete Modellwerte
8. Import-, Validierungs- und Exportpipeline
9. Dataset-Store und lokale Persistenz
10. `DatasetManager.svelte` und Simulatorintegration
11. Migration der bestehenden Daten
12. Tests mit minimalem, detailliertem und historischem Referenzdataset

---

## 12. Nicht-Ziele

- Kein serverseitiges Speichern von User-Datasets
- Kein öffentliches Dataset-Repository
- Kein automatisches Nachladen realer Daten von externen APIs
- Kein Account-System in dieser Phase
- Keine Weitergabe interner Rohdaten oder Editor-Notizen in öffentlichen Exportprofilen
- Keine Vermischung von Rohdaten, abgeleiteten Werten und Simulatorparametern ohne Provenance

---

## 13. Offene Entscheidungen

- Wird das interne Erstellungstool eine geschützte Route oder eine separate Anwendung?
- Wird für große Datasets IndexedDB, ein ZIP-Export oder beides verwendet?
- Werden Attribute primär auf einer 1–20-Skala, 0–100-Skala oder in beiden Skalen gespeichert?
- Wie viel Roh-Tracking wird gehalten und wie viel wird nur aggregiert?
- Wird Teamchemie zuerst manuell erfasst, abgeleitet oder parallel auf beide Arten geführt?
- Wie wird der aktuelle Ligaindex gepflegt: manuell, über zulässige Importe oder intern kuratiert?
- Welche öffentlichen Quellen dürfen technisch und rechtlich importiert bzw. geteilt werden?
- Wie werden Spieler mit gleichen Namen und unvollständiger Identität bestätigt?
- Werden ältere Schema-Versionen direkt gelesen oder über explizite Migrationen aktualisiert?
- Wird Drag-and-Drop zusätzlich zum File-Picker benötigt?

**Nächster Schritt:**  

Die Checkboxen in [PLAN.md](/Users/kram030/git/felix-kramer-com/docs/PLAN.md)
schrittweise abarbeiten und zuerst das synthetische Referenzdataset mit
Bundesliga, Bayern, Dortmund, drei bis fünf Spielern und zwei historischen
Matches implementieren. Dieses Dataset validiert IDs, Zeiträume,
n:m-Beziehungen, Historie und Exportprofile, bevor reale Daten verwendet werden.

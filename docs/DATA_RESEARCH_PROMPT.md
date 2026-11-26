# Research Prompt — Öffentliche Fußball-Datenquellen

## Auftrag

Du recherchierst öffentliche, technisch und rechtlich nutzbare Datenquellen für
ein browser-only Fußballsimulationsspiel von `felix-kramer.com`.

Ziel ist ein vollständiges, versioniertes Dataset für die Bundesliga-Saison
2026/27 mit:

- Wettbewerben und Saisons
- Teams und Teamhistorie
- unabhängigen Spielern
- Team-Spieler-Memberships mit Gültigkeitszeiträumen
- Spielerattributen
- Teamstärken und Elo-Werten
- Matchhistorie
- Aufstellungen und Einwechslungen
- Spieler-Matchstatistiken
- Toren, Assists, Karten und Schüssen
- xG und xA
- Saisonaggregaten
- Formkurven
- Heatmaps und Positionsdaten
- Lauf- und Trackingdaten, soweit öffentlich verfügbar
- Quellen, Lizenzen, Abrufzeitpunkten und Transformationsschritten

## Regeln

- Keine unautorisierten API-Aufrufe.
- Kein Scraping, wenn Nutzungsbedingungen dies verbieten.
- Keine Quelle als frei nutzbar bewerten, ohne Lizenz und Terms of Use zu prüfen.
- Unbekannte oder nicht dokumentierte APIs ausdrücklich als Risiko markieren.
- Keine realen Daten herunterladen oder in ein Repository übernehmen.
- Zuerst nur recherchieren, bewerten und dokumentieren.
- Jede Aussage mit konkreten URLs und Abrufdatum belegen.
- Recherchiere den aktuellen Stand zum Datum `2026-11-25`.
- Keine Endpunkte erfinden. Nicht verifizierbare Endpunkte als `unverified` markieren.

Unterscheide bei jeder Quelle ausdrücklich zwischen:

1. technisch erreichbar,
2. intern nutzbar,
3. in einem Nutzerexport weitergebbar.

## Ziel-Datenmodell

Das Dataset ist normalisiert und zeitabhängig. Verwende keine Team- oder
Spielernamen als Fremdschlüssel.

Relevante Entitäten:

- `Dataset`
- `Competition`
- `Season`
- `Team`
- `TeamParticipation`
- `Player`
- `PlayerMembership`
- `TeamSnapshot`
- `PlayerSnapshot`
- `TacticalProfile`
- `Match`
- `MatchAppearance`
- `Event`
- `SeasonAggregate`
- `FormWindow`
- `Heatmap`
- `TrackingReference`
- `ChemistrySnapshot`
- `ProvenanceRecord`

Historische Werte dürfen nicht überschrieben werden. Neue Werte werden als neue
Snapshots oder Beobachtungen mit Zeitangaben gespeichert.

## Zu untersuchende Quellen und Endpunkte

### 1. football-data.co.uk

Untersuche insbesondere:

```text
https://www.football-data.co.uk/mmz4281/2627/D1.csv
https://www.football-data.co.uk/mmz4281/2526/D1.csv
https://www.football-data.co.uk/mmz4281/2425/D1.csv
```

Prüfe:

- Bundesliga-Spielplan und Ergebnisse
- Heim- und Auswärtsteam
- Tore und Halbzeitstände
- Karten und Schüsse, falls vorhanden
- historische Saisons
- CSV-Spalten und Datentypen
- Lizenz und erlaubte Weiterverwendung
- Aktualisierungsfrequenz
- automatisierte Downloads
- Eignung als Primär- oder Ergänzungsquelle

### 2. OpenLigaDB

Untersuche:

```text
https://api.openligadb.de/getmatchdata/bl1/2026
https://api.openligadb.de/getmatchdata/bl1/2026/1
```

Prüfe:

- Saison- und Spieltagssyntax
- Match-IDs
- Teams
- Termine
- Ergebnisse
- Torschützen
- Spieltage
- Bundesliga-Historie
- API-Limits
- Lizenz und Terms of Use
- Eignung für automatisierte Imports

Dokumentiere einen echten Response und mappe die Felder auf:

```text
Competition
Season
Match
Team
Event
```

### 3. football-data.org

Untersuche:

```text
https://api.football-data.org/v4/competitions/BL1
https://api.football-data.org/v4/competitions/BL1/matches?season=2026
https://api.football-data.org/v4/competitions/BL1/standings?season=2026
https://api.football-data.org/v4/competitions/BL1/teams?season=2026
```

Prüfe:

- API-Key
- kostenloses Kontingent
- private interne Nutzung
- Weitergabe und Redistribuierung
- Wettbewerbs- und Saisonabdeckung
- Matches
- Tabellen
- Teams
- Aufstellungen
- Scorer
- Karten
- Spielerinformationen
- Rate Limits
- Caching
- Attribution
- Verfügbarkeit der Bundesliga 2026/27

### 4. API-Football / API-Sports

Untersuche:

```text
https://v3.football.api-sports.io/leagues?id=78
https://v3.football.api-sports.io/fixtures?league=78&season=2026
https://v3.football.api-sports.io/fixtures?id={fixture_id}
https://v3.football.api-sports.io/fixtures/events?fixture={fixture_id}
https://v3.football.api-sports.io/fixtures/lineups?fixture={fixture_id}
https://v3.football.api-sports.io/players?league=78&season=2026
https://v3.football.api-sports.io/players/topscorers?league=78&season=2026
https://v3.football.api-sports.io/players/topassists?league=78&season=2026
```

Prüfe:

- Bundesliga-League-ID
- Saisonkonvention
- API-Key und Tarifmodell
- kostenloses Kontingent
- Player-Historie
- Aufstellungen
- Events
- Verletzungen
- xG
- Heatmaps und Tracking
- Rate Limits
- Caching
- Nutzungs- und Redistribuierungsrechte
- Eignung für interne Daten und Nutzerexports

Bewerte für jedes Feld, ob es in einem öffentlichen JSON-Export enthalten sein
darf.

### 5. StatsBomb Open Data

Untersuche:

```text
https://github.com/statsbomb/open-data
https://raw.githubusercontent.com/statsbomb/open-data/master/data/competitions.json
https://raw.githubusercontent.com/statsbomb/open-data/master/data/matches/{competition_id}/{season_id}.json
https://raw.githubusercontent.com/statsbomb/open-data/master/data/events/{match_id}.json
https://raw.githubusercontent.com/statsbomb/open-data/master/data/lineups/{match_id}.json
```

Prüfe:

- verfügbare Wettbewerbe und Saisons
- Bundesliga-Abdeckung
- Event-Schema
- Pässe
- Schüsse
- xG
- Carries
- Pressures
- Positionen
- Aufstellungen
- Heatmap-Ableitungen
- Lizenz und Attribution
- erlaubte Transformationen
- Weitergabe in abgeleiteten Datasets

Erstelle Feldmapping für:

```text
event
pass
shot
carry
pressure
location
player
lineup
```

### 6. ClubElo

Untersuche die öffentliche Seite und offiziell dokumentierte Abrufmöglichkeiten:

```text
https://clubelo.com/
https://clubelo.com/GER
https://clubelo.com/2026-11-25/GER
```

Suche nach offiziellen CSV-, JSON- oder API-Endpunkten.

Prüfe:

- Team-Elo
- historische Elo-Werte
- Datumsauflösung
- Teamidentitäten
- Wettbewerbe
- Downloadmöglichkeiten
- Terms of Use
- Speicherung und Weitergabe
- Eignung für `TeamSnapshot`
- Mapping der Teamnamen auf stabile IDs

Nicht offiziell dokumentierte Endpunkte dürfen nur als `unverified` bezeichnet
werden und nicht als Produktionsintegration empfohlen werden.

### 7. Understat

Untersuche:

```text
https://understat.com/league/Bundesliga/2026
```

Prüfe, ob ein offiziell dokumentierter API-Zugang existiert.

Untersuche:

- xG
- xA
- Schüsse
- Spielerstatistiken
- Matchhistorie
- Teamstatistiken
- historische Saisons
- Datenformat
- JavaScript- oder interne Endpunkte
- Nutzungsbedingungen
- Scraping-Risiken
- lokale Speicherung
- Weitergabe in Nutzerexports

Undokumentierte JSON-Endpunkte dürfen nur als technische Beobachtung genannt
werden, nicht als empfohlene Produktionsquelle.

### 8. FBref / Stathead

Untersuche:

```text
https://fbref.com/en/comps/20/Bundesliga-Stats
https://fbref.com/en/comps/20/2026-2027/standard/2026-2027-Bundesliga-Stats
```

Prüfe:

- aktuelle und historische Bundesliga-Statistiken
- Spielerbasisdaten
- Teamstatistiken
- Schüsse
- Passdaten
- Torhüterdaten
- Advanced Stats
- Exportmöglichkeiten
- `robots.txt`
- Terms of Service
- Rate Limits
- kommerzielle Nutzung
- Weitergabe
- Eignung als manuelle oder automatisierte Quelle

### 9. SofaScore

Untersuche nur offizielle API- oder Exportmöglichkeiten. Folgende
Endpunktfamilien sind als mögliche, aber möglicherweise nicht öffentliche
Kandidaten zu verifizieren:

```text
https://www.sofascore.com/api/v1/unique-tournament/{tournament_id}/seasons
https://www.sofascore.com/api/v1/unique-tournament/{tournament_id}/season/{season_id}/events/last/0
https://www.sofascore.com/api/v1/event/{event_id}/lineups
https://www.sofascore.com/api/v1/event/{event_id}/statistics
https://www.sofascore.com/api/v1/event/{event_id}/graph
https://www.sofascore.com/api/v1/player/{player_id}/statistics/season
```

Prüfe:

- offizielle Dokumentation
- Terms of Service
- `robots.txt`
- automatisierte Nutzung
- Speicherung
- Weitergabe
- API-Stabilität
- Heatmaps und Laufdaten

Geschützte oder undokumentierte Endpunkte dürfen nicht als
Produktionsintegration empfohlen werden.

### 10. Kaggle, GitHub und Open Data

Suche nach Datensätzen zu:

- Bundesliga-Ergebnissen
- historischen Aufstellungen
- Eventdaten
- Spielerstatistiken
- xG
- Trackingdaten
- Fußballmanager-Attributen

Dokumentiere pro Datensatz:

- URL
- Maintainer
- Aktualität
- Lizenz
- Lizenztext
- Vollständigkeit
- Bundesliga-Abdeckung
- Saisonabdeckung
- Schema
- Aktualisierungsstatus
- kommerzielle Nutzung
- Weitergabe
- Attribution
- Herkunftsrisiken

## Erwarteter Forschungsbericht

### 1. Executive Summary

Beantworte:

- Welche Quellen sind sofort nutzbar?
- Welche Quellen sind nur intern nutzbar?
- Welche Quellen eignen sich für automatisierte Imports?
- Welche Quellen dürfen in Nutzerexports verwendet werden?
- Welche Daten sind öffentlich nicht verfügbar?

### 2. Quellenmatrix

Erstelle:

| Quelle | Endpunkt/URL | Daten | Bundesliga | Historie | Lizenz | API-Key | Rate Limit | Export erlaubt | Risiko | Empfehlung |
|---|---|---|---|---|---|---|---|---|---|---|

### 3. Konkrete Endpunkte

Für jede empfohlene Quelle dokumentiere:

- HTTP-Methode
- URL
- Header
- Parameter
- Authentifizierung
- Beispielrequest
- Beispielresponse
- Pagination
- Rate Limits
- Fehlercodes
- Cache-Regeln
- Datenaktualität
- Lizenzhinweise

### 4. Feldmapping

Erstelle Mappingtabellen von Quellen auf:

```text
Competition
Season
Team
Player
Membership
Match
Event
MatchAppearance
TeamSnapshot
PlayerSnapshot
Heatmap
ProvenanceRecord
```

Markiere jedes Zielfeld mit:

- `direct`
- `derived`
- `estimated`
- `unavailable`
- `requires-manual-review`

### 5. Bundesliga-2026/27-Beschaffungsplan

Erstelle eine konkrete Reihenfolge:

1. Competition und Season
2. teilnehmende Teams
3. Team-IDs und Aliase
4. Spielplan und Ergebnisse
5. Kader
6. Spieleridentitäten
7. Memberships und Gültigkeitszeiträume
8. Aufstellungen
9. Matchevents
10. Spielerstatistiken
11. Teamstärken
12. Spielerattribute
13. Heatmaps
14. Teamchemie
15. historische Daten
16. Provenance und Qualitätssicherung

Dokumentiere für jeden Schritt:

- Primärquelle
- Fallbackquelle
- Endpunkt
- Datenumfang
- Lizenz
- erwartete Lücken
- manuelle Nacharbeit
- Exportbeschränkung

### 6. Identitäts- und Qualitätsstrategie

Beschreibe:

- stabile interne IDs
- Teamnamen-Matching
- Spielernamen-Matching
- Umlaute und Sonderzeichen
- Aliase
- Namensänderungen
- Transfers
- Leihen
- doppelte Namen
- fehlende Geburtsdaten
- manuelle Bestätigung
- Confidence-Werte
- widersprüchliche Quellen

### 7. Provenance

Definiere erforderliche Felder:

```text
sourceId
provider
sourceUrl
retrievedAt
license
originalField
normalizedField
transformation
confidence
observationDate
validFrom
validTo
attribution
restrictions
notes
```

### 8. Größen- und Kompressionsbewertung

Schätze oder messe:

- Anzahl Teams
- Anzahl Spieler
- Anzahl Memberships
- Anzahl Spieler-Snapshots
- Anzahl Matches
- Anzahl Match-Appearances
- Anzahl Events
- Anzahl Heatmaps
- Anzahl Chemistry-Paarbeziehungen
- Anzahl Tracking-Referenzen
- kompakte JSON-Größe
- formatierte JSON-Größe
- Gzip-Größe
- Brotli-Größe
- Browser-Speicherbedarf
- Parsezeit
- IndexedDB-Bedarf

Empfiehl anschließend:

- `simulation`
- `detailed`
- `historical`
- `tracking`
- `internal-complete`

### 9. Technische Importempfehlung

Bewerte pro Quelle:

- manuelle Erfassung
- einmaliger Import
- wiederholbarer Import
- CSV-Import
- REST-Import
- GitHub-Raw-Import
- kein Import wegen Lizenz- oder Technikrisiko

Priorisiere:

```text
P0 = sofort nutzbar und rechtlich klar
P1 = technisch brauchbar, Lizenzprüfung nötig
P2 = nur interne Recherche oder manuelle Nutzung
P3 = nicht verwenden
```

### 10. Schlussfolgerung

Beantworte:

- Welche Quellenkombination soll das interne Tool verwenden?
- Welche Quellen dürfen in teilbare Datasets einfließen?
- Welche Daten müssen synthetisch oder intern erzeugt werden?
- Welche Daten bleiben interne Referenzdaten?
- Welche APIs benötigen API-Keys?
- Welche Quellen verursachen Kosten?
- Welche Quellen sind für ein browser-only Spiel ungeeignet?
- Welche Quellen sollten zuerst technisch validiert werden?

## Ergebnisformat

Liefere:

1. ausführlichen Research-Bericht
2. Quellen- und Endpunktmatrix
3. Feldmappingtabellen
4. konkrete Beispielrequests
5. Beispielresponses oder verlinkte Response-Dokumentation
6. Lizenz- und Redistribuierungsbewertung
7. Bundesliga-2026/27-Beschaffungsreihenfolge
8. Größen- und Kompressionsschätzung
9. priorisierte technische Empfehlung
10. offene Fragen und Risiken

Keine Implementierung durchführen. Keine Daten ins Repository schreiben.

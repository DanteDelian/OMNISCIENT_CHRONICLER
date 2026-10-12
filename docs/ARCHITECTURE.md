# Architektur

## Überblick

```
campaign/  (JSON + Markdown, Git)  ←──  Claude Code / Editor
    │  fs.watch            ▲
    ▼                      │ PUT /api/save/<datei>  (entprellt, atomar)
SvelteKit-Server (adapter-node) ── SSE /api/stream ──►  alle offenen Browser
    │  +layout.server.ts lädt alles (loadCampaign)
    ▼
Browser (ssr = false): campaign-Store → Seiten und Bausteine
```

- **Eine Datenquelle:** `campaign/`. Der Server liest alle Dateien, baut daraus den Verweis-Index und die
  Rückverweise (`lib/refs.ts`) und liefert alles in einem Rutsch (`lib/server/data.ts`, gecacht bis zur nächsten Änderung).
- **Schreiben:** Die App schreibt nur `state`, `inventory`, `quests`, `spells`, `journal` und `map`
  (`/api/save/[file]`, prüft die Grundstruktur, schreibt atomar über eine temporäre Datei).
- **Live:** `fs.watch` (rekursiv) meldet externe Änderungen, eigene Schreibvorgänge melden sich selbst.
  Jede Meldung geht per Server-Sent Events an alle Browser. Die laden über `invalidate('app:campaign')` neu und
  behalten dabei ungespeicherte lokale Änderungen. Ein Browser ignoriert das Echo seiner eigenen Speicherungen (Client-ID).
- **Kein SSR:** Die App rendert im Browser. Die Daten kommen trotzdem vom Server.

## Code

```
app/src/
  app.css                 Design-System (Tailwind 4, Tokens, Bausteine, Markdown, Hinweiskästen, Druck)
  hooks.server.ts         optionaler PIN-Schutz, startet den Datei-Watcher
  lib/
    types.ts              Typen aller Kampagnendateien
    rules.ts              D&D-Rechnungen: Modifikatoren, Fertigkeiten, SG, Plätze, Wahrscheinlichkeiten
    rules-ref.ts          Regel-Referenz (Zustände, Aktionen, Zauberwirken, Deckung, Licht, Tod, Rasten)
    refs.ts               Verweis-Index, Namensauflösung, Rückverweise (läuft auch im Prüfskript)
    markdown.ts           Markdown → HTML mit [[Verweisen]] und Hinweiskästen
    game.ts               Spielaktionen: Schaden, Heilen, Wirken, Konzentration, Rasten, Untote
    journal.ts            Schnellnotizen und neue Journal-Einträge
    stores/               campaign (Daten + Speichern), live (SSE), rolls (Würfel), ui (Dialoge)
    server/               store (Dateien, Watcher), data (laden + Index), auth (PIN)
    components/           Bausteine; play/ = Karten des Spieltischs
  routes/                 Seiten: / bogen zauber gefolge inventar quests journal welt karte archiv regeln login
                          api/: save, stream, assets, health
app/scripts/check-data.mjs  Konsistenzprüfung der Kampagnendaten (npm run check:data)
```

## Entscheidungen

- **Dateien statt Datenbank:** lesbar, Git-versioniert, von Claude Code direkt bearbeitbar.
- **Verweise über Namen** (`[[Lisbeth Lhaaz]]`) statt IDs: Texte bleiben lesbar. Der Index löst Namen,
  Aliasse und Spitznamen auf, das Prüfskript findet tote Verweise.
- **Daten als Quelle für Wahrscheinlichkeiten:** Trefferchancen, Konzentrationschancen und Durchschnittsschaden
  rechnet `rules.ts` aus den Werten. Nichts davon ist fest eingetragen.
- **Bilder** liegen als WebP vor (Porträt 59 KB statt 6,9 MB, Karte 306 KB statt 3,2 MB). Die Originale bleiben in `assets/`.

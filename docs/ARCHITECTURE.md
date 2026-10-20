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
- **Schreiben:** Die App schreibt nur `state`, `inventory`, `quests`, `spells`, `journal`, `map`, `fragen`, `netzwerk`,
  `zaubersets` und `geheimnisse` (`WRITABLE` in `lib/types.ts`, `/api/save/[file]` prüft die Grundstruktur und schreibt
  atomar über eine temporäre Datei).
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
    game.ts               Spielaktionen: Schaden, Heilen, Wirken, Konzentration, Rasten, Untote erneuern, Bezahlen
    sets.ts               Zauber-Sets: Prioritätenliste → Vorbereitung bis zur Grenze, Studierzeit
    werkstatt.ts          Rezepte (Spielerhandbuch, Xanathars), Herstellen, eine Herstellung pro langer Rast
    raetsel.ts            Rätselwand: *Theorie:* und **Offen:** aus allen Texten sammeln
    secrets.ts            Wer weiß was?: Mitwisser ordnen, Kurznamen, Markierungen
    terms.ts              Deutsch–Englisch-Glossar aus Regeln, Fertigkeiten und Merkmalen
    tone.ts               Farben für Freund, Feind und Unbekannt
    journal.ts            Schnellnotizen und neue Journal-Einträge
    stores/               campaign (Daten + Speichern), live (SSE), rolls (Würfel), ui (Dialoge)
    server/               store (Dateien, Watcher), data (laden + Index), auth (PIN)
    components/           Bausteine; play/ = Karten des Spieltischs; print/ = Teile der Druckfassung
    print.ts              Teile, Beschriftungen und Papierfarben der Druckfassung
  routes/                 Seiten: / bogen zauber gefolge inventar werkstatt journal quests raetsel welt karte netzwerk
                          geheimnisse archiv regeln druck login
                          api/: save, stream, assets, health
app/scripts/check-data.mjs  Konsistenzprüfung der Kampagnendaten (npm run check:data)
app/scripts/druck.mjs       PDFs der Druckfassung über Edge/Chrome ohne Fenster (npm run druck)
```

## Entscheidungen

- **Dateien statt Datenbank:** lesbar, Git-versioniert, von Claude Code direkt bearbeitbar.
- **Verweise über Namen** (`[[Lisbeth Lhaaz]]`) statt IDs: Texte bleiben lesbar. Der Index löst Namen,
  Aliasse und Spitznamen auf, das Prüfskript findet tote Verweise.
- **Daten als Quelle für Wahrscheinlichkeiten:** Trefferchancen, Konzentrationschancen und Durchschnittsschaden
  rechnet `rules.ts` aus den Werten. Nichts davon ist fest eingetragen.
- **Druckfassung als eigene Route** (`/druck`) statt Druck-CSS für jede Seite: eigenes helles Layout
  (`routes/druck/print.css`, A4, `@page`-Ränder mit Seitenzahlen), die Bildschirmseiten bleiben unberührt.
  Das Layout blendet dafür Seitenleiste und Dialoge aus. `npm run druck` steuert Edge oder Chrome über das
  DevTools-Protokoll an und erzeugt daraus PDFs mit Lesezeichen und internen Verweisen.
- **Bilder** liegen als WebP vor (Porträt 59 KB statt 6,9 MB, Karte 306 KB statt 3,2 MB). Die Originale bleiben in `assets/`.

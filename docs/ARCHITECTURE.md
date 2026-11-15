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
  Die Regelkapitel (`campaign/regeln/*.md`) zerlegt `lib/rulebook.ts` in Kapitel und Regeln.
- **Schreiben:** Die App schreibt nur `state`, `inventory`, `quests`, `spells`, `journal`, `map`, `fragen`, `netzwerk`,
  `zaubersets`, `geheimnisse` und `uhren` (`WRITABLE` in `lib/types.ts`, `/api/save/[file]` prüft die Grundstruktur und
  schreibt atomar über eine temporäre Datei).
- **Verlauf:** Der `campaign`-Store merkt sich für jede Spieldatei den letzten Stand. Jede Änderung legt den Stand davor
  als Schritt ab (höchstens 40, schnelle Folgeänderungen derselben Datei innerhalb von 700 ms sind ein Schritt).
  Die Beschriftung kommt aus der Meldung, die die Spielaktion gerade geschrieben hat („−8 TP“, „Netz gewirkt“).
  Änderungen von außen (anderes Gerät, Claude Code) sind der neue Ausgangspunkt, kein Schritt. Zauberbuch und Journal
  haben eigene Dialoge und bleiben außen vor.
- **Live:** `fs.watch` (rekursiv) meldet externe Änderungen, eigene Schreibvorgänge melden sich selbst.
  Jede Meldung geht per Server-Sent Events an alle Browser. Die laden über `invalidate('app:campaign')` neu und
  behalten dabei ungespeicherte lokale Änderungen. Ein Browser ignoriert das Echo seiner eigenen Speicherungen (Client-ID).
- **Kein SSR:** Die App rendert im Browser. Die Daten kommen trotzdem vom Server.

## Code

```
app/src/
  app.css                 Design-System „Astral-Grimoire“ (Tailwind 4): Tokens, Schriften, panel/panel-ornate,
                          Knöpfe, Chips, Kristall-Pips, prose-grim, Hinweiskästen, Animationen, Touch-Größen, Druck
  hooks.server.ts         optionaler PIN-Schutz, startet den Datei-Watcher
  lib/
    types.ts              Typen aller Kampagnendateien (auch Kampf, Uhren, Regeln)
    rules.ts              D&D-Rechnungen: Modifikatoren, Fertigkeiten, SG, Plätze, Bewegungsrate, Wahrscheinlichkeiten
    rulebook.ts           Regelwerk: liest campaign/regeln/*.md (Kapitel, Regeln, Für Valerius, Kurzfassung), Suche,
                          Lizenzhinweis SRD 5.1. Nur Typ-Importe, läuft auch im Prüfskript
    glossary.ts           Wörterbuch Deutsch–Englisch (feste Begriffe)
    refs.ts               Verweis-Index, Namensauflösung, Rückverweise (läuft auch im Prüfskript)
    markdown.ts           Markdown → HTML mit [[Verweisen]] und Hinweiskästen, Sprungmarken für den Druck
    game.ts               Spielaktionen: Schaden, Heilen, Wirken, Konzentration, Rasten, Untote, Bezahlen,
                          Kampfmodus (Runde, Aktionsarten, Bewegung, Effekte mit Ablauf)
    graphs.ts             Graphen für Beziehungsnetz und Ermittlungswand: Knoten, Kanten, Ebenen, Erwähnungen
    dice.ts               Würfelausdrücke („2W8+3“), W20 mit Vorteil und Nachteil
    sets.ts               Zauber-Sets: Prioritätenliste → Vorbereitung bis zur Grenze, Studierzeit
    werkstatt.ts          Rezepte (Spielerhandbuch, Xanathars), Herstellen, eine Herstellung pro langer Rast
    raetsel.ts            Rätselwand: *Theorie:* und **Offen:** aus allen Texten sammeln
    secrets.ts            Wer weiß was?: Mitwisser ordnen, Kurznamen, Markierungen
    terms.ts              Deutsch–Englisch-Glossar aus Regeln, Fertigkeiten und Merkmalen
    tone.ts               Farben für Freund, Feind und Unbekannt
    journal.ts            Schnellnotizen und neue Journal-Einträge
    stores/               campaign (Daten, Speichern, Verlauf), live (SSE), rolls (Würfel, Meldungen),
                          ui (Dialoge, Lichtschein), wakelock (Bildschirm wach halten)
    server/               store (Dateien, Watcher), data (laden + Index + Regeln), auth (PIN)
    components/           Bausteine, darunter Starfield (Sternenfeld auf Canvas), CastFx (Lichtschein beim Wirken),
                          ForceGraph und GraphSidePanel (d3-force, SVG, Ziehen/Zoomen per Pointer-Events),
                          RollNumber (rollende Ergebnisse); play/ = Karten des Spieltischs (auch CombatCard,
                          ClocksCard); print/ = Teile der Druckfassung (auch PRulebook, PClocks)
    print.ts              Teile, Beschriftungen und Papierfarben der Druckfassung
  routes/                 Seiten: / kampf bogen zauber gefolge inventar werkstatt journal quests raetsel welt karte
                          netzwerk geheimnisse archiv regeln regeln/[kapitel] druck login
                          api/: save, stream, assets, health
app/scripts/check-data.mjs  Konsistenzprüfung der Kampagnendaten und Regeln (npm run check:data)
app/scripts/druck.mjs       PDFs der Druckfassung über Edge/Chrome ohne Fenster (npm run druck)
```

## Entscheidungen

- **Dateien statt Datenbank:** lesbar, Git-versioniert, von Claude Code direkt bearbeitbar.
- **Verweise über Namen** (`[[Lisbeth Lhaaz]]`) statt IDs: Texte bleiben lesbar. Der Index löst Namen,
  Aliasse und Spitznamen auf, das Prüfskript findet tote Verweise. Regeln sind Teil des Index (`[[Konzentration]]`).
- **Regeln als Markdown-Kapitel** statt als Code: Der volle Wortlaut steht in `campaign/regeln/`, das Format
  `## Name {Englisch} {#id}` mit Kommentaren für Aliasse, Quelle und Kurzfassung und einem Kasten „Für Valerius“.
  Seite, Spickzettel, Zustände am Spieltisch, Suche und Druck lesen dieselben Texte.
- **Daten als Quelle für Wahrscheinlichkeiten:** Trefferchancen, Konzentrationschancen und Durchschnittsschaden
  rechnet `rules.ts` aus den Werten. Nichts davon ist fest eingetragen.
- **Kampfmodus nur für Valerius:** Er zählt, was Valerius verbraucht, und lässt seine Effekte auslaufen. Gegner und
  Initiative führt der DM, Patrick hat eine Gegnerverwaltung abgelehnt.
- **Graphen in SVG** mit `d3-force` nur für die Anordnung: Knoten bleiben anklickbar und zugänglich, Ziehen, Zoomen und
  Verschieben laufen über Pointer-Events, auch mit dem Finger.
- **Bewegung mit Rücksicht:** Sternenfeld mit höchstens 30 Bildern pro Sekunde, Pause bei verdecktem Tab, still bei
  `prefers-reduced-motion`. Seitenwechsel per View Transitions; der Name dafür gilt nur während des Übergangs, sonst
  lägen Dialoge unter der mobilen Kopfzeile.
- **Druckfassung als eigene Route** (`/druck`) statt Druck-CSS für jede Seite: eigenes helles Layout
  (`routes/druck/print.css`, A4, `@page`-Ränder mit Seitenzahlen), die Bildschirmseiten bleiben unberührt.
  Das Layout blendet dafür Seitenleiste und Dialoge aus. `npm run druck` steuert Edge oder Chrome über das
  DevTools-Protokoll an und erzeugt daraus PDFs mit Lesezeichen und internen Verweisen.
- **Schriften lokal** über `@fontsource` (Cormorant, Cinzel, EB Garamond, Geist, Geist Mono; im Druck Instrument Serif):
  Die App läuft ohne Netz.
- **Bilder** liegen als WebP vor (Porträt 59 KB statt 6,9 MB, Karte 306 KB statt 3,2 MB). Die Originale bleiben in `assets/`.

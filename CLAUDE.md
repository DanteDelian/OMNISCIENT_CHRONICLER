# CLAUDE.md — Leitfaden für Claude Code

**Valerius · Grimoire**: Session-Dashboard und Nachschlagewerk für Patricks D&D-5e-Charakter Valerius Moonwhisper
(Astralelf, Magier 5, Schule der Beschwörung). SvelteKit-App in `app/` über den Daten in `campaign/`.
Schema der Daten: **`campaign/README.md`**. Technik: **`docs/ARCHITECTURE.md`**.

## Zwei Rollen

1. **Chronist:** Du pflegst `campaign/` (JSON + Markdown). Offene Browser aktualisieren sich live.
2. **Entwickler:** Du erweiterst die App in `app/`.

## Arbeitsabläufe als Chronist

### „Das ist in der Session passiert …“
1. **Datum klären.** Steht es nicht in der Nachricht, frag nach. Sonst `dateMode: "unbekannt"`, nie raten.
2. **Journal-Eintrag** in `journal.json` anlegen: `order` = letzter + 10, `events` (ein Ereignis pro Zeile, mit
   `[[Verweisen]]`), `places`, `people`, `loot`, `lost`, `encounters`, `quests` (Änderungen), `sources`.
   Gibt es für das Datum schon „Session-Notizen“ (Schnellnotizen vom Tisch, `id: notizen-JJJJ-MM-TT`), einarbeiten.
3. **Folgen nachziehen:** `quests.json` (Status, nächster Schritt), `inventory.json` (Beute, Geld, Verbrauch),
   neue Personen oder Orte als `world/*.md`, `docs/lage.md` aktualisieren, bei Stufenaufstieg siehe unten.
4. `cd app && npm run check:data`, dann Git-Commit der Kampagnendaten.

### Abgleich mit Google Drive
- Ordner „Valerius“: `13bTXk9i1u6Nu9rRG_5afo8RW0Id-61vT`, Ordner „Kho“ (Gefährtin): `1HFBGateqVOesOlInskMQMx6WtBmlc6cn`.
- Dokumente lesen, gegen die Regeln (Spielerhandbuch 2014, Xanathars, Spelljammer für den Astralelfen) prüfen,
  Abweichungen in `campaign/` korrigieren und im Prüfbericht (`docs/pruefbericht.md`) festhalten.
- `sources.json` mit Stand und Bewertung pflegen. Von Gemini erzeugte Entwürfe bekommen den Status `gemini`:
  Patrick will sie nur als Vorschläge, nicht als Fakten.
- Drive-Dateien **nie ohne Rückfrage** ändern.

### Stufenaufstieg
`character.json` (Stufe, Übungsbonus, TP-Maximum: Patrick fragen, ob gewürfelt wird, Plätze, neue Merkmale),
neue Zauber in `spells.json` mit `status: "buch"`, Journal-Eintrag mit `level`. Ein Magier bekommt pro Stufe
2 Zauber kostenlos ins Buch.

## Inhaltliche Regeln

- **Nichts erfinden.** Unbelegtes als *Theorie* kennzeichnen oder im Prüfbericht als offene Frage notieren.
- **Widersprüche sichtbar lassen** (`contradictions` im Journal), nicht stillschweigend entscheiden.
- **Zaubertexte vollständig:** alle Regeln eines Zaubers. SRD-Zauber dürfen übersetzt werden, Nicht-SRD-Zauber
  (z. B. Xanathars) in eigenen Worten.
- Sprache: Deutsch, Begriffe wie in Patricks Bögen (Magier, Menschenkenntnis, Bannzauber, GM/SM/KM, Meter mit Fuß).

## Konventionen als Entwickler

- **Svelte 5 Runes** (`$state`, `$derived`, `$effect`, `$props`), `ssr = false`, Daten lädt `+layout.server.ts`.
- **Zustand:** `campaign` aus `lib/stores/campaign.svelte.ts`. Ändern immer über `campaign.change('<datei>', fn)`.
  Das speichert entprellt nach `campaign/<datei>.json`. Spielaktionen (Schaden, Wirken, Rasten) liegen in `lib/game.ts`.
- **Design-System** in `src/app.css`: `panel`, `panel-glow`, `sunken`, `btn` (`-primary`, `-ghost`, `-danger`, `-life`,
  `-sm`, `-xs`), `chip`/`chip-on`, `badge` (Farbe über `--c`), `eyebrow`, `title-display`, `num`, `prose-grim`,
  `callout-*`, Tokens wie `text-astral`, `bg-panel`, `border-line`. Neue UI immer daraus bauen.
- **Bausteine:** `Markdown` (mit Verweisen), `RefChip`, `SourceChip`, `Pips`, `Modal`, `PageHeader`, `StatBlock`,
  `SpellDetail`, `Callout`. Regeln und Rechnungen: `lib/rules.ts`, Regeltexte: `lib/rules-ref.ts`.
- **Druckfassung** (`/druck`): Teile in `lib/components/print/` (Präfix `P`), Stil in `routes/druck/print.css`,
  nur Klassen unter `.druck`. Neue Daten, die man am Tisch braucht, auch dort ergänzen.
- Vor jedem Commit: `npm run check` und `npm run check:data` grün.

## Befehle

```bash
cd app
npm run dev          # http://localhost:5173
npm run check        # svelte-check
npm run check:data   # Kampagnendaten und Verweise
npm run build        # Produktionsbuild (start.bat startet ihn auf Port 3000)
npm run druck        # Druckfassung als PDFs nach druck/ (App muss laufen)
```

## Nicht tun

- Keine Datenbank, keine Cloud-Dienste, kein Konto-Zwang. Die Dateien in `campaign/` sind die Wahrheit.
- Keine Secrets committen (`.env` ist ignoriert).
- Keine erfundene Lore, keine Gemini-Vorschläge als Fakten übernehmen.

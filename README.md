# Omniscient Chronicler v4

Ein **lokal-first, installierbares D&D-Dashboard** im Dark-Fantasy-Look — ein interaktiver
Charakterbogen, Kampf-Tracker und Kampagnen-Planer, der sich wie ein eigenes Spiel anfühlt.
Läuft auf Laptop, Tablet & Handy.

- 🧝 **Voller Charakterbogen** — Porträt, HP-Ring, Attribute, **Fertigkeiten & Rettungswürfe** (anklickbar würfeln), **Angriffe** mit Wurf-Buttons, Zauberplätze, eigene Tracker, Zustände, Rettungswürfe, Rasten.
- 🎒 **Inventar** — Item-Karten mit Seltenheits-Farben, Beschreibungen (Markdown), Detail-Modal, Ausrüsten/Einstimmen.
- ⚔️ **Kampf-Tracker** — Initiative-Reihenfolge, aktiver Zug, Runden, HP & Zustände der Gegner, „Held übernehmen".
- 📋 **Session-Vorbereitung** (Lazy-DM-Methode) — Starker Auftakt, Szenen, Geheimnisse & Hinweise (aufdeckbar), NSCs, Orte, Schätze, Checkliste.
- 🎲 **Würfelroller** mit Krit-Funken · ⌘K-**Befehlspalette** mit Volltextsuche · Quest-Board · Chronik · Glossar.
- 🌌 Dark-Fantasy-Look (BG3-inspiriert): Vignette, Glut-Partikel, glühende Karten, animierte Zahlen.
- 🔄 **Live-Sync:** Dateien in `campaign/` sind die Datenquelle — ändert Claude Code sie, aktualisiert sich das Dashboard sofort.

## Claude Code ist die KI-Schnittstelle

Statt einer eingebauten KI bearbeitest du die Kampagne **gemeinsam mit Claude Code**: Alle Daten
liegen als lesbare Dateien in `campaign/` (JSON + Markdown). Zuhause am PC sagst du z. B.
„Claude, leg einen NSC namens Saladin an" oder „erhöhe Valerius' max. TP auf 16" — Claude editiert
die Datei, das laufende Dashboard zieht live nach. Git versioniert deine komplette Kampagne.

## Schnellstart

```
Doppelklick auf start.bat
```

Beim ersten Start wird installiert, gebaut und `campaign/` mit einem Beispielcharakter angelegt.
Danach:
- Laptop: <http://localhost:3000>
- Tablet/Handy im selben WLAN: `http://<Laptop-IP>:3000` (Adresse unter **Einstellungen → WLAN-Zugriff**)

### Entwicklung

```bash
cd app
npm install
npm run dev      # http://localhost:5173 (im WLAN per --host)
```

## Struktur

```
campaign/         DEINE Kampagnendaten (Git-getrackt, Claude-editierbar)
  character.json  voller Charakterbogen
  inventory.json  Items (Seltenheit, Beschreibung, …)
  quests.json · prep.json · meta.json
  chronicle.md    Session-Logbuch
  lore/{npcs,places,notes}/*.md
  README.md       Schema-Doku für Claude
app/              SvelteKit-App (Frontend + API + Datei-Backend)
start.bat         startet die App
```

## Technik

SvelteKit 2 / Svelte 5 · Tailwind 4 · adapter-node · PWA. **Keine Datenbank, kein Cloud-Zwang,
keine externe KI** — die App liest/schreibt direkt die Dateien in `campaign/`, ein Datei-Watcher
+ SSE liefern Live-Updates. Sync & Historie über Git (`git pull` / `git push`).

## Konfiguration (optional)

`.env.example` → `.env`. Optionen: `APP_PIN` (PIN-Schutz im WLAN), `PORT`/`HOST`, `CAMPAIGN_DIR`.

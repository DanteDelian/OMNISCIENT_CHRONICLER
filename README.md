# Omniscient Chronicler v4

Ein **lokal-first, installierbares D&D-Dashboard** im Dark-Fantasy-Look — ein interaktiver
Charakterbogen, Kampf-Tracker und Kampagnen-Planer, der sich wie ein eigenes Spiel anfühlt.
Läuft auf Laptop, Tablet & Handy.

- 🧝 **Voller Charakterbogen** — Porträt, HP-Ring, Attribute, **Fertigkeiten & Rettungswürfe** (anklickbar würfeln), **Angriffe** mit Wurf-Buttons, Zauberplätze, eigene Tracker, Zustände, Rettungswürfe, Rasten.
- 🎒 **Inventar** — Item-Karten mit Seltenheits-Farben, Beschreibungen (Markdown), Detail-Modal, Ausrüsten/Einstimmen.
- ⚔️ **Kampf-Tracker** — Initiative-Reihenfolge, aktiver Zug, Runden, HP & Zustände der Gegner, „Held übernehmen".
- 📋 **Session-Vorbereitung** (Lazy-DM-Methode) — Starker Auftakt, Szenen, Geheimnisse & Hinweise (aufdeckbar), NSCs, Orte, Schätze, Checkliste.
- 🎲 **Würfelroller** mit Krit-Funken · ⌘K-**Befehlspalette** mit Volltextsuche · Quest-Board · Chronik · Glossar.
- 🪄 **Session-Werkstatt** — nach der Session Roh-Notizen eingeben; eine **optionale** KI schlägt daraus
  Änderungen an Chronik, Quests, Inventar, Glossar & Charakter vor, die du **einzeln prüfst**
  (Akzeptieren/Bearbeiten/Ablehnen). Es wird **nichts ohne deine Freigabe** geschrieben, und jede
  übernommene Änderung trägt ihre Session als Quelle (Provenance).
- 🌌 Dark-Fantasy-Look (BG3-inspiriert): Vignette, Glut-Partikel, glühende Karten, animierte Zahlen.
- 🔄 **Live-Sync:** Dateien in `campaign/` sind die Datenquelle — ändert Claude Code sie, aktualisiert sich das Dashboard sofort.

## Claude Code ist die KI-Schnittstelle

Statt einer eingebauten KI bearbeitest du die Kampagne **gemeinsam mit Claude Code**: Alle Daten
liegen als lesbare Dateien in `campaign/` (JSON + Markdown). Zuhause am PC sagst du z. B.
„Claude, leg einen NSC namens Saladin an" oder „erhöhe Valerius' max. TP auf 16" — Claude editiert
die Datei, das laufende Dashboard zieht live nach. Git versioniert deine komplette Kampagne.

### Optionale In-App-KI (Session-Werkstatt)

Zusätzlich kannst du die **Session-Werkstatt** direkt in der App nutzen: Roh-Notizen rein → geprüfter
Vorschlags-Diff → übernehmen. Standard-Provider ist **Gemini**, vollständig optional und steckbar:

```
# .env  (bzw. app/.env in der Entwicklung)
AI_PROVIDER=gemini            # gemini | mock | none
GEMINI_API_KEY=dein-key
GEMINI_MODEL=gemini-2.5-flash
```

Ohne Schlüssel läuft alles weiter — die Werkstatt zeigt dann den manuellen/Claude-Code-Weg. `AI_PROVIDER=mock`
liefert einen Offline-Demo-Patch ohne externen Aufruf. Die KI **schlägt nur vor** und schreibt nie ohne deine
Freigabe.

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

## Mehrere Charaktere & mit Freunden nutzen

**Charakterverwaltung:** Unter **Charaktere** (Menü) legst du beliebig viele Helden an und wechselst
per Klick den aktiven Bogen — alles (Bogen, Inventar, Quests, Pläne) hängt am aktiven Charakter.

**Variante A — Freunde bekommen ihre eigene Version:**
1. Projektordner kopieren/zippen (oder Git-Repo teilen) — **vorher `campaign/` löschen**, sonst
   bekommen sie deine Kampagne mitgeliefert.
2. Freund:in startet `start.bat` → die App erkennt die leere Kampagne und zeigt das **Onboarding**
   („Ersten Charakter erschaffen", 10 Sekunden).
3. Voraussetzung nur: Node.js installiert.

**Variante B — gemeinsam am Spieltisch:**
Eine Instanz läuft auf dem Laptop, alle öffnen die WLAN-Adresse (Einstellungen → WLAN-Zugriff).
Jeder Spieler hat seinen Charakter in der Verwaltung; gewechselt wird der global aktive Bogen.
Optional `APP_PIN` setzen.

**Backup/Sync zwischen eigenen Geräten:** Git (`git pull`/`git push`) — die ganze Kampagne inklusive
Historie.

## Struktur

```
campaign/              DEINE Kampagnendaten (Git-getrackt, Claude-editierbar)
  characters/*.json    Charakterbögen (mehrere möglich; aktiv = meta.activeCharacterId)
  inventory.json       Items (Seltenheit, Beschreibung, …)
  quests.json · prep.json · meta.json
  assets/              Bilder (Porträt, Karten) → /api/assets/…
  chronicle.md         Session-Logbuch
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

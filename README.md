# Omniscient Chronicler

Ein **lokal-first, privates D&D-5e-Kampagnen-Grimoire** — das lebendige Gedächtnis deiner Kampagne.
Kein Charakterbogen-Klon und kein Wiki mit D&D-Skin: Nach der Session erzählst du einfach, was passiert
ist — die App leitet daraus geprüfte, quellenverfolgte Aktualisierungen ab und bereitet dich auf die
nächste Session vor. Läuft auf Laptop, Tablet & Handy (installierbare PWA), ganz ohne Cloud.

```
PLAY  →  RAW  →  PROCESS  →  REVIEW  →  CAMPAIGN  →  NEXT SESSION
```

## Funktionen

- 🏛️ **Campaign-State-Startseite** — erzählt zuerst die aktuelle Lage: Ort & Situation, Held-Kurzstatus,
  letzte & nächste Session, offene Fäden, zuletzt erfahrenes Wissen.
- 🪄 **Session-Werkstatt** — Roh-Notizen rein → **optionale** KI schlägt Änderungen an Chronik, Quests,
  Inventar, Glossar, Wissen & Charakter vor → du prüfst jede einzeln (Akzeptieren/Bearbeiten/Ablehnen).
  **Nichts wird ohne deine Freigabe geschrieben**, jede Übernahme trägt ihre Session als Quelle.
- 🧝 **Voller 5e-Charakterbogen** — Attribute, Fertigkeiten & Rettungswürfe (anklickbar würfeln),
  Angriffe, Zauberbuch, Zauberplätze, Merkmale, Zustände, Rasten, Währung, eigene Tracker, Würfel,
  Event-Verlauf & Snapshots. Mehrere Charaktere pro Kampagne.
- 💡 **Wissen (Fakt / Gerücht / Theorie)** — mit Trennung von **Charakter- und Spielerwissen** und Quelle.
- 🗺️ **Quests · Chronik · Glossar (NSCs & Orte)** — verknüpft über `[[Wikilinks]]`.
- 📋 **Session-Vorbereitung** (Lazy-DM) · ⚔️ **Kampf-Tracker** · ⌘K-**Befehlspalette** mit Volltextsuche.
- 🔄 **Live-Sync:** Dateien in `campaign/` sind die Wahrheit — ändert Claude Code sie, aktualisiert sich
  das Dashboard sofort (auf allen Geräten im WLAN).
- 🌌 Immersive Dark-Fantasy-Optik — gamefyed, aber kein Videospiel.

## Prinzipien

- **Deine Dateien sind die Wahrheit** (`campaign/`, JSON + Markdown, Git-versioniert, kein Lock-in).
- **Lokal & privat.** Externe KI ist optional; die Kernfunktion hängt an keinem Cloud-Konto.
- **KI schlägt vor, du entscheidest** — nie blindes Überschreiben, keine erfundenen Fakten.

## Schnellstart

```
Doppelklick auf start.bat
```

Beim ersten Start wird installiert, gebaut und `campaign/` angelegt (Onboarding: ersten Charakter
erschaffen). Danach:
- Laptop: <http://localhost:3000>
- Tablet/Handy im selben WLAN: `http://<Laptop-IP>:3000` (Adresse unter **Einstellungen → WLAN-Zugriff**)

### Entwicklung

```bash
cd app
npm install
npm run dev        # http://localhost:5173
npm run check      # Typprüfung (svelte-check)
```

## Die zwei KI-Wege (beide optional)

1. **Claude Code** editiert die `campaign/`-Dateien direkt — das laufende Dashboard zieht live nach.
2. **Session-Werkstatt** in der App: Roh-Text → geprüfter Vorschlags-Diff → übernehmen. Standard-Provider
   ist Gemini, vollständig optional und steckbar:

```
# .env  (bzw. app/.env in der Entwicklung)
AI_PROVIDER=gemini            # gemini | mock | none  (leer = auto: gemini wenn Key gesetzt)
GEMINI_API_KEY=dein-key
GEMINI_MODEL=gemini-2.5-flash
```

Ohne Schlüssel läuft alles weiter; `AI_PROVIDER=mock` liefert einen Offline-Demo-Patch ohne externen Aufruf.

## Struktur

```
campaign/          DEINE Kampagnendaten (Git-getrackt, Claude-editierbar) — Wahrheit
app/               SvelteKit-App (Frontend + API + Datei-Backend)
docs/              FEATURES.md (Ziel-Funktionen) · ARCHITECTURE.md (Architektur)
start.bat          startet die App
```

## Weiterführend

- **[docs/FEATURES.md](docs/FEATURES.md)** — die Ziel-Funktionen & Roadmap.
- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** — Technik, Datenmodell, Datenfluss.
- **[campaign/README.md](campaign/README.md)** — Schema-Doku der Kampagnendateien (für Claude Code).

## Konfiguration (optional)

`.env.example` → `.env`. Optionen: `APP_PIN` (PIN-Schutz im WLAN), `PORT`/`HOST`, `CAMPAIGN_DIR`,
`AI_PROVIDER`/`GEMINI_API_KEY`/`GEMINI_MODEL`.

## Technik

SvelteKit 2 · Svelte 5 (Runes) · Tailwind 4 · adapter-node · PWA. **Keine Datenbank, kein Cloud-Zwang.**
Datei-Watcher + SSE liefern Live-Updates; Sync & Historie über Git.

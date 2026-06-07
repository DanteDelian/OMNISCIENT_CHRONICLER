# Omniscient Chronicler v3

Ein **lokal-first, installierbares D&D-Dashboard & Omni-Notizbuch** (PWA).
Läuft auf deinem Laptop, erreichbar von Tablet & Handy im selben WLAN.

- 🎲 **Live-Charakterbogen** – HP, RK, Attribute, Zustände, Rettungswürfe, Zauberplätze, eigene Tracker. Werte direkt am Spieltisch ändern, alles wird gespeichert (mit Verlauf/Event-Log).
- 📓 **Omni-Notizbuch** – Markdown-Notizen, Obsidian-kompatibel (Wikilinks), bleiben deine Dateien im `vault/`.
- 🗺️ **Quests, Chronik, Glossar** – Quest-Board, Session-Chronik, Personen & Orte.
- 🎲 **Würfelroller** – d4–d100, Vorteil/Nachteil, Verlauf.
- 🌙 Dark/Light, responsive (Handy/Tablet/Laptop), als App installierbar.
- 🤖 **KI-Import** (Phase 2) – Session-Audio → automatische Fortschreibung mit **Diff-Vorschau** und austauschbarem Modell (Gemini oder lokal via Ollama/Gemma).

## Schnellstart

```
Doppelklick auf start.bat
```

Beim ersten Start werden Abhängigkeiten installiert und die App gebaut. Danach:

- Auf dem Laptop öffnen: <http://localhost:3000>
- Auf Tablet/Handy im selben WLAN: `http://<Laptop-IP>:3000`
  (die genaue Adresse zeigt die App unter **Einstellungen → WLAN-Zugriff**)

### Entwicklung

```bash
cd app
npm install
npm run dev      # http://localhost:5173, im WLAN per --host
```

## KI-Import (Audio/Text → Chronik)

1. **Sidecar starten:** Doppelklick auf [start-sidecar.bat](start-sidecar.bat) (legt beim ersten Mal automatisch ein Python-venv an).
2. **Modell wählen** in `.env`:
   - Lokal & kostenlos: `AI_PROVIDER=ollama` + `OLLAMA_MODEL=gemma4` (Ollama muss laufen).
   - Cloud: `AI_PROVIDER=gemini` + `GEMINI_API_KEY=...` (auch für Audio-Transkription).
3. In der App unter **KI-Import**: Text einfügen *oder* Audio hochladen → **Vorschläge erzeugen** → in der **Diff-Vorschau** Häkchen setzen → **Übernehmen**.
   Vor jeder Übernahme wird automatisch ein **Snapshot** angelegt (Undo-Sicherung), jede Änderung landet im Event-Log. Kein automatischer Git-Push.

> Hinweis: Große lokale Modelle (17 GB+) brauchen pro Antwort u.U. mehrere Minuten. Für schnelle Tests ein kleineres Ollama-Modell pullen oder Gemini nutzen.

## Struktur

```
vault/        Markdown-Notizen (Obsidian-kompatibel) – DEINE Inhalte
data/         SQLite-DB (Charakterwerte, Verlauf) + Uploads (lokal, nicht im Git)
app/          SvelteKit-App (Frontend + API)
ai-sidecar/   Python-KI-Dienst (Phase 2; Referenz der alten Pipeline liegt hier)
start.bat     startet die App
.env.example  Konfigurationsvorlage (zu .env kopieren)
```

## Technik

SvelteKit 2 / Svelte 5 · Tailwind 4 · SQLite (better-sqlite3) · PWA (vite-pwa) · adapter-node.
Charakterwerte liegen strukturiert in SQLite (atomare Updates + Verlauf), Notizen als Markdown im Vault.
Das Datenmodell ist Sync-fähig vorbereitet (UUID v7, `updatedAt`, Soft-Delete, Event-Log) für späteren optionalen Cloud-Sync.

## Konfiguration (optional)

`.env.example` → `.env` kopieren. Wichtigste Optionen:

- `APP_PIN` – PIN-Schutz, wenn die App im WLAN läuft.
- `PORT` / `HOST` – Standard 3000 / 0.0.0.0.
- `VAULT_DIR` / `DATA_DIR` – abweichende Speicherorte.

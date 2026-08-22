# CLAUDE.md — Leitfaden für Claude Code

Kurzorientierung für die Arbeit an diesem Repository.

## Was das ist

Ein lokal-first D&D-5e-**Kampagnen-Grimoire**: eine SvelteKit-App (`app/`) über einem dateibasierten
Kampagnen-Vault (`campaign/`). Vollständige Vision & Ziel-Funktionen: **`docs/FEATURES.md`**.
Technik & Datenfluss: **`docs/ARCHITECTURE.md`**.

## Zwei Rollen für Claude

1. **Als KI-Schnittstelle der App:** Du editierst die Dateien in `campaign/` (JSON + Markdown) direkt;
   das laufende Dashboard zieht per Datei-Watcher/SSE live nach. Schema-Doku: **`campaign/README.md`**.
2. **Als Entwickler:innen-Werkzeug:** Du erweiterst die App in `app/`.

## Kernprinzipien (bitte einhalten)

- **Dateien sind die Wahrheit.** Kanonisch ist `campaign/` (Git-versioniert, kein Lock-in). Keine Datenbank.
- **KI schlägt vor, überschreibt nicht blind.** Die Session-Werkstatt schreibt erst nach Nutzer-Freigabe;
  jede Übernahme trägt Provenance (`source='ai-session'`, `sessionId`). Erfinde nichts.
- **Wissen hat Ebenen:** Fakt / Gerücht / Theorie — eine Theorie wird nie automatisch zum Fakt.
- **Gamefyed, aber kein Videospiel.** Immersive Atmosphäre ja; künstliche Gamification (Beziehungs-Scores,
  NSC-XP, Deko-Rewards) nein.

## Konventionen (App)

- **Svelte 5 (Runes):** `$state`, `$derived`, `$effect`, `$props`; Stores als `*.svelte.ts`-Klassen
  (siehe `lib/stores/`). Reaktiv auf Datenänderungen via `live.rev`.
- **Design-System (`app/src/routes/layout.css`):** Klassen `.card` / `.card-pad` / `.card-ornate` /
  `.btn`(`-primary`/`-ghost`/`-danger`) / `.input` / `.chip` / `.panel-title` / `.stat-tile`;
  Tokens `--color-primary` (Violett), `--color-accent` (Gold), Fonts Cinzel (Display) + Inter.
  **Neue UI immer über diese Klassen** bauen, nicht ad-hoc.
- **Server-Endpoints:** `src/routes/api/**/+server.ts`, Muster `getActiveCharacter()` + `json()`.
  Alle Routen sind durch `hooks.server.ts` (optionaler PIN) geschützt.
- **Datei-IO nur über `lib/server/campaign.ts`** (`loadJson/saveJson/loadText/saveText`) und
  `lib/server/vault.ts` (Notizen) — damit Live-Sync & Provenance greifen.
- **Provenance:** Charakteränderungen über `updateCharacter(id, patch, source, sessionId)`;
  neue Quests/Items/Wissen tragen `sourceSession`.

## Befehle

```bash
cd app
npm run dev        # Dev-Server (http://localhost:5173, liest app/.env)
npm run check      # svelte-check — vor jedem Commit grün halten
npm run build      # Produktionsbuild (adapter-node)
```

## Do / Don't

- ✅ Bestehende Muster & Komponenten wiederverwenden; kleine, verifizierte Schritte; `npm run check` grün.
- ✅ Nach inhaltlichen `campaign/`-Änderungen Git-Commit für die Kampagnen-Historie.
- ❌ Keine Datenbank/Cloud/Microservices einführen. Keine erfundene Lore/Geografie.
- ❌ Keine echten Secrets committen (`.env` ist gitignored).

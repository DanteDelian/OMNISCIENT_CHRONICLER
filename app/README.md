# app/ — SvelteKit-Frontend + API + Datei-Backend

Die Anwendung des **Omniscient Chronicler**. Sie liest/schreibt den Kampagnen-Vault in `../campaign/`.

- Projekt-Übersicht & Start: **[../README.md](../README.md)**
- Ziel-Funktionen: **[../docs/FEATURES.md](../docs/FEATURES.md)**
- Architektur & Datenmodell: **[../docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md)**
- Konventionen für Claude Code: **[../CLAUDE.md](../CLAUDE.md)**

## Entwicklung

```bash
npm install
npm run dev      # http://localhost:5173 (liest app/.env)
npm run check    # svelte-check — vor jedem Commit grün halten
npm run build    # Produktionsbuild (adapter-node)
```

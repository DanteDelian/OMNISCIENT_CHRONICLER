# campaign/ — Kampagnendaten (Quelle der Wahrheit)

Diese Dateien sind die einzige Datenquelle des Dashboards. **Du (Claude Code) darfst sie direkt
bearbeiten** — das Dashboard aktualisiert sich live (per Datei-Watcher/SSE).

## Dateien
- `character.json` — der komplette Charakterbogen. Wichtige Felder:
  - `hp: { current, max, temp }`, `ac`, `level`, `xp`, `proficiencyBonus`
  - `abilities: { str, dex, con, int, wis, cha }` (Werte, nicht Modifikatoren)
  - `skills: { <key>: 0|1|2 }` (0 keine, 1 geübt, 2 Expertise) — Keys siehe app/src/lib/types.ts (SKILLS)
  - `saveProficiencies: ["dex","cha"]`, `attacks: [{ name, bonus, damage, damageType }]`
  - `spellSlots: [{ level, total, used }]`, `customTrackers`, `conditions`, `currency`
  - `portrait` (Emoji oder Pfad zu assets/), `appearance`, `notes`
- `inventory.json` — Array von Items: `{ name, quantity, weight, category, rarity, description, equipped, attuned, notes }`
  - category: weapon|armor|gear|consumable|magic|treasure · rarity: common|uncommon|rare|veryrare|legendary|artifact
- `quests.json` — `{ title, giver, status: rumor|active|done, priority, nextStep, reward, notes }`
- `prep.json` — Lazy-DM Session-Pläne (Auftakt, Szenen, Geheimnisse, NSCs, Orte, Schätze, Checkliste).
- `chronicle.md` — Session-Logbuch (Markdown, anhängen).
- `lore/{npcs,places,notes}/*.md` — freie Lore (Markdown, optionale Frontmatter).
- `.history/` — generiert (Event-Log, Snapshots). Nicht von Hand bearbeiten.

## Hinweise
- Nach inhaltlichen Änderungen ggf. `git add -A && git commit` für die Historie.
- IDs (`id`) bei neuen Einträgen frei vergeben (eindeutig genügt).

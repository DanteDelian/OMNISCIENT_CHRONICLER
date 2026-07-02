# campaign/ — Kampagnendaten (Quelle der Wahrheit)

Diese Dateien sind die einzige Datenquelle des Dashboards. **Du (Claude Code) darfst sie direkt
bearbeiten** — das Dashboard aktualisiert sich live (per Datei-Watcher/SSE).

## Dateien
- `character.json` — der komplette Charakterbogen. Wichtige Felder:
  - `hp: { current, max, temp }`, `ac`, `level`, `xp`, `proficiencyBonus`
  - `abilities: { str, dex, con, int, wis, cha }` (Werte, nicht Modifikatoren)
  - `skills: { <key>: 0|1|2 }` (0 keine, 1 geübt, 2 Expertise) — Keys siehe app/src/lib/types.ts (SKILLS)
  - `saveProficiencies: ["int","wis"]`, `attacks: [{ name, bonus, damage, damageType }]`
  - `spells: [{ name, level (0=Zaubertrick), school, ritual?, concentration?, alwaysPrepared?, prepared, castTime, range, description }]`
    - school: abjuration|conjuration|divination|enchantment|evocation|illusion|necromancy|transmutation
  - `features: [{ name, source, uses?: { current, max, resetOn: short|long }, description }]`
  - `spellSlots: [{ level, total, used }]`, `customTrackers`, `conditions`, `currency`
  - `portrait` (Emoji oder Bild-URL wie /api/assets/valerius.png), `appearance`, `notes`
- `inventory.json` — Array von Items: `{ name, quantity, weight, category, rarity, description, equipped, attuned, notes }`
  - category: weapon|armor|gear|consumable|magic|treasure · rarity: common|uncommon|rare|veryrare|legendary|artifact
- `quests.json` — `{ title, giver, status: rumor|active|done, priority, nextStep, reward, notes }`
- `prep.json` — Lazy-DM Session-Pläne (Auftakt, Szenen, Geheimnisse, NSCs, Orte, Schätze, Checkliste).
- `chronicle.md` — Session-Logbuch (Markdown, unten anhängen).
- `lore/{npcs,places,notes}/*.md` — Lore als Markdown; `[[Wikilinks]]` verbinden Einträge (Auflösung über Titel/H1).
- `assets/` — Bilder (Porträt, Karten); im UI unter `/api/assets/<datei>` (siehe assets/README.md).
- `.history/` — generiert (Event-Log, Snapshots). Nicht von Hand bearbeiten.

## Hinweise für Claude
- Beschreibungstexte (Items, Zauber, Merkmale) sind **Markdown** — `**fett**`, `*kursiv*`, `[[Wikilinks]]` erlaubt.
- Nach inhaltlichen Änderungen ggf. `git add -A && git commit` für die Kampagnen-Historie.
- IDs (`id`) bei neuen Einträgen frei vergeben (eindeutig genügt, z. B. `spell-feuerball`).
- Die Kampagne: Valerius „Floshem" Moonwhisper (Astralelf-Zauberer, Beschwörung, Stufe 5) in Xantus.
  Kern-Lore: chronicle.md + lore/notes/*.

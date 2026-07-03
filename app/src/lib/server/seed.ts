import { fileExists, saveJson, saveText, ensureDirs } from './campaign';

const README = `# campaign/ — Kampagnendaten (Quelle der Wahrheit)

Diese Dateien sind die einzige Datenquelle des Dashboards. **Du (Claude Code) darfst sie direkt
bearbeiten** — das Dashboard aktualisiert sich live (per Datei-Watcher/SSE).

## Dateien
- \`characters/<id>.json\` — die Charakterbögen (mehrere möglich!). Wichtige Felder:
  - \`hp: { current, max, temp }\`, \`ac\`, \`level\`, \`xp\`, \`proficiencyBonus\`
  - \`abilities: { str, dex, con, int, wis, cha }\` (Werte, nicht Modifikatoren)
  - \`skills: { <key>: 0|1|2 }\` (0 keine, 1 geübt, 2 Expertise) — Keys siehe app/src/lib/types.ts (SKILLS)
  - \`saveProficiencies: ["int","wis"]\`, \`attacks: [{ name, bonus, damage, damageType }]\`
  - \`spells: [{ name, level (0=Zaubertrick), school, ritual?, concentration?, alwaysPrepared?, prepared, castTime, range, description }]\`
    - school: abjuration|conjuration|divination|enchantment|evocation|illusion|necromancy|transmutation
  - \`features: [{ name, source, uses?: { current, max, resetOn: short|long }, description }]\`
  - \`spellSlots: [{ level, total, used }]\`, \`customTrackers\`, \`conditions\`, \`currency\`
  - \`portrait\` (Emoji oder Bild-URL wie /api/assets/valerius.png), \`appearance\`, \`notes\`
- \`meta.json\` — Kampagnenname, \`activeCharacterId\` (welcher Bogen gerade aktiv ist), Spotify-URL.
- \`inventory.json\` / \`quests.json\` — Arrays; jedes Objekt gehört über \`characterId\` zu einem Charakter.
  - Item: \`{ name, quantity, weight, category, rarity, description, equipped, attuned, notes }\`
    - category: weapon|armor|gear|consumable|magic|treasure · rarity: common|uncommon|rare|veryrare|legendary|artifact
  - Quest: \`{ title, giver, status: rumor|active|done, priority, nextStep, reward, notes }\`
- \`prep.json\` — Lazy-DM Session-Pläne (Auftakt, Szenen, Geheimnisse, NSCs, Orte, Schätze, Checkliste).
- \`chronicle.md\` — Session-Logbuch (Markdown, unten anhängen).
- \`lore/{npcs,places,notes}/*.md\` — Lore als Markdown; \`[[Wikilinks]]\` verbinden Einträge (Auflösung über Titel/H1).
- \`assets/\` — Bilder (Porträt, Karten); im UI unter /api/assets/<datei> (siehe assets/README.md).
- \`.history/\` — generiert (Event-Log, Snapshots). Nicht von Hand bearbeiten.

## Hinweise für Claude
- Beschreibungstexte (Items, Zauber, Merkmale) sind **Markdown** — \`**fett**\`, \`*kursiv*\`, \`[[Wikilinks]]\` erlaubt.
- Nach inhaltlichen Änderungen ggf. \`git add -A && git commit\` für die Kampagnen-Historie.
- IDs (\`id\`) bei neuen Einträgen frei vergeben (eindeutig genügt, z. B. \`spell-feuerball\`).
`;

/**
 * Legt die Kampagnen-Grundstruktur beim ersten Start an (idempotent).
 * Bewusst OHNE Charakter — neue Nutzer durchlaufen das Onboarding im Dashboard.
 */
export function ensureSeeded() {
	if (fileExists('meta.json')) return;
	ensureDirs();
	saveJson('meta.json', {
		name: 'Neue Kampagne',
		system: 'D&D 5e',
		spotifyUrl: '',
		createdAt: Date.now()
	});
	saveJson('inventory.json', []);
	saveJson('quests.json', []);
	saveJson('prep.json', []);
	saveText(
		'chronicle.md',
		'# Chronik\n\nHier werden die Abenteuer chronologisch festgehalten — von Hand oder gemeinsam mit Claude Code.\n\n---\n'
	);
	saveText('README.md', README);
}

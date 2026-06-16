import type { Character, InventoryItem } from '$lib/types';
import { fileExists, saveJson, saveText, ensureDirs } from './campaign';
import { newId } from '$lib/id';

export function seedCharacter(): Character {
	const now = Date.now();
	return {
		id: 'valerius',
		name: 'Valerius Moonwhisper',
		className: 'Barde',
		race: 'Hochelf',
		level: 1,
		xp: 0,
		background: 'Gelehrter / Chronist',
		alignment: 'Rechtschaffen Neutral',
		pronouns: 'er/ihm',
		portrait: '🧝',
		appearance: 'Silbriges Haar, mondblaue Augen, ein Federkiel stets griffbereit.',
		proficiencyBonus: 2,
		abilities: { str: 8, dex: 14, con: 12, int: 13, wis: 10, cha: 16 },
		hp: { current: 9, max: 9, temp: 0 },
		ac: 12,
		initiativeBonus: 2,
		speed: 9,
		hitDice: '1d8',
		hitDiceRemaining: 1,
		inspiration: false,
		conditions: [],
		deathSaves: { successes: 0, failures: 0 },
		spellSlots: [{ level: 1, total: 2, used: 0 }],
		customTrackers: [
			{
				id: newId(),
				label: 'Bardische Inspiration',
				type: 'resource',
				value: 3,
				max: 3,
				resetOn: 'long',
				color: '#a78bfa'
			}
		],
		saveProficiencies: ['dex', 'cha'],
		skills: { perception: 1, persuasion: 1, performance: 1 },
		attacks: [{ id: newId(), name: 'Rapier', bonus: 4, damage: '1d8+2', damageType: 'Stich' }],
		currency: { gp: 0, sp: 0, cp: 0 },
		notes: 'Chronist der eigenen Taten. Feder statt Schwert.',
		createdAt: now,
		updatedAt: now
	};
}

function starterInventory(characterId: string): InventoryItem[] {
	const now = Date.now();
	const mk = (data: Partial<InventoryItem>): InventoryItem => ({
		id: newId(),
		characterId,
		name: data.name || '',
		quantity: data.quantity ?? 1,
		weight: data.weight ?? 0,
		category: data.category || 'gear',
		rarity: data.rarity || 'common',
		description: data.description || '',
		equipped: data.equipped ?? false,
		attuned: false,
		notes: data.notes || '',
		updatedAt: now
	});
	return [
		mk({
			name: 'Rapier',
			category: 'weapon',
			weight: 1,
			equipped: true,
			description: 'Eine elegante Stichwaffe. *Finesse-Eigenschaft.*'
		}),
		mk({
			name: 'Lederrüstung',
			category: 'armor',
			weight: 4.5,
			equipped: true,
			description: 'Leichte, geschmeidige Rüstung. RK 11 + GE-Modifikator.'
		}),
		mk({
			name: 'Chronisten-Tagebuch',
			category: 'gear',
			description: 'Zum Festhalten der Lore. Der Quell aller Macht des Chronisten.'
		}),
		mk({ name: 'Gewöhnliche Kleidung', category: 'gear', equipped: true })
	];
}

const README = `# campaign/ — Kampagnendaten (Quelle der Wahrheit)

Diese Dateien sind die einzige Datenquelle des Dashboards. **Du (Claude Code) darfst sie direkt
bearbeiten** — das Dashboard aktualisiert sich live (per Datei-Watcher/SSE).

## Dateien
- \`character.json\` — der komplette Charakterbogen. Wichtige Felder:
  - \`hp: { current, max, temp }\`, \`ac\`, \`level\`, \`xp\`, \`proficiencyBonus\`
  - \`abilities: { str, dex, con, int, wis, cha }\` (Werte, nicht Modifikatoren)
  - \`skills: { <key>: 0|1|2 }\` (0 keine, 1 geübt, 2 Expertise) — Keys siehe app/src/lib/types.ts (SKILLS)
  - \`saveProficiencies: ["dex","cha"]\`, \`attacks: [{ name, bonus, damage, damageType }]\`
  - \`spellSlots: [{ level, total, used }]\`, \`customTrackers\`, \`conditions\`, \`currency\`
  - \`portrait\` (Emoji oder Pfad zu assets/), \`appearance\`, \`notes\`
- \`inventory.json\` — Array von Items: \`{ name, quantity, weight, category, rarity, description, equipped, attuned, notes }\`
  - category: weapon|armor|gear|consumable|magic|treasure · rarity: common|uncommon|rare|veryrare|legendary|artifact
- \`quests.json\` — \`{ title, giver, status: rumor|active|done, priority, nextStep, reward, notes }\`
- \`prep.json\` — Lazy-DM Session-Pläne (Auftakt, Szenen, Geheimnisse, NSCs, Orte, Schätze, Checkliste).
- \`chronicle.md\` — Session-Logbuch (Markdown, anhängen).
- \`lore/{npcs,places,notes}/*.md\` — freie Lore (Markdown, optionale Frontmatter).
- \`.history/\` — generiert (Event-Log, Snapshots). Nicht von Hand bearbeiten.

## Hinweise
- Nach inhaltlichen Änderungen ggf. \`git add -A && git commit\` für die Historie.
- IDs (\`id\`) bei neuen Einträgen frei vergeben (eindeutig genügt).
`;

const WELCOME = `# Willkommen, Chronist

Diese Notiz liegt als Markdown in \`campaign/lore/notes/\`. Du kannst sie im Dashboard bearbeiten —
oder zuhause gemeinsam mit Claude Code direkt in der Datei.

- **Am Spieltisch:** Werte im Dashboard antippen und ändern (HP, Gold, Zustände …).
- **Zuhause:** „Claude, leg einen NSC namens Saladin an" → Claude schreibt \`lore/npcs/Saladin.md\`.
`;

/** Legt die Kampagnendateien beim ersten Start an (idempotent). */
export function ensureSeeded() {
	if (fileExists('character.json')) return;
	ensureDirs();
	const char = seedCharacter();
	saveJson('character.json', char);
	saveJson('inventory.json', starterInventory(char.id));
	saveJson('quests.json', []);
	saveJson('prep.json', []);
	saveJson('meta.json', {
		name: 'Die Chroniken von Valerius',
		system: 'D&D 5e',
		createdAt: Date.now()
	});
	saveText(
		'chronicle.md',
		'# Chronik von Valerius Moonwhisper\n\nHier werden die Abenteuer chronologisch festgehalten.\n\n---\n'
	);
	saveText('lore/notes/willkommen.md', WELCOME);
	saveText('README.md', README);
}

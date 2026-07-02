import type { Character, InventoryItem, Spell, Feature } from '$lib/types';
import { fileExists, saveJson, saveText, ensureDirs } from './campaign';
import { newId } from '$lib/id';

/** Valerius' Zauberbuch (aus den Kampagnen-Notizen importiert, Stand Stufe 5). */
export function seedSpells(): Spell[] {
	return [
		// Zaubertricks
		{
			id: 'spell-totenglocke',
			name: 'Totenglocke',
			level: 0,
			school: 'necromancy',
			prepared: true,
			castTime: '1 Aktion',
			range: '18 m',
			description:
				'WE-Rettungswurf (SG 15) oder **2W8 nekrotischer Schaden** — **2W12**, falls das Ziel bereits verletzt ist.'
		},
		{
			id: 'spell-geringfuegige-illusion',
			name: 'Geringfügige Illusion',
			level: 0,
			school: 'illusion',
			prepared: true,
			castTime: '1 Aktion',
			range: '9 m',
			description:
				'Erschafft einen Ton oder das unbewegte Bild eines Objekts (≤ 1,5 m) für 1 Minute. Durchschauen: IN (Nachforschungen) gegen SG 15. Perfekt für Ablenkungen und die Floshem-Tarnung.'
		},
		{
			id: 'spell-taschenspielerei',
			name: 'Taschenspielerei',
			level: 0,
			school: 'transmutation',
			prepared: true,
			castTime: '1 Aktion',
			range: '3 m',
			description:
				'Kleine magische Tricks: Funkenregen, reinigen/beschmutzen, erwärmen/kühlen, Symbole erscheinen lassen. Bis zu 3 Effekte gleichzeitig aktiv.'
		},
		{
			id: 'spell-botschaft',
			name: 'Botschaft',
			level: 0,
			school: 'transmutation',
			prepared: true,
			castTime: '1 Aktion',
			range: '36 m',
			description:
				'Geflüsterte Nachricht — nur das Ziel hört sie und kann antworten. Kein Sichtkontakt nötig. Unverzichtbar für die stille Koordination mit [[Draka Stormscale]].'
		},
		// Grad 1
		{
			id: 'spell-vertrauten-finden',
			name: 'Vertrauten finden',
			level: 1,
			school: 'conjuration',
			ritual: true,
			prepared: false,
			castTime: '1 Stunde (Ritual)',
			range: '3 m',
			description:
				'Beschwört einen Geist in Tiergestalt — aktuell: **Falke**. Kann nicht angreifen, aber helfen, spähen (du siehst durch seine Sinne!) und Berührungszauber überbringen. Werte: [[Vertraute & Diener]].'
		},
		{
			id: 'spell-unsichtbarer-diener',
			name: 'Unsichtbarer Diener',
			level: 1,
			school: 'conjuration',
			ritual: true,
			prepared: true,
			castTime: '1 Aktion',
			range: '18 m',
			description:
				'Unsichtbare Kraft für einfache Aufgaben, 1 Stunde (RK 10, 1 TP, ST 2, trägt 4,5 kg). Kann nicht angreifen — aber Türen öffnen, tragen, servieren.'
		},
		{
			id: 'spell-schutz-vor-gut-und-boese',
			name: 'Schutz vor Gut und Böse',
			level: 1,
			school: 'abjuration',
			concentration: true,
			prepared: true,
			castTime: '1 Aktion',
			range: 'Berührung',
			description:
				'10 Min: Schützt vor Aberrationen, Himmlischen, Elementaren, Feen, Unholden und Untoten — sie haben Nachteil auf Angriffe; keine Bezauberung/Furcht/Besessenheit.'
		},
		{
			id: 'spell-magie-entdecken',
			name: 'Magie entdecken',
			level: 1,
			school: 'divination',
			ritual: true,
			concentration: true,
			prepared: true,
			castTime: '1 Aktion',
			range: 'Selbst (9 m)',
			description: 'Spüre 10 Min lang Magie im Umkreis; als Aktion Aura + Zauberschule erkennen.'
		},
		{
			id: 'spell-eismesser',
			name: 'Eismesser',
			level: 1,
			school: 'conjuration',
			prepared: true,
			castTime: '1 Aktion',
			range: '18 m',
			description:
				'Fernkampf-Zauberangriff (**+7**): 1W10 Stich — danach Explosion: GE-Rettungswurf (SG 15) oder **2W6 Kälte** im 1,5-m-Umkreis. +1W6 je höherem Grad.'
		},
		{
			id: 'spell-schild',
			name: 'Schild',
			level: 1,
			school: 'abjuration',
			prepared: true,
			castTime: '1 Reaktion',
			range: 'Selbst',
			description:
				'**+5 RK** bis zu deinem nächsten Zug (auch gegen den auslösenden Angriff); blockt *Magische Geschosse*. ⚠ Konkurriert mit *Gegenzauber* um die Reaktion!'
		},
		// Grad 2
		{
			id: 'spell-netz',
			name: 'Netz',
			level: 2,
			school: 'conjuration',
			concentration: true,
			prepared: true,
			castTime: '1 Aktion',
			range: '18 m',
			description:
				'6-m-Würfel klebriger Netze (bis 1 Std): GE-Rettungswurf (SG 15) oder **festgehalten**. Braucht Verankerung; brennbar (2W4 Feuer). Valerius’ Signaturzauber — hat drei Society-Magier auf einmal gestoppt.'
		},
		{
			id: 'spell-sengender-strahl',
			name: 'Sengender Strahl',
			level: 2,
			school: 'evocation',
			prepared: true,
			castTime: '1 Aktion',
			range: '36 m',
			description: '**3 Strahlen**, je +7 Angriff, je 2W6 Feuer. +1 Strahl je höherem Grad.'
		},
		{
			id: 'spell-nebelschritt',
			name: 'Nebelschritt',
			level: 2,
			school: 'conjuration',
			alwaysPrepared: true,
			prepared: true,
			castTime: '1 Bonusaktion',
			range: 'Selbst',
			description:
				'In silbrigem Nebel bis zu 9 m an einen sichtbaren freien Ort teleportieren. **Immer vorbereitet** (Astralelf & Beschwörungsschule).'
		},
		// Grad 3
		{
			id: 'spell-tote-erwecken',
			name: 'Tote erwecken',
			level: 3,
			school: 'necromancy',
			prepared: true,
			castTime: '1 Minute',
			range: '3 m',
			description:
				'Erschafft **Skelett** oder Zombie aus Leichnam/Knochen; 24 Std unter Kontrolle (Befehle = Bonusaktion). Re-Cast als Aktion erneuert 4 Untote je Slot → mit 2 Slots bis zu **8 Skelette** dauerhaft. Taktik & Statblocks: [[Zauber-Taktiken]], [[Vertraute & Diener]].'
		},
		{
			id: 'spell-gegenzauber',
			name: 'Gegenzauber',
			level: 3,
			school: 'abjuration',
			prepared: true,
			castTime: '1 Reaktion',
			range: '18 m',
			description:
				'Bricht feindliche Zauber ≤ Grad 3 **automatisch** ab; ab Grad 4: IN-Wurf (1W20+4) gegen SG 10+Grad. ⚠ Konkurriert mit *Schild* um die Reaktion. Taktik: [[Zauber-Taktiken]].'
		}
	];
}

/** Valerius' Merkmale (Astralelf / Zauberer / Schule der Beschwörung). */
export function seedFeatures(): Feature[] {
	return [
		{
			id: 'feat-sternenschritt',
			name: 'Sternenschritt',
			source: 'Astralelf',
			uses: { current: 3, max: 3, resetOn: 'long' },
			description: 'Bonusaktion: Teleportiere dich bis zu 9 m an einen sichtbaren freien Ort.'
		},
		{
			id: 'feat-arkane-erholung',
			name: 'Arkane Erholung',
			source: 'Zauberer',
			uses: { current: 1, max: 1, resetOn: 'long' },
			description:
				'1×/Tag nach einer **kurzen Rast**: Verbrauchte Zauberplätze mit Gesamtgrad ≤ 3 zurückgewinnen.'
		},
		{
			id: 'feat-feenabstammung',
			name: 'Feenabstammung',
			source: 'Astralelf',
			description:
				'Vorteil auf Rettungswürfe gegen Bezauberung; Magie kann dich nicht einschläfern.'
		},
		{
			id: 'feat-astrale-trance',
			name: 'Astrale Trance',
			source: 'Astralelf',
			description: 'Du schläfst nicht — 4 Stunden tiefe Meditation ersetzen 8 Stunden Schlaf.'
		},
		{
			id: 'feat-scharfe-sinne',
			name: 'Scharfe Sinne',
			source: 'Astralelf',
			description: 'Geübt in Wahrnehmung.'
		},
		{
			id: 'feat-gelehrter-der-beschwoerung',
			name: 'Gelehrter der Beschwörung',
			source: 'Schule der Beschwörung',
			description: 'Beschwörungszauber ins Zauberbuch kopieren kostet halbe Zeit & halbes Gold.'
		},
		{
			id: 'feat-geringe-beschwoerung',
			name: 'Geringe Beschwörung',
			source: 'Schule der Beschwörung',
			description:
				'Aktion: Erschaffe einen unbelebten, nichtmagischen Gegenstand (≤ 90 cm, ≤ 4,5 kg) in Hand oder Sichtweite. Hält 1 Stunde.'
		}
	];
}

export function seedCharacter(): Character {
	const now = Date.now();
	return {
		id: 'valerius',
		name: 'Valerius „Floshem“ Moonwhisper',
		className: 'Zauberer (Beschwörung)',
		race: 'Astralelf',
		level: 5,
		xp: 6500,
		background: 'Zaffera-Zögling aus Oakhaven',
		alignment: 'Chaotisch Neutral',
		pronouns: 'er/ihm',
		portrait: '🧝',
		appearance:
			'Astralelf mit sternenklarem Blick. Tritt als „Floshem, die Unsichtbare Hand“ auf — Waldelf-Magier der Donnergarde, Kapuze tief im Gesicht.',
		proficiencyBonus: 3,
		abilities: { str: 10, dex: 13, con: 16, int: 18, wis: 8, cha: 12 },
		hp: { current: 28, max: 28, temp: 0 },
		ac: 11,
		initiativeBonus: 1,
		speed: 9,
		hitDice: '5d6',
		hitDiceRemaining: 5,
		inspiration: false,
		conditions: [],
		deathSaves: { successes: 0, failures: 0 },
		spellSlots: [
			{ level: 1, total: 4, used: 0 },
			{ level: 2, total: 3, used: 0 },
			{ level: 3, total: 2, used: 0 }
		],
		customTrackers: [
			{
				id: 'tracker-ohrring',
				label: 'Ohrring: Botschaft (1/Tag)',
				type: 'resource',
				value: 1,
				max: 1,
				resetOn: 'long',
				color: '#f5c451'
			}
		],
		saveProficiencies: ['int', 'wis'],
		skills: { arcana: 1, deception: 1, insight: 1, perception: 1 },
		attacks: [
			{ id: 'attack-dolch', name: 'Dolch', bonus: 4, damage: '1d4+1', damageType: 'Stich (Wurf 6/18 m)' },
			{ id: 'attack-stab', name: 'Zweihandstab', bonus: 3, damage: '1d6', damageType: 'Wucht' }
		],
		spells: seedSpells(),
		features: seedFeatures(),
		currency: { gp: 17, sp: 16, cp: 0 },
		notes:
			'Zauber-SG 15 · Zauberangriff +7 (IN). Vertrauter: Falke. Ziel: eigene Organisation & Machtbasis in Xantus. Die „Donnergarde“-Tarnung ist aufgeflogen — neue Identität nötig!',
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
		attuned: data.attuned ?? false,
		notes: data.notes || '',
		updatedAt: now
	});
	return [
		mk({ name: 'Dolch', category: 'weapon', weight: 0.5, equipped: true, description: 'Leicht, Finesse, Wurfwaffe (6/18 m). 1W4+1 Stich.' }),
		mk({ name: 'Waldelfentypischer Zweihandstab', category: 'weapon', weight: 2, equipped: true, description: 'Teil der Floshem-Tarnung. 1W6 Wucht.' }),
		mk({ name: 'Arkaner Fokus (Ring)', category: 'gear', equipped: true, description: 'Unauffälliger Zauberfokus.' }),
		mk({ name: 'Wasserdichtes Zauberbuch', category: 'gear', rarity: 'uncommon', weight: 1.5, description: 'Enthält alle bekannten Zauber — wasserdicht gebunden. Valerius’ wertvollster Besitz.' }),
		mk({ name: 'Gelehrten-Ausrüstung', category: 'gear', description: 'Tinte, Feder, kleines Messer.' })
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
  - \`saveProficiencies: ["int","wis"]\`, \`attacks: [{ name, bonus, damage, damageType }]\`
  - \`spells: [{ name, level (0=Zaubertrick), school, ritual?, concentration?, alwaysPrepared?, prepared, castTime, range, description }]\`
    - school: abjuration|conjuration|divination|enchantment|evocation|illusion|necromancy|transmutation
  - \`features: [{ name, source, uses?: { current, max, resetOn: short|long }, description }]\`
  - \`spellSlots: [{ level, total, used }]\`, \`customTrackers\`, \`conditions\`, \`currency\`
  - \`portrait\` (Emoji oder Bild-URL wie /api/assets/valerius.png), \`appearance\`, \`notes\`
- \`inventory.json\` — Array von Items: \`{ name, quantity, weight, category, rarity, description, equipped, attuned, notes }\`
  - category: weapon|armor|gear|consumable|magic|treasure · rarity: common|uncommon|rare|veryrare|legendary|artifact
- \`quests.json\` — \`{ title, giver, status: rumor|active|done, priority, nextStep, reward, notes }\`
- \`prep.json\` — Lazy-DM Session-Pläne (Auftakt, Szenen, Geheimnisse, NSCs, Orte, Schätze, Checkliste).
- \`chronicle.md\` — Session-Logbuch (Markdown, anhängen).
- \`lore/{npcs,places,notes}/*.md\` — freie Lore (Markdown, [[Wikilinks]] verbinden Einträge).
- \`assets/\` — Bilder (Porträt, Karten); im UI erreichbar unter /api/assets/<datei>.
- \`.history/\` — generiert (Event-Log, Snapshots). Nicht von Hand bearbeiten.

## Hinweise
- Nach inhaltlichen Änderungen ggf. \`git add -A && git commit\` für die Historie.
- IDs (\`id\`) bei neuen Einträgen frei vergeben (eindeutig genügt).
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
		name: 'Die Chroniken von Xantus',
		system: 'D&D 5e',
		spotifyUrl: '',
		createdAt: Date.now()
	});
	saveText(
		'chronicle.md',
		'# Chronik von Valerius Moonwhisper\n\nHier werden die Abenteuer chronologisch festgehalten.\n\n---\n'
	);
	saveText('README.md', README);
}

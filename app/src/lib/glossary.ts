/**
 * Wörterbuch Deutsch – Englisch: Der DM fragt gern auf Englisch nach Proben und Zaubern.
 * Attribute, Fertigkeiten, Zustände, Aktionen, Regeln und Schulen kommen in terms.ts aus ihren eigenen Quellen dazu.
 */
export const GLOSSARY: { group: string; terms: [string, string][] }[] = [
	{
		group: 'Charakterbogen',
		terms: [
			['Rüstungsklasse (RK)', 'Armor Class (AC)'],
			['Trefferpunkte (TP)', 'Hit Points (HP)'],
			['Temporäre Trefferpunkte', 'Temporary Hit Points'],
			['Trefferwürfel', 'Hit Dice'],
			['Übungsbonus (ÜB)', 'Proficiency Bonus'],
			['Geübt', 'Proficient'],
			['Initiative', 'Initiative'],
			['Bewegungsrate', 'Speed'],
			['Inspiration', 'Inspiration'],
			['Passive Wahrnehmung', 'Passive Perception'],
			['Gesinnung', 'Alignment'],
			['Hintergrund', 'Background'],
			['Volk', 'Race'],
			['Stufe', 'Level'],
			['Erfahrungspunkte (EP)', 'Experience Points (XP)']
		]
	},
	{
		group: 'Würfe',
		terms: [
			['Attributswurf, Probe', 'Ability Check'],
			['Rettungswurf (RW)', 'Saving Throw, Save'],
			['Angriffswurf', 'Attack Roll'],
			['Schwierigkeitsgrad (SG)', 'Difficulty Class (DC)'],
			['Vorteil', 'Advantage'],
			['Nachteil', 'Disadvantage'],
			['Kritischer Treffer', 'Critical Hit'],
			['Vergleichender Wurf', 'Contest'],
			['Gruppenwurf', 'Group Check']
		]
	},
	{
		group: 'Zauber',
		terms: [
			['Zaubertrick', 'Cantrip'],
			['Zauberplatz', 'Spell Slot'],
			['Grad', 'Spell Level'],
			['Zauber-SG', 'Spell Save DC'],
			['Zauberangriff', 'Spell Attack'],
			['Vorbereitet', 'Prepared'],
			['Wirkzeit', 'Casting Time'],
			['Reichweite', 'Range'],
			['Wirkungsdauer', 'Duration'],
			['Wirkungsbereich', 'Area of Effect'],
			['Komponenten', 'Components'],
			['Zauberfokus', 'Spellcasting Focus'],
			['Komponentenbeutel', 'Component Pouch'],
			['Zauberbuch', 'Spellbook'],
			['Auf höheren Graden', 'At Higher Levels'],
			['Schule der Magie', 'School of Magic']
		]
	},
	{
		group: 'Kampf',
		terms: [
			['Aktion', 'Action'],
			['Bonusaktion', 'Bonus Action'],
			['Reaktion', 'Reaction'],
			['Zug', 'Turn'],
			['Runde', 'Round'],
			['Überrascht', 'Surprised'],
			['Nahkampf', 'Melee'],
			['Fernkampf', 'Ranged'],
			['Reichweite einer Nahkampfwaffe', 'Reach'],
			['Schwieriges Gelände', 'Difficult Terrain'],
			['Resistenz', 'Resistance'],
			['Anfälligkeit', 'Vulnerability'],
			['Immunität', 'Immunity'],
			['Waffenloser Schlag', 'Unarmed Strike']
		]
	},
	{
		group: 'Schadensarten',
		terms: [
			['Säure', 'Acid'],
			['Wucht', 'Bludgeoning'],
			['Kälte', 'Cold'],
			['Feuer', 'Fire'],
			['Energie', 'Force'],
			['Blitz', 'Lightning'],
			['Nekrotisch', 'Necrotic'],
			['Stich', 'Piercing'],
			['Gift', 'Poison'],
			['Psychisch', 'Psychic'],
			['Gleißend', 'Radiant'],
			['Hieb', 'Slashing'],
			['Schall, Donner', 'Thunder']
		]
	},
	{
		group: 'Ausrüstung',
		terms: [
			['Rüstung', 'Armor'],
			['Schild', 'Shield'],
			['Werkzeug', 'Tools'],
			['Alchemistenwerkzeug', "Alchemist's Supplies"],
			['Kräuterkundeausrüstung', 'Herbalism Kit'],
			['Holzschnitzwerkzeug', "Woodcarver's Tools"],
			['Verkleidungsausrüstung', 'Disguise Kit'],
			['Giftmischerausrüstung', "Poisoner's Kit"],
			['Diebeswerkzeug', "Thieves' Tools"],
			['Heiltrank', 'Potion of Healing'],
			['Spruchrolle', 'Spell Scroll'],
			['Einstimmung', 'Attunement'],
			['Rationen', 'Rations']
		]
	}
];

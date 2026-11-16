/** D&D-5e-Rechenlogik für Valerius (Spielerhandbuch 2014). Läuft auf Client und Server. */
import type { Ability, Attack, Character, CoverLevel, PlayState, Spell } from './types';

/** Attribute, dazu die englischen Begriffe: Der DM fragt gern auf Englisch nach Würfen. */
export const ABILITIES: { key: Ability; short: string; name: string; en: string; enShort: string }[] = [
	{ key: 'str', short: 'ST', name: 'Stärke', en: 'Strength', enShort: 'STR' },
	{ key: 'dex', short: 'GE', name: 'Geschicklichkeit', en: 'Dexterity', enShort: 'DEX' },
	{ key: 'con', short: 'KO', name: 'Konstitution', en: 'Constitution', enShort: 'CON' },
	{ key: 'int', short: 'IN', name: 'Intelligenz', en: 'Intelligence', enShort: 'INT' },
	{ key: 'wis', short: 'WE', name: 'Weisheit', en: 'Wisdom', enShort: 'WIS' },
	{ key: 'cha', short: 'CH', name: 'Charisma', en: 'Charisma', enShort: 'CHA' }
];

export const ABILITY_SHORT: Record<Ability, string> = {
	str: 'ST',
	dex: 'GE',
	con: 'KO',
	int: 'IN',
	wis: 'WE',
	cha: 'CH'
};

/** Fertigkeiten mit den Begriffen aus Patricks Bögen, dazu der englische Name. */
export const SKILLS: { key: string; name: string; en: string; ability: Ability }[] = [
	{ key: 'acrobatics', name: 'Akrobatik', en: 'Acrobatics', ability: 'dex' },
	{ key: 'arcana', name: 'Arkane Kunde', en: 'Arcana', ability: 'int' },
	{ key: 'athletics', name: 'Athletik', en: 'Athletics', ability: 'str' },
	{ key: 'performance', name: 'Auftreten', en: 'Performance', ability: 'cha' },
	{ key: 'intimidation', name: 'Einschüchtern', en: 'Intimidation', ability: 'cha' },
	{ key: 'sleight', name: 'Fingerfertigkeit', en: 'Sleight of Hand', ability: 'dex' },
	{ key: 'history', name: 'Geschichte', en: 'History', ability: 'int' },
	{ key: 'medicine', name: 'Heilkunde', en: 'Medicine', ability: 'wis' },
	{ key: 'stealth', name: 'Heimlichkeit', en: 'Stealth', ability: 'dex' },
	{ key: 'insight', name: 'Menschenkenntnis', en: 'Insight', ability: 'wis' },
	{ key: 'investigation', name: 'Nachforschung', en: 'Investigation', ability: 'int' },
	{ key: 'nature', name: 'Naturkunde', en: 'Nature', ability: 'int' },
	{ key: 'religion', name: 'Religion', en: 'Religion', ability: 'int' },
	{ key: 'deception', name: 'Täuschen', en: 'Deception', ability: 'cha' },
	{ key: 'animal', name: 'Tierhandhabung', en: 'Animal Handling', ability: 'wis' },
	{ key: 'survival', name: 'Überlebenskunst', en: 'Survival', ability: 'wis' },
	{ key: 'persuasion', name: 'Überzeugen', en: 'Persuasion', ability: 'cha' },
	{ key: 'perception', name: 'Wahrnehmung', en: 'Perception', ability: 'wis' }
];

/** Werkzeuge und Waffen, die für die tägliche Astrale Trance sinnvoll sind. */
export const TRANCE_TOOLS = [
	'Kräuterkundeausrüstung',
	'Alchemistenwerkzeug',
	'Verkleidungsausrüstung',
	'Giftmischerausrüstung',
	'Diebeswerkzeug',
	'Fälscherausrüstung',
	'Kalligraphenwerkzeug',
	'Holzschnitzwerkzeug',
	'Lederwerkzeug',
	'Navigationswerkzeug',
	'Leichte Armbrust',
	'Kurzbogen',
	'Kurzschwert',
	'Rapier'
];

export const SCHOOL_COLOR: Record<string, string> = {
	Bannzauber: 'var(--color-s-bann)',
	Beschwörung: 'var(--color-s-besch)',
	Erkenntnismagie: 'var(--color-s-erk)',
	Verzauberung: 'var(--color-s-verz)',
	Hervorrufung: 'var(--color-s-herv)',
	Illusion: 'var(--color-s-ill)',
	Nekromantie: 'var(--color-s-nekro)',
	Verwandlung: 'var(--color-s-verw)'
};

export const SCHOOL_EN: Record<string, string> = {
	Bannzauber: 'Abjuration',
	Beschwörung: 'Conjuration',
	Erkenntnismagie: 'Divination',
	Verzauberung: 'Enchantment',
	Hervorrufung: 'Evocation',
	Illusion: 'Illusion',
	Nekromantie: 'Necromancy',
	Verwandlung: 'Transmutation'
};

export const ECONOMY_EN: Record<string, string> = {
	aktion: 'Action',
	bonus: 'Bonus Action',
	reaktion: 'Reaction',
	minute: '1 Minute',
	stunde: '1 Hour',
	passiv: 'Passive',
	rast: 'Rest'
};

export const ECONOMY_LABEL: Record<string, string> = {
	aktion: 'Aktion',
	bonus: 'Bonusaktion',
	reaktion: 'Reaktion',
	minute: '1 Minute',
	stunde: '1 Stunde',
	passiv: 'Passiv',
	rast: 'Rast'
};

/** Erschöpfung: Wirkung je Stufe, kumulativ. Der Wortlaut steht im Regelwerk unter Zustände. */
export const EXHAUSTION = [
	'Nachteil auf Attributswürfe',
	'Bewegungsrate halbiert',
	'Nachteil auf Angriffswürfe und Rettungswürfe',
	'Trefferpunktemaximum halbiert',
	'Bewegungsrate auf 0 verringert',
	'Tod'
];

/** Zustände, in denen du dich nicht bewegen kannst (Anhang A: „Bewegungsrate 0“ oder „kann sich nicht bewegen“) */
const NO_MOVE: Record<string, string> = {
	gepackt: 'Gepackt',
	festgehalten: 'Festgehalten',
	gelaehmt: 'Gelähmt',
	versteinert: 'Versteinert',
	betaeubt: 'Betäubt',
	bewusstlos: 'Bewusstlos'
};

/** Bewegungsrate in diesem Moment: Zustände und Erschöpfung eingerechnet. */
export function currentSpeed(c: Character, s: PlayState): { speed: number; why?: string } {
	const stop = s.conditions.find((x) => x in NO_MOVE);
	if (stop) return { speed: 0, why: `${NO_MOVE[stop]}: Bewegungsrate 0` };
	if (s.exhaustion >= 5) return { speed: 0, why: 'Erschöpfung 5: Bewegungsrate 0' };
	if (s.exhaustion >= 2) return { speed: c.speed / 2, why: 'Erschöpfung 2: Bewegungsrate halbiert' };
	return { speed: c.speed };
}

export function mod(score: number): number {
	return Math.floor((score - 10) / 2);
}

export function fmtMod(n: number): string {
	return n >= 0 ? `+${n}` : `−${Math.abs(n)}`;
}

export function abilityMod(c: Character, a: Ability): number {
	return mod(c.abilities[a]);
}

export function saveBonus(c: Character, a: Ability): number {
	return abilityMod(c, a) + (c.saves.includes(a) ? c.proficiencyBonus : 0);
}

/** Übung in einer Fertigkeit. Die Astrale Trance gibt laut Hausregel eures DM keine Fertigkeit. */
export function skillProficient(c: Character, _s: PlayState | null, key: string): 'fest' | null {
	return c.skills[key] ? 'fest' : null;
}

export function skillBonus(c: Character, s: PlayState | null, key: string): number {
	const skill = SKILLS.find((x) => x.key === key);
	if (!skill) return 0;
	return abilityMod(c, skill.ability) + (skillProficient(c, s, key) ? c.proficiencyBonus : 0);
}

export function passivePerception(c: Character, s: PlayState | null): number {
	return 10 + skillBonus(c, s, 'perception');
}

/** Angriffsbonus einer Waffe: plus Übungsbonus, wenn die Astrale Trance heute genau diese Waffe gibt. */
export function attackBonus(c: Character, s: PlayState | null, a: Attack): number {
	return a.bonus + (a.trance && s?.trance?.tool === a.trance ? c.proficiencyBonus : 0);
}

export function spellDc(c: Character): number {
	return 8 + c.proficiencyBonus + abilityMod(c, c.spellcasting.ability);
}

export function spellAttack(c: Character): number {
	return c.proficiencyBonus + abilityMod(c, c.spellcasting.ability);
}

export function initiative(c: Character): number {
	return abilityMod(c, 'dex');
}

/** Deckung (Spielerhandbuch): Bonus auf RK und GE-Rettungswürfe. Mehrere Deckungen zählen nicht zusammen. */
export const COVER: Record<CoverLevel, { label: string; short: string; bonus: number; text: string }> = {
	halb: {
		label: 'Halbe Deckung',
		short: 'Halb +2',
		bonus: 2,
		text: '+2 auf RK und GE-Rettungswürfe. Zum Beispiel ein Skelett, ein Gefährte, eine niedrige Mauer oder ein schmaler Baum zwischen dir und dem Angreifer.'
	},
	dreiviertel: {
		label: 'Dreivierteldeckung',
		short: 'Dreiviertel +5',
		bonus: 5,
		text: '+5 auf RK und GE-Rettungswürfe. Zum Beispiel hinter Zinnen, einer Schießscharte oder einem dicken Baumstamm.'
	},
	voll: {
		label: 'Volle Deckung',
		short: 'Voll',
		bonus: 0,
		text: 'Du bist kein direktes Ziel für Angriffe und Zauber. Flächenzauber können dich trotzdem erreichen, und du selbst triffst niemanden durch die Deckung.'
	}
};

export function coverBonus(s: PlayState | null): number {
	const level = s?.combat?.cover;
	return level ? COVER[level].bonus : 0;
}

/** RK mit Schild (+5) und, im Kampf, der gewählten Deckung. */
export function armorClass(c: Character, s: PlayState | null): number {
	return c.ac.base + (s?.shield ? 5 : 0) + coverBonus(s);
}

/** Konzentrations-SG nach Schaden: 10 oder halber Schaden, je nachdem, was höher ist. */
export function concentrationDc(damage: number): number {
	return Math.max(10, Math.floor(damage / 2));
}

/** Wahrscheinlichkeit, mit 1W20 + bonus mindestens target zu erreichen (natürliche 1/20 ignoriert). */
export function chanceAtLeast(bonus: number, target: number): number {
	const need = target - bonus;
	if (need <= 1) return 1;
	if (need > 20) return 0;
	return (21 - need) / 20;
}

/** Trefferchance eines Angriffs (natürliche 20 trifft immer, natürliche 1 nie). */
export function hitChance(attackBonus: number, ac: number): number {
	const need = ac - attackBonus;
	const clamped = Math.min(20, Math.max(2, need));
	return (21 - clamped) / 20;
}

/** Chance, dass ein Ziel mit saveBonus den Rettungswurf gegen dc NICHT schafft. */
export function failChance(saveBonus: number, dc: number): number {
	return 1 - chanceAtLeast(saveBonus, dc);
}

export function slotTotals(c: Character): { level: number; total: number }[] {
	return Object.entries(c.spellcasting.slots)
		.map(([lvl, total]) => ({ level: Number(lvl), total }))
		.sort((a, b) => a.level - b.level);
}

export function slotsLeft(c: Character, s: PlayState, level: number): number {
	return (c.spellcasting.slots[String(level)] ?? 0) - (s.slotsUsed[String(level)] ?? 0);
}

/** Kleinster freie Zauberplatz ab dem Grad des Zaubers (null = keiner frei). */
export function lowestFreeSlot(c: Character, s: PlayState, minLevel: number): number | null {
	for (const { level } of slotTotals(c)) {
		if (level >= minLevel && slotsLeft(c, s, level) > 0) return level;
	}
	return null;
}

export function featureLeft(c: Character, s: PlayState, id: string): number {
	const f = c.features.find((x) => x.id === id);
	if (!f?.uses) return 0;
	return f.uses.max - (s.featureUsed[id] ?? 0);
}

export function hitDiceLeft(c: Character, s: PlayState): number {
	return c.level - s.hitDiceUsed;
}

export function isInBook(sp: Spell): boolean {
	return sp.status === 'buch';
}

export function preparedCount(spells: Spell[]): number {
	return spells.filter((s) => s.status === 'buch' && s.level > 0 && s.prepared).length;
}

/** Bekannte Zaubertricks eines Magiers (SHB 2014): 3, ab Stufe 4 vier, ab Stufe 10 fünf. */
export function cantripsKnown(level: number): number {
	return level >= 10 ? 5 : level >= 4 ? 4 : 3;
}

export type PickGroup = { maxGrade: number; total: number; used: number };

/**
 * Kostenlose Einträge im Zauberbuch: 6 auf Stufe 1, dann 2 pro Aufstieg, jeweils bis zum
 * höchsten Grad, den der Magier auf der neuen Stufe wirken kann. Die Zauber im Buch belegen
 * die Gruppen, höchster Grad zuerst und immer in die engste passende Gruppe.
 */
export function wizardPicks(level: number, gradesInBook: number[]): PickGroup[] {
	const groups: PickGroup[] = [];
	for (let l = 1; l <= level; l++) {
		const maxGrade = Math.min(9, Math.ceil(l / 2));
		const g = groups.find((x) => x.maxGrade === maxGrade);
		if (g) g.total += 2;
		else groups.push({ maxGrade, total: l === 1 ? 6 : 2, used: 0 });
	}
	for (const grade of [...gradesInBook].sort((a, b) => b - a)) {
		const g = groups.find((x) => x.maxGrade >= grade && x.used < x.total);
		if (g) g.used++;
	}
	return groups;
}

/** Kann der Zauber gerade gewirkt werden (vorbereitet, Ritual oder Zaubertrick)? */
/** Verbrauchtes Material fehlt im Inventar? Ein Fokus ersetzt es nie (Sage Advice). */
export function materialMissing(sp: Spell, items: { id: string; qty: number }[]): boolean {
	return !!sp.consumes && !items.some((i) => i.id === sp.consumes && i.qty > 0);
}

export function castable(sp: Spell): boolean {
	if (sp.status !== 'buch') return false;
	return sp.level === 0 || !!sp.prepared || !!sp.ritual;
}

/** Durchschnitt eines Würfelausdrucks wie „2d8+3“ (Summen erlaubt). */
export function averageOf(expr: string): number {
	let total = 0;
	const clean = expr.replace(/\s/g, '').replace(/[wW]/g, 'd');
	for (const term of clean.match(/[+-]?[^+-]+/g) ?? []) {
		const sign = term.startsWith('-') ? -1 : 1;
		const t = term.replace(/^[+-]/, '');
		const m = t.match(/^(\d*)d(\d+)$/);
		if (m) total += sign * (Number(m[1] || 1) * (Number(m[2]) + 1)) / 2;
		else if (/^\d+$/.test(t)) total += sign * Number(t);
	}
	return total;
}

export function maxOf(expr: string): number {
	let total = 0;
	const clean = expr.replace(/\s/g, '').replace(/[wW]/g, 'd');
	for (const term of clean.match(/[+-]?[^+-]+/g) ?? []) {
		const sign = term.startsWith('-') ? -1 : 1;
		const t = term.replace(/^[+-]/, '');
		const m = t.match(/^(\d*)d(\d+)$/);
		if (m) total += sign * Number(m[1] || 1) * Number(m[2]);
		else if (/^\d+$/.test(t)) total += sign * Number(t);
	}
	return total;
}

/** „2d8+1“ → „2W8 + 1“ (deutsche Schreibweise). */
export function diceDe(expr: string): string {
	return expr
		.replace(/(\d*)d(\d+)/gi, (_m, n, s) => `${n || 1}W${s}`)
		.replace(/\+/g, ' + ')
		.replace(/-/g, ' − ');
}

/**
 * Wortlaut eines Waffenangriffs wie im Wertblock:
 * „Nahkampf-Waffenangriff: +4 auf Treffer, Reichweite 1,5 m, ein Ziel. Treffer: 5 (1W6 + 2) Stichschaden.“
 */
export function attackWording(a: { bonus: number; damage: string; type: string; range: string }): string {
	const parts = a.range.split('·').map((p) => p.trim());
	const reach = parts.find((p) => /^\d+(,\d+)? m$/.test(p));
	const thrown = parts.find((p) => /^Wurf /.test(p))?.replace(/^Wurf /, '');
	const ranged = parts.find((p) => /^\d+\s*\/\s*\d+ m$/.test(p));
	const extra = parts.filter((p) => p !== reach && p !== ranged && !/^Wurf /.test(p));
	const kind = thrown ? 'Nah- oder Fernkampf-Waffenangriff' : ranged ? 'Fernkampf-Waffenangriff' : 'Nahkampf-Waffenangriff';
	const where = thrown ? `Reichweite ${reach ?? '1,5 m'} oder Reichweite ${thrown}` : `Reichweite ${ranged ?? reach ?? a.range}`;
	const dice = /d/i.test(a.damage);
	const hit = dice ? `${Math.max(1, Math.floor(averageOf(a.damage)))} (${diceDe(a.damage)})` : a.damage;
	return `${kind}: ${fmtMod(a.bonus)} auf Treffer, ${where}, ein Ziel${extra.length ? ` (${extra.join(', ')})` : ''}. Treffer: ${hit} ${a.type}schaden.`;
}

export function pct(p: number): string {
	return `${Math.round(p * 100)} %`;
}

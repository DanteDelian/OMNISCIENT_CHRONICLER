/** D&D-5e-Rechenlogik für Valerius (Spielerhandbuch 2014). Läuft auf Client und Server. */
import type { Ability, Character, PlayState, Spell } from './types';

export const ABILITIES: { key: Ability; short: string; name: string }[] = [
	{ key: 'str', short: 'ST', name: 'Stärke' },
	{ key: 'dex', short: 'GE', name: 'Geschicklichkeit' },
	{ key: 'con', short: 'KO', name: 'Konstitution' },
	{ key: 'int', short: 'IN', name: 'Intelligenz' },
	{ key: 'wis', short: 'WE', name: 'Weisheit' },
	{ key: 'cha', short: 'CH', name: 'Charisma' }
];

export const ABILITY_SHORT: Record<Ability, string> = {
	str: 'ST',
	dex: 'GE',
	con: 'KO',
	int: 'IN',
	wis: 'WE',
	cha: 'CH'
};

/** Fertigkeiten mit den Begriffen aus Patricks Bögen. */
export const SKILLS: { key: string; name: string; ability: Ability }[] = [
	{ key: 'acrobatics', name: 'Akrobatik', ability: 'dex' },
	{ key: 'arcana', name: 'Arkane Kunde', ability: 'int' },
	{ key: 'athletics', name: 'Athletik', ability: 'str' },
	{ key: 'performance', name: 'Auftreten', ability: 'cha' },
	{ key: 'intimidation', name: 'Einschüchtern', ability: 'cha' },
	{ key: 'sleight', name: 'Fingerfertigkeit', ability: 'dex' },
	{ key: 'history', name: 'Geschichte', ability: 'int' },
	{ key: 'medicine', name: 'Heilkunde', ability: 'wis' },
	{ key: 'stealth', name: 'Heimlichkeit', ability: 'dex' },
	{ key: 'insight', name: 'Menschenkenntnis', ability: 'wis' },
	{ key: 'investigation', name: 'Nachforschung', ability: 'int' },
	{ key: 'nature', name: 'Naturkunde', ability: 'int' },
	{ key: 'religion', name: 'Religion', ability: 'int' },
	{ key: 'deception', name: 'Täuschen', ability: 'cha' },
	{ key: 'animal', name: 'Tierhandhabung', ability: 'wis' },
	{ key: 'survival', name: 'Überlebenskunst', ability: 'wis' },
	{ key: 'persuasion', name: 'Überzeugen', ability: 'cha' },
	{ key: 'perception', name: 'Wahrnehmung', ability: 'wis' }
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

export const ECONOMY_LABEL: Record<string, string> = {
	aktion: 'Aktion',
	bonus: 'Bonusaktion',
	reaktion: 'Reaktion',
	minute: '1 Minute',
	stunde: '1 Stunde',
	passiv: 'Passiv',
	rast: 'Rast'
};

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

export function skillProficient(c: Character, s: PlayState | null, key: string): 'fest' | 'trance' | null {
	if (c.skills[key]) return 'fest';
	if (s?.trance?.skill === key) return 'trance';
	return null;
}

export function skillBonus(c: Character, s: PlayState | null, key: string): number {
	const skill = SKILLS.find((x) => x.key === key);
	if (!skill) return 0;
	return abilityMod(c, skill.ability) + (skillProficient(c, s, key) ? c.proficiencyBonus : 0);
}

export function passivePerception(c: Character, s: PlayState | null): number {
	return 10 + skillBonus(c, s, 'perception');
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

export function armorClass(c: Character, s: PlayState | null): number {
	return c.ac.base + (s?.shield ? 5 : 0);
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

/** Kann der Zauber gerade gewirkt werden (vorbereitet, Ritual oder Zaubertrick)? */
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

export function pct(p: number): string {
	return `${Math.round(p * 100)} %`;
}

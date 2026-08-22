import type {
	Character,
	CharacterPatch,
	CharacterEvent,
	CharacterSnapshot,
	EventSource
} from '$lib/types';
import { XP_THRESHOLDS, profBonusForLevel } from '$lib/types';
import {
	loadJson,
	saveJson,
	fileExists,
	deleteFile,
	listJsonFiles,
	appendEvent,
	readEvents
} from './campaign';
import { ensureSeeded } from './seed';
import { newId } from '$lib/id';

const SNAP_FILE = '.history/snapshots.json';

interface MetaLite {
	name?: string;
	system?: string;
	activeCharacterId?: string;
	createdAt?: number;
}

function characterPath(id: string): string {
	return `characters/${id}.json`;
}

function normalize(c: Character): Character {
	c.spells ??= [];
	c.features ??= [];
	c.attacks ??= [];
	c.customTrackers ??= [];
	c.conditions ??= [];
	c.skills ??= {};
	c.saveProficiencies ??= [];
	return c;
}

/** Migration: altes Einzel-Format (character.json) → characters/<id>.json + activeCharacterId. */
function migrateLegacy() {
	if (!fileExists('character.json')) return;
	const legacy = loadJson<Character | null>('character.json', null);
	if (legacy && legacy.id) {
		saveJson(characterPath(legacy.id), legacy);
		const meta = loadJson<MetaLite>('meta.json', {});
		if (!meta.activeCharacterId) {
			meta.activeCharacterId = legacy.id;
			saveJson('meta.json', meta);
		}
	}
	deleteFile('character.json');
}

export function listCharacters(): Character[] {
	ensureSeeded();
	migrateLegacy();
	return listJsonFiles('characters')
		.map((f) => loadJson<Character | null>(`characters/${f}`, null))
		.filter((c): c is Character => !!c && !!c.id)
		.map(normalize)
		.sort((a, b) => a.createdAt - b.createdAt);
}

export function getCharacter(id: string): Character | null {
	ensureSeeded();
	migrateLegacy();
	const c = loadJson<Character | null>(characterPath(id), null);
	return c && c.id ? normalize(c) : null;
}

/** Der aktive Charakter (aus meta.activeCharacterId) — oder null, wenn keiner existiert. */
export function getActiveCharacter(): Character | null {
	const chars = listCharacters();
	if (!chars.length) return null;
	const meta = loadJson<MetaLite>('meta.json', {});
	const active = chars.find((c) => c.id === meta.activeCharacterId);
	if (active) return active;
	// Verwaister Verweis → auf ersten Charakter zeigen
	setActiveCharacter(chars[0].id);
	return chars[0];
}

export function setActiveCharacter(id: string) {
	const meta = loadJson<MetaLite>('meta.json', {});
	meta.activeCharacterId = id;
	saveJson('meta.json', meta);
}

function slugify(name: string): string {
	return (
		name
			.toLowerCase()
			.replace(/[äöü]/g, (ch) => ({ ä: 'ae', ö: 'oe', ü: 'ue' })[ch] || ch)
			.replace(/ß/g, 'ss')
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-+|-+$/g, '') || 'held'
	);
}

/** Legt einen neuen (leeren) Charakter an; aktiviert ihn, wenn er der erste ist oder activate gesetzt ist. */
export function createCharacter(
	input: { name: string; race?: string; className?: string; level?: number; portrait?: string },
	activate = true
): Character {
	const level = Math.max(1, Math.min(20, input.level ?? 1));
	let id = slugify(input.name);
	while (fileExists(characterPath(id))) id = `${slugify(input.name)}-${newId().slice(-4)}`;
	const now = Date.now();
	const char: Character = {
		id,
		name: input.name.trim() || 'Neuer Held',
		className: input.className?.trim() || '',
		race: input.race?.trim() || '',
		level,
		xp: XP_THRESHOLDS[level - 1] ?? 0,
		background: '',
		alignment: '',
		pronouns: '',
		portrait: input.portrait || '🧙',
		appearance: '',
		proficiencyBonus: profBonusForLevel(level),
		abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
		hp: { current: 10, max: 10, temp: 0 },
		ac: 10,
		initiativeBonus: 0,
		speed: 9,
		hitDice: `${level}d8`,
		hitDiceRemaining: level,
		inspiration: false,
		conditions: [],
		deathSaves: { successes: 0, failures: 0 },
		spellSlots: [],
		customTrackers: [],
		saveProficiencies: [],
		skills: {},
		attacks: [],
		spells: [],
		features: [],
		currency: { gp: 0, sp: 0, cp: 0 },
		notes: '',
		createdAt: now,
		updatedAt: now
	};
	saveJson(characterPath(id), char);
	appendEvent({
		id: newId(),
		characterId: id,
		ts: now,
		field: 'created',
		delta: null,
		from: null,
		to: char.name,
		source: 'manual',
		sessionId: null
	});
	const isFirst = listCharacters().length === 1;
	if (activate || isFirst) setActiveCharacter(id);
	return char;
}

export function deleteCharacter(id: string) {
	deleteFile(characterPath(id));
	const meta = loadJson<MetaLite>('meta.json', {});
	if (meta.activeCharacterId === id) {
		const rest = listCharacters();
		meta.activeCharacterId = rest[0]?.id;
		saveJson('meta.json', meta);
	}
}

/** Flacht einen Charakter zu einer Map skalarer/JSON-Felder für das Diffing ab. */
function flatten(c: Character): Record<string, unknown> {
	return {
		name: c.name,
		className: c.className,
		race: c.race,
		level: c.level,
		xp: c.xp,
		background: c.background,
		alignment: c.alignment,
		pronouns: c.pronouns,
		appearance: c.appearance,
		portrait: c.portrait,
		proficiencyBonus: c.proficiencyBonus,
		'abilities.str': c.abilities.str,
		'abilities.dex': c.abilities.dex,
		'abilities.con': c.abilities.con,
		'abilities.int': c.abilities.int,
		'abilities.wis': c.abilities.wis,
		'abilities.cha': c.abilities.cha,
		'hp.current': c.hp.current,
		'hp.max': c.hp.max,
		'hp.temp': c.hp.temp,
		ac: c.ac,
		initiativeBonus: c.initiativeBonus,
		speed: c.speed,
		hitDice: c.hitDice,
		hitDiceRemaining: c.hitDiceRemaining,
		inspiration: c.inspiration,
		'deathSaves.successes': c.deathSaves.successes,
		'deathSaves.failures': c.deathSaves.failures,
		'currency.gp': c.currency.gp,
		'currency.sp': c.currency.sp,
		'currency.cp': c.currency.cp,
		conditions: JSON.stringify(c.conditions),
		spellSlots: JSON.stringify(c.spellSlots),
		customTrackers: JSON.stringify(c.customTrackers),
		skills: JSON.stringify(c.skills),
		saveProficiencies: JSON.stringify(c.saveProficiencies),
		attacks: JSON.stringify(c.attacks),
		spells: JSON.stringify(c.spells),
		features: JSON.stringify(c.features),
		notes: c.notes
	};
}

function mergeCharacter(cur: Character, patch: CharacterPatch): Character {
	const p = patch as Partial<Character>;
	return {
		...cur,
		...p,
		id: cur.id,
		createdAt: cur.createdAt,
		abilities: { ...cur.abilities, ...(p.abilities ?? {}) },
		hp: { ...cur.hp, ...(p.hp ?? {}) },
		deathSaves: { ...cur.deathSaves, ...(p.deathSaves ?? {}) },
		currency: { ...cur.currency, ...(p.currency ?? {}) },
		conditions: p.conditions ?? cur.conditions,
		spellSlots: p.spellSlots ?? cur.spellSlots,
		customTrackers: p.customTrackers ?? cur.customTrackers,
		skills: p.skills ?? cur.skills,
		saveProficiencies: p.saveProficiencies ?? cur.saveProficiencies,
		attacks: p.attacks ?? cur.attacks,
		spells: p.spells ?? cur.spells ?? [],
		features: p.features ?? cur.features ?? [],
		updatedAt: Date.now()
	};
}

function diffEvents(
	cur: Character,
	next: Character,
	source: EventSource,
	sessionId: string | null
): CharacterEvent[] {
	const a = flatten(cur);
	const b = flatten(next);
	const events: CharacterEvent[] = [];
	const ts = Date.now();
	for (const key of Object.keys(b)) {
		if (a[key] === b[key]) continue;
		const from = a[key];
		const to = b[key];
		const delta = typeof from === 'number' && typeof to === 'number' ? to - from : null;
		events.push({ id: newId(), characterId: next.id, ts, field: key, delta, from, to, source, sessionId });
	}
	return events;
}

/** Wendet ein Patch auf einen Charakter an, schreibt Event-Log-Einträge und speichert. */
export function updateCharacter(
	id: string,
	patch: CharacterPatch,
	source: EventSource = 'manual',
	sessionId: string | null = null
): Character {
	const cur = getCharacter(id);
	if (!cur) throw new Error(`Charakter ${id} nicht gefunden`);
	const next = mergeCharacter(cur, patch);
	const events = diffEvents(cur, next, source, sessionId);
	saveJson(characterPath(id), next);
	for (const e of events) {
		appendEvent({
			id: e.id,
			characterId: e.characterId,
			ts: e.ts,
			field: e.field,
			delta: e.delta,
			from: e.from ?? null,
			to: e.to ?? null,
			source: e.source,
			sessionId: e.sessionId
		});
	}
	return next;
}

export function listEvents(characterId: string, limit = 200): CharacterEvent[] {
	const raw = readEvents(800);
	return raw
		.filter((e) => !characterId || e.characterId === characterId)
		.slice(-limit)
		.reverse()
		.map((e) => ({
			id: e.id as string,
			characterId: e.characterId as string,
			ts: e.ts as number,
			field: e.field as string,
			delta: (e.delta as number) ?? null,
			from: e.from ?? null,
			to: e.to ?? null,
			source: (e.source as EventSource) ?? 'manual',
			sessionId: (e.sessionId as string) ?? null
		}));
}

export function createSnapshot(characterId: string, label: string): CharacterSnapshot {
	const char = getCharacter(characterId);
	if (!char) throw new Error(`Charakter ${characterId} nicht gefunden`);
	const snap: CharacterSnapshot = { id: newId(), characterId, ts: Date.now(), label, state: char };
	const snaps = loadJson<CharacterSnapshot[]>(SNAP_FILE, []);
	snaps.unshift(snap);
	saveJson(SNAP_FILE, snaps.slice(0, 50));
	return snap;
}

export function listSnapshots(characterId: string): CharacterSnapshot[] {
	return loadJson<CharacterSnapshot[]>(SNAP_FILE, []).filter(
		(s) => !characterId || s.characterId === characterId
	);
}

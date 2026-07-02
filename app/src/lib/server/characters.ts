import type {
	Character,
	CharacterPatch,
	CharacterEvent,
	CharacterSnapshot,
	EventSource
} from '$lib/types';
import { loadJson, saveJson, appendEvent, readEvents } from './campaign';
import { ensureSeeded, seedCharacter } from './seed';
import { newId } from '$lib/id';

const FILE = 'character.json';
const SNAP_FILE = '.history/snapshots.json';

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

export function getCharacter(id: string): Character | null {
	const c = getActiveCharacter();
	return c.id === id ? c : null;
}

/** Liefert den aktiven Charakter; seedet die Kampagne beim ersten Start. */
export function getActiveCharacter(): Character {
	ensureSeeded();
	const c = loadJson<Character>(FILE, seedCharacter());
	// Ältere Dateien ohne neue Felder tolerieren
	c.spells ??= [];
	c.features ??= [];
	return c;
}

/** Wendet ein Patch an, schreibt Event-Log-Einträge (events.jsonl) und speichert. */
export function updateCharacter(
	id: string,
	patch: CharacterPatch,
	source: EventSource = 'manual',
	sessionId: string | null = null
): Character {
	const cur = getActiveCharacter();
	const next = mergeCharacter(cur, patch);
	const events = diffEvents(cur, next, source, sessionId);
	saveJson(FILE, next);
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
	const char = getActiveCharacter();
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

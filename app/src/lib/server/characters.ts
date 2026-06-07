import type {
	Character,
	CharacterPatch,
	CharacterEvent,
	CharacterSnapshot,
	EventSource
} from '$lib/types';
import { getDb } from './db';
import { newId } from '$lib/id';

type Row = Record<string, unknown>;

function rowToCharacter(r: Row): Character {
	return {
		id: r.id as string,
		name: r.name as string,
		className: r.class_name as string,
		race: r.race as string,
		level: r.level as number,
		background: r.background as string,
		alignment: r.alignment as string,
		proficiencyBonus: r.proficiency_bonus as number,
		abilities: {
			str: r.str as number,
			dex: r.dex as number,
			con: r.con as number,
			int: r.int_ as number,
			wis: r.wis as number,
			cha: r.cha as number
		},
		hp: {
			current: r.hp_current as number,
			max: r.hp_max as number,
			temp: r.hp_temp as number
		},
		ac: r.ac as number,
		initiativeBonus: r.initiative_bonus as number,
		speed: r.speed as number,
		hitDice: r.hit_dice as string,
		hitDiceRemaining: r.hit_dice_remaining as number,
		inspiration: !!(r.inspiration as number),
		conditions: JSON.parse((r.conditions as string) || '[]'),
		deathSaves: {
			successes: r.death_save_successes as number,
			failures: r.death_save_failures as number
		},
		spellSlots: JSON.parse((r.spell_slots as string) || '[]'),
		customTrackers: JSON.parse((r.custom_trackers as string) || '[]'),
		currency: {
			gp: r.currency_gp as number,
			sp: r.currency_sp as number,
			cp: r.currency_cp as number
		},
		notes: r.notes as string,
		createdAt: r.created_at as number,
		updatedAt: r.updated_at as number
	};
}

function characterToRow(c: Character): Row {
	return {
		id: c.id,
		name: c.name,
		class_name: c.className,
		race: c.race,
		level: c.level,
		background: c.background,
		alignment: c.alignment,
		proficiency_bonus: c.proficiencyBonus,
		str: c.abilities.str,
		dex: c.abilities.dex,
		con: c.abilities.con,
		int_: c.abilities.int,
		wis: c.abilities.wis,
		cha: c.abilities.cha,
		hp_current: c.hp.current,
		hp_max: c.hp.max,
		hp_temp: c.hp.temp,
		ac: c.ac,
		initiative_bonus: c.initiativeBonus,
		speed: c.speed,
		hit_dice: c.hitDice,
		hit_dice_remaining: c.hitDiceRemaining,
		inspiration: c.inspiration ? 1 : 0,
		conditions: JSON.stringify(c.conditions),
		death_save_successes: c.deathSaves.successes,
		death_save_failures: c.deathSaves.failures,
		spell_slots: JSON.stringify(c.spellSlots),
		custom_trackers: JSON.stringify(c.customTrackers),
		currency_gp: c.currency.gp,
		currency_sp: c.currency.sp,
		currency_cp: c.currency.cp,
		notes: c.notes,
		created_at: c.createdAt,
		updated_at: c.updatedAt
	};
}

const INSERT_SQL = `INSERT INTO character (
	id, name, class_name, race, level, background, alignment, proficiency_bonus,
	str, dex, con, int_, wis, cha,
	hp_current, hp_max, hp_temp, ac, initiative_bonus, speed,
	hit_dice, hit_dice_remaining, inspiration, conditions,
	death_save_successes, death_save_failures, spell_slots, custom_trackers,
	currency_gp, currency_sp, currency_cp, notes, created_at, updated_at
) VALUES (
	@id, @name, @class_name, @race, @level, @background, @alignment, @proficiency_bonus,
	@str, @dex, @con, @int_, @wis, @cha,
	@hp_current, @hp_max, @hp_temp, @ac, @initiative_bonus, @speed,
	@hit_dice, @hit_dice_remaining, @inspiration, @conditions,
	@death_save_successes, @death_save_failures, @spell_slots, @custom_trackers,
	@currency_gp, @currency_sp, @currency_cp, @notes, @created_at, @updated_at
)`;

const UPDATE_SQL = `UPDATE character SET
	name=@name, class_name=@class_name, race=@race, level=@level,
	background=@background, alignment=@alignment, proficiency_bonus=@proficiency_bonus,
	str=@str, dex=@dex, con=@con, int_=@int_, wis=@wis, cha=@cha,
	hp_current=@hp_current, hp_max=@hp_max, hp_temp=@hp_temp, ac=@ac,
	initiative_bonus=@initiative_bonus, speed=@speed,
	hit_dice=@hit_dice, hit_dice_remaining=@hit_dice_remaining,
	inspiration=@inspiration, conditions=@conditions,
	death_save_successes=@death_save_successes, death_save_failures=@death_save_failures,
	spell_slots=@spell_slots, custom_trackers=@custom_trackers,
	currency_gp=@currency_gp, currency_sp=@currency_sp, currency_cp=@currency_cp,
	notes=@notes, updated_at=@updated_at
WHERE id=@id`;

/** Flacht einen Charakter zu einer Map skalarer/JSON-Felder für das Diffing ab. */
function flatten(c: Character): Record<string, unknown> {
	return {
		name: c.name,
		className: c.className,
		race: c.race,
		level: c.level,
		background: c.background,
		alignment: c.alignment,
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
		const delta =
			typeof from === 'number' && typeof to === 'number' ? to - from : null;
		events.push({
			id: newId(),
			characterId: next.id,
			ts,
			field: key,
			delta,
			from,
			to,
			source,
			sessionId
		});
	}
	return events;
}

const INSERT_EVENT_SQL = `INSERT INTO character_event
	(id, character_id, ts, field, delta, from_value, to_value, source, session_id)
	VALUES (@id, @character_id, @ts, @field, @delta, @from_value, @to_value, @source, @session_id)`;

function persistEvents(events: CharacterEvent[]) {
	if (!events.length) return;
	const db = getDb();
	const stmt = db.prepare(INSERT_EVENT_SQL);
	for (const e of events) {
		stmt.run({
			id: e.id,
			character_id: e.characterId,
			ts: e.ts,
			field: e.field,
			delta: e.delta,
			from_value: JSON.stringify(e.from ?? null),
			to_value: JSON.stringify(e.to ?? null),
			source: e.source,
			session_id: e.sessionId
		});
	}
}

export function getCharacter(id: string): Character | null {
	const row = getDb()
		.prepare('SELECT * FROM character WHERE id = ? AND deleted_at IS NULL')
		.get(id) as Row | undefined;
	return row ? rowToCharacter(row) : null;
}

/** Liefert den aktiven Charakter; legt beim ersten Start Valerius an. */
export function getActiveCharacter(): Character {
	const row = getDb()
		.prepare(
			'SELECT * FROM character WHERE deleted_at IS NULL ORDER BY created_at ASC LIMIT 1'
		)
		.get() as Row | undefined;
	if (row) return rowToCharacter(row);
	return seedDefaultCharacter();
}

/** Wendet ein Patch an, schreibt Event-Log-Einträge und speichert atomar. */
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
	const db = getDb();
	const tx = db.transaction(() => {
		db.prepare(UPDATE_SQL).run(characterToRow(next));
		persistEvents(events);
	});
	tx();
	return next;
}

export function listEvents(characterId: string, limit = 200): CharacterEvent[] {
	const rows = getDb()
		.prepare(
			'SELECT * FROM character_event WHERE character_id = ? ORDER BY ts DESC LIMIT ?'
		)
		.all(characterId, limit) as Row[];
	return rows.map((r) => ({
		id: r.id as string,
		characterId: r.character_id as string,
		ts: r.ts as number,
		field: r.field as string,
		delta: (r.delta as number) ?? null,
		from: JSON.parse((r.from_value as string) ?? 'null'),
		to: JSON.parse((r.to_value as string) ?? 'null'),
		source: r.source as EventSource,
		sessionId: (r.session_id as string) ?? null
	}));
}

export function createSnapshot(characterId: string, label: string): CharacterSnapshot {
	const char = getCharacter(characterId);
	if (!char) throw new Error(`Charakter ${characterId} nicht gefunden`);
	const snap: CharacterSnapshot = {
		id: newId(),
		characterId,
		ts: Date.now(),
		label,
		state: char
	};
	getDb()
		.prepare(
			'INSERT INTO snapshot (id, character_id, ts, label, state) VALUES (?, ?, ?, ?, ?)'
		)
		.run(snap.id, snap.characterId, snap.ts, snap.label, JSON.stringify(snap.state));
	return snap;
}

export function listSnapshots(characterId: string): CharacterSnapshot[] {
	const rows = getDb()
		.prepare('SELECT * FROM snapshot WHERE character_id = ? ORDER BY ts DESC')
		.all(characterId) as Row[];
	return rows.map((r) => ({
		id: r.id as string,
		characterId: r.character_id as string,
		ts: r.ts as number,
		label: r.label as string,
		state: JSON.parse(r.state as string)
	}));
}

/** Standard-Charakter aus dem bestehenden Vault (Valerius Moonwhisper). */
export function seedDefaultCharacter(): Character {
	const now = Date.now();
	const char: Character = {
		id: newId(),
		name: 'Valerius Moonwhisper',
		className: 'Barde',
		race: 'Hochelf',
		level: 1,
		background: 'Gelehrter / Chronist',
		alignment: 'Rechtschaffen Neutral',
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
		currency: { gp: 0, sp: 0, cp: 0 },
		notes: 'Chronist der eigenen Taten. Feder statt Schwert.',
		createdAt: now,
		updatedAt: now
	};
	const db = getDb();
	const tx = db.transaction(() => {
		db.prepare(INSERT_SQL).run(characterToRow(char));
		// Start-Inventar aus inventar.md
		const itemStmt = db.prepare(
			`INSERT INTO inventory_item (id, character_id, name, quantity, weight, category, equipped, notes, created_at, updated_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
		);
		itemStmt.run(newId(), char.id, 'Gewöhnliche Kleidung', 1, 0, 'gear', 1, 'Angezogen', now, now);
		itemStmt.run(
			newId(),
			char.id,
			'Chronisten-Tagebuch',
			1,
			0,
			'gear',
			0,
			'Zum Festhalten der Lore',
			now,
			now
		);
		db.prepare(INSERT_EVENT_SQL).run({
			id: newId(),
			character_id: char.id,
			ts: now,
			field: 'created',
			delta: null,
			from_value: 'null',
			to_value: JSON.stringify(char.name),
			source: 'seed',
			session_id: null
		});
	});
	tx();
	return char;
}

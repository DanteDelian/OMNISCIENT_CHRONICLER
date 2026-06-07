// Gemeinsame Typen für Omniscient Chronicler v3.
// Diese Shapes spiegeln die JSON-Felder in der SQLite-DB wider.

export type AbilityKey = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';

export const ABILITY_KEYS: AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

export const ABILITY_LABELS: Record<AbilityKey, string> = {
	str: 'Stärke',
	dex: 'Geschicklichkeit',
	con: 'Konstitution',
	int: 'Intelligenz',
	wis: 'Weisheit',
	cha: 'Charisma'
};

export interface SpellSlot {
	level: number;
	total: number;
	used: number;
}

export type TrackerType = 'counter' | 'bar' | 'toggle' | 'resource';

export interface CustomTracker {
	id: string;
	label: string;
	type: TrackerType;
	value: number; // toggle: 0/1
	max?: number; // für bar/resource
	resetOn?: 'short' | 'long' | 'none';
	color?: string;
}

export interface Character {
	id: string;
	name: string;
	className: string;
	race: string;
	level: number;
	background: string;
	alignment: string;
	proficiencyBonus: number;
	abilities: Record<AbilityKey, number>;
	hp: { current: number; max: number; temp: number };
	ac: number;
	initiativeBonus: number;
	speed: number;
	hitDice: string;
	hitDiceRemaining: number;
	inspiration: boolean;
	conditions: string[];
	deathSaves: { successes: number; failures: number };
	spellSlots: SpellSlot[];
	customTrackers: CustomTracker[];
	currency: { gp: number; sp: number; cp: number };
	notes: string;
	createdAt: number;
	updatedAt: number;
}

/** Tief-partielles Patch-Objekt für PATCH /api/character */
export type CharacterPatch = {
	[K in keyof Character]?: Character[K] extends object
		? Partial<Character[K]>
		: Character[K];
};

export type EventSource = 'manual' | 'ai-session' | 'rest' | 'dice' | 'seed';

export interface CharacterEvent {
	id: string;
	characterId: string;
	ts: number;
	field: string;
	delta: number | null;
	from: unknown;
	to: unknown;
	source: EventSource;
	sessionId: string | null;
}

export interface CharacterSnapshot {
	id: string;
	characterId: string;
	ts: number;
	label: string;
	state: Character;
}

export type ItemCategory = 'gear' | 'magic' | 'treasure';

export interface InventoryItem {
	id: string;
	characterId: string;
	name: string;
	quantity: number;
	weight: number;
	category: ItemCategory;
	equipped: boolean;
	notes: string;
	updatedAt: number;
}

export type QuestStatus = 'rumor' | 'active' | 'done';

export const QUEST_STATUS_LABELS: Record<QuestStatus, string> = {
	rumor: 'Gerücht / Offen',
	active: 'Aktiv',
	done: 'Abgeschlossen'
};

export interface Quest {
	id: string;
	characterId: string;
	title: string;
	giver: string;
	status: QuestStatus;
	priority: 'low' | 'normal' | 'high';
	nextStep: string;
	reward: string;
	notes: string;
	sortOrder: number;
	updatedAt: number;
}

export interface Note {
	path: string; // relativ zum Vault-Root
	title: string;
	frontmatter: Record<string, unknown>;
	body: string;
	excerpt: string;
	tags: string[];
	links: string[];
	updatedAt: number;
}

/** Rohe KI-Vorschläge vom Sidecar (entspricht dem Pydantic-Schema). */
export interface SessionUpdatesDTO {
	chronik_append: string;
	analyse_content: string;
	quests: {
		title: string;
		giver: string;
		status: QuestStatus;
		priority: 'low' | 'normal' | 'high';
		next_step: string;
		reward: string;
	}[];
	inventory: {
		name: string;
		quantity: number;
		weight: number;
		category: ItemCategory;
		note: string;
	}[];
	glossar: { type: 'Personen' | 'Orte'; name: string; content: string }[];
	character?: {
		hp_max?: number | null;
		level?: number | null;
		gold_delta: number;
		silver_delta: number;
		copper_delta: number;
		new_conditions: string[];
	} | null;
}

export type IngestKind = 'chronik' | 'analyse' | 'quest' | 'inventory' | 'glossar' | 'character';

/** Ein einzelner, bestätigbarer Änderungsvorschlag für die Diff-Vorschau. */
export interface IngestChange {
	id: string;
	kind: IngestKind;
	title: string;
	summary: string;
	before?: string;
	after?: string;
	payload: Record<string, unknown>;
}

/** Standard-5e-Conditions als Vorschläge für die Condition-Chips. */
export const DND_CONDITIONS = [
	'Blind',
	'Bezaubert',
	'Taub',
	'Verängstigt',
	'Gepackt',
	'Handlungsunfähig',
	'Unsichtbar',
	'Gelähmt',
	'Versteinert',
	'Vergiftet',
	'Liegend',
	'Festgesetzt',
	'Betäubt',
	'Bewusstlos',
	'Erschöpft'
];

/** D&D-5e Ability-Modifier. */
export function abilityMod(score: number): number {
	return Math.floor((score - 10) / 2);
}

/** Formatiert einen Modifier mit Vorzeichen, z.B. +3 / -1. */
export function fmtMod(mod: number): string {
	return mod >= 0 ? `+${mod}` : `${mod}`;
}

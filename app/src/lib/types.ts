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

/** Übungsgrad: 0 = keine, 1 = geübt, 2 = Expertise. */
export type ProfLevel = 0 | 1 | 2;

export interface SkillDef {
	key: string;
	label: string;
	ability: AbilityKey;
}

/** Die 18 D&D-5e-Fertigkeiten (deutsche Bezeichnungen). */
export const SKILLS: SkillDef[] = [
	{ key: 'acrobatics', label: 'Akrobatik', ability: 'dex' },
	{ key: 'animal', label: 'Mit Tieren umgehen', ability: 'wis' },
	{ key: 'arcana', label: 'Arkane Kunde', ability: 'int' },
	{ key: 'athletics', label: 'Athletik', ability: 'str' },
	{ key: 'deception', label: 'Täuschen', ability: 'cha' },
	{ key: 'history', label: 'Geschichte', ability: 'int' },
	{ key: 'insight', label: 'Motiv erkennen', ability: 'wis' },
	{ key: 'intimidation', label: 'Einschüchtern', ability: 'cha' },
	{ key: 'investigation', label: 'Nachforschungen', ability: 'int' },
	{ key: 'medicine', label: 'Heilkunde', ability: 'wis' },
	{ key: 'nature', label: 'Naturkunde', ability: 'int' },
	{ key: 'perception', label: 'Wahrnehmung', ability: 'wis' },
	{ key: 'performance', label: 'Auftreten', ability: 'cha' },
	{ key: 'persuasion', label: 'Überzeugen', ability: 'cha' },
	{ key: 'religion', label: 'Religion', ability: 'int' },
	{ key: 'sleight', label: 'Fingerfertigkeit', ability: 'dex' },
	{ key: 'stealth', label: 'Heimlichkeit', ability: 'dex' },
	{ key: 'survival', label: 'Überlebenskunst', ability: 'wis' }
];

export interface Attack {
	id: string;
	name: string;
	bonus: number; // Angriffsbonus (d20 + bonus)
	damage: string; // Würfelausdruck, z.B. "1d8+2"
	damageType: string;
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
	xp: number;
	background: string;
	alignment: string;
	pronouns: string;
	portrait: string; // Bildpfad (campaign/assets/…) oder Emoji
	appearance: string; // Beschreibung des Aussehens
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
	saveProficiencies: AbilityKey[];
	skills: Record<string, ProfLevel>;
	attacks: Attack[];
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

export type ItemCategory = 'weapon' | 'armor' | 'gear' | 'consumable' | 'magic' | 'treasure';

export const ITEM_CATEGORY_LABELS: Record<ItemCategory, string> = {
	weapon: 'Waffe',
	armor: 'Rüstung',
	gear: 'Ausrüstung',
	consumable: 'Verbrauch',
	magic: 'Magisch',
	treasure: 'Schatz'
};

export type Rarity = 'common' | 'uncommon' | 'rare' | 'veryrare' | 'legendary' | 'artifact';

export const RARITY: Record<Rarity, { label: string; color: string }> = {
	common: { label: 'Gewöhnlich', color: '#9ca3af' },
	uncommon: { label: 'Ungewöhnlich', color: '#4ade80' },
	rare: { label: 'Selten', color: '#60a5fa' },
	veryrare: { label: 'Sehr selten', color: '#a78bfa' },
	legendary: { label: 'Legendär', color: '#fbbf24' },
	artifact: { label: 'Artefakt', color: '#f87171' }
};

export interface InventoryItem {
	id: string;
	characterId: string;
	name: string;
	quantity: number;
	weight: number;
	category: ItemCategory;
	rarity: Rarity;
	description: string;
	equipped: boolean;
	attuned: boolean;
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

/** Sitzungs-Vorbereitung nach der Lazy-DM-Methode. */
export interface ChecklistItem {
	id: string;
	text: string;
	done: boolean;
}

export interface SecretItem {
	id: string;
	text: string;
	revealed: boolean;
}

export type PlanStatus = 'planning' | 'ready' | 'played';

export const PLAN_STATUS_LABELS: Record<PlanStatus, string> = {
	planning: 'In Planung',
	ready: 'Bereit',
	played: 'Gespielt'
};

export interface SessionPlan {
	id: string;
	characterId: string;
	title: string;
	sessionDate: string;
	status: PlanStatus;
	strongStart: string;
	scenes: ChecklistItem[];
	secrets: SecretItem[];
	npcs: string;
	locations: string;
	treasure: string;
	notes: string;
	checklist: ChecklistItem[];
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

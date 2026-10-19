/** Datentypen der Kampagnendateien in campaign/ (siehe campaign/README.md). */

export type Ability = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';
export type Economy = 'aktion' | 'bonus' | 'reaktion' | 'minute' | 'stunde' | 'passiv' | 'rast';

export interface Attack {
	id: string;
	name: string;
	bonus: number;
	damage: string;
	damageAlt?: string;
	damageType: string;
	range: string;
	props?: string;
	/** Waffenname, mit dem die Astrale Trance Übung gibt (dann + Übungsbonus) */
	trance?: string;
}

export interface Feature {
	id: string;
	name: string;
	source: string;
	economy: Economy;
	uses?: { max: number; reset: 'long' | 'short' };
	summary: string;
	text: string;
	note?: string;
	upcoming?: boolean;
}

export interface Character {
	id: string;
	name: string;
	nickname?: string;
	alias?: string;
	aliasTitle?: string;
	aliasNote?: string;
	player?: string;
	race: string;
	className: string;
	subclass: string;
	level: number;
	alignment: string;
	background: string;
	/** Dateiname in campaign/assets/ (rund freigestellt, ~640 px) */
	portrait: string;
	/** Kleine Variante für Seitenleiste und Kopfzeile (~160 px) */
	avatar?: string;
	abilities: Record<Ability, number>;
	proficiencyBonus: number;
	saves: Ability[];
	skills: Record<string, string>;
	hp: { max: number; hitDie: number; note?: string };
	ac: { base: number; formula: string };
	speed: number;
	darkvision: number;
	spellcasting: { ability: Ability; focus: string; preparedMax: number; slots: Record<string, number> };
	proficiencies: { armor: string; weapons: string; tools: string; languages: string };
	attacks: Attack[];
	features: Feature[];
	goal?: string;
	appearance?: string;
}

export interface Minion {
	id: string;
	kind: 'skelett' | 'zombie';
	name: string;
	hp: number;
	maxHp: number;
	renewed: boolean;
	note?: string;
}

export interface PlayState {
	hp: number;
	tempHp: number;
	deathSaves: { success: number; fail: number };
	slotsUsed: Record<string, number>;
	featureUsed: Record<string, number>;
	hitDiceUsed: number;
	inspiration: boolean;
	exhaustion: number;
	conditions: string[];
	concentration: { spellId: string; name: string; since: number } | null;
	shield: boolean;
	/** Astrale Trance: heute geübte Waffe oder Werkzeug (Hausregel: keine Fertigkeit) */
	trance: { tool: string };
	familiar: { form: string; present: boolean; hp: number };
	servant: boolean;
	minions: Minion[];
	updatedAt: number;
}

export interface Ref {
	with: string;
	text: string;
}

export interface Spell {
	id: string;
	name: string;
	en: string;
	level: number;
	school: string;
	status: 'buch' | 'frage' | 'vorschlag';
	prepared?: boolean;
	ritual?: boolean;
	concentration?: boolean;
	time: string;
	economy: Economy;
	trigger?: string;
	range: string;
	target?: string;
	area?: string;
	components: string;
	duration: string;
	attack?: string;
	save?: string;
	damage?: string;
	rolls?: { label: string; expr: string }[];
	source?: string;
	summary?: string;
	text: string;
	higher?: string;
	valerius?: string;
	why?: string;
	slot?: string;
	tips?: string[];
	uses?: string[];
	rulings?: string[];
	synergies?: Ref[];
	conflicts?: Ref[];
	corrections?: { doc: string; text: string }[];
	note?: string;
	docs?: string[];
	/** Kurzregeln für die Zauberkarte im Druck (Volltext steht in text) */
	card?: string;
}

export interface StatTrait {
	name: string;
	text: string;
}

export interface Familiar {
	id: string;
	name: string;
	size: string;
	ac: number;
	hp: number;
	speed: string;
	abilities: Record<Ability, number>;
	skills: string;
	senses: string;
	traits: StatTrait[];
	verdict: string;
	note?: string;
}

export interface UndeadBlock {
	id: string;
	name: string;
	type: string;
	ac: number;
	acNote?: string;
	hp: number;
	hpFormula: string;
	speed: string;
	abilities: Record<Ability, number>;
	saves?: string;
	vulnerable?: string;
	immune?: string;
	senses: string;
	languages: string;
	cr: string;
	traits?: StatTrait[];
	actions: { name: string; bonus: number; damage: string; type: string; range: string }[];
	verdict: string;
}

export interface PartyMember {
	id: string;
	name: string;
	altName?: string;
	role: string;
	ac: string;
	hp: number;
	speed: string;
	notes: string[];
	source?: string;
}

export interface FamiliarOption {
	form: string;
	label: string;
	/** Nicht in der Liste des Zaubers: braucht die Zustimmung des DM. */
	dm?: boolean;
	pro: string[];
	con: string[];
}

export interface Creatures {
	familiars: Familiar[];
	familiarPlan?: { title: string; intro: string; options: FamiliarOption[] };
	servant: { id: string; name: string; ac: number; hp: number; speed: string; str: number; rules: string[] };
	undead: UndeadBlock[];
	party: PartyMember[];
}

export type ItemGroup = 'koerper' | 'verbrauch' | 'beute' | 'plot' | 'gelagert' | 'verloren';

export interface Item {
	id: string;
	name: string;
	group: ItemGroup;
	qty: number;
	desc: string;
	note?: string;
	magic?: boolean;
	heal?: string;
}

export interface WishItem {
	id: string;
	name: string;
	price?: number;
	priceText?: string;
	priority: 'kritisch' | 'hoch' | 'mittel' | 'vorschlag' | 'saladin';
	phase: 'jetzt' | 'nach-saladin' | 'saladin';
	why: string;
	done?: boolean;
}

export interface Inventory {
	currency: { gm: number; sm: number; km: number };
	items: Item[];
	wishlist: WishItem[];
}

export type QuestStatus = 'aktiv' | 'geruecht' | 'erledigt' | 'gescheitert';

export interface Quest {
	id: string;
	title: string;
	status: QuestStatus;
	urgent?: boolean;
	kind?: string;
	giver?: string;
	next?: string;
	reward?: string;
	notes?: string;
	links?: string[];
}

export interface JournalEntry {
	id: string;
	order: number;
	chapter?: string;
	title: string;
	type: 'session' | 'nachricht' | 'planung' | 'notiz';
	date: string | null;
	dateMode: 'exakt' | 'ca' | 'spaetestens' | 'zeitraum' | 'unbekannt';
	dateLabel: string;
	dateBasis?: string;
	ingame?: string;
	places?: string[];
	people?: string[];
	summary?: string;
	events: string[];
	loot?: string[];
	lost?: string[];
	encounters?: string[];
	level?: number | null;
	quests?: { ref: string; change: string }[];
	notes?: string[];
	contradictions?: string[];
	sources?: string[];
}

export interface MapPin {
	id: string;
	x: number;
	y: number;
	kind: 'ziel' | 'gefahr' | 'bestie' | 'ort' | 'unklar' | 'eigen';
	label: string;
	text: string;
	link?: string;
	uncertain?: boolean;
}

export interface MapData {
	image: string;
	title: string;
	note: string;
	pins: MapPin[];
}

export interface Source {
	id: string;
	title: string;
	url: string;
	kind: 'doc' | 'bild';
	modified: string;
	status: 'kanon' | 'referenz' | 'teilweise' | 'veraltet' | 'gemini';
	group: string;
	local?: string;
	summary: string;
}

export interface DocFile {
	slug: string;
	title: string;
	subtitle?: string;
	icon?: string;
	order: number;
	group: string;
	aliases: string[];
	updated?: string;
	body: string;
}

export interface WorldEntry {
	slug: string;
	name: string;
	aliases: string[];
	kind: 'person' | 'fraktion' | 'ort';
	group: string;
	tone: 'ally' | 'enemy' | 'neutral' | 'unknown' | 'dead';
	status: string;
	summary: string;
	body: string;
}

/** Ein Eintrag im Verweis-Index (Suche, [[Wikilinks]], Vorschaukarten). */
export interface RefEntry {
	key: string;
	title: string;
	kind: string;
	summary: string;
	href: string;
	names: string[];
	meta?: string;
}

export interface Backlink {
	key: string;
	title: string;
	kind: string;
	href: string;
}

/** Stammbaum (campaign/stammbaum.json): Personen im Raster, Beziehungen als Linien. */
export interface TreeNode {
	id: string;
	label: string;
	/** Name eines Welt-Eintrags, auf den der Kasten verlinkt */
	ref?: string;
	sub?: string;
	/** Spalte (auch halbe) und Zeile (Generation) */
	x: number;
	y: number;
	tone?: WorldEntry['tone'];
	uncertain?: boolean;
}

export interface TreeEdge {
	/** eltern: from = Eltern, to = Kinder · geschwister/ehe/theorie: zwei Kästen · feindschaft: Bogen mit Pfeil */
	kind: 'eltern' | 'geschwister' | 'ehe' | 'theorie' | 'feindschaft';
	from: string[];
	to: string[];
	label?: string;
	/** Gestrichelt: vermutet oder offen */
	uncertain?: boolean;
}

export interface FamilyTree {
	id: string;
	/** Slug des Welt-Eintrags, auf dessen Seite der Baum erscheint */
	world: string;
	title: string;
	note?: string;
	nodes: TreeNode[];
	edges: TreeEdge[];
}

export interface CampaignData {
	trees: FamilyTree[];
	character: Character;
	state: PlayState;
	spells: Spell[];
	creatures: Creatures;
	inventory: Inventory;
	quests: Quest[];
	journal: JournalEntry[];
	map: MapData;
	sources: Source[];
	docs: DocFile[];
	world: WorldEntry[];
	index: RefEntry[];
	backlinks: Record<string, Backlink[]>;
}

/** Dateien, die die App zurückschreiben darf. */
export const WRITABLE = ['state', 'inventory', 'quests', 'spells', 'journal', 'map'] as const;
export type WritableFile = (typeof WRITABLE)[number];

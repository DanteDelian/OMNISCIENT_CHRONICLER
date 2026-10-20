/** Lädt die komplette Kampagne aus campaign/ und baut Index und Rückverweise. */
import matter from 'gray-matter';
import { buildBacklinks, buildIndex } from '$lib/refs';
import type {
	CampaignData,
	Character,
	Creatures,
	DocFile,
	FamilyTree,
	Inventory,
	JournalEntry,
	MapData,
	Network,
	SpellSets,
	PlayState,
	Quest,
	Question,
	Source,
	Spell,
	WorldEntry
} from '$lib/types';
import { listFiles, readJson, readText, revision } from './store';

const EMPTY_STATE: PlayState = {
	hp: 0,
	tempHp: 0,
	deathSaves: { success: 0, fail: 0 },
	slotsUsed: {},
	featureUsed: {},
	hitDiceUsed: 0,
	inspiration: false,
	exhaustion: 0,
	conditions: [],
	concentration: null,
	shield: false,
	trance: { tool: '' },
	familiar: { form: 'eule', present: true, hp: 1 },
	servant: false,
	minions: [],
	updatedAt: 0
};

function asArray(v: unknown): string[] {
	if (Array.isArray(v)) return v.map(String);
	if (typeof v === 'string' && v) return [v];
	return [];
}

function loadDocs(): DocFile[] {
	return listFiles('docs', '.md')
		.map((file) => {
			const { data, content } = matter(readText(`docs/${file}`));
			return {
				slug: file.replace(/\.md$/, ''),
				title: String(data.title ?? file),
				subtitle: data.subtitle ? String(data.subtitle) : undefined,
				icon: data.icon ? String(data.icon) : undefined,
				order: Number(data.order ?? 99),
				group: String(data.group ?? 'Dokumente'),
				aliases: asArray(data.aliases),
				updated: data.updated ? String(data.updated instanceof Date ? data.updated.toISOString().slice(0, 10) : data.updated) : undefined,
				body: content.trim()
			};
		})
		.sort((a, b) => a.order - b.order);
}

function loadWorld(): WorldEntry[] {
	return listFiles('world', '.md').map((file) => {
		const { data, content } = matter(readText(`world/${file}`));
		return {
			slug: file.replace(/\.md$/, ''),
			name: String(data.name ?? file),
			aliases: asArray(data.aliases),
			kind: (data.kind ?? 'person') as WorldEntry['kind'],
			group: String(data.group ?? 'kontakt'),
			tone: (data.tone ?? 'unknown') as WorldEntry['tone'],
			status: String(data.status ?? ''),
			summary: String(data.summary ?? ''),
			body: content.trim()
		};
	});
}

let cache: { rev: number; data: CampaignData } | null = null;

export function loadCampaign(): CampaignData {
	if (cache && cache.rev === revision) return cache.data;
	const base = {
		character: readJson<Character>('character.json', {} as Character),
		state: { ...EMPTY_STATE, ...readJson<Partial<PlayState>>('state.json', {}) },
		spells: readJson<Spell[]>('spells.json', []),
		creatures: readJson<Creatures>('creatures.json', { familiars: [], servant: {} as Creatures['servant'], undead: [], party: [] }),
		inventory: readJson<Inventory>('inventory.json', { currency: { gm: 0, sm: 0, km: 0 }, items: [], wishlist: [] }),
		quests: readJson<Quest[]>('quests.json', []),
		journal: readJson<JournalEntry[]>('journal.json', []).sort((a, b) => a.order - b.order),
		map: readJson<MapData>('map.json', { image: '', title: 'Karte', note: '', pins: [] }),
		sources: readJson<Source[]>('sources.json', []),
		docs: loadDocs(),
		world: loadWorld(),
		trees: readJson<{ trees: FamilyTree[] }>('stammbaum.json', { trees: [] }).trees ?? [],
		fragen: readJson<Question[]>('fragen.json', []),
		netzwerk: { roles: [], agents: [], ...readJson<Partial<Network>>('netzwerk.json', {}) },
		zaubersets: { sets: [], ...readJson<Partial<SpellSets>>('zaubersets.json', {}) }
	};
	const index = buildIndex(base);
	const data: CampaignData = { ...base, index, backlinks: buildBacklinks(base, index) };
	cache = { rev: revision, data };
	return data;
}

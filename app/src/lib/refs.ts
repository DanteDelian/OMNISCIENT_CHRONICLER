/**
 * Verweis-Index: Jede Person, jeder Ort, Zauber, jedes Dokument, jede Quest usw.
 * bekommt einen Eintrag. [[Wikilinks]], die Suche (⌘K) und die Vorschaukarten nutzen ihn.
 */
import type { Backlink, CampaignData, RefEntry } from './types';

export function normalizeName(s: string): string {
	return s
		.toLowerCase()
		.replace(/[„“”"'’‚‘«»]/g, '')
		.replace(/&/g, 'und')
		.replace(/\s+/g, ' ')
		.trim();
}

/** „Aella Rayann „Khoraa“ Stormscale“ → „Aella Rayann Stormscale“ */
function withoutNick(s: string): string {
	return s.replace(/\s*[„"“][^„"“”]*[“”"]\s*/g, ' ').replace(/\s+/g, ' ').trim();
}

export function slugify(s: string): string {
	return s
		.toLowerCase()
		.replace(/ä/g, 'ae')
		.replace(/ö/g, 'oe')
		.replace(/ü/g, 'ue')
		.replace(/ß/g, 'ss')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');
}

const WIKILINK = /\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|([^\]]+))?\]\]/g;

export function extractLinks(text: string | undefined): string[] {
	if (!text) return [];
	const out: string[] = [];
	for (const m of text.matchAll(WIKILINK)) out.push(m[1].trim());
	return out;
}

const KIND_ORDER: Record<string, number> = {
	Person: 1,
	Fraktion: 2,
	Ort: 3,
	Zauber: 4,
	Merkmal: 5,
	Kreatur: 6,
	Quest: 7,
	Gegenstand: 8,
	Dokument: 9,
	Journal: 10,
	Seite: 11
};

export function kindRank(kind: string): number {
	return KIND_ORDER[kind] ?? 50;
}

type IndexInput = Omit<CampaignData, 'index' | 'backlinks'>;

export function buildIndex(d: IndexInput): RefEntry[] {
	const out: RefEntry[] = [];
	const push = (e: Omit<RefEntry, 'names'> & { names: string[] }) => {
		const names = new Set<string>();
		for (const n of e.names) {
			if (!n) continue;
			names.add(normalizeName(n));
			names.add(normalizeName(withoutNick(n)));
		}
		out.push({ ...e, names: [...names] });
	};

	for (const w of d.world) {
		const kind = w.kind === 'person' ? 'Person' : w.kind === 'fraktion' ? 'Fraktion' : 'Ort';
		push({ key: `world:${w.slug}`, title: w.name, kind, summary: w.summary, href: `/welt/${w.slug}`, names: [w.name, ...w.aliases], meta: w.status });
	}
	for (const s of d.spells) {
		const lvl = s.level === 0 ? 'Zaubertrick' : `Grad ${s.level}`;
		push({
			key: `spell:${s.id}`,
			title: s.name,
			kind: 'Zauber',
			summary: s.summary ?? stripMd(s.text).slice(0, 180),
			href: `/zauber/${s.id}`,
			names: [s.name, s.en],
			meta: `${lvl} · ${s.school} · ${s.time} · ${s.range}`
		});
	}
	for (const f of d.character.features) {
		push({ key: `feature:${f.id}`, title: f.name, kind: 'Merkmal', summary: f.summary, href: `/bogen#${f.id}`, names: [f.name], meta: f.source });
	}
	for (const a of d.character.attacks) {
		push({ key: `attack:${a.id}`, title: a.name, kind: 'Angriff', summary: `${a.bonus >= 0 ? '+' : ''}${a.bonus} · ${a.damage} ${a.damageType}`, href: `/bogen#angriffe`, names: [a.name] });
	}
	for (const f of d.creatures.familiars) {
		push({ key: `creature:${f.id}`, title: f.name, kind: 'Kreatur', summary: f.verdict, href: `/gefolge#${f.id}`, names: [f.name, f.name.replace(/\s*\(.*\)/, '')], meta: `RK ${f.ac} · ${f.hp} TP · ${f.speed}` });
	}
	for (const u of d.creatures.undead) {
		push({ key: `creature:${u.id}`, title: u.name, kind: 'Kreatur', summary: u.verdict, href: `/gefolge#${u.id}`, names: [u.name, u.name + 'e', u.name + 's'], meta: `RK ${u.ac} · ${u.hp} TP · ${u.speed}` });
	}
	for (const p of d.creatures.party) {
		// Gruppenmitglieder verweisen auf ihren Welt-Eintrag, wenn es einen gibt.
		if (!out.some((e) => e.names.includes(normalizeName(withoutNick(p.name))))) {
			push({ key: `party:${p.id}`, title: p.name, kind: 'Person', summary: p.role, href: `/gefolge#${p.id}`, names: [p.name] });
		}
	}
	for (const q of d.quests) {
		push({ key: `quest:${q.id}`, title: q.title, kind: 'Quest', summary: q.next || q.notes || '', href: `/quests#${q.id}`, names: [q.title], meta: q.status });
	}
	for (const it of d.inventory.items) {
		push({ key: `item:${it.id}`, title: it.name, kind: 'Gegenstand', summary: stripMd(it.desc), href: `/inventar#${it.id}`, names: [it.name], meta: `× ${it.qty}` });
	}
	for (const doc of d.docs) {
		push({ key: `doc:${doc.slug}`, title: doc.title, kind: 'Dokument', summary: doc.subtitle ?? '', href: `/archiv/${doc.slug}`, names: [doc.title, ...doc.aliases] });
	}
	for (const j of d.journal) {
		push({ key: `journal:${j.id}`, title: j.title, kind: 'Journal', summary: j.summary ?? '', href: `/journal#${j.id}`, names: [j.title], meta: j.dateLabel });
	}
	// Feste Seiten
	push({ key: 'page:karte', title: 'Echsen-Karte', kind: 'Seite', summary: d.map.note, href: '/karte', names: ['Echsen-Karte', 'Wüstenkarte', 'Karte', 'Echsenkarte'] });
	push({ key: 'page:zauber', title: 'Zauberbuch', kind: 'Seite', summary: 'Alle Zauber mit vollständigen Regeln', href: '/zauber', names: ['Zauberbuch'] });
	push({ key: 'page:gefolge', title: 'Gefolge', kind: 'Seite', summary: 'Vertrauter, Diener, Untote, Gefährtin', href: '/gefolge', names: ['Gefolge', 'Vertraute und Diener', 'Vertraute & Diener'] });
	push({ key: 'page:regeln', title: 'Regeln', kind: 'Seite', summary: 'Zustände, Aktionen, Konzentration, Rasten', href: '/regeln', names: ['Regeln'] });
	return out;
}

export function makeResolver(index: RefEntry[]) {
	const map = new Map<string, RefEntry>();
	// Spezifischere Typen zuerst eintragen, damit sie bei Namensgleichheit gewinnen.
	const sorted = [...index].sort((a, b) => kindRank(a.kind) - kindRank(b.kind));
	for (const e of sorted) for (const n of e.names) if (!map.has(n)) map.set(n, e);
	return (name: string): RefEntry | undefined => map.get(normalizeName(name));
}

/** Rückverweise: Wer erwähnt wen? */
export function buildBacklinks(d: IndexInput, index: RefEntry[]): Record<string, Backlink[]> {
	const resolve = makeResolver(index);
	const result: Record<string, Backlink[]> = {};
	const add = (targetName: string, from: Backlink) => {
		const t = resolve(targetName);
		if (!t || t.key === from.key) return;
		const list = (result[t.key] ??= []);
		if (!list.some((b) => b.key === from.key)) list.push(from);
	};

	for (const w of d.world) {
		const from = { key: `world:${w.slug}`, title: w.name, kind: w.kind === 'ort' ? 'Ort' : w.kind === 'person' ? 'Person' : 'Fraktion', href: `/welt/${w.slug}` };
		for (const l of extractLinks(w.body)) add(l, from);
	}
	for (const doc of d.docs) {
		const from = { key: `doc:${doc.slug}`, title: doc.title, kind: 'Dokument', href: `/archiv/${doc.slug}` };
		for (const l of extractLinks(doc.body)) add(l, from);
	}
	for (const q of d.quests) {
		const from = { key: `quest:${q.id}`, title: q.title, kind: 'Quest', href: `/quests#${q.id}` };
		for (const l of [...(q.links ?? []), ...extractLinks(q.notes), ...extractLinks(q.next)]) add(l, from);
	}
	for (const j of d.journal) {
		const from = { key: `journal:${j.id}`, title: j.title, kind: 'Journal', href: `/journal#${j.id}` };
		const texts = [...j.events, ...(j.notes ?? []), j.summary ?? ''];
		for (const l of [...(j.people ?? []), ...(j.places ?? []), ...texts.flatMap(extractLinks)]) add(l, from);
		for (const q of j.quests ?? []) {
			const quest = d.quests.find((x) => x.id === q.ref);
			if (quest) add(quest.title, from);
		}
	}
	for (const s of d.spells) {
		const from = { key: `spell:${s.id}`, title: s.name, kind: 'Zauber', href: `/zauber/${s.id}` };
		for (const r of [...(s.synergies ?? []), ...(s.conflicts ?? [])]) add(r.with, from);
	}
	for (const it of d.inventory.items) {
		const from = { key: `item:${it.id}`, title: it.name, kind: 'Gegenstand', href: `/inventar#${it.id}` };
		for (const l of extractLinks(it.desc)) add(l, from);
	}
	return result;
}

export function stripMd(s: string): string {
	return s
		.replace(WIKILINK, (_m, t, l) => l || t)
		.replace(/[*_`#>]/g, '')
		.replace(/\s+/g, ' ')
		.trim();
}

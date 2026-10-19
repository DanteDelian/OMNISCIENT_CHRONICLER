#!/usr/bin/env node
/**
 * Prüft die Kampagnendaten in campaign/ auf Konsistenz:
 * - gültiges JSON und Pflichtfelder
 * - jeder [[Verweis]] und jeder Personen-/Ortsname löst sich auf
 * - Quellen-IDs (sources.json) und Quest-IDs existieren
 * - Stammbäume (stammbaum.json) verbinden nur vorhandene Personen
 * Aufruf: npm run check:data   (Exit-Code 1 bei Fehlern)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import { buildIndex, extractLinks, makeResolver } from '../src/lib/refs.ts';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..', '..', 'campaign');
const errors = [];
const warnings = [];

function json(rel) {
	try {
		return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf-8'));
	} catch (e) {
		errors.push(`${rel}: kein gültiges JSON (${e.message})`);
		return null;
	}
}

function mdDir(dir, map) {
	const abs = path.join(root, dir);
	if (!fs.existsSync(abs)) return [];
	return fs
		.readdirSync(abs)
		.filter((f) => f.endsWith('.md'))
		.map((f) => {
			const { data, content } = matter(fs.readFileSync(path.join(abs, f), 'utf-8'));
			return map(f.replace(/\.md$/, ''), data, content.trim());
		});
}

const asArray = (v) => (Array.isArray(v) ? v.map(String) : v ? [String(v)] : []);

const d = {
	character: json('character.json'),
	state: json('state.json'),
	spells: json('spells.json') ?? [],
	creatures: json('creatures.json') ?? { familiars: [], undead: [], party: [] },
	inventory: json('inventory.json') ?? { items: [], wishlist: [] },
	quests: json('quests.json') ?? [],
	journal: json('journal.json') ?? [],
	map: json('map.json') ?? { pins: [] },
	sources: json('sources.json') ?? [],
	trees: json('stammbaum.json')?.trees ?? [],
	docs: mdDir('docs', (slug, data, body) => ({ slug, title: String(data.title ?? slug), subtitle: data.subtitle, aliases: asArray(data.aliases), order: data.order ?? 99, group: data.group ?? '', body })),
	world: mdDir('world', (slug, data, body) => ({
		slug,
		name: String(data.name ?? slug),
		aliases: asArray(data.aliases),
		kind: data.kind ?? 'person',
		group: data.group ?? '',
		tone: data.tone ?? 'unknown',
		status: String(data.status ?? ''),
		summary: String(data.summary ?? ''),
		body
	}))
};

if (!d.character) {
	console.error('character.json fehlt oder ist kaputt.');
	process.exit(1);
}

const index = buildIndex(d);
const resolve = makeResolver(index);
const sourceIds = new Set(d.sources.map((s) => s.id));
const questIds = new Set(d.quests.map((q) => q.id));

function ref(where, name) {
	if (!resolve(name)) errors.push(`${where}: Verweis „${name}“ findet keinen Eintrag`);
}
function links(where, text) {
	for (const l of extractLinks(text)) ref(where, l);
}
function source(where, id) {
	if (!sourceIds.has(id)) errors.push(`${where}: Quelle „${id}“ fehlt in sources.json`);
}

// Pflichtfelder
for (const s of d.spells) {
	for (const k of ['id', 'name', 'level', 'school', 'status', 'time', 'economy', 'range', 'components', 'duration', 'text']) {
		if (s[k] === undefined || s[k] === '') errors.push(`spells.json: ${s.id ?? '?'} ohne „${k}“`);
	}
}
const ids = new Set();
for (const s of d.spells) {
	if (ids.has(s.id)) errors.push(`spells.json: doppelte ID ${s.id}`);
	ids.add(s.id);
}

// Verweise
for (const doc of d.docs) links(`docs/${doc.slug}.md`, doc.body);
for (const w of d.world) links(`world/${w.slug}.md`, w.body);
for (const q of d.quests) {
	for (const l of q.links ?? []) ref(`quests.json ${q.id}`, l);
	links(`quests.json ${q.id}`, `${q.notes ?? ''} ${q.next ?? ''}`);
}
for (const j of d.journal) {
	for (const n of [...(j.people ?? []), ...(j.places ?? [])]) ref(`journal.json ${j.id}`, n);
	for (const t of [...j.events, ...(j.notes ?? [])]) links(`journal.json ${j.id}`, t);
	for (const s of j.sources ?? []) source(`journal.json ${j.id}`, s);
	for (const q of j.quests ?? []) if (!questIds.has(q.ref)) errors.push(`journal.json ${j.id}: Quest „${q.ref}“ gibt es nicht`);
	if (!j.dateLabel) warnings.push(`journal.json ${j.id}: ohne dateLabel`);
}
for (const s of d.spells) {
	for (const r of [...(s.synergies ?? []), ...(s.conflicts ?? [])]) ref(`spells.json ${s.id}`, r.with);
	for (const t of [s.text, s.higher, s.valerius, s.why, s.note, ...(s.tips ?? []), ...(s.uses ?? []), ...(s.rulings ?? [])]) links(`spells.json ${s.id}`, t);
	for (const doc of s.docs ?? []) source(`spells.json ${s.id}`, doc);
	for (const c of s.corrections ?? []) source(`spells.json ${s.id}`, c.doc);
}
for (const it of d.inventory.items) links(`inventory.json ${it.id}`, `${it.desc} ${it.note ?? ''}`);
for (const p of d.map.pins) if (p.link) ref(`map.json ${p.id}`, p.link);
for (const p of d.creatures.party ?? []) if (p.source) source(`creatures.json ${p.id}`, p.source);

// Stammbäume
for (const t of d.trees) {
	const where = `stammbaum.json ${t.id}`;
	if (!d.world.some((w) => w.slug === t.world)) errors.push(`${where}: Welt-Eintrag „${t.world}“ fehlt`);
	const nodes = new Map();
	for (const n of t.nodes ?? []) {
		if (nodes.has(n.id)) errors.push(`${where}: doppelte Person ${n.id}`);
		nodes.set(n.id, n);
		if (n.ref) ref(`${where} ${n.id}`, n.ref);
	}
	for (const e of t.edges ?? []) {
		const ids = [...(e.from ?? []), ...(e.to ?? [])];
		for (const id of ids) if (!nodes.has(id)) errors.push(`${where}: Linie (${e.kind}) kennt „${id}“ nicht`);
		if (e.kind === 'eltern') continue;
		if (e.from?.length !== 1 || e.to?.length !== 1) errors.push(`${where}: Linie (${e.kind}) verbindet genau zwei Personen`);
		else if (nodes.get(e.from[0])?.y !== nodes.get(e.to[0])?.y) warnings.push(`${where}: Linie (${e.kind}) zwischen verschiedenen Generationen wird schief gezeichnet`);
	}
	links(where, t.note);
}

// Zustand plausibel?
const s = d.state;
if (s && d.character) {
	if (s.hp > d.character.hp.max) warnings.push(`state.json: TP ${s.hp} über dem Maximum ${d.character.hp.max}`);
	for (const [lvl, used] of Object.entries(s.slotsUsed ?? {})) {
		if (used > (d.character.spellcasting.slots[lvl] ?? 0)) errors.push(`state.json: mehr Grad-${lvl}-Plätze verbraucht als vorhanden`);
	}
}
const prepared = d.spells.filter((x) => x.status === 'buch' && x.level > 0 && x.prepared).length;
if (prepared > d.character.spellcasting.preparedMax) warnings.push(`spells.json: ${prepared} vorbereitet, erlaubt sind ${d.character.spellcasting.preparedMax}`);

console.log(`Index: ${index.length} Einträge · Zauber ${d.spells.length} · Welt ${d.world.length} · Dokumente ${d.docs.length} · Journal ${d.journal.length} · Quests ${d.quests.length} · Stammbäume ${d.trees.length}`);
for (const w of warnings) console.log(`  Hinweis: ${w}`);
for (const e of errors) console.log(`  FEHLER:  ${e}`);
console.log(errors.length ? `\n${errors.length} Fehler gefunden.` : '\nAlles konsistent.');
process.exit(errors.length ? 1 : 0);

#!/usr/bin/env node
/**
 * Prüft die Kampagnendaten in campaign/ auf Konsistenz:
 * - gültiges JSON und Pflichtfelder
 * - jeder [[Verweis]] und jeder Personen-/Ortsname löst sich auf
 * - Quellen-IDs (sources.json) und Quest-IDs existieren
 * - Stammbäume (stammbaum.json) verbinden nur vorhandene Personen
 * - Fragen (fragen.json) und Netzwerk (netzwerk.json) sind vollständig
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
	fragen: json('fragen.json') ?? [],
	netzwerk: { roles: [], agents: [], ...(json('netzwerk.json') ?? {}) },
	zaubersets: { sets: [], ...(json('zaubersets.json') ?? {}) },
	geheimnisse: { ruf: '', gefahren: '', secrets: [], ...(json('geheimnisse.json') ?? {}) },
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
	for (const t of [...j.events, ...(j.notes ?? []), ...(j.contradictions ?? [])]) links(`journal.json ${j.id}`, t);
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
for (const w of d.inventory.wishlist ?? []) {
	for (const way of w.ways ?? []) if (!['herstellen', 'erfragen', 'klauen', 'erbeuten'].includes(way)) errors.push(`inventory.json Wunsch ${w.id}: unbekannter Weg „${way}“`);
	links(`inventory.json Wunsch ${w.id}`, `${w.why ?? ''} ${w.how ?? ''}`);
}
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

// Fragen an den DM, an den Tisch und an dich
const fragenIds = new Set();
for (const q of d.fragen) {
	const where = `fragen.json ${q.id ?? '?'}`;
	for (const k of ['id', 'to', 'topic', 'question', 'status']) if (!q[k]) errors.push(`${where}: ohne „${k}“`);
	if (fragenIds.has(q.id)) errors.push(`${where}: doppelte ID`);
	fragenIds.add(q.id);
	if (!['dm', 'tisch', 'dich'].includes(q.to)) errors.push(`${where}: to muss dm, tisch oder dich sein`);
	if (!['offen', 'geklaert'].includes(q.status)) errors.push(`${where}: status muss offen oder geklaert sein`);
	if (q.status === 'geklaert' && !q.answer) warnings.push(`${where}: geklärt, aber ohne Antwort`);
	for (const l of q.links ?? []) ref(where, l);
	links(where, `${q.question ?? ''} ${q.answer ?? ''}`);
}

// Netzwerk der Unsichtbaren Hand
const roleIds = new Set(d.netzwerk.roles.map((r) => r.id));
for (const r of d.netzwerk.roles) links(`netzwerk.json Rolle ${r.id}`, `${r.task} ${r.where} ${r.cost}`);
const agentIds = new Set();
for (const a of d.netzwerk.agents) {
	const where = `netzwerk.json ${a.id ?? '?'}`;
	if (!a.id || !a.name) errors.push(`${where}: ohne id oder name`);
	if (agentIds.has(a.id)) errors.push(`${where}: doppelte ID`);
	agentIds.add(a.id);
	if (!roleIds.has(a.role)) errors.push(`${where}: Rolle „${a.role}“ gibt es nicht`);
	if (!['kandidat', 'aktiv', 'ruhend', 'verloren'].includes(a.status)) errors.push(`${where}: unbekannter Status „${a.status}“`);
	if (!(a.loyalty >= 0 && a.loyalty <= 5)) errors.push(`${where}: Treue muss zwischen 0 und 5 liegen`);
	if (a.ref) ref(where, a.ref);
	links(where, `${a.knows ?? ''} ${a.notes ?? ''}`);
}

// Zauber-Sets für den Tag
const setIds = new Set();
for (const z of d.zaubersets.sets) {
	const where = `zaubersets.json ${z.id ?? '?'}`;
	if (!z.id || !z.name) errors.push(`${where}: ohne id oder name`);
	if (setIds.has(z.id)) errors.push(`${where}: doppelte ID`);
	setIds.add(z.id);
	if (!Array.isArray(z.spells)) errors.push(`${where}: spells fehlt`);
	for (const id of z.spells ?? []) {
		const sp = d.spells.find((x) => x.id === id);
		if (!sp) errors.push(`${where}: Zauber „${id}“ gibt es nicht`);
		else if (sp.level === 0) warnings.push(`${where}: Zaubertrick „${sp.name}“ braucht keine Vorbereitung`);
	}
	if (new Set(z.spells).size !== (z.spells ?? []).length) errors.push(`${where}: Zauber doppelt`);
	links(where, z.tip ?? '');
}

// Wer weiß was?
links('geheimnisse.json ruf', d.geheimnisse.ruf);
links('geheimnisse.json gefahren', d.geheimnisse.gefahren);
const secretIds = new Set();
for (const g of d.geheimnisse.secrets) {
	const where = `geheimnisse.json ${g.id ?? '?'}`;
	if (!g.id || !g.title || !g.truth) errors.push(`${where}: ohne id, title oder truth`);
	if (secretIds.has(g.id)) errors.push(`${where}: doppelte ID`);
	secretIds.add(g.id);
	if (!['sicher', 'gefaehrdet', 'aufgeflogen'].includes(g.status)) errors.push(`${where}: unbekannter Status „${g.status}“`);
	if (!Array.isArray(g.knownBy) || !Array.isArray(g.suspects)) errors.push(`${where}: knownBy und suspects müssen Listen sein`);
	for (const w of [...(g.knownBy ?? []), ...(g.suspects ?? [])]) {
		if (!w.who) errors.push(`${where}: Zeuge ohne who`);
		else if (!resolve(w.who) && !/^[„"]/.test(w.who)) warnings.push(`${where}: „${w.who}“ hat keinen Welt-Eintrag`);
		links(where, w.how ?? '');
	}
	for (const l of g.links ?? []) ref(where, l);
	links(where, [g.truth, g.cover, g.risk, g.note].filter(Boolean).join(' '));
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
// Zauberkarten im Druck: Lange Regeltexte brauchen eigene Kurzregeln (card), sonst wird die Schrift winzig
for (const s of d.spells.filter((x) => x.status === 'buch' && !x.card)) {
	const plain = s.text.replace(/\*|\[\[(?:[^\]|]*\|)?|\]\]/g, '');
	if (plain.length > 650) warnings.push(`spells.json ${s.id}: langer Regeltext ohne „card“ für die Zauberkarte`);
}

console.log(`Index: ${index.length} Einträge · Zauber ${d.spells.length} · Welt ${d.world.length} · Dokumente ${d.docs.length} · Journal ${d.journal.length} · Quests ${d.quests.length} · Stammbäume ${d.trees.length} · Fragen ${d.fragen.length} · Netzwerk ${d.netzwerk.agents.length} · Zauber-Sets ${d.zaubersets.sets.length} · Geheimnisse ${d.geheimnisse.secrets.length}`);
for (const w of warnings) console.log(`  Hinweis: ${w}`);
for (const e of errors) console.log(`  FEHLER:  ${e}`);
console.log(errors.length ? `\n${errors.length} Fehler gefunden.` : '\nAlles konsistent.');
process.exit(errors.length ? 1 : 0);

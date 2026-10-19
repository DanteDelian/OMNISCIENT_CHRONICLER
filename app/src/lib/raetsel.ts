/**
 * Rätselwand: sammelt Theorien und offene Punkte aus allen Texten der Kampagne.
 * Erkannt werden „*Theorie:* …“, „*Theorie (Juli 2026):* …“, „… *Theorie: ein Fluch.*“,
 * Listen unter „*Theorien:*“ und „**Offen:** …“. Neue Einträge erscheinen also von selbst.
 */
import type { CampaignData, Question } from './types';

export interface ClueSource {
	/** Eindeutig je Fundstelle (gruppiert die Anzeige) */
	key: string;
	/** Index-Schlüssel für die Vorschaukarte */
	ref: string;
	title: string;
	href: string;
	kind: string;
}

export interface Clue {
	kind: 'theorie' | 'offen';
	text: string;
	/** Zeitangabe aus „*Theorie (Juli 2026):*“ */
	when?: string;
	source: ClueSource;
}

export const QUESTION_TO: Record<Question['to'], { label: string; hint: string }> = {
	dm: { label: 'An den DM', hint: 'Regeln und Kampagne' },
	tisch: { label: 'Am Tisch', hint: 'Mitspieler fragen' },
	dich: { label: 'An dich', hint: 'Das weißt nur du' }
};

export const SOURCE_ORDER = ['Welt', 'Quest', 'Journal', 'Karte', 'Zauber', 'Dokument'];

const THEORY = /\*Theorie\b/;
const OPEN = /\*\*Offen:?\*\*/;
const THEORY_LIST = /^\s*\*Theorien(?:\s*\([^)]*\))?:\*\s*$/;
const LIST_ITEM = /^\s*(?:[-*+]|\d+\.)\s+/;
const LEAD = /^\*Theorie(?:\s*\(([^)]*)\))?:\*\s*|^\*\*Offen:?\*\*\s*/;

/** Eine Zeile zu einem Fund machen: Listenzeichen, Zitat und Tabellenstriche weg, Marke am Anfang weg. */
function toClue(line: string, kind: Clue['kind'], source: ClueSource): Clue {
	let text = line.trim().replace(/^>\s*/, '').replace(LIST_ITEM, '');
	if (text.startsWith('|')) {
		text = text
			.split('|')
			.map((c) => c.trim())
			.filter(Boolean)
			.join(' · ');
	}
	const lead = text.match(LEAD);
	if (lead) text = text.slice(lead[0].length);
	return { kind, text: text.charAt(0).toUpperCase() + text.slice(1), when: lead?.[1], source };
}

export function cluesIn(md: string | undefined, source: ClueSource): Clue[] {
	if (!md) return [];
	const out: Clue[] = [];
	let inList = false;
	for (const line of md.split('\n')) {
		if (THEORY_LIST.test(line)) {
			inList = true;
			continue;
		}
		if (inList) {
			if (LIST_ITEM.test(line)) {
				out.push(toClue(line, 'theorie', source));
				continue;
			}
			if (!line.trim()) continue;
			inList = false;
		}
		if (THEORY.test(line)) out.push(toClue(line, 'theorie', source));
		else if (OPEN.test(line)) out.push(toClue(line, 'offen', source));
	}
	return out;
}

export function collectClues(d: CampaignData): Clue[] {
	const out: Clue[] = [];
	const join = (...parts: (string | undefined)[]) => parts.filter(Boolean).join('\n');
	for (const w of d.world) {
		out.push(...cluesIn(w.body, { key: `world:${w.slug}`, ref: `world:${w.slug}`, title: w.name, href: `/welt/${w.slug}`, kind: 'Welt' }));
	}
	for (const q of d.quests) {
		out.push(...cluesIn(join(q.next, q.notes), { key: `quest:${q.id}`, ref: `quest:${q.id}`, title: q.title, href: `/quests#${q.id}`, kind: 'Quest' }));
	}
	for (const j of d.journal) {
		const src = { key: `journal:${j.id}`, ref: `journal:${j.id}`, title: j.title, href: `/journal#${j.id}`, kind: 'Journal' };
		out.push(...cluesIn(join(j.summary, ...j.events, ...(j.notes ?? [])), src));
	}
	for (const p of d.map.pins) {
		out.push(...cluesIn(p.text, { key: `pin:${p.id}`, ref: 'page:karte', title: `Karte: ${p.label}`, href: '/karte', kind: 'Karte' }));
	}
	for (const s of d.spells) {
		out.push(...cluesIn(join(s.why, s.valerius, ...(s.tips ?? [])), { key: `spell:${s.id}`, ref: `spell:${s.id}`, title: s.name, href: `/zauber/${s.id}`, kind: 'Zauber' }));
	}
	for (const doc of d.docs) {
		out.push(...cluesIn(doc.body, { key: `doc:${doc.slug}`, ref: `doc:${doc.slug}`, title: doc.title, href: `/archiv/${doc.slug}`, kind: 'Dokument' }));
	}
	return out;
}

/** Funde nach Fundstelle bündeln, in der Reihenfolge von SOURCE_ORDER. */
export function groupClues(clues: Clue[]): { source: ClueSource; clues: Clue[] }[] {
	const map = new Map<string, { source: ClueSource; clues: Clue[] }>();
	for (const c of clues) {
		const g = map.get(c.source.key) ?? { source: c.source, clues: [] };
		g.clues.push(c);
		map.set(c.source.key, g);
	}
	return [...map.values()].sort(
		(a, b) => SOURCE_ORDER.indexOf(a.source.kind) - SOURCE_ORDER.indexOf(b.source.kind) || a.source.title.localeCompare(b.source.title, 'de')
	);
}

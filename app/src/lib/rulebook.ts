/**
 * Regelwerk (campaign/regeln/*.md): Kapitel mit Regeln im vollen Wortlaut.
 * Läuft im Browser, auf dem Server und im Prüfskript (darum nur Typ-Importe).
 *
 * Aufbau einer Regel:
 *   ## Name {Englisch} {#id}
 *   <!-- auch: Alias, Alias -->          weitere Namen für [[Verweise]] und die Suche
 *   <!-- quelle: … -->                    weicht von der Quelle des Kapitels ab
 *   <!-- kurz: … -->                      Kurzfassung für den Spickzettel im Druck
 *   Regeltext (Markdown, Unterabschnitte mit ###)
 *   > [!VAL]
 *   > Was die Regel für Valerius bedeutet.
 */
import type { Rule, RuleChapter } from './types';

const HEAD = /^##\s+(.+?)\s*$/;
const ID = /\s*\{#([^}\s]+)\}/;
const EN = /\s*\{(?!#)([^}]*)\}/;
const COMMENT = /^<!--\s*(auch|quelle|kurz):\s*([\s\S]*?)\s*-->\s*$/i;
const VAL = /^>\s*\[!VAL\]\s*(.*)$/i;

/** Die Zustands-IDs, die state.json verwendet. Sie stehen in regeln/01-zustaende.md. */
export const CONDITION_IDS = [
	'blind',
	'bezaubert',
	'taub',
	'veraengstigt',
	'gepackt',
	'kampfunfaehig',
	'unsichtbar',
	'gelaehmt',
	'versteinert',
	'vergiftet',
	'liegend',
	'festgehalten',
	'betaeubt',
	'bewusstlos'
] as const;

/** Lizenzhinweis für die übersetzten SRD-Texte (Pflicht nach CC BY 4.0), auf der Regelseite und im Druck */
export const SRD_NOTICE =
	'Enthält Regelinhalte aus dem System Reference Document 5.1 („SRD 5.1“) von Wizards of the Coast LLC, verfügbar unter ' +
	'https://dnd.wizards.com/resources/systems-reference-document, lizenziert unter der Creative Commons Attribution 4.0 International License ' +
	'(https://creativecommons.org/licenses/by/4.0/legalcode), in eigener deutscher Übersetzung. Regeln aus anderen Büchern stehen in eigenen Worten ' +
	'und sind mit ihrer Quelle gekennzeichnet.';

/** „03-kampf.md“ → „kampf“ */
export function ruleChapterSlug(file: string): string {
	return file.replace(/\.md$/i, '').replace(/^\d+[-_]/, '');
}

function slug(s: string): string {
	return s
		.toLowerCase()
		.replace(/ä/g, 'ae')
		.replace(/ö/g, 'oe')
		.replace(/ü/g, 'ue')
		.replace(/ß/g, 'ss')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');
}

function str(v: unknown): string | undefined {
	return v === undefined || v === null || v === '' ? undefined : String(v);
}

/** Markdown zu schlichtem Text (für Suche, Vorschaukarten und Kurzfassungen). */
export function plainText(md: string): string {
	return md
		.replace(/\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|([^\]]+))?\]\]/g, (_m, t, l) => l || t)
		.replace(/<!--[\s\S]*?-->/g, '')
		.replace(/^\s*(?:[-*+]|\d+\.)\s+/gm, '')
		.replace(/^\s*>\s?/gm, '')
		.replace(/^#+\s*/gm, '')
		.replace(/[*_`|]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

/** Erster Absatz einer Regel ohne Markdown, gekürzt. Tabellen und Unterüberschriften zählen nicht. */
export function firstParagraph(md: string, max = 260): string {
	for (const block of md.split(/\n\s*\n/)) {
		const t = block.trim();
		if (!t || t.startsWith('|') || t.startsWith('#') || t.startsWith('<!--')) continue;
		let text = plainText(t);
		if (!text) continue;
		if (text.length > max) text = text.slice(0, max).replace(/\s+\S*$/, '') + ' …';
		return text;
	}
	return '';
}

function parseRule(head: string, lines: string[]): Rule {
	let name = head;
	const idMatch = name.match(ID);
	if (idMatch) name = name.replace(idMatch[0], '');
	const enMatch = name.match(EN);
	if (enMatch) name = name.replace(enMatch[0], '');
	name = name.trim();

	const aliases: string[] = [];
	let source: string | undefined;
	let short: string | undefined;
	const text: string[] = [];
	const val: string[] = [];
	let inVal = false;
	for (const line of lines) {
		const c = line.match(COMMENT);
		if (c) {
			const kind = c[1].toLowerCase();
			if (kind === 'auch') aliases.push(...c[2].split(',').map((a) => a.trim()).filter(Boolean));
			else if (kind === 'quelle') source = c[2];
			else short = c[2];
			continue;
		}
		const v = line.match(VAL);
		if (v) {
			inVal = true;
			if (v[1]) val.push(v[1]);
			continue;
		}
		if (inVal) {
			if (/^>/.test(line)) {
				val.push(line.replace(/^>\s?/, ''));
				continue;
			}
			inVal = false;
		}
		text.push(line);
	}
	const body = text.join('\n').trim();
	return {
		id: idMatch?.[1] ?? slug(name),
		name,
		en: enMatch?.[1].trim() || undefined,
		aliases,
		text: body,
		valerius: val.join('\n').trim() || undefined,
		source,
		short,
		summary: firstParagraph(body)
	};
}

/** Ein Kapitel aus Frontmatter (gray-matter) und Inhalt lesen. */
export function parseRuleChapter(file: string, data: Record<string, unknown>, body: string): RuleChapter {
	const intro: string[] = [];
	const rules: Rule[] = [];
	let cur: { head: string; lines: string[] } | null = null;
	for (const line of body.replace(/\r\n?/g, '\n').split('\n')) {
		const m = line.match(HEAD);
		if (m) {
			if (cur) rules.push(parseRule(cur.head, cur.lines));
			cur = { head: m[1], lines: [] };
		} else if (cur) cur.lines.push(line);
		else intro.push(line);
	}
	if (cur) rules.push(parseRule(cur.head, cur.lines));
	const slugName = ruleChapterSlug(file);
	return {
		slug: slugName,
		file,
		title: str(data.title) ?? slugName,
		en: str(data.en),
		order: Number(data.order ?? 99),
		icon: str(data.icon),
		source: str(data.source),
		summary: str(data.summary),
		intro: intro.join('\n').trim(),
		rules
	};
}

export function ruleChapter(chapters: RuleChapter[] | undefined, slugName: string): RuleChapter | undefined {
	return chapters?.find((c) => c.slug === slugName);
}

export function rulesOf(chapters: RuleChapter[] | undefined, slugName: string): Rule[] {
	return ruleChapter(chapters, slugName)?.rules ?? [];
}

/** Die 14 Zustände in der Reihenfolge des Kapitels (ohne Erschöpfung). */
export function conditionRules(chapters: RuleChapter[] | undefined): Rule[] {
	const ids = new Set<string>(CONDITION_IDS);
	return rulesOf(chapters, 'zustaende').filter((r) => ids.has(r.id));
}

export function ruleHref(chapterSlug: string, ruleId?: string): string {
	return `/regeln/${chapterSlug}${ruleId ? `#${ruleId}` : ''}`;
}

/** Suche im ganzen Regelwerk: Name, Englisch und Aliasse zählen mehr als der Text. */
export function searchRules(chapters: RuleChapter[], query: string, normalize: (s: string) => string, limit = 60) {
	const q = normalize(query);
	if (!q) return [];
	const hits: { chapter: RuleChapter; rule: Rule; score: number; snippet: string }[] = [];
	for (const chapter of chapters) {
		for (const rule of chapter.rules) {
			const names = [rule.name, rule.en ?? '', ...rule.aliases].map(normalize);
			let score = 0;
			for (const n of names) {
				if (!n) continue;
				if (n === q) score = Math.max(score, 100);
				else if (n.startsWith(q)) score = Math.max(score, 70);
				else if (n.includes(q)) score = Math.max(score, 45);
			}
			const plain = plainText(`${rule.text} ${rule.valerius ?? ''}`);
			const at = normalize(plain).indexOf(q);
			if (!score && at >= 0) score = 10;
			if (!score) continue;
			let snippet = rule.summary;
			if (at >= 0 && score < 45) {
				const start = Math.max(0, at - 70);
				snippet = (start ? '… ' : '') + plain.slice(start, at + q.length + 110).trim() + ' …';
			}
			hits.push({ chapter, rule, score, snippet });
		}
	}
	return hits.sort((a, b) => b.score - a.score || a.chapter.order - b.chapter.order).slice(0, limit);
}

/**
 * Ingest-Kern: verwandelt KI-Vorschläge (SessionUpdatesDTO) in bestätigbare
 * IngestChange-Diffs und wendet die vom Nutzer AKZEPTIERTEN Änderungen auf die
 * kanonischen Dateien an — mit Provenance (source='ai-session', sessionId).
 * Nichts wird geschrieben, bevor der Mensch bestätigt.
 */
import type {
	Character,
	CharacterPatch,
	IngestChange,
	IngestKind,
	SessionUpdatesDTO
} from '$lib/types';
import { profBonusForLevel, KNOWLEDGE_TIER_LABELS } from '$lib/types';
import { newId } from '$lib/id';
import { getActiveCharacter, updateCharacter } from './characters';
import { listQuests, createQuest, updateQuest } from './quests';
import { listItems, createItem, updateItem } from './inventory';
import { listNotes, readNote, writeNote } from './vault';
import { createKnowledge } from './knowledge';
import { loadText, saveText, appendEvent } from './campaign';
import { createSession } from './sessions';

const CHRONICLE = 'chronicle.md';
const ANALYSE_NOTE = 'notes/strategische-analyse.md';

function slugify(s: string): string {
	return (
		s
			.toLowerCase()
			.replace(/[äöü]/g, (c) => ({ ä: 'ae', ö: 'oe', ü: 'ue' })[c] || c)
			.replace(/ß/g, 'ss')
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-+|-+$/g, '') || 'eintrag'
	);
}

function firstSentence(text: string, max = 120): string {
	const t = text.replace(/\s+/g, ' ').trim();
	const dot = t.indexOf('. ');
	const cut = dot > 20 && dot < max ? dot + 1 : Math.min(t.length, max);
	return t.slice(0, cut) + (cut < t.length ? '…' : '');
}

function ci(a: string, b: string): boolean {
	return a.trim().toLowerCase() === b.trim().toLowerCase();
}

/** Kompakter Kampagnen-Kontext, der die KI an bestehende Namen bindet. */
export function buildContext(char: Character | null): string {
	const lines: string[] = [];
	if (char) {
		lines.push(
			`CHARAKTER: ${char.name} — ${char.race} ${char.className}, Stufe ${char.level}. ` +
				`TP ${char.hp.current}/${char.hp.max}. Gold ${char.currency.gp}, Silber ${char.currency.sp}, Kupfer ${char.currency.cp}.`
		);
		const quests = listQuests(char.id).filter((q) => q.status !== 'done');
		if (quests.length) lines.push('OFFENE QUESTS: ' + quests.map((q) => q.title).join(', '));
	}
	const notes = listNotes();
	const npcs = notes.filter((n) => n.path.startsWith('npcs/')).map((n) => n.title);
	const places = notes.filter((n) => n.path.startsWith('places/')).map((n) => n.title);
	if (npcs.length) lines.push('BEKANNTE PERSONEN: ' + npcs.join(', '));
	if (places.length) lines.push('BEKANNTE ORTE: ' + places.join(', '));
	return lines.join('\n') || 'Neue Kampagne, noch kein Kontext.';
}

function findNoteByName(name: string) {
	return listNotes().find((n) => ci(n.title, name));
}

/** Baut aus dem DTO die Liste bestätigbarer Änderungen (schreibt NICHTS). */
export function proposeChanges(dto: SessionUpdatesDTO, char: Character | null): IngestChange[] {
	const out: IngestChange[] = [];

	if (dto.chronik_append?.trim()) {
		out.push({
			id: newId(),
			kind: 'chronik',
			title: 'Chronik-Eintrag',
			summary: firstSentence(dto.chronik_append),
			confidence: 'known',
			after: dto.chronik_append.trim(),
			payload: { text: dto.chronik_append.trim() }
		});
	}

	if (dto.analyse_content?.trim()) {
		const existing = readNote(ANALYSE_NOTE);
		out.push({
			id: newId(),
			kind: 'analyse',
			title: 'Strategische Analyse',
			summary: firstSentence(dto.analyse_content),
			confidence: 'suggested',
			before: existing?.excerpt,
			after: dto.analyse_content.trim(),
			payload: { text: dto.analyse_content.trim() }
		});
	}

	const quests = char ? listQuests(char.id) : [];
	for (const q of dto.quests ?? []) {
		if (!q.title?.trim()) continue;
		const existing = quests.find((x) => ci(x.title, q.title));
		const data = {
			title: q.title.trim(),
			giver: q.giver || '',
			status: q.status || 'active',
			priority: q.priority || 'normal',
			nextStep: q.next_step || '',
			reward: q.reward || ''
		};
		out.push({
			id: newId(),
			kind: 'quest',
			title: existing ? `Quest aktualisieren: ${data.title}` : `Neue Quest: ${data.title}`,
			summary: `${data.status}${data.nextStep ? ' · ' + data.nextStep : ''}`,
			confidence: 'inferred',
			before: existing ? `${existing.status}${existing.nextStep ? ' · ' + existing.nextStep : ''}` : undefined,
			after: `${data.status}${data.nextStep ? ' · ' + data.nextStep : ''}`,
			payload: { existingId: existing?.id ?? null, data }
		});
	}

	const items = char ? listItems(char.id) : [];
	for (const it of dto.inventory ?? []) {
		if (!it.name?.trim()) continue;
		const existing = items.find((x) => ci(x.name, it.name));
		const qty = it.quantity ?? 1;
		out.push({
			id: newId(),
			kind: 'inventory',
			title: existing ? `Inventar: ${it.name}` : `Neuer Gegenstand: ${it.name}`,
			summary: it.note || '',
			confidence: 'known',
			before: existing ? `${existing.quantity}×` : undefined,
			after: existing ? `${existing.quantity} → ${existing.quantity + qty}×` : `+${qty}×`,
			payload: {
				existingId: existing?.id ?? null,
				delta: qty,
				data: {
					name: it.name.trim(),
					quantity: qty,
					weight: it.weight ?? 0,
					category: it.category || 'gear',
					notes: it.note || ''
				}
			}
		});
	}

	for (const g of dto.glossar ?? []) {
		if (!g.name?.trim()) continue;
		const folder = g.type === 'Orte' ? 'places' : 'npcs';
		const existing = findNoteByName(g.name);
		const path = existing?.path ?? `${folder}/${slugify(g.name)}.md`;
		out.push({
			id: newId(),
			kind: 'glossar',
			title: existing ? `${g.type} aktualisieren: ${g.name}` : `Neu (${g.type}): ${g.name}`,
			summary: firstSentence(g.content || ''),
			confidence: 'inferred',
			before: existing?.excerpt,
			after: firstSentence(g.content || '', 180),
			payload: { type: g.type, name: g.name.trim(), content: g.content || '', path }
		});
	}

	for (const k of dto.knowledge ?? []) {
		if (!k.statement?.trim()) continue;
		const tier = k.tier || 'rumor';
		out.push({
			id: newId(),
			kind: 'knowledge',
			title: `${KNOWLEDGE_TIER_LABELS[tier]}${k.topic ? ' · ' + k.topic : ''}`,
			summary: k.statement.trim(),
			confidence: tier === 'fact' ? 'known' : tier === 'rumor' ? 'inferred' : 'suggested',
			after: k.statement.trim(),
			payload: {
				statement: k.statement.trim(),
				tier,
				view: k.view || 'character',
				topic: k.topic || 'Allgemein'
			}
		});
	}

	if (dto.character && char) {
		const c = dto.character;
		const parts: string[] = [];
		if (c.gold_delta) parts.push(`Gold ${c.gold_delta > 0 ? '+' : ''}${c.gold_delta}`);
		if (c.silver_delta) parts.push(`Silber ${c.silver_delta > 0 ? '+' : ''}${c.silver_delta}`);
		if (c.copper_delta) parts.push(`Kupfer ${c.copper_delta > 0 ? '+' : ''}${c.copper_delta}`);
		if (c.hp_max != null) parts.push(`Max-TP → ${c.hp_max}`);
		if (c.level != null) parts.push(`Stufe → ${c.level}`);
		if (c.new_conditions?.length) parts.push('Zustände: ' + c.new_conditions.join(', '));
		if (parts.length) {
			out.push({
				id: newId(),
				kind: 'character',
				title: 'Charakter-Änderungen',
				summary: parts.join(' · '),
				confidence: 'known',
				after: parts.join(' · '),
				payload: { char: c }
			});
		}
	}

	return out;
}

function buildCharacterPatch(char: Character, c: NonNullable<SessionUpdatesDTO['character']>): CharacterPatch {
	const patch: CharacterPatch = {};
	const gp = char.currency.gp + (c.gold_delta || 0);
	const sp = char.currency.sp + (c.silver_delta || 0);
	const cp = char.currency.cp + (c.copper_delta || 0);
	if (c.gold_delta || c.silver_delta || c.copper_delta) {
		patch.currency = { gp: Math.max(0, gp), sp: Math.max(0, sp), cp: Math.max(0, cp) };
	}
	if (c.hp_max != null) patch.hp = { max: c.hp_max };
	if (c.level != null) {
		patch.level = c.level;
		patch.proficiencyBonus = profBonusForLevel(c.level);
	}
	if (c.new_conditions?.length) {
		const merged = new Set([...char.conditions, ...c.new_conditions]);
		patch.conditions = [...merged];
	}
	return patch;
}

export interface ApplyResult {
	sessionId: string;
	number: number;
	applied: number;
	errors: string[];
}

/** Wendet die akzeptierten Änderungen an und legt die Session-Entität an. */
export function applySession(
	rawText: string,
	meta: { title: string; date?: string; summary: string; highlights: string[] },
	changes: IngestChange[]
): ApplyResult {
	const char = getActiveCharacter();
	const errors: string[] = [];
	const kinds = new Set<IngestKind>();

	const session = createSession({
		characterId: char?.id ?? null,
		title: meta.title,
		date: meta.date,
		rawNotes: rawText,
		summary: meta.summary,
		highlights: meta.highlights,
		changeKinds: [...new Set(changes.map((c) => c.kind))],
		appliedCount: changes.length
	});

	const chronikTexts: string[] = [];

	for (const ch of changes) {
		try {
			const p = ch.payload as Record<string, any>;
			switch (ch.kind) {
				case 'chronik':
					chronikTexts.push(String(p.text ?? ch.after ?? ''));
					break;
				case 'analyse': {
					const text = String(p.text ?? ch.after ?? '');
					writeNote(ANALYSE_NOTE, `# Strategische Analyse\n\n${text}\n`, {
						title: 'Strategische Analyse',
						updated: new Date().toISOString(),
						source_session: session.number
					});
					break;
				}
				case 'quest': {
					if (!char) throw new Error('Kein aktiver Charakter');
					if (p.existingId) updateQuest(p.existingId, p.data);
					else createQuest(char.id, { ...p.data, sourceSession: session.number });
					break;
				}
				case 'inventory': {
					if (!char) throw new Error('Kein aktiver Charakter');
					if (p.existingId) {
						const cur = listItems(char.id).find((i) => i.id === p.existingId);
						const q = Math.max(0, (cur?.quantity ?? 0) + (p.delta ?? 0));
						updateItem(p.existingId, { quantity: q });
					} else {
						createItem(char.id, { ...p.data, sourceSession: session.number });
					}
					break;
				}
				case 'glossar': {
					const body = /^#\s/m.test(p.content) ? p.content : `# ${p.name}\n\n${p.content}`;
					writeNote(p.path, body, { title: p.name, source_session: session.number });
					break;
				}
				case 'knowledge': {
					createKnowledge(char?.id ?? null, {
						statement: p.statement,
						tier: p.tier,
						view: p.view,
						topic: p.topic,
						sourceSession: session.number
					});
					break;
				}
				case 'character': {
					if (!char) throw new Error('Kein aktiver Charakter');
					const patch = buildCharacterPatch(char, p.char);
					updateCharacter(char.id, patch, 'ai-session', session.id);
					break;
				}
			}
			kinds.add(ch.kind);
			if (ch.kind !== 'character') {
				appendEvent({
					id: newId(),
					characterId: char?.id ?? null,
					ts: Date.now(),
					field: `ingest:${ch.kind}`,
					delta: null,
					from: null,
					to: ch.title,
					source: 'ai-session',
					sessionId: session.id
				});
			}
		} catch (e) {
			errors.push(`${ch.title}: ${e instanceof Error ? e.message : String(e)}`);
		}
	}

	// Chronik-Block einmal, lesbar, an chronicle.md anhängen
	const recap = buildChronicleBlock(session.number, session.title, session.date, meta.summary, chronikTexts);
	const existing = loadText(CHRONICLE, '# Chronik\n');
	saveText(CHRONICLE, existing.trimEnd() + '\n\n' + recap + '\n');

	return { sessionId: session.id, number: session.number, applied: changes.length - errors.length, errors };
}

function buildChronicleBlock(
	num: number,
	title: string,
	date: string,
	summary: string,
	chronikTexts: string[]
): string {
	const lines = [`## Session ${num} — ${title}`, `*${date}*`, ''];
	if (summary) lines.push(`> ${summary}`, '');
	for (const t of chronikTexts) if (t.trim()) lines.push(t.trim(), '');
	return lines.join('\n').trimEnd();
}

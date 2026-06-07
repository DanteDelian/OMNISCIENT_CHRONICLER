import type { IngestChange, SessionUpdatesDTO } from '$lib/types';
import type { VaultContext } from './context';
import { newId } from '$lib/id';
import { getActiveCharacter, updateCharacter, createSnapshot } from './characters';
import { listQuests, createQuest, updateQuest } from './quests';
import { listItems, createItem, updateItem } from './inventory';
import { readNote, writeNote } from './vault';

function sanitize(name: string): string {
	return name.replace(/[^\p{L}\p{N} _-]/gu, '').trim() || 'Eintrag';
}

/** Wandelt rohe KI-Vorschläge in bestätigbare Diff-Changes um (Vergleich mit aktuellem Stand). */
export function toChanges(u: SessionUpdatesDTO, ctx: VaultContext): IngestChange[] {
	const changes: IngestChange[] = [];
	const char = ctx.charObj;
	const add = (c: Omit<IngestChange, 'id'>) => changes.push({ id: newId(), ...c });

	if (u.chronik_append?.trim()) {
		const lines = u.chronik_append.trim().split('\n').filter((l) => l.trim()).length;
		add({
			kind: 'chronik',
			title: 'Chronik',
			summary: `${lines} neue${lines === 1 ? 'r Eintrag' : ' Einträge'}`,
			after: u.chronik_append.trim(),
			payload: { text: u.chronik_append.trim() }
		});
	}

	if (u.analyse_content?.trim() && u.analyse_content.trim() !== ctx.analyse.trim()) {
		add({
			kind: 'analyse',
			title: 'Strategische Analyse',
			summary: 'Analyse aktualisiert',
			before: ctx.analyse.trim().slice(0, 500),
			after: u.analyse_content.trim().slice(0, 500),
			payload: { content: u.analyse_content.trim() }
		});
	}

	const quests = listQuests(char.id);
	for (const q of u.quests ?? []) {
		if (!q.title?.trim() || q.title.length > 120) continue; // degenerierte KI-Ausgabe überspringen
		const match = quests.find((e) => e.title.toLowerCase() === q.title.toLowerCase());
		if (match) {
			add({
				kind: 'quest',
				title: q.title,
				summary: 'Quest aktualisiert',
				before: `[${match.status}] ${match.nextStep}`,
				after: `[${q.status}] ${q.next_step}`,
				payload: {
					id: match.id,
					status: q.status,
					priority: q.priority,
					nextStep: q.next_step,
					giver: q.giver || match.giver,
					reward: q.reward || match.reward
				}
			});
		} else {
			add({
				kind: 'quest',
				title: q.title,
				summary: 'Neue Quest',
				after: `[${q.status}] ${q.next_step}`,
				payload: {
					title: q.title,
					giver: q.giver,
					status: q.status,
					priority: q.priority,
					nextStep: q.next_step,
					reward: q.reward
				}
			});
		}
	}

	const items = listItems(char.id);
	for (const it of u.inventory ?? []) {
		if (!it.name?.trim() || it.name.length > 120) continue;
		const match = items.find((e) => e.name.toLowerCase() === it.name.toLowerCase());
		if (match) {
			const qty = match.quantity + it.quantity;
			add({
				kind: 'inventory',
				title: it.name,
				summary: 'Menge aktualisiert',
				before: `x${match.quantity}`,
				after: `x${qty}`,
				payload: { id: match.id, quantity: qty }
			});
		} else {
			add({
				kind: 'inventory',
				title: it.name,
				summary: 'Neuer Gegenstand',
				after: `x${it.quantity} · ${it.category}`,
				payload: {
					name: it.name,
					quantity: it.quantity,
					weight: it.weight,
					category: it.category,
					notes: it.note
				}
			});
		}
	}

	for (const g of u.glossar ?? []) {
		if (!g.name?.trim() || g.name.length > 80) continue;
		const path = `04_Glossar/${g.type}/${sanitize(g.name)}.md`;
		const exists = !!readNote(path);
		add({
			kind: 'glossar',
			title: `${g.name} (${g.type})`,
			summary: exists ? 'Eintrag aktualisiert' : 'Neuer Eintrag',
			after: g.content.slice(0, 400),
			payload: { path, content: g.content }
		});
	}

	if (u.character) {
		const c = u.character;
		if (c.hp_max != null && c.hp_max !== char.hp.max)
			add({
				kind: 'character',
				title: 'Max. TP',
				summary: 'Trefferpunkte-Maximum',
				before: String(char.hp.max),
				after: String(c.hp_max),
				payload: { patch: { hp: { max: c.hp_max } } }
			});
		if (c.level != null && c.level !== char.level)
			add({
				kind: 'character',
				title: 'Stufe',
				summary: 'Stufenaufstieg',
				before: String(char.level),
				after: String(c.level),
				payload: { patch: { level: c.level } }
			});
		const cg = c.gold_delta || 0;
		const cs = c.silver_delta || 0;
		const cc = c.copper_delta || 0;
		if (cg || cs || cc)
			add({
				kind: 'character',
				title: 'Währung',
				summary: `${cg >= 0 ? '+' : ''}${cg} G · ${cs >= 0 ? '+' : ''}${cs} S · ${cc >= 0 ? '+' : ''}${cc} K`,
				payload: {
					patch: {
						currency: {
							gp: char.currency.gp + cg,
							sp: char.currency.sp + cs,
							cp: char.currency.cp + cc
						}
					}
				}
			});
		const newConds = (c.new_conditions || []).filter((x) => !char.conditions.includes(x));
		if (newConds.length)
			add({
				kind: 'character',
				title: 'Zustände',
				summary: `+ ${newConds.join(', ')}`,
				payload: { patch: { conditions: [...char.conditions, ...newConds] } }
			});
	}

	return changes;
}

/** Wendet nur die bestätigten Changes an. Legt vorher einen Snapshot an (Undo-Sicherung). */
export function applyChanges(changes: IngestChange[]): { applied: number } {
	const char = getActiveCharacter();
	if (changes.length) {
		createSnapshot(char.id, 'Vor KI-Import ' + new Date().toLocaleString('de-DE'));
	}
	let applied = 0;
	for (const ch of changes) {
		try {
			applyOne(char.id, ch);
			applied++;
		} catch (e) {
			console.error('KI-Import: Change fehlgeschlagen', ch.kind, e);
		}
	}
	return { applied };
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function applyOne(charId: string, ch: IngestChange) {
	const p = ch.payload as any;
	switch (ch.kind) {
		case 'chronik': {
			const note = readNote('01_Chronik/chronik.md');
			const body = (note?.body ?? '# Chronik\n').replace(/\s+$/, '') + '\n' + p.text + '\n';
			writeNote('01_Chronik/chronik.md', body, note?.frontmatter);
			break;
		}
		case 'analyse': {
			const note = readNote('05_Strategie/analyse.md');
			writeNote('05_Strategie/analyse.md', p.content, note?.frontmatter);
			break;
		}
		case 'quest': {
			if (p.id)
				updateQuest(p.id, {
					status: p.status,
					priority: p.priority,
					nextStep: p.nextStep,
					giver: p.giver,
					reward: p.reward
				});
			else
				createQuest(charId, {
					title: p.title,
					giver: p.giver,
					status: p.status,
					priority: p.priority,
					nextStep: p.nextStep,
					reward: p.reward
				});
			break;
		}
		case 'inventory': {
			if (p.id) updateItem(p.id, { quantity: p.quantity });
			else
				createItem(charId, {
					name: p.name,
					quantity: p.quantity,
					weight: p.weight,
					category: p.category,
					notes: p.notes
				});
			break;
		}
		case 'glossar': {
			writeNote(p.path, p.content, { updated: new Date().toISOString() });
			break;
		}
		case 'character': {
			updateCharacter(charId, p.patch, 'ai-session');
			break;
		}
	}
}

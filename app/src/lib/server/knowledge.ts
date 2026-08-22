import type { KnowledgeEntry, KnowledgeTier, KnowledgeView } from '$lib/types';
import { loadJson, saveJson } from './campaign';
import { newId } from '$lib/id';

const FILE = 'knowledge.json';

function all(): KnowledgeEntry[] {
	return loadJson<KnowledgeEntry[]>(FILE, []);
}

export function listKnowledge(characterId?: string): KnowledgeEntry[] {
	return all()
		.filter((k) => !characterId || k.characterId === characterId || k.characterId === null)
		.sort((a, b) => a.topic.localeCompare(b.topic) || b.updatedAt - a.updatedAt);
}

export function createKnowledge(
	characterId: string | null,
	data: Partial<KnowledgeEntry>
): KnowledgeEntry {
	const items = all();
	const now = Date.now();
	const entry: KnowledgeEntry = {
		id: newId(),
		characterId,
		statement: (data.statement || '').trim() || 'Neue Erkenntnis',
		tier: (data.tier as KnowledgeTier) || 'rumor',
		view: (data.view as KnowledgeView) || 'character',
		topic: (data.topic || 'Allgemein').trim(),
		subject: (data.subject || '').trim(),
		sourceSession: data.sourceSession ?? null,
		resolved: data.resolved ?? false,
		createdAt: now,
		updatedAt: now
	};
	items.push(entry);
	saveJson(FILE, items);
	return entry;
}

export function updateKnowledge(id: string, data: Partial<KnowledgeEntry>): void {
	const items = all();
	const idx = items.findIndex((k) => k.id === id);
	if (idx < 0) return;
	items[idx] = { ...items[idx], ...data, id, updatedAt: Date.now() };
	saveJson(FILE, items);
}

export function deleteKnowledge(id: string): void {
	saveJson(
		FILE,
		all().filter((k) => k.id !== id)
	);
}

/** Nach Thema gruppiert (für die Wissens-Ansicht). */
export function knowledgeByTopic(characterId?: string): { topic: string; entries: KnowledgeEntry[] }[] {
	const groups = new Map<string, KnowledgeEntry[]>();
	for (const k of listKnowledge(characterId)) {
		const arr = groups.get(k.topic) ?? [];
		arr.push(k);
		groups.set(k.topic, arr);
	}
	return [...groups.entries()]
		.map(([topic, entries]) => ({ topic, entries }))
		.sort((a, b) => b.entries.length - a.entries.length || a.topic.localeCompare(b.topic));
}

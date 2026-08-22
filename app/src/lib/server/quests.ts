import type { Quest } from '$lib/types';
import { loadJson, saveJson } from './campaign';
import { newId } from '$lib/id';

const FILE = 'quests.json';

function all(): Quest[] {
	return loadJson<Quest[]>(FILE, []);
}

export function listQuests(characterId: string): Quest[] {
	return all()
		.filter((q) => !characterId || q.characterId === characterId)
		.sort((a, b) => a.sortOrder - b.sortOrder || b.updatedAt - a.updatedAt);
}

export function createQuest(characterId: string, data: Partial<Quest>): Quest {
	const quests = all();
	const now = Date.now();
	const q: Quest = {
		id: newId(),
		characterId,
		title: data.title || 'Neue Quest',
		giver: data.giver || '',
		status: data.status || 'active',
		priority: data.priority || 'normal',
		nextStep: data.nextStep || '',
		reward: data.reward || '',
		notes: data.notes || '',
		sortOrder: data.sortOrder ?? now,
		sourceSession: data.sourceSession ?? null,
		updatedAt: now
	};
	quests.push(q);
	saveJson(FILE, quests);
	return q;
}

export function updateQuest(id: string, data: Partial<Quest>): void {
	const quests = all();
	const idx = quests.findIndex((q) => q.id === id);
	if (idx < 0) return;
	quests[idx] = { ...quests[idx], ...data, id, updatedAt: Date.now() };
	saveJson(FILE, quests);
}

export function deleteQuest(id: string): void {
	saveJson(
		FILE,
		all().filter((q) => q.id !== id)
	);
}

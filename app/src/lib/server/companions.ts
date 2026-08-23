import type { Companion } from '$lib/types';
import { loadJson, saveJson } from './campaign';
import { newId } from '$lib/id';

const FILE = 'companions.json';

function all(): Companion[] {
	return loadJson<Companion[]>(FILE, []);
}

export function listCompanions(characterId: string): Companion[] {
	return all().filter((c) => !characterId || c.characterId === characterId);
}

export function createCompanion(characterId: string, data: Partial<Companion>): Companion {
	const items = all();
	const hpMax = data.hp?.max ?? 1;
	const comp: Companion = {
		id: newId(),
		characterId,
		name: data.name || 'Kreatur',
		kind: data.kind || 'summon',
		ac: data.ac ?? 10,
		hp: { current: data.hp?.current ?? hpMax, max: hpMax, temp: data.hp?.temp ?? 0 },
		speed: data.speed || '',
		attack: data.attack || '',
		note: data.note || '',
		conditions: data.conditions || [],
		updatedAt: Date.now()
	};
	items.push(comp);
	saveJson(FILE, items);
	return comp;
}

export function updateCompanion(id: string, data: Partial<Companion>): void {
	const items = all();
	const i = items.findIndex((c) => c.id === id);
	if (i < 0) return;
	items[i] = { ...items[i], ...data, id, hp: { ...items[i].hp, ...(data.hp ?? {}) }, updatedAt: Date.now() };
	saveJson(FILE, items);
}

export function deleteCompanion(id: string): void {
	saveJson(FILE, all().filter((c) => c.id !== id));
}

/** Entlässt (löscht) alle Begleiter eines Charakters — „alle beschworenen Kreaturen entlassen". */
export function dismissAll(characterId: string): void {
	saveJson(FILE, all().filter((c) => c.characterId !== characterId));
}

import type { InventoryItem } from '$lib/types';
import { loadJson, saveJson } from './campaign';
import { newId } from '$lib/id';

const FILE = 'inventory.json';

function all(): InventoryItem[] {
	return loadJson<InventoryItem[]>(FILE, []);
}

export function listItems(characterId: string): InventoryItem[] {
	return all().filter((i) => !characterId || i.characterId === characterId);
}

export function createItem(characterId: string, data: Partial<InventoryItem>): InventoryItem {
	const items = all();
	const item: InventoryItem = {
		id: newId(),
		characterId,
		name: data.name || 'Neuer Gegenstand',
		quantity: data.quantity ?? 1,
		weight: data.weight ?? 0,
		category: data.category || 'gear',
		rarity: data.rarity || 'common',
		description: data.description || '',
		equipped: data.equipped ?? false,
		attuned: data.attuned ?? false,
		notes: data.notes || '',
		sourceSession: data.sourceSession ?? null,
		updatedAt: Date.now()
	};
	items.push(item);
	saveJson(FILE, items);
	return item;
}

export function updateItem(id: string, data: Partial<InventoryItem>): void {
	const items = all();
	const idx = items.findIndex((i) => i.id === id);
	if (idx < 0) return;
	items[idx] = { ...items[idx], ...data, id, updatedAt: Date.now() };
	saveJson(FILE, items);
}

export function deleteItem(id: string): void {
	saveJson(
		FILE,
		all().filter((i) => i.id !== id)
	);
}

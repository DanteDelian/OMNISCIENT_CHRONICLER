import type { InventoryItem, ItemCategory } from '$lib/types';
import { getDb } from './db';
import { newId } from '$lib/id';

type Row = Record<string, unknown>;

function toItem(r: Row): InventoryItem {
	return {
		id: r.id as string,
		characterId: r.character_id as string,
		name: r.name as string,
		quantity: r.quantity as number,
		weight: r.weight as number,
		category: r.category as ItemCategory,
		equipped: !!(r.equipped as number),
		notes: r.notes as string,
		updatedAt: r.updated_at as number
	};
}

export function listItems(characterId: string): InventoryItem[] {
	const rows = getDb()
		.prepare(
			'SELECT * FROM inventory_item WHERE character_id = ? AND deleted_at IS NULL ORDER BY category, name'
		)
		.all(characterId) as Row[];
	return rows.map(toItem);
}

export function createItem(
	characterId: string,
	data: Partial<InventoryItem>
): InventoryItem {
	const now = Date.now();
	const item: InventoryItem = {
		id: newId(),
		characterId,
		name: data.name || 'Neuer Gegenstand',
		quantity: data.quantity ?? 1,
		weight: data.weight ?? 0,
		category: data.category || 'gear',
		equipped: data.equipped ?? false,
		notes: data.notes || '',
		updatedAt: now
	};
	getDb()
		.prepare(
			`INSERT INTO inventory_item (id, character_id, name, quantity, weight, category, equipped, notes, created_at, updated_at)
			 VALUES (@id, @character_id, @name, @quantity, @weight, @category, @equipped, @notes, @created_at, @updated_at)`
		)
		.run({
			id: item.id,
			character_id: item.characterId,
			name: item.name,
			quantity: item.quantity,
			weight: item.weight,
			category: item.category,
			equipped: item.equipped ? 1 : 0,
			notes: item.notes,
			created_at: now,
			updated_at: now
		});
	return item;
}

export function updateItem(id: string, data: Partial<InventoryItem>): void {
	const now = Date.now();
	const fields: string[] = [];
	const params: Row = { id, updated_at: now };
	const map: Record<string, string> = {
		name: 'name',
		quantity: 'quantity',
		weight: 'weight',
		category: 'category',
		notes: 'notes'
	};
	for (const [k, col] of Object.entries(map)) {
		if (k in data) {
			fields.push(`${col} = @${col}`);
			params[col] = (data as Record<string, unknown>)[k];
		}
	}
	if ('equipped' in data) {
		fields.push('equipped = @equipped');
		params.equipped = data.equipped ? 1 : 0;
	}
	if (!fields.length) return;
	getDb()
		.prepare(`UPDATE inventory_item SET ${fields.join(', ')}, updated_at = @updated_at WHERE id = @id`)
		.run(params);
}

export function deleteItem(id: string): void {
	getDb()
		.prepare('UPDATE inventory_item SET deleted_at = ? WHERE id = ?')
		.run(Date.now(), id);
}

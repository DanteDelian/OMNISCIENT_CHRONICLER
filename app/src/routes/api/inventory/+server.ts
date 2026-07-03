import { json } from '@sveltejs/kit';
import { getActiveCharacter } from '$lib/server/characters';
import { listItems, createItem } from '$lib/server/inventory';
import type { InventoryItem } from '$lib/types';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = () => {
	const char = getActiveCharacter();
	return json(char ? listItems(char.id) : []);
};

export const POST: RequestHandler = async ({ request }) => {
	const char = getActiveCharacter();
	if (!char) return json({ error: 'Kein Charakter aktiv' }, { status: 400 });
	const data = (await request.json().catch(() => ({}))) as Partial<InventoryItem>;
	return json(createItem(char.id, data));
};

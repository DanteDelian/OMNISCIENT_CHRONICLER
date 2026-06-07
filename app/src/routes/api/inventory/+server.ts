import { json } from '@sveltejs/kit';
import { getActiveCharacter } from '$lib/server/characters';
import { listItems, createItem } from '$lib/server/inventory';
import type { InventoryItem } from '$lib/types';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = () => {
	return json(listItems(getActiveCharacter().id));
};

export const POST: RequestHandler = async ({ request }) => {
	const data = (await request.json().catch(() => ({}))) as Partial<InventoryItem>;
	return json(createItem(getActiveCharacter().id, data));
};

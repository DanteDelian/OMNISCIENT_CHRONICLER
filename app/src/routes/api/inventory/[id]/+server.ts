import { json } from '@sveltejs/kit';
import { updateItem, deleteItem } from '$lib/server/inventory';
import type { InventoryItem } from '$lib/types';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ params, request }) => {
	const data = (await request.json()) as Partial<InventoryItem>;
	updateItem(params.id, data);
	return json({ ok: true });
};

export const DELETE: RequestHandler = ({ params }) => {
	deleteItem(params.id);
	return json({ ok: true });
};

import { json } from '@sveltejs/kit';
import { getActiveCharacter, createSnapshot, listSnapshots } from '$lib/server/characters';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = () => {
	return json(listSnapshots(getActiveCharacter().id));
};

export const POST: RequestHandler = async ({ request }) => {
	const { label } = (await request.json().catch(() => ({}))) as { label?: string };
	const char = getActiveCharacter();
	const snap = createSnapshot(char.id, label || `Snapshot ${new Date().toLocaleString('de-DE')}`);
	return json(snap);
};

import { json } from '@sveltejs/kit';
import { getActiveCharacter, createSnapshot, listSnapshots } from '$lib/server/characters';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = () => {
	const char = getActiveCharacter();
	return json(char ? listSnapshots(char.id) : []);
};

export const POST: RequestHandler = async ({ request }) => {
	const { label } = (await request.json().catch(() => ({}))) as { label?: string };
	const char = getActiveCharacter();
	if (!char) return json({ error: 'Kein Charakter aktiv' }, { status: 400 });
	const snap = createSnapshot(char.id, label || `Snapshot ${new Date().toLocaleString('de-DE')}`);
	return json(snap);
};

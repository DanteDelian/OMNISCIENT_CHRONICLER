import { json } from '@sveltejs/kit';
import { getCharacter, setActiveCharacter, deleteCharacter } from '$lib/server/characters';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ params, request }) => {
	const { active } = (await request.json().catch(() => ({}))) as { active?: boolean };
	if (!getCharacter(params.id)) return json({ error: 'Charakter nicht gefunden' }, { status: 404 });
	if (active) setActiveCharacter(params.id);
	return json({ ok: true });
};

export const DELETE: RequestHandler = ({ params }) => {
	deleteCharacter(params.id);
	return json({ ok: true });
};

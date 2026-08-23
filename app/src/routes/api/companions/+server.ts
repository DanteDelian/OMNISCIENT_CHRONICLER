import { json } from '@sveltejs/kit';
import { getActiveCharacter } from '$lib/server/characters';
import { listCompanions, createCompanion, dismissAll } from '$lib/server/companions';
import type { Companion } from '$lib/types';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = () => {
	const char = getActiveCharacter();
	return json(char ? listCompanions(char.id) : []);
};

export const POST: RequestHandler = async ({ request }) => {
	const char = getActiveCharacter();
	if (!char) return json({ error: 'Kein Charakter aktiv' }, { status: 400 });
	const data = (await request.json().catch(() => ({}))) as Partial<Companion>;
	return json(createCompanion(char.id, data));
};

/** DELETE ohne id = alle Begleiter entlassen. */
export const DELETE: RequestHandler = () => {
	const char = getActiveCharacter();
	if (char) dismissAll(char.id);
	return json({ ok: true });
};

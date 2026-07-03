import { json } from '@sveltejs/kit';
import { getActiveCharacter } from '$lib/server/characters';
import { listPlans, createPlan } from '$lib/server/prep';
import type { SessionPlan } from '$lib/types';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = () => {
	const char = getActiveCharacter();
	return json(char ? listPlans(char.id) : []);
};

export const POST: RequestHandler = async ({ request }) => {
	const char = getActiveCharacter();
	if (!char) return json({ error: 'Kein Charakter aktiv' }, { status: 400 });
	const data = (await request.json().catch(() => ({}))) as Partial<SessionPlan>;
	return json(createPlan(char.id, data));
};

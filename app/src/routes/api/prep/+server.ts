import { json } from '@sveltejs/kit';
import { getActiveCharacter } from '$lib/server/characters';
import { listPlans, createPlan } from '$lib/server/prep';
import type { SessionPlan } from '$lib/types';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = () => {
	return json(listPlans(getActiveCharacter().id));
};

export const POST: RequestHandler = async ({ request }) => {
	const data = (await request.json().catch(() => ({}))) as Partial<SessionPlan>;
	return json(createPlan(getActiveCharacter().id, data));
};

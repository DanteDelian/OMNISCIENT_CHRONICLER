import { json } from '@sveltejs/kit';
import { getPlan, updatePlan, deletePlan } from '$lib/server/prep';
import type { SessionPlan } from '$lib/types';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ params }) => {
	const plan = getPlan(params.id);
	if (!plan) return json({ error: 'Plan nicht gefunden' }, { status: 404 });
	return json(plan);
};

export const PATCH: RequestHandler = async ({ params, request }) => {
	const data = (await request.json()) as Partial<SessionPlan>;
	updatePlan(params.id, data);
	return json({ ok: true });
};

export const DELETE: RequestHandler = ({ params }) => {
	deletePlan(params.id);
	return json({ ok: true });
};

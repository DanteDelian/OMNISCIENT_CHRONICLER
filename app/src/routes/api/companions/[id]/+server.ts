import { json } from '@sveltejs/kit';
import { updateCompanion, deleteCompanion } from '$lib/server/companions';
import type { Companion } from '$lib/types';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ params, request }) => {
	const data = (await request.json().catch(() => ({}))) as Partial<Companion>;
	updateCompanion(params.id!, data);
	return json({ ok: true });
};

export const DELETE: RequestHandler = ({ params }) => {
	deleteCompanion(params.id!);
	return json({ ok: true });
};

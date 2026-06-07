import { json } from '@sveltejs/kit';
import { updateQuest, deleteQuest } from '$lib/server/quests';
import type { Quest } from '$lib/types';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ params, request }) => {
	const data = (await request.json()) as Partial<Quest>;
	updateQuest(params.id, data);
	return json({ ok: true });
};

export const DELETE: RequestHandler = ({ params }) => {
	deleteQuest(params.id);
	return json({ ok: true });
};

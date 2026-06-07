import { json } from '@sveltejs/kit';
import { getActiveCharacter } from '$lib/server/characters';
import { listQuests, createQuest } from '$lib/server/quests';
import type { Quest } from '$lib/types';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = () => {
	return json(listQuests(getActiveCharacter().id));
};

export const POST: RequestHandler = async ({ request }) => {
	const data = (await request.json().catch(() => ({}))) as Partial<Quest>;
	return json(createQuest(getActiveCharacter().id, data));
};

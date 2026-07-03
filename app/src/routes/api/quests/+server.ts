import { json } from '@sveltejs/kit';
import { getActiveCharacter } from '$lib/server/characters';
import { listQuests, createQuest } from '$lib/server/quests';
import type { Quest } from '$lib/types';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = () => {
	const char = getActiveCharacter();
	return json(char ? listQuests(char.id) : []);
};

export const POST: RequestHandler = async ({ request }) => {
	const char = getActiveCharacter();
	if (!char) return json({ error: 'Kein Charakter aktiv' }, { status: 400 });
	const data = (await request.json().catch(() => ({}))) as Partial<Quest>;
	return json(createQuest(char.id, data));
};

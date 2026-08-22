import { json } from '@sveltejs/kit';
import { getActiveCharacter } from '$lib/server/characters';
import { listKnowledge, createKnowledge } from '$lib/server/knowledge';
import type { KnowledgeEntry } from '$lib/types';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = () => {
	const char = getActiveCharacter();
	return json(listKnowledge(char?.id));
};

export const POST: RequestHandler = async ({ request }) => {
	const char = getActiveCharacter();
	const data = (await request.json().catch(() => ({}))) as Partial<KnowledgeEntry>;
	return json(createKnowledge(char?.id ?? null, data));
};

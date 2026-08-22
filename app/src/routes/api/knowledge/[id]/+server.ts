import { json } from '@sveltejs/kit';
import { updateKnowledge, deleteKnowledge } from '$lib/server/knowledge';
import type { KnowledgeEntry } from '$lib/types';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ params, request }) => {
	const data = (await request.json().catch(() => ({}))) as Partial<KnowledgeEntry>;
	updateKnowledge(params.id!, data);
	return json({ ok: true });
};

export const DELETE: RequestHandler = ({ params }) => {
	deleteKnowledge(params.id!);
	return json({ ok: true });
};

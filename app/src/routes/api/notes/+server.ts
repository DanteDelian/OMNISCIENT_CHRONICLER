import { json } from '@sveltejs/kit';
import { listNotes, createNote } from '$lib/server/vault';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = () => {
	return json(listNotes());
};

export const POST: RequestHandler = async ({ request }) => {
	const { title } = (await request.json().catch(() => ({}))) as { title?: string };
	return json(createNote(title || 'Neue Notiz'));
};

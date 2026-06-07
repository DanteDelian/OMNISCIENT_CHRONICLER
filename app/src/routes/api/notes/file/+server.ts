import { json } from '@sveltejs/kit';
import { readNote, writeNote, deleteNote } from '$lib/server/vault';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ url }) => {
	const p = url.searchParams.get('path');
	if (!p) return json({ error: 'path fehlt' }, { status: 400 });
	const note = readNote(p);
	if (!note) return json({ error: 'Notiz nicht gefunden' }, { status: 404 });
	return json(note);
};

export const PUT: RequestHandler = async ({ request }) => {
	const { path: p, body, frontmatter } = (await request.json()) as {
		path: string;
		body: string;
		frontmatter?: Record<string, unknown>;
	};
	if (!p) return json({ error: 'path fehlt' }, { status: 400 });
	return json(writeNote(p, body ?? '', frontmatter));
};

export const DELETE: RequestHandler = ({ url }) => {
	const p = url.searchParams.get('path');
	if (!p) return json({ error: 'path fehlt' }, { status: 400 });
	deleteNote(p);
	return json({ ok: true });
};

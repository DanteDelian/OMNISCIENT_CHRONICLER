import { json } from '@sveltejs/kit';
import { applySession } from '$lib/server/ingest';
import type { IngestChange } from '$lib/types';
import type { RequestHandler } from './$types';

/** Wendet die vom Nutzer akzeptierten (ggf. bearbeiteten) Änderungen an. */
export const POST: RequestHandler = async ({ request }) => {
	const body = (await request.json().catch(() => ({}))) as {
		rawText?: string;
		meta?: { title?: string; date?: string; summary?: string; highlights?: string[] };
		changes?: IngestChange[];
	};
	if (!Array.isArray(body.changes) || body.changes.length === 0) {
		return json({ error: 'Keine Änderungen zum Übernehmen.' }, { status: 400 });
	}
	const result = applySession(
		body.rawText || '',
		{
			title: body.meta?.title || 'Session',
			date: body.meta?.date,
			summary: body.meta?.summary || '',
			highlights: Array.isArray(body.meta?.highlights) ? body.meta!.highlights! : []
		},
		body.changes
	);
	return json(result);
};

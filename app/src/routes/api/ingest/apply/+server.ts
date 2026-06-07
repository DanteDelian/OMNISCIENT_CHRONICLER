import { json } from '@sveltejs/kit';
import { applyChanges } from '$lib/server/ingest';
import type { IngestChange } from '$lib/types';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { changes } = (await request.json()) as { changes: IngestChange[] };
	if (!Array.isArray(changes)) return json({ error: 'Keine Changes' }, { status: 400 });
	const result = applyChanges(changes);
	return json(result);
};

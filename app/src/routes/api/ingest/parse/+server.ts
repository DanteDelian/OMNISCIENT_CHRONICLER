import { json } from '@sveltejs/kit';
import { gatherContext } from '$lib/server/context';
import { sidecarParse } from '$lib/server/sidecar';
import { toChanges } from '$lib/server/ingest';
import type { SessionUpdatesDTO } from '$lib/types';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { transcript, provider, model } = (await request.json()) as {
		transcript: string;
		provider?: string;
		model?: string;
	};
	if (!transcript?.trim()) return json({ error: 'Kein Text' }, { status: 400 });
	try {
		const ctx = gatherContext();
		const { charObj, ...ctxForAI } = ctx;
		const updates = (await sidecarParse(transcript, ctxForAI, provider, model)) as SessionUpdatesDTO;
		const changes = toChanges(updates, ctx);
		return json({ changes });
	} catch (e) {
		return json({ error: e instanceof Error ? e.message : 'Fehler' }, { status: 502 });
	}
};

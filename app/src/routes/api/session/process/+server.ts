import { json } from '@sveltejs/kit';
import { getActiveCharacter } from '$lib/server/characters';
import { getAiProvider, aiStatus } from '$lib/server/ai';
import { buildContext, proposeChanges } from '$lib/server/ingest';
import type { RequestHandler } from './$types';

/** Status des KI-Providers (für die Werkstatt-UI). */
export const GET: RequestHandler = () => json(aiStatus());

/** RAW-Text → KI-Vorschläge (schreibt nichts). */
export const POST: RequestHandler = async ({ request }) => {
	const { rawText } = (await request.json().catch(() => ({}))) as { rawText?: string };
	if (!rawText || !rawText.trim()) return json({ error: 'Kein Text übergeben.' }, { status: 400 });

	const provider = getAiProvider();
	if (!provider) return json({ error: 'KI nicht konfiguriert.', status: aiStatus() }, { status: 503 });

	const char = getActiveCharacter();
	try {
		const dto = await provider.processSession(rawText, buildContext(char));
		return json({
			meta: {
				title: dto.session_title || '',
				summary: dto.session_summary || '',
				highlights: dto.session_highlights || []
			},
			changes: proposeChanges(dto, char),
			model: provider.model
		});
	} catch (e) {
		return json({ error: e instanceof Error ? e.message : String(e) }, { status: 502 });
	}
};

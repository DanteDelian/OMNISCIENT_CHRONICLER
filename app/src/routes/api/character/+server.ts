import { json } from '@sveltejs/kit';
import { getActiveCharacter, getCharacter, updateCharacter } from '$lib/server/characters';
import type { CharacterPatch, EventSource } from '$lib/types';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = () => {
	// null = noch kein Charakter angelegt → Frontend zeigt Onboarding
	return json(getActiveCharacter());
};

export const PATCH: RequestHandler = async ({ request }) => {
	const body = (await request.json()) as {
		id?: string;
		patch?: CharacterPatch;
		source?: EventSource;
		sessionId?: string | null;
	};
	const active = getActiveCharacter();
	const id = body.id ?? active?.id;
	if (!id || !getCharacter(id)) {
		return json({ error: 'Charakter nicht gefunden' }, { status: 404 });
	}
	const patch = body.patch ?? (body as CharacterPatch);
	const updated = updateCharacter(id, patch, body.source ?? 'manual', body.sessionId ?? null);
	return json(updated);
};

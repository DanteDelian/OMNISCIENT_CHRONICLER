import { json } from '@sveltejs/kit';
import { getActiveCharacter, listEvents, listSnapshots } from '$lib/server/characters';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ url }) => {
	const id = url.searchParams.get('characterId') ?? getActiveCharacter().id;
	const limit = Number(url.searchParams.get('limit') ?? '200');
	return json({ events: listEvents(id, limit), snapshots: listSnapshots(id) });
};

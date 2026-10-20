import { error, json } from '@sveltejs/kit';
import { WRITABLE, type WritableFile } from '$lib/types';
import { writeJson } from '$lib/server/store';
import type { RequestHandler } from './$types';

/** Erwartete Grundform je Datei, damit kein kaputtes JSON die Kampagne zerschießt. */
const SHAPE: Record<WritableFile, 'object' | 'array'> = {
	state: 'object',
	inventory: 'object',
	quests: 'array',
	spells: 'array',
	journal: 'array',
	map: 'object',
	fragen: 'array',
	netzwerk: 'object',
	zaubersets: 'object',
	geheimnisse: 'object'
};

export const PUT: RequestHandler = async ({ params, request, url }) => {
	const file = params.file as WritableFile;
	if (!WRITABLE.includes(file)) error(404, 'Unbekannte Datei');
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		error(400, 'Kein gültiges JSON');
	}
	const isArray = Array.isArray(body);
	if ((SHAPE[file] === 'array') !== isArray || body === null || typeof body !== 'object') {
		error(400, `Falsche Struktur für ${file}.json`);
	}
	if (file === 'inventory' && !Array.isArray((body as { items?: unknown }).items)) error(400, 'inventory.items fehlt');
	if (file === 'map' && !Array.isArray((body as { pins?: unknown }).pins)) error(400, 'map.pins fehlt');
	if (file === 'netzwerk' && !Array.isArray((body as { agents?: unknown }).agents)) error(400, 'netzwerk.agents fehlt');
	if (file === 'zaubersets' && !Array.isArray((body as { sets?: unknown }).sets)) error(400, 'zaubersets.sets fehlt');
	if (file === 'geheimnisse' && !Array.isArray((body as { secrets?: unknown }).secrets)) error(400, 'geheimnisse.secrets fehlt');
	writeJson(`${file}.json`, body, request.headers.get('x-client-id') ?? url.searchParams.get('client') ?? undefined);
	return json({ ok: true });
};

/** sendBeacon (beim Schließen des Tabs) kann nur POST. */
export const POST = PUT;

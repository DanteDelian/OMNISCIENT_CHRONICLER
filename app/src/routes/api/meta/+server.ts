import { json } from '@sveltejs/kit';
import { loadJson, saveJson } from '$lib/server/campaign';
import type { RequestHandler } from './$types';

interface Meta {
	name: string;
	system: string;
	spotifyUrl?: string;
	activeCharacterId?: string;
	createdAt?: number;
	// Kampagnen-Zustand (Campaign State) — die aktuelle Lage der Kampagne.
	location?: string; // Wo sind wir gerade?
	situation?: string; // Was ist die aktuelle Lage? (kurzer Satz)
	story?: string; // Aktueller Handlungsbogen (Kapitel-Titel)
}

const FALLBACK: Meta = { name: 'Die Chroniken von Xantus', system: 'D&D 5e', spotifyUrl: '' };

export const GET: RequestHandler = () => {
	return json(loadJson<Meta>('meta.json', FALLBACK));
};

export const PATCH: RequestHandler = async ({ request }) => {
	const patch = (await request.json()) as Partial<Meta>;
	const meta = { ...loadJson<Meta>('meta.json', FALLBACK), ...patch };
	saveJson('meta.json', meta);
	return json(meta);
};

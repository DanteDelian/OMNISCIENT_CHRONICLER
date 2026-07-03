import { json } from '@sveltejs/kit';
import { listCharacters, createCharacter, getActiveCharacter } from '$lib/server/characters';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = () => {
	const active = getActiveCharacter();
	return json(
		listCharacters().map((c) => ({
			id: c.id,
			name: c.name,
			race: c.race,
			className: c.className,
			level: c.level,
			portrait: c.portrait,
			hp: c.hp,
			active: c.id === active?.id
		}))
	);
};

export const POST: RequestHandler = async ({ request }) => {
	const data = (await request.json().catch(() => ({}))) as {
		name?: string;
		race?: string;
		className?: string;
		level?: number;
		portrait?: string;
		activate?: boolean;
	};
	if (!data.name?.trim()) return json({ error: 'Name fehlt' }, { status: 400 });
	const char = createCharacter(
		{
			name: data.name,
			race: data.race,
			className: data.className,
			level: data.level,
			portrait: data.portrait
		},
		data.activate ?? true
	);
	return json(char);
};

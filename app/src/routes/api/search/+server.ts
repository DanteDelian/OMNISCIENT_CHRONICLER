import { json } from '@sveltejs/kit';
import { listNotes } from '$lib/server/vault';
import { listQuests } from '$lib/server/quests';
import { listItems } from '$lib/server/inventory';
import { listPlans } from '$lib/server/prep';
import { getActiveCharacter } from '$lib/server/characters';
import type { RequestHandler } from './$types';

interface Result {
	type: 'note' | 'glossar' | 'quest' | 'item' | 'prep';
	title: string;
	sub: string;
	href: string;
	score: number;
}

function score(q: string, title: string, body = '', tags: string[] = []): number {
	let s = 0;
	const t = title.toLowerCase();
	if (t.startsWith(q)) s += 4;
	else if (t.includes(q)) s += 3;
	if (tags.some((x) => x.toLowerCase().includes(q))) s += 2;
	if (body.toLowerCase().includes(q)) s += 1;
	return s;
}

export const GET: RequestHandler = ({ url }) => {
	const q = (url.searchParams.get('q') ?? '').trim().toLowerCase();
	if (q.length < 2) return json([]);
	const char = getActiveCharacter();
	const results: Result[] = [];

	for (const n of listNotes()) {
		const s = score(q, n.title, n.body, n.tags);
		if (s <= 0) continue;
		const isGlossar = n.path.startsWith('04_Glossar/');
		results.push({
			type: isGlossar ? 'glossar' : 'note',
			title: n.title,
			sub: n.excerpt.slice(0, 80) || n.path,
			href: isGlossar
				? '/glossar/' + encodeURIComponent(n.title)
				: '/notes?path=' + encodeURIComponent(n.path),
			score: s
		});
	}

	for (const qu of listQuests(char.id)) {
		const s = score(q, qu.title, `${qu.giver} ${qu.nextStep} ${qu.notes}`);
		if (s <= 0) continue;
		results.push({
			type: 'quest',
			title: qu.title,
			sub: qu.nextStep || qu.giver || 'Quest',
			href: '/quests',
			score: s
		});
	}

	for (const it of listItems(char.id)) {
		const s = score(q, it.name, it.notes);
		if (s <= 0) continue;
		results.push({
			type: 'item',
			title: it.name,
			sub: `Inventar · x${it.quantity}`,
			href: '/character',
			score: s
		});
	}

	for (const p of listPlans(char.id)) {
		const s = score(q, p.title, `${p.strongStart} ${p.npcs} ${p.locations} ${p.notes}`);
		if (s <= 0) continue;
		results.push({
			type: 'prep',
			title: p.title,
			sub: 'Session-Vorbereitung',
			href: '/prep?id=' + p.id,
			score: s
		});
	}

	results.sort((a, b) => b.score - a.score);
	return json(results.slice(0, 20));
};

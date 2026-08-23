import { json } from '@sveltejs/kit';
import { getActiveCharacter } from '$lib/server/characters';
import { listQuests } from '$lib/server/quests';
import { listItems } from '$lib/server/inventory';
import { listKnowledge } from '$lib/server/knowledge';
import { listNotes } from '$lib/server/vault';
import type { RequestHandler } from './$types';

/** Alles, was aus Session <n> stammt — für die „Seit der letzten Session"-Ansicht. */
export const GET: RequestHandler = ({ params }) => {
	const n = Number(params.n);
	if (!Number.isFinite(n)) return json({ quests: [], items: [], knowledge: [], notes: [] });
	const char = getActiveCharacter();
	const quests = (char ? listQuests(char.id) : []).filter((q) => q.sourceSession === n);
	const items = (char ? listItems(char.id) : []).filter((i) => i.sourceSession === n);
	const knowledge = listKnowledge(char?.id).filter((k) => k.sourceSession === n);
	const notes = listNotes()
		.filter((note) => Number(note.frontmatter?.source_session) === n)
		.map((note) => ({ path: note.path, title: note.title, excerpt: note.excerpt }));
	return json({ quests, items, knowledge, notes });
};

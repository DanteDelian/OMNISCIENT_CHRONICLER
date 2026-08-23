import { listNotes } from '$lib/server/vault';
import { listKnowledge } from '$lib/server/knowledge';
import { getActiveCharacter } from '$lib/server/characters';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params }) => {
	const name = decodeURIComponent(params.name);
	const lower = name.toLowerCase();
	const all = listNotes();
	const note =
		all.find((n) => n.title.toLowerCase() === lower) ??
		all.find((n) => n.path.toLowerCase().endsWith('/' + lower + '.md')) ??
		all.find((n) => n.title.toLowerCase().includes(lower)) ??
		null;

	const displayName = note?.title ?? name;
	const dn = displayName.toLowerCase();

	// Verwandtes Wissen: Thema/Subjekt trifft den Namen, oder die Aussage erwähnt ihn.
	const char = getActiveCharacter();
	const knowledge = listKnowledge(char?.id).filter(
		(k) =>
			k.subject.toLowerCase() === dn ||
			k.topic.toLowerCase() === dn ||
			k.statement.toLowerCase().includes(dn)
	);

	// Backlinks: andere Notizen, die per [[Wikilink]] hierher zeigen.
	const backlinks = note
		? all
				.filter((n) => n.path !== note.path && n.links.some((l) => l.toLowerCase() === dn))
				.map((n) => ({ path: n.path, title: n.title, excerpt: n.excerpt }))
		: [];

	return { name: displayName, note, knowledge, backlinks };
};

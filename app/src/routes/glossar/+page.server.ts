import { listNotes } from '$lib/server/vault';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	const all = listNotes();
	return {
		personen: all.filter((n) => n.path.startsWith('npcs/')),
		orte: all.filter((n) => n.path.startsWith('places/'))
	};
};

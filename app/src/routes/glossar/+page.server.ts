import { listNotes } from '$lib/server/vault';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	const all = listNotes();
	return {
		personen: all.filter((n) => n.path.startsWith('04_Glossar/Personen/')),
		orte: all.filter((n) => n.path.startsWith('04_Glossar/Orte/'))
	};
};

import { listNotes } from '$lib/server/vault';
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
	return { name, note };
};

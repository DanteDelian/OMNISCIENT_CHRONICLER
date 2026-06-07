import type { PageLoad } from './$types';
import type { Note } from '$lib/types';

export const load: PageLoad = async ({ fetch, url }) => {
	const notes = (await fetch('/api/notes').then((r) => r.json())) as Note[];
	const path = url.searchParams.get('path');
	let selected: Note | null = null;
	if (path) {
		const res = await fetch('/api/notes/file?path=' + encodeURIComponent(path));
		if (res.ok) selected = await res.json();
	}
	return { notes, selected };
};

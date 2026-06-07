import type { PageLoad } from './$types';
import type { Quest } from '$lib/types';

export const load: PageLoad = async ({ fetch }) => {
	const quests = (await fetch('/api/quests').then((r) => r.json())) as Quest[];
	return { quests };
};

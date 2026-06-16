import { loadText } from '$lib/server/campaign';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => ({
	body: loadText('chronicle.md', '')
});

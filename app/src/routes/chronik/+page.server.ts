import { loadText } from '$lib/server/campaign';
import { listSessions } from '$lib/server/sessions';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => ({
	body: loadText('chronicle.md', ''),
	sessions: listSessions() // absteigend nach Nummer
});

import { readNote } from '$lib/server/vault';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => ({
	note: readNote('01_Chronik/chronik.md')
});

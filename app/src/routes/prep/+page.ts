import type { PageLoad } from './$types';
import type { SessionPlan } from '$lib/types';

export const load: PageLoad = async ({ fetch, url }) => {
	const plans = (await fetch('/api/prep').then((r) => r.json())) as SessionPlan[];
	const id = url.searchParams.get('id');
	const selected = (id ? plans.find((p) => p.id === id) : plans[0]) ?? null;
	return { plans, selected };
};

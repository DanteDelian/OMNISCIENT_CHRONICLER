import { loadCampaign } from '$lib/server/data';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ depends, url }) => {
	depends('app:campaign');
	// Die Login-Seite bekommt keine Kampagnendaten.
	if (url.pathname === '/login') return { campaign: null };
	return { campaign: loadCampaign() };
};

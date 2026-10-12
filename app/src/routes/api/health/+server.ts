import { json } from '@sveltejs/kit';
import { CAMPAIGN_DIR } from '$lib/server/store';

export const GET = () => json({ ok: true, campaign: CAMPAIGN_DIR });

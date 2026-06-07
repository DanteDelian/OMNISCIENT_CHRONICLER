import { json } from '@sveltejs/kit';
import { sidecarHealth } from '$lib/server/sidecar';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	const health = await sidecarHealth();
	return json({ online: !!health, health });
};

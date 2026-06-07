import type { Handle } from '@sveltejs/kit';
import { redirect, json } from '@sveltejs/kit';
import { pinEnabled, pinToken, PIN_COOKIE } from '$lib/server/auth';

export const handle: Handle = async ({ event, resolve }) => {
	if (pinEnabled()) {
		const authed = event.cookies.get(PIN_COOKIE) === pinToken();
		const p = event.url.pathname;
		const isPublic =
			p === '/login' ||
			p === '/api/health' ||
			p === '/manifest.webmanifest' ||
			p.startsWith('/favicon') ||
			p.startsWith('/_app/') ||
			p.endsWith('.png') ||
			p.endsWith('.svg');
		if (!authed && !isPublic) {
			if (p.startsWith('/api')) return json({ error: 'PIN erforderlich' }, { status: 401 });
			throw redirect(303, '/login');
		}
	}
	return resolve(event);
};

import type { Handle } from '@sveltejs/kit';
import { json, redirect } from '@sveltejs/kit';
import { PIN_COOKIE, pinEnabled, pinToken } from '$lib/server/auth';
import { startWatcher } from '$lib/server/store';

// Externe Änderungen an campaign/ (Claude Code, Editor, Git) sofort erkennen.
startWatcher();

const PUBLIC = ['/login', '/api/health', '/manifest.webmanifest', '/favicon.svg'];

export const handle: Handle = async ({ event, resolve }) => {
	if (pinEnabled()) {
		const p = event.url.pathname;
		const authed = event.cookies.get(PIN_COOKIE) === pinToken();
		if (!authed && !PUBLIC.includes(p) && !p.startsWith('/_app/')) {
			if (p.startsWith('/api')) return json({ error: 'PIN erforderlich' }, { status: 401 });
			redirect(303, '/login');
		}
	}
	return resolve(event);
};

import { fail, redirect } from '@sveltejs/kit';
import { checkPin, pinEnabled, pinToken, PIN_COOKIE } from '$lib/server/auth';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => ({ enabled: pinEnabled() });

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const data = await request.formData();
		const pin = String(data.get('pin') ?? '');
		if (!checkPin(pin)) return fail(401, { error: 'Falsche PIN' });
		cookies.set(PIN_COOKIE, pinToken(), {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 30
		});
		throw redirect(303, '/');
	}
};

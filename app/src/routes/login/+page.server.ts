import { fail, redirect } from '@sveltejs/kit';
import { PIN_COOKIE, checkPin, pinEnabled, pinToken } from '$lib/server/auth';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	if (!pinEnabled()) redirect(303, '/');
	return {};
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const pin = String((await request.formData()).get('pin') ?? '');
		if (!checkPin(pin)) return fail(401, { wrong: true });
		cookies.set(PIN_COOKIE, pinToken(), { path: '/', httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 90 });
		redirect(303, '/');
	}
};

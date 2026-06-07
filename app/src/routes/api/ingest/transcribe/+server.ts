import { json } from '@sveltejs/kit';
import { sidecarTranscribe } from '$lib/server/sidecar';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const form = await request.formData();
	const file = form.get('file');
	if (!(file instanceof File)) return json({ error: 'Keine Datei' }, { status: 400 });
	const provider = (form.get('provider') as string) || undefined;
	const model = (form.get('model') as string) || undefined;
	try {
		const res = await sidecarTranscribe(file, provider, model);
		return json(res);
	} catch (e) {
		return json({ error: e instanceof Error ? e.message : 'Fehler' }, { status: 502 });
	}
};

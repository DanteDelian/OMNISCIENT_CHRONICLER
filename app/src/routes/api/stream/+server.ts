import { changes, type ChangeEvent } from '$lib/server/store';
import type { RequestHandler } from './$types';

/** Server-Sent Events: meldet jede Änderung in campaign/ an alle offenen Geräte. */
export const GET: RequestHandler = () => {
	const enc = new TextEncoder();
	let onChange: (e: ChangeEvent) => void = () => {};
	let keepalive: ReturnType<typeof setInterval>;

	const stream = new ReadableStream({
		start(controller) {
			const send = (s: string) => {
				try {
					controller.enqueue(enc.encode(s));
				} catch {
					/* Verbindung geschlossen */
				}
			};
			onChange = (e) => send(`data: ${JSON.stringify(e)}\n\n`);
			changes.on('change', onChange);
			send('retry: 3000\n\n');
			keepalive = setInterval(() => send(': ping\n\n'), 25_000);
		},
		cancel() {
			clearInterval(keepalive);
			changes.off('change', onChange);
		}
	});

	return new Response(stream, {
		headers: { 'content-type': 'text/event-stream', 'cache-control': 'no-cache', connection: 'keep-alive' }
	});
};

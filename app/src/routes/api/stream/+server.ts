import { changes, startWatcher } from '$lib/server/campaign';
import type { RequestHandler } from './$types';

/** Server-Sent-Events: meldet Datei-Änderungen in campaign/ (UI-Edits + externe Claude-Edits). */
export const GET: RequestHandler = () => {
	startWatcher();
	const enc = new TextEncoder();
	let onChange: (rel: string) => void = () => {};
	let keepalive: ReturnType<typeof setInterval>;

	const stream = new ReadableStream({
		start(controller) {
			const send = (data: string) => {
				try {
					controller.enqueue(enc.encode(data));
				} catch {
					/* closed */
				}
			};
			onChange = (rel: string) => send(`data: ${JSON.stringify({ file: rel })}\n\n`);
			changes.on('change', onChange);
			send('retry: 3000\ndata: {"file":"__connected__"}\n\n');
			keepalive = setInterval(() => send(': keepalive\n\n'), 25000);
		},
		cancel() {
			clearInterval(keepalive);
			changes.off('change', onChange);
		}
	});

	return new Response(stream, {
		headers: {
			'content-type': 'text/event-stream',
			'cache-control': 'no-cache',
			connection: 'keep-alive'
		}
	});
};

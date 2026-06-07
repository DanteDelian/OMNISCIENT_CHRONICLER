import { env } from '$env/dynamic/private';
import { Agent } from 'undici';

export const SIDECAR_BASE = env.SIDECAR_URL || 'http://127.0.0.1:8756';

// Lokale Modelle (Ollama) können für eine Antwort mehrere Minuten brauchen.
// Der Node-Standard-Timeout (~300s) würde das abbrechen -> großzügig erhöhen (15 min).
const longDispatcher = new Agent({ headersTimeout: 900_000, bodyTimeout: 900_000 });

export async function sidecarHealth(): Promise<Record<string, unknown> | null> {
	try {
		const r = await fetch(SIDECAR_BASE + '/health', { signal: AbortSignal.timeout(2000) });
		return r.ok ? await r.json() : null;
	} catch {
		return null;
	}
}

export async function sidecarParse(
	transcript: string,
	context: Record<string, unknown>,
	provider?: string,
	model?: string
) {
	const r = await fetch(SIDECAR_BASE + '/parse', {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({ transcript, context, provider, model }),
		dispatcher: longDispatcher
	} as RequestInit & { dispatcher: Agent });
	const data = await r.json();
	if (!r.ok || data.error) throw new Error(data.error || 'Parsing fehlgeschlagen');
	return data;
}

export async function sidecarTranscribe(file: File, provider?: string, model?: string) {
	const form = new FormData();
	form.append('file', file);
	if (provider) form.append('provider', provider);
	if (model) form.append('model', model);
	const r = await fetch(SIDECAR_BASE + '/transcribe', {
		method: 'POST',
		body: form,
		dispatcher: longDispatcher
	} as RequestInit & { dispatcher: Agent });
	const data = await r.json();
	if (!r.ok || data.error) throw new Error(data.error || 'Transkription fehlgeschlagen');
	return data as { transcript: string };
}

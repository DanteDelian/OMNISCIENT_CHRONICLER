/** Live-Verbindung: Ändert jemand (oder Claude Code) eine Datei, lädt jedes Gerät neu. */
import { invalidate } from '$app/navigation';
import { CLIENT_ID } from './campaign.svelte';

class LiveStore {
	connected = $state(false);
	lastExternal = $state<{ file: string; at: number } | null>(null);
	private es: EventSource | null = null;
	private timer: ReturnType<typeof setTimeout> | null = null;

	start() {
		if (this.es || typeof EventSource === 'undefined') return;
		// ?nolive: ohne Live-Verbindung, z. B. für Screenshots oder zum Drucken.
		if (new URLSearchParams(location.search).has('nolive')) return;
		const es = new EventSource('/api/stream');
		es.onopen = () => (this.connected = true);
		es.onerror = () => (this.connected = false);
		es.onmessage = (ev) => {
			let msg: { file?: string; origin?: string };
			try {
				msg = JSON.parse(ev.data);
			} catch {
				return;
			}
			if (!msg.file || msg.origin === CLIENT_ID) return;
			this.lastExternal = { file: msg.file, at: Date.now() };
			if (this.timer) clearTimeout(this.timer);
			this.timer = setTimeout(() => invalidate('app:campaign'), 120);
		};
		this.es = es;
	}
}

export const live = new LiveStore();

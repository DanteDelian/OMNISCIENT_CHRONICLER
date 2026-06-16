/** Live-Verbindung zum Server (SSE). `rev` erhöht sich bei jeder Datei-Änderung in campaign/. */
class LiveStore {
	rev = $state(0);
	connected = $state(false);
	private es: EventSource | null = null;

	start() {
		if (this.es || typeof EventSource === 'undefined') return;
		const es = new EventSource('/api/stream');
		es.onopen = () => (this.connected = true);
		es.onmessage = (e) => {
			try {
				const d = JSON.parse(e.data);
				if (d.file === '__connected__') return;
			} catch {
				return;
			}
			this.rev++;
		};
		es.onerror = () => {
			this.connected = false;
		};
		this.es = es;
	}
}

export const live = new LiveStore();

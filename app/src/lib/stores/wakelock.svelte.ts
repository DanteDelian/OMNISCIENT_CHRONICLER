/**
 * Bildschirm wach halten (Screen Wake Lock), damit das Tablet am Tisch nicht einschläft.
 * Die Wahl bleibt im Browser gespeichert. Der Browser gibt die Sperre frei, sobald der Tab verdeckt ist,
 * darum fordert die App sie beim Zurückkehren neu an.
 */
const KEY = 'grimoire:wachhalten';

class WakeLockStore {
	supported = $state(false);
	enabled = $state(false);
	active = $state(false);
	private sentinel: WakeLockSentinel | null = null;

	init() {
		if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) return;
		this.supported = true;
		try {
			this.enabled = localStorage.getItem(KEY) === '1';
		} catch {
			this.enabled = false;
		}
		document.addEventListener('visibilitychange', () => {
			if (document.visibilityState === 'visible' && this.enabled) void this.acquire();
		});
		if (this.enabled) void this.acquire();
	}

	private async acquire() {
		if (!this.supported || this.sentinel) return;
		try {
			this.sentinel = await navigator.wakeLock.request('screen');
			this.active = true;
			this.sentinel.addEventListener('release', () => {
				this.sentinel = null;
				this.active = false;
			});
		} catch {
			// Ohne Nutzergeste oder im Energiesparmodus kann der Browser ablehnen
			this.active = false;
		}
	}

	async toggle() {
		this.enabled = !this.enabled;
		try {
			localStorage.setItem(KEY, this.enabled ? '1' : '0');
		} catch {
			/* privates Fenster: dann gilt die Wahl nur bis zum Neuladen */
		}
		if (this.enabled) await this.acquire();
		else {
			await this.sentinel?.release();
			this.sentinel = null;
			this.active = false;
		}
	}
}

export const wakelock = new WakeLockStore();

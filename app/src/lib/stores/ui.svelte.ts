const LS_KEY = 'cc-ui-v1';

class UiStore {
	paletteOpen = $state(false);
	moreOpen = $state(false);
	sound = $state(true);
	loaded = $state(false);

	load() {
		if (typeof localStorage === 'undefined') return;
		try {
			const raw = localStorage.getItem(LS_KEY);
			if (raw) {
				const d = JSON.parse(raw);
				this.sound = d.sound ?? true;
			}
		} catch {
			/* ignore */
		}
		this.loaded = true;
	}

	setSound(v: boolean) {
		this.sound = v;
		this.save();
	}

	private save() {
		try {
			localStorage.setItem(LS_KEY, JSON.stringify({ sound: this.sound }));
		} catch {
			/* ignore */
		}
	}
}

export const ui = new UiStore();

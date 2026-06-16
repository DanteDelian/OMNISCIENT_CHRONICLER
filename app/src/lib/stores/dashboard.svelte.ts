const DEFAULT_ORDER = [
	'hp',
	'dice',
	'abilities',
	'conditions',
	'trackers',
	'spells',
	'currency',
	'inventory',
	'quests',
	'history'
];
const LS_KEY = 'cc-dashboard-v1';

class DashboardStore {
	order = $state<string[]>([...DEFAULT_ORDER]);
	hidden = $state<string[]>([]);
	customizing = $state(false);
	loaded = $state(false);

	load() {
		if (typeof localStorage === 'undefined') return;
		try {
			const raw = localStorage.getItem(LS_KEY);
			if (raw) {
				const d = JSON.parse(raw);
				const saved: string[] = Array.isArray(d.order) ? d.order : [];
				// Gespeicherte Reihenfolge + neue Default-Widgets ergänzen
				this.order = [
					...saved.filter((x) => DEFAULT_ORDER.includes(x)),
					...DEFAULT_ORDER.filter((x) => !saved.includes(x))
				];
				this.hidden = Array.isArray(d.hidden)
					? d.hidden.filter((x: string) => DEFAULT_ORDER.includes(x))
					: [];
			}
		} catch {
			/* ignore */
		}
		this.loaded = true;
	}

	private save() {
		try {
			localStorage.setItem(LS_KEY, JSON.stringify({ order: this.order, hidden: this.hidden }));
		} catch {
			/* ignore */
		}
	}

	setOrder(ids: string[]) {
		this.order = ids;
		this.save();
	}

	toggle(id: string) {
		this.hidden = this.hidden.includes(id)
			? this.hidden.filter((x) => x !== id)
			: [...this.hidden, id];
		this.save();
	}

	reset() {
		this.order = [...DEFAULT_ORDER];
		this.hidden = [];
		this.save();
	}
}

export const dashboard = new DashboardStore();

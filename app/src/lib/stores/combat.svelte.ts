export interface Combatant {
	id: string;
	name: string;
	initiative: number;
	hp: number;
	maxHp: number;
	ac: number;
	isPlayer: boolean;
	conditions: string[];
}

const LS_KEY = 'cc-combat-v1';

class CombatStore {
	combatants = $state<Combatant[]>([]);
	round = $state(1);
	activeId = $state<string | null>(null);
	loaded = $state(false);

	load() {
		if (typeof localStorage === 'undefined') return;
		try {
			const raw = localStorage.getItem(LS_KEY);
			if (raw) {
				const d = JSON.parse(raw);
				this.combatants = d.combatants ?? [];
				this.round = d.round ?? 1;
				this.activeId = d.activeId ?? null;
			}
		} catch {
			/* ignore */
		}
		this.loaded = true;
	}

	private save() {
		try {
			localStorage.setItem(
				LS_KEY,
				JSON.stringify({ combatants: this.combatants, round: this.round, activeId: this.activeId })
			);
		} catch {
			/* ignore */
		}
	}

	private sort() {
		this.combatants.sort((a, b) => b.initiative - a.initiative);
	}

	add(data: Partial<Combatant>) {
		const c: Combatant = {
			id: crypto.randomUUID(),
			name: data.name || 'Gegner',
			initiative: data.initiative ?? 10,
			hp: data.hp ?? 10,
			maxHp: data.maxHp ?? data.hp ?? 10,
			ac: data.ac ?? 12,
			isPlayer: data.isPlayer ?? false,
			conditions: data.conditions ?? []
		};
		this.combatants.push(c);
		this.sort();
		if (!this.activeId) this.activeId = this.combatants[0]?.id ?? null;
		this.save();
	}

	patch(id: string, data: Partial<Combatant>) {
		const c = this.combatants.find((x) => x.id === id);
		if (!c) return;
		Object.assign(c, data);
		if ('initiative' in data) this.sort();
		this.save();
	}

	remove(id: string) {
		const wasActive = this.activeId === id;
		this.combatants = this.combatants.filter((c) => c.id !== id);
		if (wasActive) this.activeId = this.combatants[0]?.id ?? null;
		this.save();
	}

	next() {
		if (!this.combatants.length) return;
		const idx = this.combatants.findIndex((c) => c.id === this.activeId);
		const nextIdx = idx < 0 ? 0 : idx + 1;
		if (nextIdx >= this.combatants.length) {
			this.round++;
			this.activeId = this.combatants[0].id;
		} else {
			this.activeId = this.combatants[nextIdx].id;
		}
		this.save();
	}

	reset() {
		this.combatants = [];
		this.round = 1;
		this.activeId = null;
		this.save();
	}
}

export const combat = new CombatStore();

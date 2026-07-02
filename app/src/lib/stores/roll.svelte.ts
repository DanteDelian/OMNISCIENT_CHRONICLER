/** Zentraler „Schicksalswurf": jede Probe landet dramatisch im RollOverlay. */
export interface RollResult {
	label: string;
	/** natürlicher d20 (für Krit-Erkennung); fehlt bei reinen Schadenswürfen */
	d20?: number;
	bonus: number;
	total: number;
	crit?: 'hit' | 'miss';
	detail: string;
}

class RollStore {
	current = $state<RollResult | null>(null);
	#timer: ReturnType<typeof setTimeout> | null = null;

	show(r: RollResult, holdMs = 2300) {
		if (this.#timer) clearTimeout(this.#timer);
		this.current = r;
		this.#timer = setTimeout(() => (this.current = null), holdMs + (r.crit ? 700 : 0));
	}

	dismiss() {
		if (this.#timer) clearTimeout(this.#timer);
		this.current = null;
	}
}

export const roll = new RollStore();

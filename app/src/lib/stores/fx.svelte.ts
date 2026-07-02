/** Globale visuelle Effekte: Screen-Edge-Flashes und Level-Up-Vorschlag. */
class FxStore {
	edge = $state<'damage' | 'heal' | 'levelup' | null>(null);
	/** Wenn gesetzt: XP haben eine Schwelle überschritten — Level-Up-Feier anbieten. */
	levelUpTo = $state<number | null>(null);

	#edgeTimer: ReturnType<typeof setTimeout> | null = null;

	pulse(kind: 'damage' | 'heal' | 'levelup') {
		if (this.#edgeTimer) clearTimeout(this.#edgeTimer);
		this.edge = null;
		// Reflow-Trick: im nächsten Frame setzen, damit die Animation neu startet
		requestAnimationFrame(() => {
			this.edge = kind;
			this.#edgeTimer = setTimeout(() => (this.edge = null), 700);
		});
	}

	suggestLevelUp(level: number) {
		this.levelUpTo = level;
	}

	clearLevelUp() {
		this.levelUpTo = null;
	}
}

export const fx = new FxStore();

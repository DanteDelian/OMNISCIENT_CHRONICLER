/** Globaler UI-Zustand: Befehlspalette, Würfelschale, Detail-Schublade, Dialoge. */

class UiStore {
	palette = $state(false);
	dice = $state(false);
	/** Zauber-ID für die Schnellansicht (rechte Schublade). */
	spellDrawer = $state<string | null>(null);
	rest = $state<'kurz' | 'lang' | null>(null);
	/** Offene Konzentrationsprobe nach Schaden. */
	concentrationCheck = $state<{ dc: number; damage: number } | null>(null);
	sidebarCollapsed = $state(false);
}

export const ui = new UiStore();

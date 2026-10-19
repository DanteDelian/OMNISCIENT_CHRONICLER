/**
 * Druckfassung (/druck): Teile, Beschriftungen und Papierfarben.
 * Die Bildschirmseiten nutzen eigene Farben für den dunklen Hintergrund,
 * hier stehen dunklere Varianten, die auf weißem Papier lesbar bleiben.
 */
import type { ItemGroup, JournalEntry, QuestStatus, Source, WishItem, WorldEntry } from './types';

export interface PrintPart {
	id: string;
	label: string;
	hint: string;
	group: 'Am Tisch' | 'Kampagne' | 'Archiv';
}

/** Feste Teile. Die Archiv-Dokumente kommen als „doc-<slug>“ dazu. */
export const PRINT_PARTS: PrintPart[] = [
	{ id: 'deckblatt', label: 'Deckblatt und Inhalt', hint: '1 Seite', group: 'Am Tisch' },
	{ id: 'bogen', label: 'Charakterbogen', hint: 'Werte, Fertigkeiten, Merkmale', group: 'Am Tisch' },
	{ id: 'spielbogen', label: 'Sitzungsbogen zum Abhaken', hint: 'TP, Plätze, Kräfte, Untote, Notizen', group: 'Am Tisch' },
	{ id: 'zauber', label: 'Zauberbuch', hint: 'Alle Zauber mit vollem Regeltext', group: 'Am Tisch' },
	{ id: 'zauberkarten', label: 'Zauberkarten zum Ausschneiden', hint: 'Spielkartenformat, 9 pro Seite', group: 'Am Tisch' },
	{ id: 'gefolge', label: 'Gefolge', hint: 'Vertraute, Untote, Diener, Aella', group: 'Am Tisch' },
	{ id: 'regeln', label: 'Regel-Spickzettel', hint: 'Zustände, Aktionen, Konzentration, Rasten', group: 'Am Tisch' },
	{ id: 'fragen', label: 'Fragen an den DM', hint: 'Zum Abhaken, mit Platz für Antworten', group: 'Am Tisch' },
	{ id: 'inventar', label: 'Inventar', hint: 'Besitz, Geld, Wunschliste', group: 'Kampagne' },
	{ id: 'quests', label: 'Quests', hint: 'Aktiv, Gerüchte, erledigt', group: 'Kampagne' },
	{ id: 'raetsel', label: 'Rätselwand', hint: 'Theorien, Widersprüche, Mysterien', group: 'Kampagne' },
	{ id: 'journal', label: 'Journal', hint: 'Datierte Chronik und Notizseite', group: 'Kampagne' },
	{ id: 'welt', label: 'Welt', hint: 'Personen, Fraktionen, Orte', group: 'Kampagne' },
	{ id: 'netzwerk', label: 'Die Unsichtbare Hand', hint: 'Rollen und Leute, zum Ergänzen', group: 'Kampagne' },
	{ id: 'karte', label: 'Echsen-Karte', hint: 'Karte mit nummerierten Markierungen', group: 'Kampagne' },
	{ id: 'quellen', label: 'Quellenverzeichnis', hint: 'Alle Originale mit Bewertung', group: 'Archiv' }
];

export const SCHOOL_PRINT: Record<string, string> = {
	Bannzauber: '#2563a8',
	Beschwörung: '#6d3fc0',
	Erkenntnismagie: '#0f766e',
	Verzauberung: '#b02a74',
	Hervorrufung: '#c2410c',
	Illusion: '#8b3fb0',
	Nekromantie: '#2f7d3b',
	Verwandlung: '#94700a'
};

export const ITEM_GROUPS: { id: ItemGroup; label: string; hint: string }[] = [
	{ id: 'koerper', label: 'Am Körper', hint: 'Ausgerüstet und immer dabei' },
	{ id: 'verbrauch', label: 'Verbrauchsgüter', hint: 'Tränke, Gift, Vorräte, Zutaten' },
	{ id: 'beute', label: 'Beute und Handelsware', hint: 'Zum Verkaufen, Tauschen, Tarnen' },
	{ id: 'plot', label: 'Dokumente und Plot', hint: 'Beweise, Briefe, Karten' },
	{ id: 'gelagert', label: 'Gelagert', hint: 'Nicht im Gepäck' },
	{ id: 'verloren', label: 'Verloren oder gestohlen', hint: 'Noch offen' }
];

export const PRIO: Record<WishItem['priority'], string> = {
	kritisch: 'Kritisch',
	hoch: 'Hoch',
	mittel: 'Mittel',
	vorschlag: 'Vorschlag',
	saladin: 'Von Saladin'
};

export const PHASE: Record<WishItem['phase'], string> = {
	jetzt: 'Jetzt',
	'nach-saladin': 'Nach Saladin',
	saladin: 'Saladin-Plan'
};

export const QUEST_STATUS: Record<QuestStatus, string> = {
	aktiv: 'Aktiv',
	geruecht: 'Gerücht',
	erledigt: 'Erledigt',
	gescheitert: 'Gescheitert'
};

export const JOURNAL_TYPE: Record<JournalEntry['type'], string> = {
	session: 'Session',
	nachricht: 'Nachricht',
	planung: 'Planung',
	notiz: 'Notiz'
};

export const WORLD_GROUPS: { id: string; label: string }[] = [
	{ id: 'gruppe', label: 'Die Gruppe' },
	{ id: 'lhaaz', label: 'Haus Lhaaz' },
	{ id: 'kontakt', label: 'Kontakte und Verbündete' },
	{ id: 'bedrohung', label: 'Bedrohungen' },
	{ id: 'vergangenheit', label: 'Vergangenheit' },
	{ id: 'ort', label: 'Orte' }
];

export const TONE_PRINT: Record<WorldEntry['tone'], { label: string; color: string }> = {
	ally: { label: 'Verbündet', color: '#17805a' },
	neutral: { label: 'Neutral', color: '#2563a8' },
	enemy: { label: 'Gefahr', color: '#b4233a' },
	unknown: { label: 'Unklar', color: '#6d3fc0' },
	dead: { label: 'Tot / ausgelöscht', color: '#6b6780' }
};

export const SOURCE_STATUS: Record<Source['status'], { label: string; hint: string }> = {
	kanon: { label: 'Kanon', hint: 'Original, gilt so' },
	referenz: { label: 'Referenz', hint: 'Nützlich, Fehler im Grimoire korrigiert' },
	teilweise: { label: 'Teilweise falsch', hint: 'Enthält Fehler, im Grimoire korrigiert' },
	veraltet: { label: 'Veraltet', hint: 'Durch das Grimoire ersetzt' },
	gemini: { label: 'Gemini-Entwurf', hint: 'Nur Vorschläge, nicht übernommen' }
};

/** „2026-10-12“ → „12.10.2026“ */
export function dateDe(iso: string | undefined | null): string {
	if (!iso) return '';
	const [y, m, d] = iso.slice(0, 10).split('-');
	return d && m && y ? `${d}.${m}.${y}` : iso;
}

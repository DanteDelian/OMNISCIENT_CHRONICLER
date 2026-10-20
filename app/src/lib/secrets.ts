/** Wer weiß was? Gemeinsame Helfer für die Seite und die Druckfassung. */
import { campaign } from '$lib/stores/campaign.svelte';
import type { Secret } from '$lib/types';

/** Kurznamen für die Tabellenköpfe, mit weichem Trennstrich für schmale Spalten */
const SHORT: Record<string, string> = { 'Zaffera-Syndikat': 'Zafferas', 'Maskierter Mönchsmeister': 'Mönchs­meister' };

/** Personen beim Vornamen, Gruppen und freie Namen („Graf Lhaaz“) wie eingetragen */
export function shortName(who: string): string {
	if (SHORT[who]) return SHORT[who];
	if (/^[„"]/.test(who)) return who;
	return campaign.resolve(who)?.kind === 'Person' ? who.split(' ')[0] : who;
}

/** Alle Mitwisser, wer am meisten weiß zuerst (weiß es zählt doppelt, ahnt es einfach) */
export function witnesses(secrets: Secret[]): string[] {
	const score = new Map<string, number>();
	for (const s of secrets) {
		for (const w of s.knownBy) score.set(w.who, (score.get(w.who) ?? 0) + 2);
		for (const w of s.suspects) score.set(w.who, (score.get(w.who) ?? 0) + 1);
	}
	return [...score.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'de')).map(([who]) => who);
}

export type Mark = 'weiss' | 'ahnt' | null;

/** Weiß die Person es, ahnt sie es oder nichts davon? Mit der Begründung. */
export function markOf(s: Secret, who: string): { mark: Mark; how?: string } {
	const k = s.knownBy.find((w) => w.who === who);
	if (k) return { mark: 'weiss', how: k.how };
	const a = s.suspects.find((w) => w.who === who);
	if (a) return { mark: 'ahnt', how: a.how };
	return { mark: null };
}

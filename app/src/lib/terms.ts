/** Deutsch und Englisch für den Spieltisch: alle Begriffe in Gruppen, die häufigsten zuerst. */
import { ABILITIES, SCHOOL_EN, SKILLS } from './rules';
import { ACTIONS, CONDITIONS, GLOSSARY } from './rules-ref';
import type { Feature } from './types';

export interface TermGroup {
	group: string;
	terms: [string, string][];
}

export function glossaryGroups(features: Feature[]): TermGroup[] {
	const fixed = (name: string) => GLOSSARY.find((g) => g.group === name)?.terms ?? [];
	const enShort = (key: string) => ABILITIES.find((a) => a.key === key)?.enShort ?? '';
	const groups: TermGroup[] = [
		{ group: 'Fertigkeiten', terms: SKILLS.map((k) => [k.name, `${k.en} (${enShort(k.ability)})`]) },
		{ group: 'Attribute', terms: ABILITIES.map((a) => [`${a.name} (${a.short})`, `${a.en} (${a.enShort})`]) },
		{ group: 'Würfe', terms: fixed('Würfe') },
		{ group: 'Zustände', terms: [...CONDITIONS.map((c): [string, string] => [c.name, c.en ?? '']), ['Erschöpfung', 'Exhaustion']] },
		{ group: 'Aktionen', terms: ACTIONS.map((a): [string, string] => [a.name, a.en ?? '']) },
		{ group: 'Kampf', terms: fixed('Kampf') },
		{ group: 'Zauber', terms: fixed('Zauber') },
		{ group: 'Schulen der Magie', terms: Object.entries(SCHOOL_EN) },
		{ group: 'Schadensarten', terms: fixed('Schadensarten') },
		{ group: 'Charakterbogen', terms: fixed('Charakterbogen') },
		{ group: 'Ausrüstung', terms: fixed('Ausrüstung') },
		{ group: 'Deine Merkmale', terms: features.filter((f) => f.en).map((f): [string, string] => [f.name, f.en ?? '']) }
	];
	return groups.filter((g) => g.terms.length);
}

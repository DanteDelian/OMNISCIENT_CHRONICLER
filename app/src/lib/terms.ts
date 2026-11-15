/** Deutsch und Englisch für den Spieltisch: alle Begriffe in Gruppen, die häufigsten zuerst. */
import { ABILITIES, SCHOOL_EN, SKILLS } from './rules';
import { GLOSSARY } from './glossary';
import { rulesOf } from './rulebook';
import type { Feature, RuleChapter } from './types';

export interface TermGroup {
	group: string;
	terms: [string, string][];
}

/**
 * @param withRules Auch die übrigen Regeln des Regelwerks als eigene Gruppe (Bildschirm). Der Druck lässt sie weg,
 *   damit das Blatt auf eine Seite passt.
 */
export function glossaryGroups(features: Feature[], rules: RuleChapter[] = [], withRules = false): TermGroup[] {
	const fixed = (name: string) => GLOSSARY.find((g) => g.group === name)?.terms ?? [];
	const enShort = (key: string) => ABILITIES.find((a) => a.key === key)?.enShort ?? '';
	const pairs = (slug: string): [string, string][] => rulesOf(rules, slug).filter((r) => r.en).map((r) => [r.name, r.en ?? '']);
	const groups: TermGroup[] = [
		{ group: 'Fertigkeiten', terms: SKILLS.map((k) => [k.name, `${k.en} (${enShort(k.ability)})`]) },
		{ group: 'Attribute', terms: ABILITIES.map((a) => [`${a.name} (${a.short})`, `${a.en} (${a.enShort})`]) },
		{ group: 'Würfe', terms: fixed('Würfe') },
		{ group: 'Zustände', terms: pairs('zustaende') },
		{ group: 'Aktionen', terms: pairs('aktionen') },
		{ group: 'Kampf', terms: fixed('Kampf') },
		{ group: 'Zauber', terms: fixed('Zauber') },
		{ group: 'Schulen der Magie', terms: Object.entries(SCHOOL_EN) },
		{ group: 'Schadensarten', terms: fixed('Schadensarten') },
		{ group: 'Charakterbogen', terms: fixed('Charakterbogen') },
		{ group: 'Ausrüstung', terms: fixed('Ausrüstung') },
		{ group: 'Deine Merkmale', terms: features.filter((f) => f.en).map((f): [string, string] => [f.name, f.en ?? '']) }
	];
	if (withRules) {
		const known = new Set(groups.flatMap((g) => g.terms.map(([de]) => de.toLowerCase())));
		const rest = rules
			.filter((c) => c.slug !== 'zustaende' && c.slug !== 'aktionen')
			.flatMap((c) => c.rules)
			.filter((r) => r.en && !known.has(r.name.toLowerCase()))
			.map((r): [string, string] => [r.name, r.en ?? '']);
		groups.push({ group: 'Regelwerk', terms: rest });
	}
	return groups.filter((g) => g.terms.length);
}

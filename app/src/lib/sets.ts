/**
 * Zauber-Sets für den Tag: Ein Set ist eine Prioritätenliste. Vorbereitet werden die ersten
 * Zauber aus dem Buch, bis die Grenze (IN-Modifikator + Stufe) erreicht ist.
 * Rituale und Zaubertricks brauchen keine Vorbereitung.
 */
import { campaign } from '$lib/stores/campaign.svelte';
import { rolls } from '$lib/stores/rolls.svelte';
import { materialMissing } from '$lib/rules';
import type { Item, Spell, SpellSet } from '$lib/types';

export interface SetPlan {
	/** Wird vorbereitet */
	prepare: Spell[];
	/** Im Buch, aber über der Grenze */
	over: Spell[];
	/** Noch nicht im Buch (Vorschläge, Stufe 6) */
	notInBook: Spell[];
	/** Im Buch, aber das verbrauchte Material fehlt: Vorbereiten wäre ein verschenkter Platz */
	missing: Spell[];
	/** Studierzeit in Minuten: 1 Minute pro Grad jedes vorbereiteten Zaubers */
	minutes: number;
}

export function planSet(set: SpellSet, spells: Spell[], max: number, items: Item[] = []): SetPlan {
	const plan: SetPlan = { prepare: [], over: [], notInBook: [], missing: [], minutes: 0 };
	for (const id of set.spells) {
		const sp = spells.find((s) => s.id === id);
		if (!sp || sp.level === 0) continue;
		if (sp.status !== 'buch') plan.notInBook.push(sp);
		else if (materialMissing(sp, items)) plan.missing.push(sp);
		else if (plan.prepare.length < max) plan.prepare.push(sp);
		else plan.over.push(sp);
	}
	plan.minutes = plan.prepare.reduce((sum, s) => sum + s.level, 0);
	return plan;
}

/** Entspricht die heutige Vorbereitung genau diesem Set? */
export function matches(set: SpellSet, spells: Spell[], max: number, items: Item[] = []): boolean {
	const want = new Set(planSet(set, spells, max, items).prepare.map((s) => s.id));
	const have = spells.filter((s) => s.status === 'buch' && s.level > 0 && s.prepared);
	return have.length === want.size && have.every((s) => want.has(s.id));
}

/**
 * Das Set von heute: das zuletzt gewählte, solange die Vorbereitung noch passt.
 * Ohne Wahl nur dann, wenn genau ein Set passt.
 */
export function activeSetId(sets: SpellSet[], spells: Spell[], max: number, chosen?: string, items: Item[] = []): string | null {
	const fit = sets.filter((x) => matches(x, spells, max, items));
	return fit.find((x) => x.id === chosen)?.id ?? (fit.length === 1 ? fit[0].id : null);
}

/** Set anwenden: Nur die geplanten Zauber sind danach vorbereitet. */
export function applySet(set: SpellSet) {
	const max = campaign.data.character.spellcasting.preparedMax;
	const plan = planSet(set, campaign.data.spells, max, campaign.data.inventory.items);
	const want = new Set(plan.prepare.map((s) => s.id));
	campaign.change('spells', (list) => {
		for (const s of list) if (s.status === 'buch' && s.level > 0) s.prepared = want.has(s.id);
	});
	campaign.change('state', (st) => (st.spellSet = set.id));
	const skipped = plan.missing.length ? ` · ohne Material übersprungen: ${plan.missing.map((s) => s.name).join(', ')}` : '';
	rolls.event(`Vorbereitet: ${set.name}`, `${plan.prepare.length} Zauber, ${plan.minutes} Minuten Studium${skipped}`, 'good');
}

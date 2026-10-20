/**
 * Werkstatt: Was Valerius selbst herstellen kann (Spielerhandbuch 2014 und Xanathars Ratgeber für alles).
 * Gegenstandsregeln aus dem SRD 5.1 übersetzt, Xanathars-Regeln in eigenen Worten.
 */
import { campaign } from '$lib/stores/campaign.svelte';
import { rolls } from '$lib/stores/rolls.svelte';
import { fmtGold } from '$lib/format';
import { pay } from '$lib/game';
import type { Item, PlayState } from '$lib/types';

export interface Recipe {
	/** ID des Gegenstands im Inventar, zu dem das Erzeugnis gestapelt wird */
	id: string;
	name: string;
	en: string;
	/** Werkzeug, wie es in der Astralen Trance heißt */
	tool: string;
	toolEn: string;
	/** lange Rast (Xanathars) oder Arbeitstag (Heiltrank) */
	time: 'rast' | 'tag';
	/** Menge pro Herstellung */
	yield: number;
	/** Zutaten in GM pro Herstellung */
	cost: number;
	/** Marktwert in GM pro Stück (Spielerhandbuch) */
	value: number;
	/** Regel, nach der hergestellt wird */
	how: string;
	/** Vollständige Regeln des Gegenstands */
	rules: string;
	/** Wofür Valerius es braucht */
	use?: string;
}

const ALCHEMY =
	'Als Teil einer langen Rast stellst du mit dem Alchemistenwerkzeug **eine Dosis** her. Du verbrauchst Rohstoffe im Wert des **halben Marktpreises**, die du vorher kaufen oder sammeln musst (Xanathars).';

export const RECIPES: Recipe[] = [
	{
		id: 'alchemistenfeuer',
		name: 'Alchemistenfeuer',
		en: "Alchemist's Fire",
		tool: 'Alchemistenwerkzeug',
		toolEn: "Alchemist's Supplies",
		time: 'rast',
		yield: 1,
		cost: 25,
		value: 50,
		how: ALCHEMY,
		rules:
			'Diese klebrige Flüssigkeit entzündet sich, sobald sie mit Luft in Berührung kommt. Als **Aktion** wirfst du die Flasche bis zu **6 m** weit, wo sie zerbricht. Mach einen **Fernkampfangriff** gegen eine Kreatur oder einen Gegenstand, das Alchemistenfeuer gilt als improvisierte Waffe. Bei einem Treffer erleidet das Ziel zu Beginn jedes seiner Züge **1W4 Feuerschaden**. Eine Kreatur beendet den Schaden, wenn sie ihre Aktion nutzt und einen **Geschicklichkeitswurf gegen SG 10** schafft, um die Flammen zu löschen.',
		use: 'Die Holzstapel der Orcs am Fluss, Barrikaden, Belagerungsgerät. Dein Wurf: +1 (GE, improvisierte Waffe ohne Übung).'
	},
	{
		id: 'saeure',
		name: 'Säure',
		en: 'Acid (vial)',
		tool: 'Alchemistenwerkzeug',
		toolEn: "Alchemist's Supplies",
		time: 'rast',
		yield: 1,
		cost: 12.5,
		value: 25,
		how: ALCHEMY,
		rules:
			'Als **Aktion** spritzt du den Inhalt dieser Phiole auf eine Kreatur in **1,5 m** oder wirfst die Phiole bis zu **6 m** weit, wo sie zerbricht. In beiden Fällen machst du einen **Fernkampfangriff** gegen eine Kreatur oder einen Gegenstand, die Säure gilt als improvisierte Waffe. Bei einem Treffer erleidet das Ziel **2W6 Säureschaden**.',
		use: 'Sabotage an Schlössern, Ketten und Seilen. Was die Säure einem Gegenstand antut, entscheidet der DM.'
	},
	{
		id: 'gegengift',
		name: 'Gegengift',
		en: 'Antitoxin (vial)',
		tool: 'Alchemistenwerkzeug',
		toolEn: "Alchemist's Supplies",
		time: 'rast',
		yield: 1,
		cost: 25,
		value: 50,
		how: ALCHEMY,
		rules: 'Wer den Inhalt dieser Phiole trinkt, hat **1 Stunde** lang **Vorteil auf Rettungswürfe gegen Gift**. Bei Untoten und Konstrukten wirkt es nicht.',
		use: 'Vor einem Kampf gegen Giftmischer oder giftige Bestien. Für deine Skelette nutzlos, sie sind ohnehin immun.'
	},
	{
		id: 'oel',
		name: 'Öl',
		en: 'Oil (flask)',
		tool: 'Alchemistenwerkzeug',
		toolEn: "Alchemist's Supplies",
		time: 'rast',
		yield: 1,
		cost: 0.05,
		value: 0.1,
		how: ALCHEMY,
		rules:
			'Öl gibt es meist in einer Tonflasche mit knapp einem halben Liter. Als **Aktion** spritzt du das Öl auf eine Kreatur in **1,5 m** oder wirfst die Flasche bis zu **6 m** weit, wo sie zerbricht. Mach einen **Fernkampfangriff** gegen eine Kreatur oder einen Gegenstand, das Öl gilt als improvisierte Waffe. Bei einem Treffer ist das Ziel mit Öl bedeckt. Erleidet es Feuerschaden, bevor das Öl getrocknet ist (nach 1 Minute), erleidet es **5 zusätzlichen Feuerschaden**.\n\nDu kannst das Öl auch auf einer ebenen Fläche ausgießen und ein **1,5-m-Feld** bedecken. Angezündet brennt es **2 Runden** und fügt jeder Kreatur, die das Feld betritt oder ihren Zug darin beendet, **5 Feuerschaden** zu. Eine Kreatur erleidet diesen Schaden höchstens einmal pro Zug.',
		use: 'Kaufen geht schneller: 1 SM pro Flasche. Herstellen lohnt nur, wenn ihr weit weg von jedem Händler seid.'
	},
	{
		id: 'parfuem',
		name: 'Parfüm',
		en: 'Perfume (vial)',
		tool: 'Alchemistenwerkzeug',
		toolEn: "Alchemist's Supplies",
		time: 'rast',
		yield: 1,
		cost: 2.5,
		value: 5,
		how: ALCHEMY,
		rules: 'Ein Fläschchen Duftwasser. Es hat keine Regelwirkung.',
		use: 'Ein Geschenk mit Wirkung für Lisbeth oder Leon, oder Ware für Saladins Laden.'
	},
	{
		id: 'seife',
		name: 'Seife',
		en: 'Soap',
		tool: 'Alchemistenwerkzeug',
		toolEn: "Alchemist's Supplies",
		time: 'rast',
		yield: 1,
		cost: 0.01,
		value: 0.02,
		how: ALCHEMY,
		rules: 'Ein Stück Seife. Es hat keine Regelwirkung.',
		use: 'Kaum der Mühe wert, außer als Übung für einen Lehrling.'
	},
	{
		id: 'heiltrank',
		name: 'Heiltrank',
		en: 'Potion of Healing',
		tool: 'Kräuterkundeausrüstung',
		toolEn: 'Herbalism Kit',
		time: 'tag',
		yield: 1,
		cost: 25,
		value: 50,
		how: 'Mit Übung in der **Kräuterkundeausrüstung** braust du einen Heiltrank in **1 Tag Arbeit** für **25 GM** Zutaten (Xanathars, Heiltränke brauen). Das Alchemistenwerkzeug reicht dafür nicht.',
		rules:
			'Du erhältst **2W4 + 2 Trefferpunkte** zurück, wenn du diesen Trank trinkst. Die rote Flüssigkeit schimmert, wenn man sie schüttelt. Einen Trank zu trinken oder einer anderen Kreatur einzuflößen, kostet eine **Aktion**.',
		use: 'Deine 3 Heilkräuter könnten Zutaten sein, ob sie zählen, entscheidet der DM. Die Ausrüstung fehlt dir noch (5 GM, Einkaufszettel).'
	},
	{
		id: 'pfeile',
		name: 'Pfeile',
		en: 'Arrows',
		tool: 'Holzschnitzwerkzeug',
		toolEn: "Woodcarver's Tools",
		time: 'rast',
		yield: 20,
		cost: 0,
		value: 0.05,
		how: 'Mit Übung im **Holzschnitzwerkzeug** schnitzt du als Teil einer **langen Rast bis zu 20 Pfeile**, in einer kurzen Rast bis zu 5 (Xanathars). Du brauchst genug Holz. Das Werkzeug kostet 1 GM.',
		rules:
			'**Munition:** Für einen Fernkampfangriff mit dem Bogen brauchst du Pfeile, jeder Angriff verbraucht einen. Das Ziehen gehört zum Angriff. Nach dem Kampf findest du in 1 Minute die **Hälfte** der verschossenen Pfeile wieder.',
		use: 'Für deine Bogen-Skelette. Holz gibt es genug, die Orcs stapeln es am Fluss.'
	}
];

/** Vorrat im Inventar */
export function stock(items: Item[], id: string): number {
	return items.find((i) => i.id === id)?.qty ?? 0;
}

/** Ist die Werkstatt in diesem Rast-Zyklus schon benutzt? (eine Herstellung pro langer Rast) */
export function usedThisRest(s: PlayState): boolean {
	if (!s.workshop) return false;
	return !s.lastLongRest || s.workshop.at > s.lastLongRest;
}

/** Hat Valerius heute Übung mit dem Werkzeug (Astrale Trance)? */
export function trained(s: PlayState, r: Recipe): boolean {
	return s.trance.tool.trim().toLowerCase() === r.tool.toLowerCase();
}

/** Herstellen: Zutaten bezahlen (oder aus dem Vorrat), Erzeugnis ins Inventar, Rast-Zyklus markieren. */
export function craft(r: Recipe, qty: number, fromStock: boolean): boolean {
	const cost = fromStock ? 0 : r.cost * Math.ceil(qty / r.yield);
	if (cost > 0 && !pay(cost)) {
		rolls.event('Nicht genug Geld', `${r.name}: Zutaten für ${fmtGold(cost)} GM`, 'bad');
		return false;
	}
	campaign.change('inventory', (inv) => {
		const it = inv.items.find((i) => i.id === r.id);
		if (it) it.qty += qty;
		else inv.items.push({ id: r.id, name: r.name, group: 'verbrauch', qty, desc: r.rules.replace(/\n\n/g, ' '), ...(r.id === 'heiltrank' ? { heal: '2d4+2' } : {}) });
	});
	if (r.time === 'rast') campaign.change('state', (s) => (s.workshop = { at: Date.now(), item: r.name }));
	rolls.event('Hergestellt', `${qty} × ${r.name}${cost ? ` für ${fmtGold(cost)} GM Zutaten` : ''}`, 'good');
	return true;
}

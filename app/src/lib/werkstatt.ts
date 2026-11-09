/**
 * Werkstatt: Was Valerius selbst herstellen kann (Spielerhandbuch 2014 und Xanathars Ratgeber für alles).
 * Gegenstandsregeln aus dem SRD 5.1 übersetzt, Xanathars-Regeln in eigenen Worten.
 */
import { campaign } from '$lib/stores/campaign.svelte';
import { rolls } from '$lib/stores/rolls.svelte';
import { fmtGold, uid } from '$lib/format';
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
	/** Sorte im Materialvorrat */
	material: MaterialId;
}

/** Materialvorrat in GM (Xanathars rechnet Material nur in Gold) */
export const MATERIALS = [
	{ id: 'alchemie', label: 'Alchemie', hint: 'Phiolen, Öl, Schwefel, Salz, Harz, Alkohol' },
	{ id: 'kraeuter', label: 'Kräuter', hint: 'Heilkräuter, Wurzeln, Blüten' },
	{ id: 'leder', label: 'Leder und Felle', hint: 'gegerbte Häute, Riemen, Schnallen' },
	{ id: 'stoff', label: 'Stoff und Faden', hint: 'Stoff, Garn, Beutestoff' },
	{ id: 'holz', label: 'Holz und Federn', hint: 'Schösslinge, Bretter, Federn, Sehnen' }
] as const;
export type MaterialId = (typeof MATERIALS)[number]['id'];
/** Welches Werkzeug aus welchem Vorrat arbeitet */
export const TOOL_MATERIAL: Record<string, MaterialId> = {
	Alchemistenwerkzeug: 'alchemie',
	'Kräuterkundeausrüstung': 'kraeuter',
	Lederwerkzeug: 'leder',
	Weberwerkzeug: 'stoff',
	Holzschnitzwerkzeug: 'holz'
};
/** Woher das Material kommt: kaufen (Geld abziehen), aus dem Vorrat oder schon da (nichts verbuchen) */
export type MaterialSource = 'kaufen' | 'vorrat' | 'frei';

export function materialStock(id: MaterialId | undefined): number {
	return id ? (campaign.data.inventory.materials?.[id] ?? 0) : 0;
}

/** Vorrat ändern (Wert in GM, den der DM für Gesammeltes nennt) */
export function adjustMaterial(id: MaterialId, delta: number): void {
	campaign.change('inventory', (inv) => {
		const now = Math.max(0, Math.round(((inv.materials?.[id] ?? 0) + delta) * 100) / 100);
		inv.materials = { ...(inv.materials ?? {}), [id]: now };
	});
}

/** Material bezahlen oder aus dem Vorrat nehmen. false, wenn Geld oder Vorrat nicht reichen. */
function takeMaterial(what: string, cost: number, source: MaterialSource, id: MaterialId | undefined): boolean {
	if (cost <= 0 || source === 'frei') return true;
	if (source === 'kaufen') {
		if (pay(cost)) return true;
		rolls.event('Nicht genug Geld', `${what}: Material für ${fmtGold(cost)} GM`, 'bad');
		return false;
	}
	const have = materialStock(id);
	if (!id || have + 1e-9 < cost) {
		rolls.event('Zu wenig Material', `${what}: ${fmtGold(have)} von ${fmtGold(cost)} GM im Vorrat`, 'bad');
		return false;
	}
	adjustMaterial(id, -cost);
	return true;
}

const ALCHEMY =
	'Als Teil einer langen Rast stellst du mit dem Alchemistenwerkzeug **eine Dosis** her. Du verbrauchst Rohstoffe im Wert des **halben Marktpreises**, die du vorher kaufen oder sammeln musst (Xanathars).';

export const RECIPES: Recipe[] = [
	{
		id: 'alchemistenfeuer',
		material: 'alchemie',
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
		material: 'alchemie',
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
		material: 'alchemie',
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
		material: 'alchemie',
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
		material: 'alchemie',
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
		material: 'alchemie',
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
		material: 'kraeuter',
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
		material: 'holz',
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
export function craft(r: Recipe, qty: number, source: MaterialSource): boolean {
	const full = r.cost * Math.ceil(qty / r.yield);
	if (!takeMaterial(r.name, full, source, r.material)) return false;
	const cost = source === 'kaufen' ? full : 0;
	campaign.change('inventory', (inv) => {
		const it = inv.items.find((i) => i.id === r.id);
		if (it) it.qty += qty;
		else inv.items.push({ id: r.id, name: r.name, group: 'verbrauch', qty, desc: r.rules.replace(/\n\n/g, ' '), ...(r.id === 'heiltrank' ? { heal: '2d4+2' } : {}) });
	});
	if (r.time === 'rast') campaign.change('state', (s) => (s.workshop = { at: Date.now(), item: r.name }));
	rolls.event('Hergestellt', `${qty} × ${r.name}${cost ? ` für ${fmtGold(cost)} GM Zutaten` : ''}`, 'good');
	return true;
}

// ---------- Projekte (Spielerhandbuch: Herstellen in der Freizeit) ----------

/** 5 GM Marktwert pro Arbeitstag von 8 Stunden */
export const GM_PER_HOUR = 5 / 8;
/** Astralelf: nach 4 Stunden Trance wach, während die anderen noch 4 Stunden ruhen (laut DM: Zeit zum Herstellen) */
export const FREE_HOURS = 4;

export interface ProjectPreset {
	name: string;
	tool: string;
	value: number;
	note?: string;
}

/** Was Valerius gerade brauchen kann, Preise aus dem Spielerhandbuch (Details im Handwerks-Handbuch) */
export const PROJECT_PRESETS: ProjectPreset[] = [
	{ name: 'Lederrüstung', tool: 'Lederwerkzeug', value: 10, note: 'leicht, RK 11 + GE' },
	{ name: 'Fellrüstung', tool: 'Lederwerkzeug', value: 10, note: 'mittelschwer, RK 12 + GE (höchstens 2)' },
	{ name: 'Zaumzeug und Zügel', tool: 'Lederwerkzeug', value: 2 },
	{ name: 'Packsattel', tool: 'Lederwerkzeug', value: 5 },
	{ name: 'Reitsattel', tool: 'Lederwerkzeug', value: 10 },
	{ name: 'Militärsattel', tool: 'Lederwerkzeug', value: 20, note: 'Vorteil auf Würfe, um im Sattel zu bleiben' },
	{ name: 'Satteltaschen', tool: 'Lederwerkzeug', value: 4 },
	{ name: 'Rucksack', tool: 'Lederwerkzeug', value: 2 },
	{ name: 'Köcher', tool: 'Lederwerkzeug', value: 1, note: 'fasst 20 Pfeile' },
	{ name: 'Kurzbogen', tool: 'Holzschnitzwerkzeug', value: 25, note: '1W6 Stich, Munition (24/96 m), zweihändig' },
	{ name: 'Schild', tool: 'Holzschnitzwerkzeug', value: 10, note: '+2 RK' },
	{ name: 'Speer', tool: 'Holzschnitzwerkzeug', value: 1, note: '1W6 Stich, Wurfwaffe (6/18 m), vielseitig (1W8)' },
	{ name: 'Zelt für zwei', tool: 'Weberwerkzeug', value: 2 },
	{ name: 'Decke', tool: 'Weberwerkzeug', value: 0.5 }
];

/** Freie Nächte (je 4 Stunden), bis das Projekt fertig ist */
export function nightsLeft(value: number, done: number): number {
	return Math.ceil((value - done) / (GM_PER_HOUR * FREE_HOURS) - 1e-9);
}

/** Neues Projekt. Mit payMaterial wird das Material (halber Marktwert) bezahlt. */
export function startProject(p: ProjectPreset, source: MaterialSource): boolean {
	const material = p.value / 2;
	if (!takeMaterial(p.name, material, source, TOOL_MATERIAL[p.tool])) return false;
	campaign.change('state', (s) => {
		(s.projects ??= []).push({ id: uid('projekt'), name: p.name, tool: p.tool, value: p.value, done: 0, ...(p.note ? { note: p.note } : {}) });
	});
	const how = source === 'kaufen' ? `, Material ${fmtGold(material)} GM bezahlt` : source === 'vorrat' ? `, Material ${fmtGold(material)} GM aus dem Vorrat` : '';
	rolls.event('Projekt begonnen', `${p.name} (${fmtGold(p.value)} GM)${how}`, 'good');
	return true;
}

/** Stunden Arbeit gutschreiben (5 GM pro 8 Stunden), höchstens bis zum Marktwert */
export function workOn(id: string, hours: number): void {
	const p = campaign.data.state.projects?.find((x) => x.id === id);
	if (!p) return;
	const done = Math.min(p.value, Math.round((p.done + hours * GM_PER_HOUR) * 100) / 100);
	campaign.change('state', (s) => {
		const x = s.projects?.find((y) => y.id === id);
		if (x) x.done = done;
	});
	rolls.event('Am Projekt gearbeitet', `${p.name}: ${hours} Std., jetzt ${fmtGold(done)} von ${fmtGold(p.value)} GM`, 'info');
}

/** Fertiges Projekt ins Inventar (am Körper) */
export function finishProject(id: string): void {
	const p = campaign.data.state.projects?.find((x) => x.id === id);
	if (!p) return;
	campaign.change('inventory', (inv) => {
		inv.items.push({ id: uid('eigen'), name: p.name, group: 'koerper', qty: 1, desc: `Selbst hergestellt mit dem ${p.tool}.${p.note ? ` ${p.note}.` : ''}` });
	});
	campaign.change('state', (s) => (s.projects = (s.projects ?? []).filter((x) => x.id !== id)));
	rolls.event('Fertig', `${p.name} liegt jetzt im Inventar`, 'good');
}

export function dropProject(id: string): void {
	campaign.change('state', (s) => (s.projects = (s.projects ?? []).filter((x) => x.id !== id)));
}

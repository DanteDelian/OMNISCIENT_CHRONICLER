import type { CompanionKind } from './types';

/** Schnell-Vorlagen für beschwörbare Kreaturen (aus dem Beschwörungs-Kompendium). */
export interface CreatureTemplate {
	name: string;
	kind: CompanionKind;
	ac: number;
	hpMax: number;
	speed: string;
	attack: string;
	note?: string;
}

export const CREATURE_TEMPLATES: CreatureTemplate[] = [
	{ name: 'Falke (Vertrauter)', kind: 'familiar', ac: 13, hpMax: 1, speed: '3 m, Fliegen 18 m', attack: '— (Vertrauter greift nicht an)', note: 'Späher · Vorteil auf Sicht-Wahrnehmung · Sinne teilen' },
	{ name: 'Eule (Vertrauter)', kind: 'familiar', ac: 11, hpMax: 1, speed: 'Fliegen 18 m', attack: '— (Vertrauter greift nicht an)', note: 'Vorbeiflug · Dunkelsicht 36 m' },
	{ name: 'Unsichtbarer Diener', kind: 'summon', ac: 10, hpMax: 1, speed: '4,5 m', attack: '— (kann nicht angreifen)', note: 'Trägt bis 4,5 kg · einfache Aufgaben' },
	{ name: 'Skelett', kind: 'undead', ac: 13, hpMax: 13, speed: '9 m', attack: 'Knochenbogen +4, 24/96 m, 1W6+2 Stich', note: 'Immun: Gift · anfällig: Wucht · mobile Artillerie' },
	{ name: 'Zombie', kind: 'undead', ac: 8, hpMax: 22, speed: '6 m', attack: 'Schlag +3, 1W6+1 Wucht', note: 'Untote Zähigkeit (CON-Rettung SG 5+Schaden → 1 TP)' }
];

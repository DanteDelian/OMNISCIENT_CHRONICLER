import { getActiveCharacter } from './characters';
import { listQuests } from './quests';
import { listItems } from './inventory';
import { readNote, listNotes } from './vault';
import type { Character } from '$lib/types';

export interface VaultContext {
	chronik: string;
	analyse: string;
	quests: string;
	inventar: string;
	glossar: string;
	character: string;
	charObj: Character;
}

/** Sammelt den aktuellen Stand als Kontext für das KI-Parsing. */
export function gatherContext(): VaultContext {
	const char = getActiveCharacter();
	const chronik = readNote('01_Chronik/chronik.md')?.body ?? '';
	const analyse = readNote('05_Strategie/analyse.md')?.body ?? '';
	const quests = listQuests(char.id)
		.map((q) => `- ${q.title} [${q.status}] – ${q.nextStep}`)
		.join('\n');
	const items = listItems(char.id);
	const inventar =
		items.map((i) => `- ${i.name} x${i.quantity}`).join('\n') +
		`\nWährung: ${char.currency.gp} Gold, ${char.currency.sp} Silber, ${char.currency.cp} Kupfer`;
	const glossar = listNotes()
		.filter((n) => n.path.startsWith('04_Glossar/'))
		.map((n) => `### ${n.title}\n${n.body}`)
		.join('\n\n');
	const character = `${char.name}, Stufe ${char.level} ${char.race} ${char.className}. TP ${char.hp.current}/${char.hp.max}, RK ${char.ac}. Zustände: ${char.conditions.join(', ') || 'keine'}.`;
	return { chronik, analyse, quests, inventar, glossar, character, charObj: char };
}

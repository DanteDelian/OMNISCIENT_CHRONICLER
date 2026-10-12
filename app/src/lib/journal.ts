/** Journal-Helfer: Schnellnotizen und neue Einträge (journal.json). */
import { campaign } from './stores/campaign.svelte';
import { fmtDate, timeHM, todayIso, uid } from './format';
import type { JournalEntry } from './types';

function nextOrder(list: JournalEntry[]): number {
	return list.reduce((m, j) => Math.max(m, j.order), 0) + 10;
}

/** Hängt eine Zeile an die „Session-Notizen“ von heute an (legt den Eintrag bei Bedarf an). */
export function addQuickNote(text: string) {
	const today = todayIso();
	const id = `notizen-${today}`;
	campaign.change('journal', (list) => {
		let entry = list.find((j) => j.id === id);
		if (!entry) {
			entry = {
				id,
				order: nextOrder(list),
				chapter: 'Laufende Session',
				title: `Session-Notizen vom ${fmtDate(today)}`,
				type: 'notiz',
				date: today,
				dateMode: 'exakt',
				dateLabel: fmtDate(today),
				dateBasis: 'Während der Session im Grimoire notiert.',
				summary: 'Schnellnotizen vom Spieltisch. Claude kann daraus einen ausführlichen Eintrag machen.',
				events: [],
				sources: []
			};
			list.push(entry);
		}
		entry.events.push(`${timeHM(Date.now())} · ${text}`);
	});
}

export function addEntry(input: { date: string; title: string; type: JournalEntry['type']; text: string; places: string[]; people: string[] }) {
	const events = input.text
		.split('\n')
		.map((l) => l.replace(/^\s*[-*•]\s*/, '').trim())
		.filter(Boolean);
	campaign.change('journal', (list) => {
		list.push({
			id: uid('eintrag'),
			order: nextOrder(list),
			chapter: 'Neu',
			title: input.title || `Session vom ${fmtDate(input.date)}`,
			type: input.type,
			date: input.date || null,
			dateMode: input.date ? 'exakt' : 'unbekannt',
			dateLabel: input.date ? fmtDate(input.date) : 'Datum unbekannt',
			dateBasis: 'Von dir im Grimoire eingetragen.',
			places: input.places,
			people: input.people,
			events,
			sources: []
		});
	});
}

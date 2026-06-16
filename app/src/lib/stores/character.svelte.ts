import type { Character, CharacterPatch, EventSource } from '$lib/types';

/** Lokales Anwenden eines Patches (optimistisches UI), spiegelt die Server-Merge-Logik. */
function applyPatch(cur: Character, p: CharacterPatch): Character {
	const pp = p as Partial<Character>;
	return {
		...cur,
		...pp,
		abilities: { ...cur.abilities, ...(pp.abilities ?? {}) },
		hp: { ...cur.hp, ...(pp.hp ?? {}) },
		deathSaves: { ...cur.deathSaves, ...(pp.deathSaves ?? {}) },
		currency: { ...cur.currency, ...(pp.currency ?? {}) },
		conditions: pp.conditions ?? cur.conditions,
		spellSlots: pp.spellSlots ?? cur.spellSlots,
		customTrackers: pp.customTrackers ?? cur.customTrackers
	};
}

class CharacterStore {
	current = $state<Character | null>(null);
	saving = $state(false);

	set(c: Character) {
		this.current = c;
	}

	/** Lädt den Charakter neu vom Server (z.B. nach externer Datei-Änderung durch Claude). */
	async refresh() {
		try {
			const res = await fetch('/api/character');
			if (res.ok) this.current = (await res.json()) as Character;
		} catch {
			/* offline */
		}
	}

	/** Optimistisches Update + Persistenz via API. */
	async patch(p: CharacterPatch, source: EventSource = 'manual') {
		if (!this.current) return;
		this.current = applyPatch(this.current, p);
		this.saving = true;
		try {
			const res = await fetch('/api/character', {
				method: 'PATCH',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ patch: p, source })
			});
			if (res.ok) this.current = (await res.json()) as Character;
		} catch (e) {
			console.error('Charakter speichern fehlgeschlagen', e);
		} finally {
			this.saving = false;
		}
	}

	async snapshot(label: string) {
		await fetch('/api/character/snapshot', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ label })
		});
	}
}

export const character = new CharacterStore();

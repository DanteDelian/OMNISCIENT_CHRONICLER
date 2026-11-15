/**
 * Kampagnen-Zustand im Browser. Änderungen werden sofort angezeigt und
 * entprellt in die Dateien unter campaign/ geschrieben. Jede Änderung an den
 * Spieldateien landet im Verlauf und lässt sich rückgängig machen (Strg+Z).
 */
import { makeResolver } from '$lib/refs';
import { rolls } from '$lib/stores/rolls.svelte';
import type { CampaignData, RefEntry, WritableFile } from '$lib/types';

export const CLIENT_ID = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : String(Math.random());

/** Dateien mit Verlauf. Zauber und Journal haben eigene Dialoge und sind groß, sie bleiben draußen. */
const UNDOABLE: WritableFile[] = ['state', 'inventory', 'uhren', 'quests', 'fragen', 'netzwerk', 'geheimnisse', 'zaubersets', 'map'];

const FILE_LABEL: Record<WritableFile, string> = {
	state: 'Spielstand',
	inventory: 'Inventar',
	quests: 'Quests',
	spells: 'Zauberbuch',
	journal: 'Journal',
	map: 'Karte',
	fragen: 'Fragen',
	netzwerk: 'Netzwerk',
	zaubersets: 'Zauber-Sets',
	geheimnisse: 'Geheimnisse',
	uhren: 'Uhren'
};

export interface HistoryEntry {
	file: WritableFile;
	/** Stand vor der Änderung (JSON) */
	before: string;
	label: string;
	at: number;
}

class CampaignStore {
	data = $state<CampaignData>(null as unknown as CampaignData);
	saving = $state(0);
	error = $state<string | null>(null);
	lastSaved = $state<number>(0);
	history = $state<HistoryEntry[]>([]);

	resolve = $derived.by(() => {
		const r = makeResolver(this.data?.index ?? []);
		return (name: string): RefEntry | undefined => r(name);
	});

	private timers = new Map<WritableFile, ReturnType<typeof setTimeout>>();
	private versions = new Map<WritableFile, number>();
	private dirty = new Set<WritableFile>();
	/** Letzter bekannter Stand je Datei: Daraus entsteht beim nächsten Ändern der Verlaufseintrag */
	private base = new Map<WritableFile, string>();

	private snap(file: WritableFile): string {
		return JSON.stringify($state.snapshot(this.data[file]));
	}

	/** Serverstand übernehmen. Ungespeicherte lokale Änderungen bleiben erhalten. */
	load(server: CampaignData) {
		if (!this.data) {
			this.data = server;
			for (const f of UNDOABLE) this.base.set(f, this.snap(f));
			return;
		}
		const next = { ...server };
		for (const f of this.dirty) {
			(next as Record<string, unknown>)[f] = $state.snapshot(this.data[f]);
		}
		this.data = next;
		// Fremde Änderungen (anderes Gerät, Claude Code) sind der neue Ausgangspunkt, kein Verlaufsschritt
		for (const f of UNDOABLE) if (!this.dirty.has(f)) this.base.set(f, this.snap(f));
	}

	/** Eine schreibbare Datei ändern und das Speichern planen. */
	change<F extends WritableFile>(file: F, fn: (draft: CampaignData[F]) => void, label?: string) {
		fn(this.data[file]);
		this.touch(file, label);
	}

	touch(file: WritableFile, label?: string) {
		if (file === 'state') this.data.state.updatedAt = Date.now();
		if (UNDOABLE.includes(file)) this.record(file, label);
		this.schedule(file);
	}

	private schedule(file: WritableFile) {
		this.dirty.add(file);
		this.versions.set(file, (this.versions.get(file) ?? 0) + 1);
		clearTimeout(this.timers.get(file));
		this.timers.set(
			file,
			setTimeout(() => this.flush(file), 350)
		);
	}

	private record(file: WritableFile, label?: string) {
		const now = this.snap(file);
		const before = this.base.get(file);
		this.base.set(file, now);
		if (before === undefined || before === now) return;
		// Was eine Spielaktion gerade ins Protokoll geschrieben hat, wird zur Beschriftung („−8 TP“, „Netz gewirkt“)
		const recent = rolls.log[0];
		const fromEvent = recent && Date.now() - recent.at < 120 ? recent.label : undefined;
		const last = this.history.at(-1);
		// Schnelle Folgeänderungen derselben Datei (Schaden und Konzentrationsprobe) sind ein Schritt
		if (last && last.file === file && Date.now() - last.at < 700) {
			last.at = Date.now();
			if (label || fromEvent) last.label = label ?? fromEvent ?? last.label;
			return;
		}
		this.history = [...this.history.slice(-39), { file, before, label: label ?? fromEvent ?? FILE_LABEL[file], at: Date.now() }];
	}

	get canUndo() {
		return this.history.length > 0;
	}

	/** Den letzten Schritt zurücknehmen: Die Datei bekommt ihren Stand davor zurück und wird gespeichert. */
	undo(): HistoryEntry | null {
		const h = this.history.at(-1);
		if (!h) return null;
		this.history = this.history.slice(0, -1);
		(this.data as unknown as Record<string, unknown>)[h.file] = JSON.parse(h.before);
		this.base.set(h.file, h.before);
		this.schedule(h.file);
		rolls.event('Rückgängig', `${h.label} (${FILE_LABEL[h.file]})`, 'info');
		return h;
	}

	async flush(file: WritableFile) {
		this.timers.delete(file);
		const version = this.versions.get(file);
		const body = JSON.stringify($state.snapshot(this.data[file]));
		this.saving++;
		try {
			const res = await fetch(`/api/save/${file}`, {
				method: 'PUT',
				headers: { 'content-type': 'application/json', 'x-client-id': CLIENT_ID },
				body
			});
			if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
			if (this.versions.get(file) === version) this.dirty.delete(file);
			this.error = null;
			this.lastSaved = Date.now();
		} catch (e) {
			this.error = `Speichern fehlgeschlagen (${file}.json): ${e instanceof Error ? e.message : e}`;
		} finally {
			this.saving--;
		}
	}

	/** Beim Verlassen der Seite alles Offene sofort senden. */
	flushAll() {
		for (const [file, t] of this.timers) {
			clearTimeout(t);
			this.timers.delete(file);
			const blob = new Blob([JSON.stringify($state.snapshot(this.data[file]))], { type: 'application/json' });
			navigator.sendBeacon?.(`/api/save/${file}?client=${CLIENT_ID}`, blob);
		}
	}

	get hasPending() {
		return this.dirty.size > 0;
	}
}

export const campaign = new CampaignStore();

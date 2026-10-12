/**
 * Kampagnen-Zustand im Browser. Änderungen werden sofort angezeigt und
 * entprellt in die Dateien unter campaign/ geschrieben.
 */
import { makeResolver } from '$lib/refs';
import type { CampaignData, RefEntry, WritableFile } from '$lib/types';

export const CLIENT_ID = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : String(Math.random());

class CampaignStore {
	data = $state<CampaignData>(null as unknown as CampaignData);
	saving = $state(0);
	error = $state<string | null>(null);
	lastSaved = $state<number>(0);

	resolve = $derived.by(() => {
		const r = makeResolver(this.data?.index ?? []);
		return (name: string): RefEntry | undefined => r(name);
	});

	private timers = new Map<WritableFile, ReturnType<typeof setTimeout>>();
	private versions = new Map<WritableFile, number>();
	private dirty = new Set<WritableFile>();

	/** Serverstand übernehmen. Ungespeicherte lokale Änderungen bleiben erhalten. */
	load(server: CampaignData) {
		if (!this.data) {
			this.data = server;
			return;
		}
		const next = { ...server };
		for (const f of this.dirty) {
			(next as Record<string, unknown>)[f] = $state.snapshot(this.data[f]);
		}
		this.data = next;
	}

	/** Eine schreibbare Datei ändern und das Speichern planen. */
	change<F extends WritableFile>(file: F, fn: (draft: CampaignData[F]) => void) {
		fn(this.data[file]);
		this.touch(file);
	}

	touch(file: WritableFile) {
		if (file === 'state') this.data.state.updatedAt = Date.now();
		this.dirty.add(file);
		this.versions.set(file, (this.versions.get(file) ?? 0) + 1);
		clearTimeout(this.timers.get(file));
		this.timers.set(
			file,
			setTimeout(() => this.flush(file), 350)
		);
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

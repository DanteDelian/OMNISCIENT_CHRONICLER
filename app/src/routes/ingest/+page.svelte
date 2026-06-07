<script lang="ts">
	import { onMount } from 'svelte';
	import { character } from '$lib/stores/character.svelte';
	import { toasts } from '$lib/stores/toast.svelte';
	import type { IngestChange, IngestKind } from '$lib/types';
	import Card from '$lib/components/ui/Card.svelte';
	import Upload from '@lucide/svelte/icons/upload';
	import FileText from '@lucide/svelte/icons/file-text';
	import Sparkles from '@lucide/svelte/icons/sparkles';
	import Check from '@lucide/svelte/icons/check';
	import Loader from '@lucide/svelte/icons/loader-circle';
	import Wifi from '@lucide/svelte/icons/wifi';
	import WifiOff from '@lucide/svelte/icons/wifi-off';

	type Stage = 'input' | 'review';
	let stage = $state<Stage>('input');
	let mode = $state<'text' | 'audio'>('text');
	let transcript = $state('');
	let audioFile = $state<File | null>(null);
	let changes = $state<(IngestChange & { selected: boolean })[]>([]);

	let online = $state<boolean | null>(null);
	let providerInfo = $state<string>('');
	let busy = $state<'' | 'transcribe' | 'parse' | 'apply'>('');

	onMount(async () => {
		try {
			const r = await fetch('/api/ingest/health');
			const d = await r.json();
			online = d.online;
			if (d.health) providerInfo = `Parsing: ${d.health.parse_provider} · Transkription: ${d.health.transcribe_provider}`;
		} catch {
			online = false;
		}
	});

	async function transcribe() {
		if (!audioFile) return;
		busy = 'transcribe';
		try {
			const form = new FormData();
			form.append('file', audioFile);
			const r = await fetch('/api/ingest/transcribe', { method: 'POST', body: form });
			const d = await r.json();
			if (d.error) throw new Error(d.error);
			transcript = d.transcript;
			mode = 'text';
			toasts.push('Transkription fertig', `${transcript.length} Zeichen`, 'good');
		} catch (e) {
			toasts.push('Transkription fehlgeschlagen', e instanceof Error ? e.message : '', 'bad');
		} finally {
			busy = '';
		}
	}

	async function parse() {
		if (!transcript.trim()) return;
		busy = 'parse';
		try {
			const r = await fetch('/api/ingest/parse', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ transcript })
			});
			const d = await r.json();
			if (d.error) throw new Error(d.error);
			changes = (d.changes as IngestChange[]).map((c) => ({ ...c, selected: true }));
			stage = 'review';
			if (changes.length === 0) toasts.push('Keine Änderungen vorgeschlagen');
		} catch (e) {
			toasts.push('Analyse fehlgeschlagen', e instanceof Error ? e.message : '', 'bad');
		} finally {
			busy = '';
		}
	}

	async function apply() {
		const selected = changes.filter((c) => c.selected).map(({ selected, ...c }) => c);
		if (!selected.length) return;
		busy = 'apply';
		try {
			const r = await fetch('/api/ingest/apply', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ changes: selected })
			});
			const d = await r.json();
			toasts.push('Übernommen', `${d.applied} Änderung(en) gespeichert`, 'good');
			// Charakter-Store auffrischen
			const cr = await fetch('/api/character');
			if (cr.ok) character.set(await cr.json());
			stage = 'input';
			transcript = '';
			audioFile = null;
			changes = [];
		} catch (e) {
			toasts.push('Übernahme fehlgeschlagen', e instanceof Error ? e.message : '', 'bad');
		} finally {
			busy = '';
		}
	}

	const KIND_META: Record<IngestKind, { label: string; cls: string }> = {
		chronik: { label: 'Chronik', cls: 'text-primary' },
		analyse: { label: 'Analyse', cls: 'text-accent' },
		quest: { label: 'Quest', cls: 'text-primary' },
		inventory: { label: 'Inventar', cls: 'text-accent' },
		glossar: { label: 'Glossar', cls: 'text-success' },
		character: { label: 'Charakter', cls: 'text-danger' }
	};

	const selectedCount = $derived(changes.filter((c) => c.selected).length);
	function setAll(v: boolean) {
		changes = changes.map((c) => ({ ...c, selected: v }));
	}
</script>

<svelte:head><title>KI-Import · Omniscient Chronicler</title></svelte:head>

<div class="mb-4 flex items-center justify-between">
	<h1 class="font-display text-2xl font-bold">KI-Import</h1>
	{#if online === true}
		<span class="chip chip-active gap-1"><Wifi class="h-3.5 w-3.5" /> Sidecar online</span>
	{:else if online === false}
		<span class="chip gap-1 text-danger"><WifiOff class="h-3.5 w-3.5" /> Sidecar offline</span>
	{/if}
</div>

{#if online === false}
	<Card class="mb-4">
		<p class="text-sm text-muted">
			Der KI-Dienst läuft nicht. Starte ihn einmalig:
		</p>
		<pre class="mt-2 overflow-auto rounded-lg bg-surface2 p-3 text-xs">cd ai-sidecar
python -m venv venv
venv\Scripts\pip install -r requirements.txt
venv\Scripts\python -m uvicorn server:app --port 8756</pre>
		<p class="mt-2 text-xs text-muted">
			Tipp: Du hast Ollama installiert – damit läuft das Parsing lokal & kostenlos (Modell z.B.
			<code>gemma2</code>). Für Transkription Gemini-Key oder lokal <code>faster-whisper</code>.
		</p>
	</Card>
{/if}

{#if stage === 'input'}
	<Card>
		{#if providerInfo}<p class="mb-3 text-xs text-muted">{providerInfo}</p>{/if}
		<div class="mb-3 flex gap-1.5">
			<button class="chip {mode === 'text' ? 'chip-active' : ''}" onclick={() => (mode = 'text')}>
				<FileText class="h-3.5 w-3.5" /> Text
			</button>
			<button class="chip {mode === 'audio' ? 'chip-active' : ''}" onclick={() => (mode = 'audio')}>
				<Upload class="h-3.5 w-3.5" /> Audio
			</button>
		</div>

		{#if mode === 'audio'}
			<div class="mb-3 flex flex-wrap items-center gap-2">
				<input
					type="file"
					accept="audio/*,video/mp4"
					class="input"
					onchange={(e) => (audioFile = e.currentTarget.files?.[0] ?? null)}
				/>
				<button class="btn btn-primary" onclick={transcribe} disabled={!audioFile || busy !== ''}>
					{#if busy === 'transcribe'}<Loader class="h-4 w-4 animate-spin" />{/if} Transkribieren
				</button>
			</div>
		{/if}

		<textarea
			class="input min-h-48 resize-y font-mono text-sm"
			bind:value={transcript}
			placeholder="Session-Transkript oder Notizen hier einfügen…"
		></textarea>

		<div class="mt-3 flex justify-end">
			<button class="btn btn-primary" onclick={parse} disabled={!transcript.trim() || busy !== '' || online === false}>
				{#if busy === 'parse'}<Loader class="h-4 w-4 animate-spin" />{:else}<Sparkles class="h-4 w-4" />{/if}
				Vorschläge erzeugen
			</button>
		</div>
	</Card>
{:else}
	<Card>
		<div class="mb-3 flex items-center justify-between">
			<h2 class="panel-title">Vorschläge ({selectedCount}/{changes.length})</h2>
			<div class="flex gap-1">
				<button class="chip" onclick={() => setAll(true)}>Alle</button>
				<button class="chip" onclick={() => setAll(false)}>Keine</button>
			</div>
		</div>

		{#if changes.length === 0}
			<p class="py-6 text-center text-sm text-muted">Keine Änderungen vorgeschlagen.</p>
		{:else}
			<div class="flex flex-col gap-2">
				{#each changes as ch (ch.id)}
					<label class="flex cursor-pointer gap-3 rounded-xl border border-border bg-surface2 p-3 transition hover:border-primary/40">
						<input type="checkbox" bind:checked={ch.selected} class="mt-1 h-4 w-4 accent-[var(--color-primary)]" />
						<div class="min-w-0 flex-1">
							<div class="flex items-center gap-2">
								<span class="text-[10px] font-bold uppercase tracking-wide {KIND_META[ch.kind].cls}">{KIND_META[ch.kind].label}</span>
								<span class="font-semibold">{ch.title}</span>
								<span class="text-xs text-muted">· {ch.summary}</span>
							</div>
							{#if ch.before}
								<div class="mt-1 text-sm text-danger/80 line-through">{ch.before}</div>
							{/if}
							{#if ch.after}
								<div class="mt-0.5 whitespace-pre-wrap text-sm text-success">{ch.after}</div>
							{/if}
						</div>
					</label>
				{/each}
			</div>
		{/if}

		<div class="mt-4 flex justify-between">
			<button class="btn" onclick={() => (stage = 'input')}>Zurück</button>
			<button class="btn btn-primary" onclick={apply} disabled={selectedCount === 0 || busy !== ''}>
				{#if busy === 'apply'}<Loader class="h-4 w-4 animate-spin" />{:else}<Check class="h-4 w-4" />{/if}
				{selectedCount} übernehmen
			</button>
		</div>
	</Card>
{/if}

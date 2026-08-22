<script lang="ts">
	import { onMount } from 'svelte';
	import { fly, fade } from 'svelte/transition';
	import { toasts } from '$lib/stores/toast.svelte';
	import { INGEST_KIND_LABELS, CONFIDENCE_LABELS } from '$lib/types';
	import type { IngestChange, IngestKind, ChangeConfidence, AiStatus } from '$lib/types';
	import Sparkles from '@lucide/svelte/icons/sparkles';
	import Wand2 from '@lucide/svelte/icons/wand-sparkles';
	import BookOpen from '@lucide/svelte/icons/book-open';
	import Brain from '@lucide/svelte/icons/brain';
	import ScrollText from '@lucide/svelte/icons/scroll-text';
	import Package from '@lucide/svelte/icons/package';
	import Users from '@lucide/svelte/icons/users';
	import Shield from '@lucide/svelte/icons/shield';
	import Lightbulb from '@lucide/svelte/icons/lightbulb';
	import Check from '@lucide/svelte/icons/check';
	import X from '@lucide/svelte/icons/x';
	import Pencil from '@lucide/svelte/icons/pencil';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import Loader from '@lucide/svelte/icons/loader-circle';
	import CircleCheck from '@lucide/svelte/icons/circle-check-big';

	type Phase = 'input' | 'loading' | 'review' | 'applying' | 'done';
	let phase = $state<Phase>('input');
	let rawText = $state('');
	let errorMsg = $state('');
	let status = $state<AiStatus | null>(null);

	let meta = $state({ title: '', date: new Date().toISOString().slice(0, 10), summary: '' });
	let highlights = $state<string[]>([]);
	let model = $state('');
	let changes = $state<IngestChange[]>([]);
	// pro Änderung: akzeptiert? + editierbarer Text (für Text-Typen)
	let decisions = $state<Record<string, { accepted: boolean; editing: boolean; text: string }>>({});
	let result = $state<{ number: number; applied: number; errors: string[] } | null>(null);

	const TEXT_KINDS: IngestKind[] = ['chronik', 'analyse', 'glossar'];
	const KIND_ICON: Record<IngestKind, typeof BookOpen> = {
		chronik: BookOpen,
		analyse: Brain,
		quest: ScrollText,
		inventory: Package,
		glossar: Users,
		character: Shield,
		knowledge: Lightbulb
	};
	const CONF_COLOR: Record<ChangeConfidence, string> = {
		known: 'var(--color-success)',
		inferred: 'var(--color-primary)',
		suggested: 'var(--color-accent)'
	};

	const acceptedCount = $derived(changes.filter((c) => decisions[c.id]?.accepted).length);

	onMount(async () => {
		try {
			const r = await fetch('/api/session/process');
			if (r.ok) status = await r.json();
		} catch {
			/* offline ok */
		}
	});

	function editableText(c: IngestChange): string {
		if (c.kind === 'glossar') return String((c.payload as any).content ?? c.after ?? '');
		return String((c.payload as any).text ?? c.after ?? '');
	}

	async function process() {
		if (!rawText.trim()) return;
		errorMsg = '';
		phase = 'loading';
		try {
			const r = await fetch('/api/session/process', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ rawText })
			});
			const data = await r.json();
			if (!r.ok) {
				errorMsg = data?.error || 'Verarbeitung fehlgeschlagen.';
				if (data?.status) status = data.status;
				phase = 'input';
				return;
			}
			meta = {
				title: data.meta?.title || '',
				date: new Date().toISOString().slice(0, 10),
				summary: data.meta?.summary || ''
			};
			highlights = data.meta?.highlights || [];
			model = data.model || '';
			changes = data.changes || [];
			decisions = Object.fromEntries(
				changes.map((c) => [c.id, { accepted: true, editing: false, text: editableText(c) }])
			);
			phase = changes.length ? 'review' : 'input';
			if (!changes.length) toasts.push('Keine Änderungen gefunden', 'Der Text ergab nichts Neues.', 'default');
		} catch (e) {
			errorMsg = e instanceof Error ? e.message : 'Netzwerkfehler.';
			phase = 'input';
		}
	}

	async function apply() {
		const accepted = changes
			.filter((c) => decisions[c.id]?.accepted)
			.map((c) => {
				const d = decisions[c.id];
				if (!TEXT_KINDS.includes(c.kind)) return c;
				const payload = { ...(c.payload as any) };
				if (c.kind === 'glossar') payload.content = d.text;
				else payload.text = d.text;
				return { ...c, after: d.text, payload };
			});
		if (!accepted.length) return;
		phase = 'applying';
		try {
			const r = await fetch('/api/session/apply', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ rawText, meta, changes: accepted })
			});
			const data = await r.json();
			if (!r.ok) throw new Error(data?.error || 'Fehler beim Übernehmen.');
			result = data;
			phase = 'done';
			toasts.push(`Session ${data.number} gespeichert`, `${data.applied} Änderungen übernommen`, 'good');
		} catch (e) {
			errorMsg = e instanceof Error ? e.message : 'Fehler beim Übernehmen.';
			phase = 'review';
			toasts.push('Übernehmen fehlgeschlagen', errorMsg, 'bad');
		}
	}

	function reset() {
		phase = 'input';
		rawText = '';
		changes = [];
		decisions = {};
		result = null;
		errorMsg = '';
		highlights = [];
	}

	const EXAMPLE = `Wir kehrten zur Festung zurück. Die Kräuterfrau nahm Valerius endlich als Lehrling an.\nAm Schlachtfeld im Südosten hob er drei Skelette. Ein roter Echsenkrieger tauchte auf und behauptete, Lisbeths Schiff sei bereits gesunken.\nWir fanden 40 Goldstücke und zwei Heiltränke. Ich glaube, Leon verheimlicht etwas über den Turm.`;
</script>

<svelte:head><title>Werkstatt · Omniscient Chronicler</title></svelte:head>

<div class="mx-auto max-w-3xl">
	<div class="mb-4 flex items-center gap-3">
		<div class="grid h-11 w-11 place-items-center rounded-xl border border-border bg-surface2 text-primary">
			<Wand2 size={22} />
		</div>
		<div>
			<h1 class="text-xl font-semibold leading-tight">Session-Werkstatt</h1>
			<p class="text-sm text-muted">Erzähl, was passiert ist — die Kampagne wächst mit, nach deiner Freigabe.</p>
		</div>
	</div>

	{#if phase === 'input' || phase === 'loading'}
		<div class="card card-pad" in:fade>
			<!-- KI-Status -->
			{#if status}
				{#if status.configured}
					<div class="mb-3 inline-flex items-center gap-2 rounded-full border border-success/40 bg-success/10 px-3 py-1 text-xs font-medium" style="color:var(--color-success)">
						<Sparkles size={13} /> KI aktiv · {status.provider} · {status.model}
					</div>
				{:else}
					<div class="mb-3 rounded-xl border border-accent/40 bg-accent/10 px-3 py-2 text-sm" style="color:color-mix(in oklab, var(--color-accent) 80%, var(--color-ink))">
						<b>KI noch nicht eingerichtet.</b> {status.hint}
						<a href="/settings" class="underline">Einstellungen</a>
					</div>
				{/if}
			{/if}

			<label for="raw" class="panel-title mb-2">Roh-Notizen der Session</label>
			<textarea
				id="raw"
				bind:value={rawText}
				rows="10"
				placeholder={EXAMPLE}
				class="input font-sans leading-relaxed"
				style="resize:vertical; min-height:12rem"
			></textarea>

			{#if errorMsg}
				<p class="mt-2 text-sm" style="color:var(--color-danger)">{errorMsg}</p>
			{/if}

			<div class="mt-3 flex items-center justify-between gap-3">
				<button class="btn btn-ghost text-xs" onclick={() => (rawText = EXAMPLE)} disabled={phase === 'loading'}>
					Beispiel einfügen
				</button>
				<button
					class="btn btn-primary"
					onclick={process}
					disabled={!rawText.trim() || phase === 'loading' || !status?.configured}
				>
					{#if phase === 'loading'}
						<span class="roll-spin"><Loader size={16} /></span> Chronist liest…
					{:else}
						<Sparkles size={16} /> Verarbeiten
					{/if}
				</button>
			</div>
			{#if status && !status.configured}
				<p class="mt-2 text-xs text-muted">
					Ohne KI-Schlüssel kannst du die Session weiterhin klassisch mit Claude Code verarbeiten — deine Dateien in <code>campaign/</code> bleiben die Wahrheit.
				</p>
			{/if}
		</div>
	{/if}

	{#if phase === 'review' || phase === 'applying'}
		<div in:fly={{ y: 12, duration: 250 }}>
			<!-- Zusammenfassung -->
			<div class="card card-ornate card-pad mb-4">
				<div class="mb-3 flex items-baseline justify-between gap-3">
					<div class="text-2xl font-semibold grad-text">{changes.length} Änderungen gefunden</div>
					{#if model}<span class="chip text-[11px]">{model}</span>{/if}
				</div>
				<div class="grid gap-3 sm:grid-cols-2">
					<label class="block">
						<span class="panel-title mb-1">Titel</span>
						<input class="input" bind:value={meta.title} placeholder="Titel der Session" />
					</label>
					<label class="block">
						<span class="panel-title mb-1">Datum</span>
						<input class="input" type="date" bind:value={meta.date} />
					</label>
				</div>
				<label class="mt-3 block">
					<span class="panel-title mb-1">Zusammenfassung</span>
					<textarea class="input" rows="2" bind:value={meta.summary} style="resize:vertical"></textarea>
				</label>
				{#if highlights.length}
					<div class="mt-3 flex flex-wrap gap-1.5">
						{#each highlights as h}<span class="chip text-xs">{h}</span>{/each}
					</div>
				{/if}
			</div>

			<!-- Änderungen -->
			<div class="grid gap-2.5">
				{#each changes as c (c.id)}
					{@const d = decisions[c.id]}
					{@const Icon = KIND_ICON[c.kind]}
					<div class="card card-pad transition" style:opacity={d?.accepted ? '1' : '0.5'}>
						<div class="flex items-start gap-3">
							<div class="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border bg-surface2 text-muted">
								<Icon size={17} />
							</div>
							<div class="min-w-0 flex-1">
								<div class="flex flex-wrap items-center gap-2">
									<span class="chip text-[11px]">{INGEST_KIND_LABELS[c.kind]}</span>
									{#if c.confidence}
										<span
											class="inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium"
											style="color:{CONF_COLOR[c.confidence]}; border-color:color-mix(in oklab, {CONF_COLOR[c.confidence]} 45%, transparent); background:color-mix(in oklab, {CONF_COLOR[c.confidence]} 12%, transparent)"
										>{CONFIDENCE_LABELS[c.confidence]}</span>
									{/if}
								</div>
								<div class="mt-1 font-medium">{c.title}</div>
								{#if c.summary}<div class="text-sm text-muted">{c.summary}</div>{/if}

								{#if c.before || c.after}
									<div class="mt-2 flex flex-wrap items-center gap-2 text-sm">
										{#if c.before}<span class="rounded-md bg-surface2 px-2 py-0.5 text-muted line-through decoration-danger/50">{c.before}</span>{/if}
										{#if c.before && c.after}<ArrowRight size={14} class="text-muted" />{/if}
										{#if c.after && !(d?.editing)}<span class="rounded-md bg-surface2 px-2 py-0.5">{c.after.length > 200 ? c.after.slice(0, 200) + '…' : c.after}</span>{/if}
									</div>
								{/if}

								{#if d?.editing && TEXT_KINDS.includes(c.kind)}
									<textarea class="input mt-2 font-sans text-sm" rows="4" bind:value={d.text} style="resize:vertical"></textarea>
								{/if}
							</div>

							<!-- Aktionen -->
							<div class="flex shrink-0 items-center gap-1">
								{#if TEXT_KINDS.includes(c.kind)}
									<button
										class="btn btn-icon btn-ghost h-9 w-9"
										title="Bearbeiten"
										aria-pressed={d?.editing}
										onclick={() => (decisions[c.id].editing = !decisions[c.id].editing)}
									><Pencil size={15} /></button>
								{/if}
								<button
									class="btn btn-icon h-9 w-9"
									class:btn-primary={d?.accepted}
									title={d?.accepted ? 'Akzeptiert' : 'Akzeptieren'}
									onclick={() => (decisions[c.id].accepted = true)}
								><Check size={16} /></button>
								<button
									class="btn btn-icon h-9 w-9"
									class:btn-danger={!d?.accepted}
									title={d?.accepted ? 'Ablehnen' : 'Abgelehnt'}
									onclick={() => (decisions[c.id].accepted = false)}
								><X size={16} /></button>
							</div>
						</div>
					</div>
				{/each}
			</div>

			{#if errorMsg}<p class="mt-3 text-sm" style="color:var(--color-danger)">{errorMsg}</p>{/if}

			<!-- Aktionsleiste -->
			<div class="sticky bottom-3 mt-4 flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface/90 p-3 backdrop-blur">
				<button class="btn btn-ghost" onclick={reset} disabled={phase === 'applying'}>Verwerfen</button>
				<div class="flex items-center gap-3">
					<span class="text-sm text-muted">{acceptedCount} von {changes.length} ausgewählt</span>
					<button class="btn btn-primary" onclick={apply} disabled={!acceptedCount || phase === 'applying'}>
						{#if phase === 'applying'}
							<span class="roll-spin"><Loader size={16} /></span> Schreibe…
						{:else}
							<Check size={16} /> Übernehmen ({acceptedCount})
						{/if}
					</button>
				</div>
			</div>
		</div>
	{/if}

	{#if phase === 'done' && result}
		<div class="card card-ornate card-pad text-center" in:fly={{ y: 12, duration: 250 }}>
			<div class="mx-auto mb-2 grid h-14 w-14 place-items-center rounded-full border border-success/40 bg-success/10" style="color:var(--color-success)">
				<CircleCheck size={28} />
			</div>
			<h2 class="text-xl font-semibold">Session {result.number} verewigt</h2>
			<p class="text-muted">{result.applied} Änderungen in deine Kampagne übernommen.</p>
			{#if result.errors?.length}
				<div class="mx-auto mt-3 max-w-md rounded-xl border border-danger/40 bg-danger/10 p-3 text-left text-sm" style="color:var(--color-danger)">
					<b>{result.errors.length} übersprungen:</b>
					<ul class="mt-1 list-disc pl-5">{#each result.errors as e}<li>{e}</li>{/each}</ul>
				</div>
			{/if}
			<div class="mt-4 flex justify-center gap-2">
				<a href="/chronik" class="btn btn-primary"><BookOpen size={16} /> Zur Chronik</a>
				<button class="btn" onclick={reset}><Sparkles size={16} /> Neue Session</button>
			</div>
		</div>
	{/if}
</div>

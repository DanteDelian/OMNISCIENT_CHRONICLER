<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { replaceState } from '$app/navigation';
	import {
		Plus,
		Swords,
		Mail,
		ClipboardList,
		StickyNote,
		MapPin,
		Users,
		Gem,
		PackageX,
		Skull,
		ArrowUpCircle,
		TriangleAlert,
		CalendarClock,
		Pencil,
		Trash2,
		Search
	} from '@lucide/svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Markdown from '$lib/components/Markdown.svelte';
	import RefChip from '$lib/components/RefChip.svelte';
	import SourceChip from '$lib/components/SourceChip.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import { campaign } from '$lib/stores/campaign.svelte';
	import { addEntry } from '$lib/journal';
	import { daysBetween, fmtDate, todayIso } from '$lib/format';
	import { normalizeName } from '$lib/refs';
	import type { JournalEntry } from '$lib/types';

	const journal = $derived(campaign.data.journal);
	const quests = $derived(campaign.data.quests);

	const TYPE = {
		session: { label: 'Session', icon: Swords, color: 'var(--color-astral)' },
		nachricht: { label: 'Nachricht', icon: Mail, color: 'var(--color-astral-2)' },
		planung: { label: 'Planung', icon: ClipboardList, color: 'var(--color-gold)' },
		notiz: { label: 'Notiz', icon: StickyNote, color: 'var(--color-warn)' }
	} as const;

	const MODE: Record<JournalEntry['dateMode'], string> = {
		exakt: 'exakt',
		ca: 'ungefähr',
		spaetestens: 'spätestens',
		zeitraum: 'Zeitraum',
		unbekannt: 'unbekannt'
	};

	const CHANGE_COLOR: Record<string, string> = {
		neu: 'var(--color-astral-2)',
		angenommen: 'var(--color-astral-2)',
		aktualisiert: 'var(--color-astral)',
		erledigt: 'var(--color-life)',
		gescheitert: 'var(--color-blood)'
	};

	let type = $state<'alle' | JournalEntry['type']>('alle');
	let who = $state('');
	let q = $state('');

	const refsInJournal = $derived([...new Set(journal.flatMap((j) => [...(j.people ?? []), ...(j.places ?? [])]))].sort());

	const visible = $derived(
		journal.filter((j) => {
			if (type !== 'alle' && j.type !== type) return false;
			if (who && ![...(j.people ?? []), ...(j.places ?? [])].includes(who)) return false;
			if (q) {
				const hay = normalizeName([j.title, j.summary ?? '', ...j.events, ...(j.notes ?? [])].join(' '));
				if (!hay.includes(normalizeName(q))) return false;
			}
			return true;
		})
	);

	const dated = $derived(journal.filter((j) => j.date).map((j) => j.date!).sort());
	const lastDate = $derived(dated.at(-1) ?? null);
	const gapDays = $derived(lastDate ? daysBetween(lastDate, todayIso()) : 0);
	const stats = $derived([
		{ label: 'Einträge', value: journal.length },
		{ label: 'Sessions', value: journal.filter((j) => j.type === 'session').length },
		{ label: 'Beute-Funde', value: journal.reduce((a, j) => a + (j.loot?.length ?? 0), 0) },
		{ label: 'Kämpfe / Begegnungen', value: journal.reduce((a, j) => a + (j.encounters?.length ?? 0), 0) },
		{ label: 'Quest-Änderungen', value: journal.reduce((a, j) => a + (j.quests?.length ?? 0), 0) },
		{ label: 'Widersprüche offen', value: journal.reduce((a, j) => a + (j.contradictions?.length ?? 0), 0) }
	]);

	// ---------- Neuer Eintrag ----------
	let creating = $state(false);
	let form = $state({ date: todayIso(), title: '', type: 'session' as JournalEntry['type'], text: '', places: '', people: '' });
	function openNew() {
		form = { date: todayIso(), title: '', type: 'session', text: '', places: '', people: '' };
		creating = true;
	}
	function submitNew() {
		if (!form.text.trim() && !form.title.trim()) return;
		const split = (s: string) => s.split(',').map((x) => x.trim()).filter(Boolean);
		addEntry({ ...form, places: split(form.places), people: split(form.people) });
		creating = false;
	}
	onMount(() => {
		if (page.url.searchParams.get('neu')) {
			openNew();
			replaceState('/journal', {});
		}
	});

	// ---------- Bearbeiten ----------
	let editing = $state<JournalEntry | null>(null);
	let editText = $state('');
	function openEdit(j: JournalEntry) {
		editing = { ...$state.snapshot(j) };
		editText = j.events.join('\n');
	}
	function saveEdit() {
		if (!editing) return;
		const draft = { ...$state.snapshot(editing), events: editText.split('\n').map((l) => l.trim()).filter(Boolean) };
		if (draft.date && draft.dateMode !== 'exakt' && draft.date !== journal.find((x) => x.id === draft.id)?.date) {
			draft.dateMode = 'exakt';
			draft.dateLabel = fmtDate(draft.date);
			draft.dateBasis = 'Von dir korrigiert.';
		}
		campaign.change('journal', (list) => {
			const i = list.findIndex((x) => x.id === draft.id);
			if (i >= 0) list[i] = draft;
		});
		editing = null;
	}
	let confirmDelete = $state<JournalEntry | null>(null);
	function remove(j: JournalEntry) {
		campaign.change('journal', (list) => {
			const i = list.findIndex((x) => x.id === j.id);
			if (i >= 0) list.splice(i, 1);
		});
		confirmDelete = null;
	}

	function questTitle(ref: string) {
		return quests.find((x) => x.id === ref)?.title ?? ref;
	}
</script>

<svelte:head><title>Journal · Valerius</title></svelte:head>

<PageHeader
	eyebrow="Journal"
	title="Die Chronik von Xantus"
	subtitle="Jeder Eintrag mit Datum, Orten, Personen, Beute, Quest-Änderungen und Quellen. Ist ein Datum aus Dokumenten abgeleitet, steht dabei, woher es kommt."
>
	{#snippet actions()}
		<button class="btn btn-primary" onclick={openNew}><Plus size={15} />Neuer Eintrag</button>
	{/snippet}
</PageHeader>

<div class="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
	{#each stats as st (st.label)}
		<div class="panel px-4 py-3">
			<div class="num text-2xl font-semibold">{st.value}</div>
			<div class="text-xs text-ink-3">{st.label}</div>
		</div>
	{/each}
</div>

{#if gapDays > 45}
	<div class="callout callout-warning mb-5">
		<div class="callout-title" data-label="Lücke">Seit {fmtDate(lastDate)} ist nichts eingetragen ({gapDays} Tage)</div>
		<p class="text-sm">
			Was ist seitdem passiert? Schreib es mit <b>Neuer Eintrag</b> auf oder erzähl es Claude. Am Spieltisch landet die <b>Schnellnotiz</b> automatisch hier, mit Datum und Uhrzeit.
		</p>
	</div>
{/if}

<div class="mb-6 flex flex-wrap items-center gap-2">
	<button class="chip {type === 'alle' ? 'chip-on' : ''}" onclick={() => (type = 'alle')}>Alle</button>
	{#each Object.entries(TYPE) as [id, t] (id)}
		<button class="chip {type === id ? 'chip-on' : ''}" onclick={() => (type = id as JournalEntry['type'])}><t.icon size={12} />{t.label}</button>
	{/each}
	<select class="input !h-8 w-56 text-xs" bind:value={who} aria-label="Nach Person oder Ort filtern">
		<option value="">Alle Personen und Orte</option>
		{#each refsInJournal as r (r)}<option value={r}>{r}</option>{/each}
	</select>
	<div class="relative ml-auto w-full sm:w-64">
		<Search size={14} class="absolute top-1/2 left-3 -translate-y-1/2 text-ink-3" />
		<input class="input !pl-8" placeholder="Im Journal suchen …" bind:value={q} />
	</div>
</div>

<ol class="relative">
	<span class="absolute top-2 bottom-2 left-[118px] hidden w-px bg-gradient-to-b from-astral/50 via-line-2 to-transparent md:block"></span>
	{#each visible as j (j.id)}
		{@const t = TYPE[j.type]}
		<li id={j.id} class="relative mb-5 scroll-mt-24 md:grid md:grid-cols-[108px_1fr] md:gap-8">
			<!-- Datum -->
			<div class="mb-2 md:mb-0 md:pt-4 md:text-right">
				<div class="num text-sm font-semibold text-ink">{j.date ? fmtDate(j.date) : '—'}</div>
				<div class="text-[0.68rem] text-ink-3" title={j.dateBasis}>{MODE[j.dateMode]}{j.dateBasis ? ' ⓘ' : ''}</div>
				<span class="absolute top-[22px] left-[114px] hidden h-2.5 w-2.5 rounded-full ring-4 ring-bg md:block" style="background: {t.color}"></span>
			</div>

			<article class="panel p-5">
				<div class="flex flex-wrap items-start justify-between gap-3">
					<div class="min-w-0">
						<div class="mb-1 flex flex-wrap items-center gap-2">
							<span class="badge" style="--c: {t.color}"><t.icon size={10} />{t.label}</span>
							{#if j.chapter}<span class="eyebrow">{j.chapter}</span>{/if}
							{#if j.level}<span class="badge" style="--c: var(--color-gold)"><ArrowUpCircle size={10} />Stufe {j.level}</span>{/if}
						</div>
						<h2 class="title-display text-[1.75rem] leading-tight">{j.title}</h2>
						<div class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-3">
							<span class="flex items-center gap-1" title={j.dateBasis}><CalendarClock size={11} />{j.dateLabel}</span>
							{#if j.ingame}<span>· im Spiel: {j.ingame}</span>{/if}
						</div>
					</div>
					<div class="flex gap-1">
						<button class="icon-btn !h-7 !w-7" onclick={() => openEdit(j)} aria-label="Bearbeiten"><Pencil size={13} /></button>
						<button class="icon-btn !h-7 !w-7 hover:!text-blood" onclick={() => (confirmDelete = j)} aria-label="Löschen"><Trash2 size={13} /></button>
					</div>
				</div>

				{#if j.summary}<p class="mt-3 text-[0.95rem] text-ink">{j.summary}</p>{/if}

				{#if j.events.length}
					<ul class="prose-grim prose-sm mt-3">
						{#each j.events as ev, i (i)}<li><Markdown src={ev} inline /></li>{/each}
					</ul>
				{/if}

				{#if j.places?.length || j.people?.length}
					<div class="mt-4 flex flex-wrap items-center gap-1.5">
						{#if j.places?.length}<MapPin size={13} class="text-ink-3" />{#each j.places as p (p)}<RefChip name={p} />{/each}{/if}
						{#if j.people?.length}<Users size={13} class="ml-2 text-ink-3" />{#each j.people as p (p)}<RefChip name={p} />{/each}{/if}
					</div>
				{/if}

				{#if j.loot?.length || j.lost?.length || j.encounters?.length}
					<div class="mt-3 grid gap-2 sm:grid-cols-3">
						{#if j.encounters?.length}
							<div class="rounded-xl bg-white/[0.025] p-2.5">
								<div class="mb-1 flex items-center gap-1 text-[0.68rem] text-ink-3"><Skull size={11} />Gegner</div>
								{#each j.encounters as e (e)}<div class="text-xs text-ink-2">{e}</div>{/each}
							</div>
						{/if}
						{#if j.loot?.length}
							<div class="rounded-xl bg-gold/[0.05] p-2.5">
								<div class="mb-1 flex items-center gap-1 text-[0.68rem] text-gold"><Gem size={11} />Beute</div>
								{#each j.loot as e (e)}<div class="text-xs text-ink-2">{e}</div>{/each}
							</div>
						{/if}
						{#if j.lost?.length}
							<div class="rounded-xl bg-blood/[0.05] p-2.5">
								<div class="mb-1 flex items-center gap-1 text-[0.68rem] text-blood"><PackageX size={11} />Verloren</div>
								{#each j.lost as e (e)}<div class="text-xs text-ink-2">{e}</div>{/each}
							</div>
						{/if}
					</div>
				{/if}

				{#if j.quests?.length}
					<div class="mt-3 flex flex-wrap gap-1.5">
						{#each j.quests as qc (qc.ref + qc.change)}
							<a class="chip" href="/quests#{qc.ref}" data-ref="quest:{qc.ref}">
								<span class="badge !h-4 shrink-0 !text-[0.58rem]" style="--c: {CHANGE_COLOR[qc.change] ?? 'var(--color-ink-2)'}">{qc.change}</span><span class="truncate">{questTitle(qc.ref)}</span>
							</a>
						{/each}
					</div>
				{/if}

				{#each j.contradictions ?? [] as c (c)}
					<div class="mt-3 flex items-start gap-2 rounded-xl border border-warn/30 bg-warn/[0.06] px-3 py-2 text-xs text-ink-2">
						<TriangleAlert size={13} class="mt-0.5 shrink-0 text-warn" />{c}
					</div>
				{/each}

				{#if j.notes?.length}
					<ul class="mt-3 space-y-1 border-l-2 border-line pl-3 text-xs text-ink-2">
						{#each j.notes as n (n)}<li><Markdown src={n} inline /></li>{/each}
					</ul>
				{/if}

				{#if j.sources?.length}
					<div class="mt-4 flex flex-wrap items-center gap-1.5 border-t border-line pt-3">
						<span class="eyebrow mr-1">Quellen</span>
						{#each j.sources as s (s)}<SourceChip id={s} />{/each}
					</div>
				{/if}
			</article>
		</li>
	{:else}
		<li class="py-10 text-center text-ink-3">Keine Einträge für diesen Filter.</li>
	{/each}
</ol>

<Modal open={creating} title="Neuer Journal-Eintrag" subtitle="Eine Zeile pro Ereignis. [[Verweise]] auf Personen und Orte sind erlaubt." onclose={() => (creating = false)} width="max-w-2xl">
	<form
		class="space-y-3"
		onsubmit={(e) => {
			e.preventDefault();
			submitNew();
		}}
	>
		<div class="grid grid-cols-3 gap-3">
			<label class="block"><span class="mb-1 block text-xs text-ink-3">Datum der Session</span><input class="input" type="date" bind:value={form.date} /></label>
			<label class="col-span-2 block"><span class="mb-1 block text-xs text-ink-3">Titel</span><input class="input" bind:value={form.title} placeholder="z. B. Das Boot kommt" /></label>
		</div>
		<label class="block">
			<span class="mb-1 block text-xs text-ink-3">Art</span>
			<select class="input" bind:value={form.type}>{#each Object.entries(TYPE) as [id, t] (id)}<option value={id}>{t.label}</option>{/each}</select>
		</label>
		<label class="block">
			<span class="mb-1 block text-xs text-ink-3">Was ist passiert?</span>
			<textarea class="input" rows="8" bind:value={form.text} placeholder="Das kleine Boot ist angekommen …&#10;Wir haben mit [[Lisbeth Lhaaz]] gesprochen …"></textarea>
		</label>
		<div class="grid grid-cols-2 gap-3">
			<label class="block"><span class="mb-1 block text-xs text-ink-3">Orte (mit Komma)</span><input class="input" bind:value={form.places} placeholder="Die Siedlung" /></label>
			<label class="block"><span class="mb-1 block text-xs text-ink-3">Personen (mit Komma)</span><input class="input" bind:value={form.people} placeholder="Leon Lhaaz, Saladin" /></label>
		</div>
		<div class="flex justify-end gap-2 pt-2">
			<button type="button" class="btn" onclick={() => (creating = false)}>Abbrechen</button>
			<button class="btn btn-primary">Eintragen</button>
		</div>
	</form>
</Modal>

<Modal open={!!editing} title="Eintrag bearbeiten" onclose={() => (editing = null)} width="max-w-2xl">
	{#if editing}
		<form
			class="space-y-3"
			onsubmit={(e) => {
				e.preventDefault();
				saveEdit();
			}}
		>
			<div class="grid grid-cols-3 gap-3">
				<label class="block"><span class="mb-1 block text-xs text-ink-3">Datum</span><input class="input" type="date" bind:value={editing.date} /></label>
				<label class="col-span-2 block"><span class="mb-1 block text-xs text-ink-3">Titel</span><input class="input" bind:value={editing.title} /></label>
			</div>
			<label class="block"><span class="mb-1 block text-xs text-ink-3">Zusammenfassung</span><textarea class="input" rows="2" bind:value={editing.summary}></textarea></label>
			<label class="block"><span class="mb-1 block text-xs text-ink-3">Ereignisse (eine Zeile pro Ereignis)</span><textarea class="input" rows="9" bind:value={editText}></textarea></label>
			<p class="text-xs text-ink-3">Änderst du das Datum, gilt es danach als exakt.</p>
			<div class="flex justify-end gap-2 pt-2">
				<button type="button" class="btn" onclick={() => (editing = null)}>Abbrechen</button>
				<button class="btn btn-primary">Speichern</button>
			</div>
		</form>
	{/if}
</Modal>

<Modal open={!!confirmDelete} title="Eintrag löschen?" subtitle={confirmDelete?.title} onclose={() => (confirmDelete = null)}>
	<p class="text-sm text-ink-2">Der Eintrag verschwindet aus journal.json. Über Git lässt er sich wiederherstellen.</p>
	{#snippet footer()}
		<button class="btn" onclick={() => (confirmDelete = null)}>Abbrechen</button>
		<button class="btn btn-danger" onclick={() => confirmDelete && remove(confirmDelete)}>Löschen</button>
	{/snippet}
</Modal>

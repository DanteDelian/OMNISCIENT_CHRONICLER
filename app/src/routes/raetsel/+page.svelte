<script lang="ts">
	import { Plus, Pencil, Trash2, Check, RotateCcw, Printer, Search, TriangleAlert, Sparkles, CircleHelp, Lightbulb } from '@lucide/svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Markdown from '$lib/components/Markdown.svelte';
	import RefChip from '$lib/components/RefChip.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import { campaign } from '$lib/stores/campaign.svelte';
	import { fmtDate, todayIso, uid } from '$lib/format';
	import { normalizeName } from '$lib/refs';
	import { QUESTION_TO, collectClues, groupClues } from '$lib/raetsel';
	import type { Question } from '$lib/types';

	const TO = Object.keys(QUESTION_TO) as Question['to'][];

	const fragen = $derived(campaign.data.fragen);
	const open = $derived(fragen.filter((q) => q.status === 'offen'));
	const solved = $derived(fragen.filter((q) => q.status === 'geklaert').sort((a, b) => (b.answered ?? '').localeCompare(a.answered ?? '')));
	const mysteries = $derived(campaign.data.quests.filter((q) => q.kind === 'Mysterium' && (q.status === 'aktiv' || q.status === 'geruecht')));
	const contradictions = $derived(campaign.data.journal.flatMap((j) => (j.contradictions ?? []).map((text) => ({ text, entry: j }))));
	const clues = $derived(collectClues(campaign.data));
	const sources = $derived(new Set(clues.map((c) => c.source.key)).size);
	const tiles = $derived([
		{ id: 'fragen', label: 'Offene Fragen', value: open.length, hint: `${open.filter((q) => q.to === 'dm').length} an den DM`, icon: CircleHelp, color: 'var(--color-astral)' },
		{ id: 'theorien', label: 'Theorien', value: clues.filter((c) => c.kind === 'theorie').length, hint: `dazu ${clues.filter((c) => c.kind === 'offen').length} offene Punkte`, icon: Lightbulb, color: 'var(--color-astral-2)' },
		{ id: 'widersprueche', label: 'Widersprüche', value: contradictions.length, hint: 'aus dem Journal', icon: TriangleAlert, color: 'var(--color-warn)' },
		{ id: 'mysterien', label: 'Mysterien', value: mysteries.length, hint: 'laufende Quests', icon: Sparkles, color: 'var(--color-life)' }
	]);

	let filter = $state('');
	const groups = $derived.by(() => {
		const f = normalizeName(filter);
		return groupClues(f ? clues.filter((c) => normalizeName(`${c.text} ${c.source.title}`).includes(f)) : clues);
	});

	function patch(id: string, fn: (q: Question) => void) {
		campaign.change('fragen', (list) => {
			const q = list.find((x) => x.id === id);
			if (q) fn(q);
		});
	}

	// Antwort direkt an der Frage eintragen
	let answering = $state<string | null>(null);
	const focus = (node: HTMLElement) => node.focus();
	let answerText = $state('');
	function startAnswer(q: Question) {
		answering = q.id;
		answerText = q.answer ?? '';
	}
	function solve(id: string) {
		patch(id, (q) => {
			q.status = 'geklaert';
			q.answer = answerText.trim() || undefined;
			q.answered = todayIso();
		});
		answering = null;
	}
	function reopen(id: string) {
		patch(id, (q) => {
			q.status = 'offen';
			delete q.answer;
			delete q.answered;
		});
	}

	// Neu und bearbeiten
	let editing = $state<Question | null>(null);
	let linksText = $state('');
	let isNew = $state(false);
	function openNew() {
		editing = { id: uid('frage'), to: 'dm', topic: '', question: '', status: 'offen' };
		linksText = '';
		isNew = true;
	}
	function openEdit(q: Question) {
		editing = { ...q };
		linksText = (q.links ?? []).join(', ');
		isNew = false;
	}
	function save() {
		if (!editing?.topic.trim() || !editing.question.trim()) return;
		const links = linksText
			.split(',')
			.map((l) => l.trim())
			.filter(Boolean);
		const draft: Question = { ...$state.snapshot(editing), links: links.length ? links : undefined };
		if (draft.status === 'geklaert') draft.answered ??= todayIso();
		campaign.change('fragen', (list) => {
			const i = list.findIndex((x) => x.id === draft.id);
			if (i >= 0) list[i] = draft;
			else list.unshift(draft);
		});
		editing = null;
	}
	let confirmDelete = $state<Question | null>(null);
	function remove(q: Question) {
		campaign.change('fragen', (list) => {
			const i = list.findIndex((x) => x.id === q.id);
			if (i >= 0) list.splice(i, 1);
		});
		confirmDelete = null;
	}
</script>

<svelte:head><title>Rätselwand · Valerius</title></svelte:head>

<PageHeader
	eyebrow="Kampagne"
	title="Rätselwand"
	subtitle="Was noch offen ist, an einem Ort. Theorien und offene Punkte aus den Einträgen erscheinen hier von selbst."
>
	{#snippet actions()}
		<a class="btn" href="/druck?teil=fragen"><Printer size={15} />Fragen drucken</a>
		<button class="btn btn-primary" onclick={openNew}><Plus size={15} />Frage</button>
	{/snippet}
</PageHeader>

<div class="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
	{#each tiles as t (t.id)}
		<a href="#{t.id}" class="panel panel-hover p-4">
			<div class="eyebrow flex items-center gap-1.5"><t.icon size={12} style="color: {t.color}" />{t.label}</div>
			<div class="num mt-1 text-2xl text-ink">{t.value}</div>
			<div class="text-xs text-ink-3">{t.hint}</div>
		</a>
	{/each}
</div>

<div class="grid gap-6 xl:grid-cols-[1fr_380px]">
	<section id="fragen" class="scroll-mt-24">
		<h2 class="title-display mb-1 text-2xl">Offene Fragen</h2>
		<p class="mb-4 text-sm text-ink-3">Am Tisch abhaken und die Antwort gleich eintragen.</p>

		{#each TO as to (to)}
			{@const list = open.filter((q) => q.to === to)}
			{#if list.length}
				<div class="eyebrow mt-5 mb-2">{QUESTION_TO[to].label} · {list.length} <span class="normal-case tracking-normal text-ink-3">· {QUESTION_TO[to].hint}</span></div>
				<div class="space-y-2">
					{#each list as q (q.id)}
						<article id={q.id} class="panel scroll-mt-24 p-4">
							<div class="flex items-start gap-3">
								<button
									class="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border border-line-2 text-transparent transition hover:border-life hover:text-life"
									title="Als geklärt markieren"
									aria-label="Als geklärt markieren"
									onclick={() => startAnswer(q)}
								>
									<Check size={13} />
								</button>
								<div class="min-w-0 flex-1">
									<div class="text-sm font-semibold text-ink">{q.topic}</div>
									<div class="mt-0.5 text-sm leading-relaxed text-ink-2"><Markdown src={q.question} inline /></div>
									{#if q.links?.length}
										<div class="mt-2 flex flex-wrap gap-1.5">{#each q.links as l (l)}<RefChip name={l} />{/each}</div>
									{/if}
									{#if answering === q.id}
										<form
											class="mt-3 space-y-2"
											onsubmit={(e) => {
												e.preventDefault();
												solve(q.id);
											}}
										>
											<textarea class="input" rows="2" bind:value={answerText} placeholder="Antwort (Markdown, [[Verweise]])" use:focus></textarea>
											<div class="flex justify-end gap-2">
												<button type="button" class="btn btn-sm" onclick={() => (answering = null)}>Abbrechen</button>
												<button class="btn btn-sm btn-life"><Check size={13} />Geklärt</button>
											</div>
										</form>
									{/if}
								</div>
								<div class="flex shrink-0 gap-0.5">
									<button class="icon-btn !h-7 !w-7" onclick={() => openEdit(q)} aria-label="Bearbeiten"><Pencil size={13} /></button>
									<button class="icon-btn !h-7 !w-7 hover:!text-blood" onclick={() => (confirmDelete = q)} aria-label="Löschen"><Trash2 size={13} /></button>
								</div>
							</div>
						</article>
					{/each}
				</div>
			{/if}
		{/each}
		{#if !open.length}<p class="panel p-6 text-center text-sm text-ink-3">{fragen.length ? 'Alle Fragen sind geklärt.' : 'Keine Fragen eingetragen.'}</p>{/if}

		{#if solved.length}
			<details class="mt-6">
				<summary class="cursor-pointer text-sm text-ink-2 hover:text-ink">Geklärt · {solved.length}</summary>
				<ul class="mt-3 space-y-2">
					{#each solved as q (q.id)}
						<li id={q.id} class="panel scroll-mt-24 p-3">
							<div class="flex items-start justify-between gap-3">
								<div class="min-w-0">
									<div class="text-sm">
										<b class="text-ink">{q.topic}</b>
										<span class="text-xs text-ink-3">· {QUESTION_TO[q.to].label}{q.answered ? ` · ${fmtDate(q.answered)}` : ''}</span>
									</div>
									<p class="mt-0.5 text-xs text-ink-3"><Markdown src={q.question} inline /></p>
									{#if q.answer}
										<p class="mt-1.5 flex items-start gap-1.5 text-sm text-ink-2">
											<Check size={13} class="mt-1 shrink-0 text-life" /><span><Markdown src={q.answer} inline /></span>
										</p>
									{/if}
								</div>
								<div class="flex shrink-0 gap-0.5">
									<button class="btn btn-xs btn-ghost" onclick={() => reopen(q.id)}><RotateCcw size={12} />öffnen</button>
									<button class="icon-btn !h-7 !w-7" onclick={() => openEdit(q)} aria-label="Bearbeiten"><Pencil size={13} /></button>
								</div>
							</div>
						</li>
					{/each}
				</ul>
			</details>
		{/if}
	</section>

	<aside class="space-y-4">
		<section id="mysterien" class="panel scroll-mt-24 p-4">
			<div class="mb-3 flex items-center gap-2 text-sm font-medium"><Sparkles size={14} class="text-life" />Mysterien <span class="text-ink-3">· {mysteries.length}</span></div>
			<ul class="space-y-3">
				{#each mysteries as q (q.id)}
					<li>
						<a class="text-sm font-semibold text-ink hover:text-astral" href="/quests#{q.id}" data-ref="quest:{q.id}">{q.title}</a>
						{#if q.next}<p class="mt-0.5 text-xs leading-relaxed text-ink-2"><Markdown src={q.next} inline /></p>{/if}
					</li>
				{:else}
					<li class="text-xs text-ink-3">Keine offenen Mysterien.</li>
				{/each}
			</ul>
		</section>

		<section id="widersprueche" class="panel scroll-mt-24 p-4">
			<div class="mb-3 flex items-center gap-2 text-sm font-medium"><TriangleAlert size={14} class="text-warn" />Widersprüche <span class="text-ink-3">· {contradictions.length}</span></div>
			<ul class="space-y-3">
				{#each contradictions as c, i (i)}
					<li class="text-xs leading-relaxed text-ink-2">
						<a class="mb-0.5 block text-[0.8rem] font-medium text-ink hover:text-astral" href="/journal#{c.entry.id}" data-ref="journal:{c.entry.id}">
							{c.entry.title} <span class="num font-normal text-ink-3">· {c.entry.dateLabel}</span>
						</a>
						<Markdown src={c.text} inline />
					</li>
				{:else}
					<li class="text-xs text-ink-3">Keine offenen Widersprüche.</li>
				{/each}
			</ul>
		</section>
	</aside>
</div>

<section id="theorien" class="mt-10 scroll-mt-24">
	<div class="mb-4 flex flex-wrap items-end justify-between gap-3">
		<div>
			<h2 class="title-display text-2xl">Theorien und offene Punkte</h2>
			<p class="mt-1 text-sm text-ink-3">{clues.length} Funde in {sources} Einträgen. Bestätigt der DM etwas, wird aus der Theorie ein Fakt.</p>
		</div>
		<div class="relative w-full sm:w-64">
			<Search size={14} class="absolute top-1/2 left-3 -translate-y-1/2 text-ink-3" />
			<input class="input !pl-8" placeholder="Filtern …" bind:value={filter} />
		</div>
	</div>
	<div class="columns-1 gap-4 md:columns-2 2xl:columns-3">
		{#each groups as g (g.source.key)}
			<article class="panel mb-4 break-inside-avoid p-4">
				<div class="mb-2 flex items-center justify-between gap-2">
					<a class="truncate text-sm font-semibold text-ink hover:text-astral" href={g.source.href} data-ref={g.source.ref}>{g.source.title}</a>
					<span class="badge shrink-0">{g.source.kind}</span>
				</div>
				<ul class="space-y-2">
					{#each g.clues as c, i (i)}
						<li class="flex items-start gap-2 text-[0.84rem] leading-relaxed text-ink-2">
							<span class="badge mt-0.5 shrink-0 !text-[0.58rem]" style="--c: {c.kind === 'theorie' ? 'var(--color-astral)' : 'var(--color-warn)'}">
								{c.kind === 'theorie' ? 'Theorie' : 'Offen'}
							</span>
							<span class="min-w-0"><Markdown src={c.text} inline />{#if c.when}<span class="text-ink-3"> · {c.when}</span>{/if}</span>
						</li>
					{/each}
				</ul>
			</article>
		{:else}
			<p class="text-sm text-ink-3">Nichts gefunden.</p>
		{/each}
	</div>
</section>

<Modal open={!!editing} title={isNew ? 'Neue Frage' : 'Frage bearbeiten'} onclose={() => (editing = null)} width="max-w-xl">
	{#if editing}
		<form
			class="space-y-3"
			onsubmit={(e) => {
				e.preventDefault();
				save();
			}}
		>
			<div class="grid grid-cols-2 gap-3">
				<label class="block">
					<span class="mb-1 block text-xs text-ink-3">An wen</span>
					<select class="input" bind:value={editing.to}>{#each TO as to (to)}<option value={to}>{QUESTION_TO[to].label}</option>{/each}</select>
				</label>
				<label class="block">
					<span class="mb-1 block text-xs text-ink-3">Status</span>
					<select class="input" bind:value={editing.status}><option value="offen">Offen</option><option value="geklaert">Geklärt</option></select>
				</label>
			</div>
			<label class="block"><span class="mb-1 block text-xs text-ink-3">Thema</span><input class="input" bind:value={editing.topic} required placeholder="z. B. Ohrringe" /></label>
			<label class="block"><span class="mb-1 block text-xs text-ink-3">Frage (Markdown, [[Verweise]])</span><textarea class="input" rows="3" bind:value={editing.question} required></textarea></label>
			{#if editing.status === 'geklaert'}
				<label class="block"><span class="mb-1 block text-xs text-ink-3">Antwort</span><textarea class="input" rows="2" bind:value={editing.answer}></textarea></label>
			{/if}
			<label class="block">
				<span class="mb-1 block text-xs text-ink-3">Verweise (Namen, mit Komma getrennt)</span>
				<input class="input" bind:value={linksText} placeholder="Die Orcs, Fluch brechen" />
			</label>
			<div class="flex justify-end gap-2 pt-2">
				<button type="button" class="btn" onclick={() => (editing = null)}>Abbrechen</button>
				<button class="btn btn-primary">Speichern</button>
			</div>
		</form>
	{/if}
</Modal>

<Modal open={!!confirmDelete} title="Frage löschen?" subtitle={confirmDelete?.topic} onclose={() => (confirmDelete = null)}>
	<p class="text-sm text-ink-2">Tipp: Beantwortete Fragen lieber als „geklärt“ abhaken, dann bleibt die Antwort erhalten.</p>
	{#snippet footer()}
		<button class="btn" onclick={() => (confirmDelete = null)}>Abbrechen</button>
		<button class="btn btn-danger" onclick={() => confirmDelete && remove(confirmDelete)}>Löschen</button>
	{/snippet}
</Modal>

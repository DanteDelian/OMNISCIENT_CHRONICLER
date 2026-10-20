<script lang="ts">
	import { Flag, Plus, Pencil, Trash2, Flame, History, Gift, User } from '@lucide/svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Markdown from '$lib/components/Markdown.svelte';
	import RefChip from '$lib/components/RefChip.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import { campaign } from '$lib/stores/campaign.svelte';
	import { uid } from '$lib/format';
	import type { Quest, QuestStatus } from '$lib/types';

	const quests = $derived(campaign.data.quests);
	const journal = $derived(campaign.data.journal);

	const SECTIONS: { id: string; label: string; hint: string; filter: (q: Quest) => boolean; color: string }[] = [
		{ id: 'dringend', label: 'Dringend', hint: 'Jetzt handeln', filter: (q) => q.status === 'aktiv' && !!q.urgent, color: 'var(--color-blood)' },
		{ id: 'aktiv', label: 'Aktiv', hint: 'Laufende Aufträge und Projekte', filter: (q) => q.status === 'aktiv' && !q.urgent, color: 'var(--color-astral)' },
		{ id: 'geruecht', label: 'Gerüchte und Erkundung', hint: 'Noch nicht angegangen', filter: (q) => q.status === 'geruecht', color: 'var(--color-astral-2)' },
		{ id: 'erledigt', label: 'Erledigt', hint: '', filter: (q) => q.status === 'erledigt', color: 'var(--color-life)' },
		{ id: 'gescheitert', label: 'Gescheitert', hint: '', filter: (q) => q.status === 'gescheitert', color: 'var(--color-ink-3)' }
	];

	const STATUS: { id: QuestStatus; label: string }[] = [
		{ id: 'aktiv', label: 'Aktiv' },
		{ id: 'geruecht', label: 'Gerücht' },
		{ id: 'erledigt', label: 'Erledigt' },
		{ id: 'gescheitert', label: 'Gescheitert' }
	];

	function history(id: string) {
		return journal.flatMap((j) => (j.quests ?? []).filter((q) => q.ref === id).map((q) => ({ entry: j, change: q.change })));
	}

	function patch(id: string, fn: (q: Quest) => void) {
		campaign.change('quests', (list) => {
			const q = list.find((x) => x.id === id);
			if (q) fn(q);
		});
	}

	let editing = $state<Quest | null>(null);
	let linksText = $state('');
	let isNew = $state(false);
	function openNew() {
		editing = { id: uid('quest'), title: '', status: 'aktiv', urgent: false, kind: 'Auftrag', next: '', links: [] };
		linksText = '';
		isNew = true;
	}
	function openEdit(q: Quest) {
		editing = { ...q };
		linksText = (q.links ?? []).join(', ');
		isNew = false;
	}
	function save() {
		if (!editing?.title.trim()) return;
		const draft = { ...$state.snapshot(editing), links: linksText.split(',').map((l) => l.trim()).filter(Boolean) };
		campaign.change('quests', (list) => {
			const i = list.findIndex((x) => x.id === draft.id);
			if (i >= 0) list[i] = draft;
			else list.unshift(draft);
		});
		editing = null;
	}
	let confirmDelete = $state<Quest | null>(null);
	function remove(q: Quest) {
		campaign.change('quests', (list) => {
			const i = list.findIndex((x) => x.id === q.id);
			if (i >= 0) list.splice(i, 1);
		});
		confirmDelete = null;
	}
</script>

<svelte:head><title>Quests · Valerius</title></svelte:head>

<PageHeader
	eyebrow="Quests"
	title="Ziele, Aufträge, Mysterien"
	subtitle="{quests.filter((q) => q.status === 'aktiv').length} aktiv · {quests.filter((q) => q.status === 'geruecht').length} Gerüchte · {quests.filter((q) => q.status === 'erledigt').length} erledigt. Der Verlauf kommt aus dem Journal."
>
	{#snippet actions()}
		<button class="btn btn-primary" onclick={openNew}><Plus size={15} />Quest</button>
	{/snippet}
</PageHeader>

{#each SECTIONS as sec (sec.id)}
	{@const list = quests.filter(sec.filter)}
	{#if list.length}
		<section class="mb-8">
			<div class="mb-3 flex items-baseline gap-3">
				<span class="h-2.5 w-2.5 rounded-full" style="background: {sec.color}"></span>
				<h2 class="title-display text-2xl">{sec.label}</h2>
				<span class="text-sm text-ink-3">{list.length}{sec.hint ? ` · ${sec.hint}` : ''}</span>
			</div>
			<div class="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
				{#each list as q (q.id)}
					{@const hist = history(q.id)}
					<article id={q.id} class="panel scroll-mt-24 flex flex-col p-5 {sec.id === 'dringend' ? 'panel-glow' : ''} {sec.id === 'erledigt' || sec.id === 'gescheitert' ? 'opacity-80' : ''}">
						<div class="flex items-start justify-between gap-3">
							<div class="min-w-0">
								<div class="mb-1 flex flex-wrap items-center gap-1.5">
									{#if q.kind}<span class="badge">{q.kind}</span>{/if}
									{#if q.urgent && q.status === 'aktiv'}<span class="badge" style="--c: var(--color-blood)"><Flame size={10} />dringend</span>{/if}
								</div>
								<h3 class="text-[1.05rem] leading-snug font-semibold">{q.title}</h3>
								{#if q.giver}<p class="mt-0.5 flex items-center gap-1 text-xs text-ink-3"><User size={11} />{q.giver}</p>{/if}
							</div>
							<select
								class="input !h-8 w-32 shrink-0 text-xs"
								value={q.status}
								onchange={(e) => patch(q.id, (x) => (x.status = e.currentTarget.value as QuestStatus))}
								aria-label="Status"
							>
								{#each STATUS as st (st.id)}<option value={st.id}>{st.label}</option>{/each}
							</select>
						</div>

						{#if q.next}
							<div class="mt-3 rounded-xl border border-astral/25 bg-astral/[0.06] px-3 py-2">
								<div class="eyebrow !text-[0.6rem] !text-astral">Nächster Schritt</div>
								<p class="mt-0.5 text-sm text-ink"><Markdown src={q.next} inline /></p>
							</div>
						{/if}
						{#if q.notes}<Markdown src={q.notes} class="prose-sm mt-3" />{/if}
						{#if q.reward}<p class="mt-2 flex items-start gap-1.5 text-xs text-ink-2"><Gift size={12} class="mt-0.5 shrink-0 text-gold" />{q.reward}</p>{/if}

						{#if q.links?.length}
							<div class="mt-3 flex flex-wrap gap-1.5">{#each q.links as l (l)}<RefChip name={l} />{/each}</div>
						{/if}

						{#if hist.length}
							<div class="mt-3 border-t border-line pt-2.5">
								<div class="mb-1 flex items-center gap-1.5 text-[0.7rem] text-ink-3"><History size={11} />Verlauf</div>
								<ul class="space-y-0.5 text-xs">
									{#each hist as h (h.entry.id + h.change)}
										<li class="flex gap-2">
											<span class="num shrink-0 whitespace-nowrap text-ink-3">{h.entry.date ? h.entry.dateLabel.replace('spätestens ', '≤ ') : h.entry.dateLabel}</span>
											<a class="truncate text-ink-2 hover:text-astral" href="/journal#{h.entry.id}" data-ref="journal:{h.entry.id}"><b class="text-ink">{h.change}</b> · {h.entry.title}</a>
										</li>
									{/each}
								</ul>
							</div>
						{/if}

						<div class="mt-auto flex items-center gap-1 pt-3">
							<button class="chip !h-6 text-[0.7rem] {q.urgent ? 'chip-on' : ''}" onclick={() => patch(q.id, (x) => (x.urgent = !x.urgent))}><Flag size={10} />dringend</button>
							<span class="flex-1"></span>
							<button class="icon-btn !h-7 !w-7" onclick={() => openEdit(q)} aria-label="Bearbeiten"><Pencil size={13} /></button>
							<button class="icon-btn !h-7 !w-7 hover:!text-blood" onclick={() => (confirmDelete = q)} aria-label="Löschen"><Trash2 size={13} /></button>
						</div>
					</article>
				{/each}
			</div>
		</section>
	{/if}
{/each}

<Modal open={!!editing} title={isNew ? 'Neue Quest' : 'Quest bearbeiten'} onclose={() => (editing = null)} width="max-w-xl">
	{#if editing}
		<form
			class="space-y-3"
			onsubmit={(e) => {
				e.preventDefault();
				save();
			}}
		>
			<label class="block"><span class="mb-1 block text-xs text-ink-3">Titel</span><input class="input" bind:value={editing.title} required /></label>
			<div class="grid grid-cols-3 gap-3">
				<label class="block"><span class="mb-1 block text-xs text-ink-3">Art</span><input class="input" bind:value={editing.kind} placeholder="Auftrag, Projekt …" /></label>
				<label class="block">
					<span class="mb-1 block text-xs text-ink-3">Status</span>
					<select class="input" bind:value={editing.status}>{#each STATUS as st (st.id)}<option value={st.id}>{st.label}</option>{/each}</select>
				</label>
				<label class="flex items-end gap-2 pb-2 text-sm"><input type="checkbox" bind:checked={editing.urgent} />dringend</label>
			</div>
			<label class="block"><span class="mb-1 block text-xs text-ink-3">Auftraggeber</span><input class="input" bind:value={editing.giver} /></label>
			<label class="block"><span class="mb-1 block text-xs text-ink-3">Nächster Schritt</span><textarea class="input" rows="2" bind:value={editing.next}></textarea></label>
			<label class="block"><span class="mb-1 block text-xs text-ink-3">Notizen (Markdown, [[Verweise]])</span><textarea class="input" rows="3" bind:value={editing.notes}></textarea></label>
			<label class="block"><span class="mb-1 block text-xs text-ink-3">Belohnung</span><input class="input" bind:value={editing.reward} /></label>
			<label class="block"><span class="mb-1 block text-xs text-ink-3">Verweise (Namen, mit Komma getrennt)</span><input class="input" bind:value={linksText} placeholder="Lisbeth Lhaaz, Die Siedlung" /></label>
			<div class="flex justify-end gap-2 pt-2">
				<button type="button" class="btn" onclick={() => (editing = null)}>Abbrechen</button>
				<button class="btn btn-primary">Speichern</button>
			</div>
		</form>
	{/if}
</Modal>

<Modal open={!!confirmDelete} title="Quest löschen?" subtitle={confirmDelete?.title} onclose={() => (confirmDelete = null)}>
	<p class="text-sm text-ink-2">Tipp: Statt zu löschen kannst du sie auf „Erledigt“ oder „Gescheitert“ setzen. Dann bleibt der Verlauf erhalten.</p>
	{#snippet footer()}
		<button class="btn" onclick={() => (confirmDelete = null)}>Abbrechen</button>
		<button class="btn btn-danger" onclick={() => confirmDelete && remove(confirmDelete)}>Löschen</button>
	{/snippet}
</Modal>

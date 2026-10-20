<script lang="ts">
	/** Zauber-Sets für den Tag: anwenden, bearbeiten, aus der aktuellen Vorbereitung anlegen. */
	import { ArrowDown, ArrowUp, BookMarked, Building2, Castle, Check, Clock, Moon, Pencil, Plus, Ship, Sparkle, Swords, Trash2, Wand2, X } from '@lucide/svelte';
	import Markdown from './Markdown.svelte';
	import Modal from './Modal.svelte';
	import { campaign } from '$lib/stores/campaign.svelte';
	import { activeSetId, applySet, planSet } from '$lib/sets';
	import { uid } from '$lib/format';
	import type { SpellSet } from '$lib/types';

	let { compact = false }: { compact?: boolean } = $props();

	const ICONS = { ship: Ship, castle: Castle, wand: Wand2, building: Building2, swords: Swords, moon: Moon } as const;
	const ICON_LABEL: Record<keyof typeof ICONS, string> = { ship: 'Reise', castle: 'Belagerung', wand: 'Magie', building: 'Stadt', swords: 'Kampf', moon: 'Nacht' };
	const iconOf = (set: SpellSet) => ICONS[(set.icon ?? 'swords') as keyof typeof ICONS] ?? Swords;

	const spells = $derived(campaign.data.spells);
	const sets = $derived(campaign.data.zaubersets.sets);
	const max = $derived(campaign.data.character.spellcasting.preparedMax);
	const rituals = $derived(spells.filter((s) => s.status === 'buch' && s.ritual));
	const active = $derived(activeSetId(sets, spells, max, campaign.data.state.spellSet));
	const nameOf = (id: string) => spells.find((s) => s.id === id)?.name ?? id;

	// ---------- Bearbeiten ----------
	let editing = $state<SpellSet | null>(null);
	let isNew = $state(false);
	let confirmDelete = $state(false);
	/** Wählbar: Zauber ab Grad 1 im Buch und die Empfehlungen des Plans */
	const choosable = $derived(
		spells
			.filter((s) => s.level > 0 && (s.status === 'buch' || s.pick))
			.sort((a, b) => a.level - b.level || a.name.localeCompare(b.name, 'de'))
	);

	function openNew() {
		// Start: die aktuelle Vorbereitung
		const now = spells.filter((s) => s.status === 'buch' && s.level > 0 && s.prepared).map((s) => s.id);
		editing = { id: uid('set'), name: '', icon: 'swords', when: '', spells: now };
		isNew = true;
		confirmDelete = false;
	}
	function openEdit(set: SpellSet) {
		editing = $state.snapshot(set) as SpellSet;
		isNew = false;
		confirmDelete = false;
	}
	function move(i: number, d: -1 | 1) {
		if (!editing) return;
		const list = editing.spells;
		const j = i + d;
		if (j < 0 || j >= list.length) return;
		[list[i], list[j]] = [list[j], list[i]];
	}
	function save() {
		if (!editing?.name.trim()) return;
		const draft = $state.snapshot(editing) as SpellSet;
		if (!draft.tip?.trim()) delete draft.tip;
		campaign.change('zaubersets', (z) => {
			const i = z.sets.findIndex((x) => x.id === draft.id);
			if (i >= 0) z.sets[i] = draft;
			else z.sets.push(draft);
		});
		editing = null;
	}
	function remove() {
		if (!editing) return;
		const id = editing.id;
		campaign.change('zaubersets', (z) => (z.sets = z.sets.filter((x) => x.id !== id)));
		editing = null;
	}
</script>

{#if compact}
	<div class="flex flex-wrap gap-2">
		{#each sets as set (set.id)}
			{@const Icon = iconOf(set)}
			{@const on = active === set.id}
			<button class="chip {on ? 'chip-on' : ''}" onclick={() => applySet(set)} title={set.when}>
				<Icon size={13} />{set.name}{#if on}{' '}<Check size={12} />{/if}
			</button>
		{:else}
			<span class="text-xs text-ink-3">Noch keine Sets. Lege sie im Zauberbuch an.</span>
		{/each}
	</div>
{:else}
	<section class="panel p-5">
		<div class="mb-1 flex flex-wrap items-start justify-between gap-3">
			<div>
				<div class="eyebrow">Vorbereitung für heute</div>
				<h2 class="title-display text-3xl">Zauber-Sets</h2>
			</div>
			<button class="btn btn-sm" onclick={openNew}><Plus size={14} />Set aus heutiger Vorbereitung</button>
		</div>
		<p class="mb-4 max-w-3xl text-sm leading-relaxed text-ink-2">
			Ein Set ist eine Reihenfolge: Vorbereitet wird von oben, bis deine Grenze von <b class="text-ink">{max}</b> erreicht ist. Neu vorbereiten darfst du nach
			einer langen Rast, dafür studierst du 1 Minute pro Grad jedes Zaubers. Zaubertricks sind immer bereit, und Rituale
			{#if rituals.length}({rituals.map((r) => r.name).join(', ')}){/if} wirkst du auch unvorbereitet.
		</p>

		<div class="grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
			{#each sets as set (set.id)}
				{@const Icon = iconOf(set)}
				{@const plan = planSet(set, spells, max)}
				{@const on = active === set.id}
				<article class="flex flex-col rounded-2xl border p-4 transition {on ? 'border-astral/60 bg-astral/[0.06] shadow-[0_0_24px_-8px_var(--color-astral)]' : 'border-line bg-white/[0.015]'}">
					<div class="flex items-start gap-3">
						<span class="grid size-9 shrink-0 place-items-center rounded-xl {on ? 'bg-astral/20 text-astral' : 'bg-white/[0.05] text-ink-2'}"><Icon size={18} /></span>
						<div class="min-w-0 flex-1">
							<h3 class="flex flex-wrap items-center gap-2 font-semibold">
								{set.name}
								{#if on}<span class="badge" style="--c: var(--color-astral)"><Check size={11} />heute</span>{/if}
							</h3>
							<p class="mt-0.5 text-xs leading-snug text-ink-3">{set.when}</p>
						</div>
						<button class="icon-btn -mt-1 -mr-1" onclick={() => openEdit(set)} aria-label="{set.name} bearbeiten"><Pencil size={14} /></button>
					</div>

					<ol class="mt-3 flex flex-wrap gap-1.5">
						{#each plan.prepare as sp (sp.id)}
							<li><a class="chip !py-0.5 !text-xs" href="/zauber/{sp.id}" data-ref="spell:{sp.id}"><span class="num text-ink-3">{sp.level}</span>{sp.name}</a></li>
						{/each}
						{#each plan.over as sp (sp.id)}
							<li><a class="chip !py-0.5 !text-xs opacity-45" href="/zauber/{sp.id}" title="Heute nicht: über der Grenze von {max}"><span class="num">{sp.level}</span><s>{sp.name}</s></a></li>
						{/each}
						{#each plan.notInBook as sp (sp.id)}
							<li><a class="chip !border-dashed !py-0.5 !text-xs text-ink-3" href="/zauber/{sp.id}" title="Noch nicht im Buch: Plan"><Sparkle size={10} class="text-life" />{sp.name}</a></li>
						{/each}
					</ol>

					{#if set.tip}<div class="mt-3 border-t border-line pt-3"><Markdown src={set.tip} class="prose-sm text-[0.8rem]" /></div>{/if}

					<div class="mt-auto flex flex-wrap items-center justify-between gap-2 pt-3">
						<span class="flex items-center gap-1.5 text-xs text-ink-3">
							<BookMarked size={12} /><span class="num">{plan.prepare.length}/{max}</span>
							<Clock size={12} class="ml-1" /><span class="num">{plan.minutes} Min.</span>
						</span>
						<button class="btn btn-sm {on ? '' : 'btn-primary'}" disabled={on} onclick={() => applySet(set)}>{on ? 'Ist vorbereitet' : 'Vorbereiten'}</button>
					</div>
				</article>
			{:else}
				<p class="text-sm text-ink-3">Noch keine Sets.</p>
			{/each}
		</div>
		<p class="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-3">
			<span><span class="chip !py-0 !text-[0.65rem]">Netz</span> wird vorbereitet</span>
			<span><span class="chip !py-0 !text-[0.65rem] opacity-45"><s>Eismesser</s></span> heute über der Grenze</span>
			<span><span class="chip !border-dashed !py-0 !text-[0.65rem]"><Sparkle size={9} class="text-life" />Flutwelle</span> noch nicht im Buch</span>
		</p>
	</section>
{/if}

<Modal open={!!editing} title={isNew ? 'Neues Zauber-Set' : 'Set bearbeiten'} subtitle="Oben steht, was du an diesem Tag sicher brauchst." onclose={() => (editing = null)} width="max-w-2xl">
	{#if editing}
		<div class="space-y-4">
			<div class="grid gap-3 sm:grid-cols-[1fr_auto]">
				<label class="block">
					<span class="mb-1 block text-xs text-ink-3">Name</span>
					<input class="input" bind:value={editing.name} placeholder="z. B. Orc-Lager" />
				</label>
				<div>
					<span class="mb-1 block text-xs text-ink-3">Symbol</span>
					<div class="flex gap-1">
						{#each Object.entries(ICONS) as [key, Icon] (key)}
							<button class="icon-btn {editing.icon === key ? '!bg-astral/20 !text-astral' : ''}" onclick={() => editing && (editing.icon = key)} title={ICON_LABEL[key as keyof typeof ICONS]} aria-label={ICON_LABEL[key as keyof typeof ICONS]}><Icon size={16} /></button>
						{/each}
					</div>
				</div>
			</div>
			<label class="block">
				<span class="mb-1 block text-xs text-ink-3">Wann passt es?</span>
				<input class="input" bind:value={editing.when} placeholder="z. B. Nachts im Feindgebiet" />
			</label>

			<div>
				<div class="mb-1.5 flex items-baseline justify-between gap-2">
					<span class="text-xs text-ink-3">Reihenfolge: Die ersten {max} aus dem Buch werden vorbereitet</span>
					<span class="num text-xs text-ink-3">{editing.spells.length} Zauber</span>
				</div>
				<ol class="space-y-1">
					{#each editing.spells as id, i (id)}
						{@const sp = spells.find((s) => s.id === id)}
						<li class="flex items-center gap-2 rounded-lg border border-line px-2 py-1 text-sm">
							<span class="num w-5 text-right text-xs text-ink-3">{i + 1}</span>
							<span class="min-w-0 flex-1 truncate">{nameOf(id)}{#if sp && sp.status !== 'buch'}{' '}<span class="text-xs text-life">· Plan</span>{/if}</span>
							<span class="num text-xs text-ink-3">Grad {sp?.level ?? '?'}</span>
							<button class="icon-btn" disabled={i === 0} onclick={() => move(i, -1)} aria-label="nach oben"><ArrowUp size={14} /></button>
							<button class="icon-btn" disabled={i === editing.spells.length - 1} onclick={() => move(i, 1)} aria-label="nach unten"><ArrowDown size={14} /></button>
							<button class="icon-btn" onclick={() => editing && (editing.spells = editing.spells.filter((x) => x !== id))} aria-label="entfernen"><X size={14} /></button>
						</li>
					{/each}
				</ol>
				{#if choosable.some((s) => !editing?.spells.includes(s.id))}
					<div class="mt-2 flex flex-wrap gap-1.5">
						{#each choosable.filter((s) => !editing?.spells.includes(s.id)) as sp (sp.id)}
							<button class="chip !py-0.5 !text-xs {sp.status !== 'buch' ? '!border-dashed' : ''}" onclick={() => editing && (editing.spells = [...editing.spells, sp.id])}>
								<Plus size={11} />{sp.name}{sp.ritual ? ' (Ritual)' : ''}
							</button>
						{/each}
					</div>
				{/if}
			</div>

			<label class="block">
				<span class="mb-1 block text-xs text-ink-3">Tipp für den Tag (optional, mit [[Verweisen]])</span>
				<textarea class="input min-h-20" bind:value={editing.tip}></textarea>
			</label>
		</div>
	{/if}
	{#snippet footer()}
		{#if !isNew}
			{#if confirmDelete}
				<button class="btn btn-danger mr-auto" onclick={remove}><Trash2 size={14} />Wirklich löschen</button>
			{:else}
				<button class="btn btn-ghost mr-auto" onclick={() => (confirmDelete = true)}><Trash2 size={14} />Löschen</button>
			{/if}
		{/if}
		<button class="btn" onclick={() => (editing = null)}>Abbrechen</button>
		<button class="btn btn-primary" disabled={!editing?.name.trim()} onclick={save}>Speichern</button>
	{/snippet}
</Modal>

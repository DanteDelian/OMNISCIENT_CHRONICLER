<script lang="ts">
	import { page } from '$app/state';
	import { Search, BookOpen, Sparkle, CircleHelp } from '@lucide/svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import SpellCard from '$lib/components/SpellCard.svelte';
	import Pips from '$lib/components/Pips.svelte';
	import { campaign } from '$lib/stores/campaign.svelte';
	import { toggleSlot } from '$lib/game';
	import { fmtMod, preparedCount, slotTotals, slotsLeft, spellAttack, spellDc } from '$lib/rules';
	import { normalizeName as normalize } from '$lib/refs';

	type Filter = 'alle' | 'vorbereitet' | 'ritual' | 'konzentration' | 'reaktion';
	let filter = $state<Filter>((page.url.searchParams.get('filter') as Filter) ?? 'alle');
	let q = $state('');

	const c = $derived(campaign.data.character);
	const s = $derived(campaign.data.state);
	const all = $derived(campaign.data.spells);
	const book = $derived(all.filter((x) => x.status === 'buch'));
	const unclear = $derived(all.filter((x) => x.status === 'frage'));
	const proposals = $derived(all.filter((x) => x.status === 'vorschlag'));
	const prepared = $derived(preparedCount(all));
	const leveledInBook = $derived(book.filter((x) => x.level > 0).length);
	const rulesTotal = $derived(6 + 2 * (c.level - 1));

	const visible = $derived(
		[...book, ...unclear].filter((sp) => {
			if (q && !normalize(sp.name + ' ' + sp.en + ' ' + sp.school).includes(normalize(q))) return false;
			if (filter === 'vorbereitet') return sp.level === 0 || sp.prepared;
			if (filter === 'ritual') return sp.ritual;
			if (filter === 'konzentration') return sp.concentration;
			if (filter === 'reaktion') return sp.economy === 'reaktion' || sp.economy === 'bonus';
			return true;
		})
	);

	const groups = $derived(
		[0, 1, 2, 3]
			.map((lvl) => ({ lvl, list: visible.filter((x) => x.level === lvl) }))
			.filter((g) => g.list.length)
	);

	const FILTERS: { id: Filter; label: string }[] = [
		{ id: 'alle', label: 'Alle' },
		{ id: 'vorbereitet', label: 'Vorbereitet' },
		{ id: 'ritual', label: 'Rituale' },
		{ id: 'konzentration', label: 'Konzentration' },
		{ id: 'reaktion', label: 'Reaktion & Bonus' }
	];
</script>

<svelte:head><title>Zauberbuch · Valerius</title></svelte:head>

<PageHeader
	eyebrow="Zauberbuch"
	title="Valerius' Grimoire"
	subtitle="Alle Zauber mit vollständigem Regeltext, deinen Werten, Tipps, Verweisen und Korrekturen. Klick auf einen Zauber öffnet alles."
/>

<div class="grid gap-4 lg:grid-cols-4">
	<div class="panel p-4">
		<div class="eyebrow">Zauber-SG · Angriff</div>
		<div class="num mt-1 text-3xl font-semibold">{spellDc(c)} <span class="text-ink-3">·</span> {fmtMod(spellAttack(c))}</div>
		<div class="text-xs text-ink-3">Intelligenz · Fokus: {c.spellcasting.focus}</div>
	</div>
	<div class="panel p-4">
		<div class="eyebrow">Vorbereitet</div>
		<div class="num mt-1 text-3xl font-semibold {prepared > c.spellcasting.preparedMax ? 'text-blood' : ''}">{prepared}<span class="text-ink-3">/{c.spellcasting.preparedMax}</span></div>
		<div class="text-xs text-ink-3">IN-Mod. 4 + Stufe 5 · Rituale zählen nicht</div>
	</div>
	<div class="panel p-4">
		<div class="eyebrow mb-2">Zauberplätze</div>
		<div class="space-y-1.5">
			{#each slotTotals(c) as sl (sl.level)}
				<div class="flex items-center gap-3">
					<span class="w-12 text-xs text-ink-3">Grad {sl.level}</span>
					<Pips total={sl.total} left={slotsLeft(c, s, sl.level)} size="sm" label="Grad {sl.level}" ontoggle={(full) => toggleSlot(sl.level, full)} />
				</div>
			{/each}
		</div>
	</div>
	<div class="panel p-4">
		<div class="eyebrow">Im Buch</div>
		<div class="num mt-1 text-3xl font-semibold">{leveledInBook}<span class="text-ink-3">/{rulesTotal}</span></div>
		<div class="text-xs text-ink-3">Zauber ab Grad 1 · laut Regeln {rulesTotal} bis Stufe {c.level}</div>
	</div>
</div>

<div class="mt-6 mb-4 flex flex-wrap items-center gap-2">
	{#each FILTERS as f (f.id)}
		<button class="chip {filter === f.id ? 'chip-on' : ''}" onclick={() => (filter = f.id)}>{f.label}</button>
	{/each}
	<div class="relative ml-auto w-full sm:w-64">
		<Search size={14} class="absolute top-1/2 left-3 -translate-y-1/2 text-ink-3" />
		<input class="input !pl-8" placeholder="Zauber suchen …" bind:value={q} />
	</div>
</div>

{#each groups as g (g.lvl)}
	<section class="mb-6">
		<div class="mb-3 flex items-baseline gap-3">
			<h2 class="title-display text-2xl">{g.lvl === 0 ? 'Zaubertricks' : `Grad ${g.lvl}`}</h2>
			<span class="text-sm text-ink-3">
				{#if g.lvl === 0}unbegrenzt wirkbar · Stufe 5: doppelte Würfel{:else}{slotsLeft(c, s, g.lvl)}/{c.spellcasting.slots[String(g.lvl)]} Plätze frei{/if}
			</span>
		</div>
		<div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
			{#each g.list as sp (sp.id)}<SpellCard spell={sp} />{/each}
		</div>
	</section>
{:else}
	<p class="py-10 text-center text-ink-3">Kein Zauber passt zum Filter.</p>
{/each}

<!-- Freie Plätze -->
<section class="panel panel-glow mt-8 p-6">
	<div class="flex flex-wrap items-start gap-6">
		<div class="min-w-[260px] flex-1">
			<div class="mb-2 flex items-center gap-2"><BookOpen size={18} class="text-astral" /><h2 class="title-display text-3xl">Freie Plätze im Zauberbuch</h2></div>
			<p class="text-sm leading-relaxed text-ink-2">
				Ein Magier startet mit <b class="text-ink">6</b> Zaubern und erhält bei jedem Stufenaufstieg <b class="text-ink">2</b> kostenlos, bis Stufe {c.level} also
				<b class="text-ink">{rulesTotal}</b>. In deinem Buch stehen <b class="text-ink">{leveledInBook}</b>, dazu fraglich Nebelschritt.
			</p>
			<p class="mt-2 text-sm leading-relaxed text-ink-2">
				Damit fehlen <b class="text-ink">{rulesTotal - leveledInBook - 1} bis {rulesTotal - leveledInBook}</b> Zauber: zwei bis Grad 1 (Aufstieg auf Stufe 2) und ein
				bis zwei bis Grad 2 (Stufen 3 und 4). Bitte mit dem DM klären, ob sie nie gewählt wurden.
			</p>
		</div>
		<div class="grid min-w-[260px] flex-1 grid-cols-2 gap-2 text-sm">
			<div class="sunken p-3"><div class="num text-xl font-semibold">6 + 2</div><div class="text-xs text-ink-3">Grad 1 (Stufe 1 und 2)</div></div>
			<div class="sunken p-3"><div class="num text-xl font-semibold">2 + 2</div><div class="text-xs text-ink-3">bis Grad 2 (Stufen 3 und 4)</div></div>
			<div class="sunken p-3"><div class="num text-xl font-semibold">2</div><div class="text-xs text-ink-3">bis Grad 3 (Stufe 5): Tote erwecken, Gegenzauber</div></div>
			<div class="sunken p-3"><div class="num text-xl font-semibold">+∞</div><div class="text-xs text-ink-3">Abschreiben: 50 GM und 2 Std. pro Grad, Beschwörung halb</div></div>
		</div>
	</div>

	{#if unclear.length}
		<div class="mt-5 flex flex-wrap items-center gap-2 text-sm">
			<CircleHelp size={15} class="text-warn" /><span class="text-ink-2">Mit dem DM klären:</span>
			{#each unclear as u (u.id)}<a class="chip" href="/zauber/{u.id}" data-ref="spell:{u.id}">{u.name}</a>{/each}
		</div>
	{/if}

	<div class="mt-6 mb-3 flex items-center gap-2"><Sparkle size={16} class="text-life" /><h3 class="font-semibold">Meine Vorschläge für die freien Plätze</h3><span class="text-xs text-ink-3">· nicht im Buch, mit Begründung und vollen Regeln</span></div>
	<div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
		{#each proposals as sp (sp.id)}
			<div class="flex flex-col gap-2">
				<SpellCard spell={sp} />
				{#if sp.slot}<span class="px-1 text-xs text-ink-3">passt in: <b class="text-ink-2">{sp.slot}</b></span>{/if}
			</div>
		{/each}
	</div>
</section>

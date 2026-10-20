<script lang="ts">
	import { page } from '$app/state';
	import { Search, BookOpen, Sparkle, CircleHelp } from '@lucide/svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import SpellCard from '$lib/components/SpellCard.svelte';
	import SpellSets from '$lib/components/SpellSets.svelte';
	import Pips from '$lib/components/Pips.svelte';
	import { campaign } from '$lib/stores/campaign.svelte';
	import { toggleSlot } from '$lib/game';
	import { cantripsKnown, fmtMod, preparedCount, slotTotals, slotsLeft, spellAttack, spellDc, wizardPicks } from '$lib/rules';
	import { normalizeName as normalize } from '$lib/refs';

	type Filter = 'alle' | 'vorbereitet' | 'ritual' | 'konzentration' | 'reaktion';
	let filter = $state<Filter>((page.url.searchParams.get('filter') as Filter) ?? 'alle');
	let q = $state('');

	const c = $derived(campaign.data.character);
	const s = $derived(campaign.data.state);
	const all = $derived(campaign.data.spells);
	const book = $derived(all.filter((x) => x.status === 'buch'));
	const unclear = $derived(all.filter((x) => x.status === 'frage'));
	/** Vorschläge, empfohlene zuerst */
	const proposals = $derived(all.filter((x) => x.status === 'vorschlag').sort((a, b) => Number(!!b.pick) - Number(!!a.pick)));
	/** Vorschläge nach Ziel: fehlende Einträge jetzt oder neue Zauber auf Stufe 6 */
	const proposalGroups = $derived(
		[
			{ id: 'frei', title: 'für die 4 fehlenden Einträge', hint: '2 bis Grad 1, 2 bis Grad 2, Nachtragen mit dem DM klären', list: proposals.filter((x) => !x.slot?.startsWith('Stufe 6')) },
			{ id: 'stufe6', title: 'für Stufe 6', hint: '2 neue Zauber bis Grad 3, siehe Stufe-6-Planer im Archiv', list: proposals.filter((x) => x.slot?.startsWith('Stufe 6')) }
		].filter((g) => g.list.length)
	);
	const prepared = $derived(preparedCount(all));
	const leveledInBook = $derived(book.filter((x) => x.level > 0).length);
	const cantripCount = $derived(book.filter((x) => x.level === 0).length);
	const cantripMax = $derived(cantripsKnown(c.level));
	const picks = $derived(wizardPicks(c.level, book.filter((x) => x.level > 0).map((x) => x.level)));
	const rulesTotal = $derived(picks.reduce((sum, g) => sum + g.total, 0));
	const freePicks = $derived(picks.filter((g) => g.used < g.total));
	const freeTotal = $derived(rulesTotal - picks.reduce((sum, g) => sum + g.used, 0));

	/** Auf welchen Stufen gab es die Zauber dieser Gruppe? */
	function pickLevels(maxGrade: number): string {
		const first = 2 * maxGrade - 1;
		const last = maxGrade === 9 ? c.level : Math.min(c.level, 2 * maxGrade);
		if (first === last) return `Stufe ${first}`;
		return last - first === 1 ? `Stufen ${first} und ${last}` : `Stufen ${first} bis ${last}`;
	}

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
		<div class="text-xs text-ink-3">Zauber ab Grad 1 · {freeTotal} frei · dazu {cantripCount}/{cantripMax} Zaubertricks</div>
	</div>
</div>

<div class="mt-4"><SpellSets /></div>

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
				<b class="text-ink">{rulesTotal}</b>. In deinem Buch stehen <b class="text-ink">{leveledInBook}</b>.
			</p>
			<p class="mt-2 text-sm leading-relaxed text-ink-2">
				{#if freeTotal > 0}
					Damit sind <b class="text-ink">{freeTotal}</b> Einträge frei:
					{#each freePicks as g, i (g.maxGrade)}{i > 0 ? (i === freePicks.length - 1 ? ' und ' : ', ') : ''}<b class="text-ink">{g.total - g.used}</b> bis Grad {g.maxGrade}{/each}.
				{:else}
					Alle kostenlosen Einträge sind belegt.
				{/if}
				{#if cantripCount < cantripMax}
					Dazu kommt <b class="text-ink">{cantripMax - cantripCount}</b> Zaubertrick: Ein Magier der Stufe {c.level} kennt {cantripMax}, du hast {cantripCount}.
				{/if}
				Bitte mit dem DM klären, ob diese Plätze nie gewählt wurden.
			</p>
		</div>
		<div class="grid min-w-[260px] flex-1 grid-cols-2 gap-2 text-sm">
			{#each picks as g (g.maxGrade)}
				<div class="sunken p-3">
					<div class="flex items-baseline justify-between gap-2">
						<span class="num text-xl font-semibold">{g.used}<span class="text-ink-3">/{g.total}</span></span>
						{#if g.used < g.total}<span class="badge" style="--c: var(--color-life)">{g.total - g.used} frei</span>{/if}
					</div>
					<div class="text-xs text-ink-3">bis Grad {g.maxGrade} · {pickLevels(g.maxGrade)}</div>
				</div>
			{/each}
			<div class="sunken p-3">
				<div class="flex items-baseline justify-between gap-2">
					<span class="num text-xl font-semibold">{cantripCount}<span class="text-ink-3">/{cantripMax}</span></span>
					{#if cantripCount < cantripMax}<span class="badge" style="--c: var(--color-life)">{cantripMax - cantripCount} frei</span>{/if}
				</div>
				<div class="text-xs text-ink-3">Zaubertricks · 4. ab Stufe 4</div>
			</div>
			<div class="sunken col-span-2 p-3"><div class="num text-xl font-semibold">+∞</div><div class="text-xs text-ink-3">Abschreiben aus Rollen und Büchern: 50 GM und 2 Std. pro Grad, als Beschwörer bei Beschwörungszaubern die Hälfte</div></div>
		</div>
	</div>

	{#if unclear.length}
		<div class="mt-5 flex flex-wrap items-center gap-2 text-sm">
			<CircleHelp size={15} class="text-warn" /><span class="text-ink-2">Mit dem DM klären:</span>
			{#each unclear as u (u.id)}<a class="chip" href="/zauber/{u.id}" data-ref="spell:{u.id}">{u.name}</a>{/each}
		</div>
	{/if}

	{#each proposalGroups as g (g.id)}
		<div class="mt-6 mb-3 flex flex-wrap items-center gap-2">
			<Sparkle size={16} class="text-life" /><h3 class="font-semibold">Vorschläge {g.title}</h3>
			<span class="text-xs text-ink-3">· {g.hint} · nicht im Buch, mit Begründung und vollen Regeln</span>
		</div>
		<div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
			{#each g.list as sp (sp.id)}
				<div class="flex flex-col gap-2">
					<SpellCard spell={sp} />
					<span class="flex flex-wrap items-center gap-1.5 px-1 text-xs text-ink-3">
						{#if sp.pick}<span class="badge" style="--c: var(--color-life)">Empfehlung</span>{/if}
						{#if sp.slot}<span>passt in: <b class="text-ink-2">{sp.slot}</b></span>{/if}
					</span>
				</div>
			{/each}
		</div>
	{/each}
</section>

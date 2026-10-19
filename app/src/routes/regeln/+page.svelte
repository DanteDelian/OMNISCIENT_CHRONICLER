<script lang="ts">
	import { Search } from '@lucide/svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import { campaign } from '$lib/stores/campaign.svelte';
	import { CONDITIONS, EXHAUSTION, ACTIONS, SPELL_RULES, COMBAT_RULES, VISION_RULES, DEATH_RULES, REST_RULES, type RuleItem } from '$lib/rules-ref';
	import { glossaryGroups } from '$lib/terms';

	const SECTIONS: { id: string; title: string; items: RuleItem[] }[] = [
		{ id: 'aktionen', title: 'Aktionen im Kampf', items: ACTIONS },
		{ id: 'zauberwirken', title: 'Zauberwirken', items: SPELL_RULES },
		{ id: 'kampf', title: 'Kampfregeln', items: COMBAT_RULES },
		{ id: 'sicht', title: 'Sicht und Licht', items: VISION_RULES },
		{ id: 'tod', title: 'Bei 0 Trefferpunkten', items: DEATH_RULES },
		{ id: 'rasten', title: 'Rasten', items: REST_RULES }
	];

	// Deutsch und Englisch, die häufigsten Begriffe zuerst
	const groups = $derived(glossaryGroups(campaign.data.character.features));

	let q = $state('');
	const shown = $derived.by(() => {
		const f = q.trim().toLowerCase();
		if (!f) return groups;
		return groups
			.map((g) => ({ ...g, terms: g.terms.filter(([de, en]) => de.toLowerCase().includes(f) || en.toLowerCase().includes(f)) }))
			.filter((g) => g.terms.length);
	});
</script>

<svelte:head><title>Regeln · Valerius</title></svelte:head>

<PageHeader eyebrow="Regeln" title="Schnellreferenz" subtitle="D&D 5e (Spielerhandbuch 2014, SRD 5.1), kompakt zusammengefasst. Bei jedem Punkt steht, was er konkret für Valerius bedeutet, und daneben der englische Begriff." />

<nav class="mb-6 flex flex-wrap gap-2">
	<a class="chip chip-on" href="#begriffe">Deutsch – Englisch</a>
	<a class="chip" href="#zustaende">Zustände</a>
	{#each SECTIONS as s (s.id)}<a class="chip" href="#{s.id}">{s.title}</a>{/each}
</nav>

<section id="zustaende" class="mb-10 scroll-mt-24">
	<h2 class="title-display mb-3 text-3xl">Zustände <span class="text-xl text-ink-3">· Conditions</span></h2>
	<div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
		{#each CONDITIONS as c (c.id)}
			<article class="panel p-4">
				<h3 class="font-semibold">{c.name}{#if c.en} <span class="text-sm font-normal text-ink-3 italic">{c.en}</span>{/if}</h3>
				<ul class="prose-grim prose-sm mt-2">
					{#each c.effects as e (e)}<li>{e}</li>{/each}
				</ul>
				{#if c.valerius}<p class="mt-2 rounded-lg bg-astral/[0.08] px-3 py-1.5 text-xs text-ink-2"><b class="text-astral">Für Valerius:</b> {c.valerius}</p>{/if}
			</article>
		{/each}
		<article class="panel p-4">
			<h3 class="font-semibold">Erschöpfung <span class="text-sm font-normal text-ink-3 italic">Exhaustion</span></h3>
			<ol class="prose-grim prose-sm mt-2">
				{#each EXHAUSTION as e (e)}<li>{e}</li>{/each}
			</ol>
			<p class="mt-2 text-xs text-ink-3">Stufen wirken kumulativ. Eine lange Rast mit Essen und Trinken senkt die Erschöpfung um 1.</p>
		</article>
	</div>
</section>

{#each SECTIONS as s (s.id)}
	<section id={s.id} class="mb-10 scroll-mt-24">
		<h2 class="title-display mb-3 text-3xl">{s.title}</h2>
		<div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
			{#each s.items as it (it.name)}
				<article class="panel p-4">
					<h3 class="font-semibold">{it.name}{#if it.en && it.en !== it.name} <span class="text-sm font-normal text-ink-3 italic">{it.en}</span>{/if}</h3>
					<p class="mt-1.5 text-sm leading-relaxed text-ink-2">{it.text}</p>
					{#if it.valerius}<p class="mt-2 rounded-lg bg-astral/[0.08] px-3 py-1.5 text-xs text-ink-2"><b class="text-astral">Für Valerius:</b> {it.valerius}</p>{/if}
				</article>
			{/each}
		</div>
	</section>
{/each}

<section id="begriffe" class="mb-10 scroll-mt-24">
	<div class="mb-3 flex flex-wrap items-end justify-between gap-3">
		<div>
			<h2 class="title-display text-3xl">Deutsch – Englisch</h2>
			<p class="mt-1 text-sm text-ink-3">Für den DM, der gern Denglisch spricht. Die Suche findet beide Sprachen.</p>
		</div>
		<div class="relative w-full sm:w-64">
			<Search size={14} class="absolute top-1/2 left-3 -translate-y-1/2 text-ink-3" />
			<input class="input !pl-8" placeholder="z. B. Perception" bind:value={q} />
		</div>
	</div>
	<div class="columns-1 gap-4 md:columns-2 xl:columns-3">
		{#each shown as g (g.group)}
			<article class="panel mb-4 break-inside-avoid p-4">
				<h3 class="mb-2 font-semibold">{g.group}</h3>
				<table class="w-full text-sm">
					<tbody>
						{#each g.terms as [de, en] (de)}
							<tr class="border-b border-line last:border-0">
								<td class="py-1 pr-3 text-ink">{de}</td>
								<td class="py-1 text-ink-2 italic">{en}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</article>
		{:else}
			<p class="text-sm text-ink-3">Kein Begriff gefunden.</p>
		{/each}
	</div>
</section>

<p class="mt-4 text-xs text-ink-3">
	Enthält Regelinhalte aus dem System Reference Document 5.1 von Wizards of the Coast LLC, lizenziert unter CC BY 4.0, in eigener deutscher Zusammenfassung.
</p>

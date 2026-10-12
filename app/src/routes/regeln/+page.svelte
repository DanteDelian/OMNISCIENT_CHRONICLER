<script lang="ts">
	import PageHeader from '$lib/components/PageHeader.svelte';
	import { CONDITIONS, EXHAUSTION, ACTIONS, SPELL_RULES, COMBAT_RULES, VISION_RULES, DEATH_RULES, REST_RULES, type RuleItem } from '$lib/rules-ref';

	const SECTIONS: { id: string; title: string; items: RuleItem[] }[] = [
		{ id: 'aktionen', title: 'Aktionen im Kampf', items: ACTIONS },
		{ id: 'zauberwirken', title: 'Zauberwirken', items: SPELL_RULES },
		{ id: 'kampf', title: 'Kampfregeln', items: COMBAT_RULES },
		{ id: 'sicht', title: 'Sicht und Licht', items: VISION_RULES },
		{ id: 'tod', title: 'Bei 0 Trefferpunkten', items: DEATH_RULES },
		{ id: 'rasten', title: 'Rasten', items: REST_RULES }
	];
</script>

<svelte:head><title>Regeln · Valerius</title></svelte:head>

<PageHeader eyebrow="Regeln" title="Schnellreferenz" subtitle="D&D 5e (Spielerhandbuch 2014, SRD 5.1), kompakt zusammengefasst. Bei jedem Punkt steht, was er konkret für Valerius bedeutet." />

<nav class="mb-6 flex flex-wrap gap-2">
	<a class="chip" href="#zustaende">Zustände</a>
	{#each SECTIONS as s (s.id)}<a class="chip" href="#{s.id}">{s.title}</a>{/each}
</nav>

<section id="zustaende" class="mb-10 scroll-mt-24">
	<h2 class="title-display mb-3 text-3xl">Zustände</h2>
	<div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
		{#each CONDITIONS as c (c.id)}
			<article class="panel p-4">
				<h3 class="font-semibold">{c.name}</h3>
				<ul class="prose-grim prose-sm mt-2">
					{#each c.effects as e (e)}<li>{e}</li>{/each}
				</ul>
				{#if c.valerius}<p class="mt-2 rounded-lg bg-astral/[0.08] px-3 py-1.5 text-xs text-ink-2"><b class="text-astral">Für Valerius:</b> {c.valerius}</p>{/if}
			</article>
		{/each}
		<article class="panel p-4">
			<h3 class="font-semibold">Erschöpfung</h3>
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
					<h3 class="font-semibold">{it.name}</h3>
					<p class="mt-1.5 text-sm leading-relaxed text-ink-2">{it.text}</p>
					{#if it.valerius}<p class="mt-2 rounded-lg bg-astral/[0.08] px-3 py-1.5 text-xs text-ink-2"><b class="text-astral">Für Valerius:</b> {it.valerius}</p>{/if}
				</article>
			{/each}
		</div>
	</section>
{/each}

<p class="mt-4 text-xs text-ink-3">
	Enthält Regelinhalte aus dem System Reference Document 5.1 von Wizards of the Coast LLC, lizenziert unter CC BY 4.0, in eigener deutscher Zusammenfassung.
</p>

<script lang="ts">
	import PDoc from './PDoc.svelte';
	import PMd from './PMd.svelte';
	import { campaign } from '$lib/stores/campaign.svelte';
	import { printAnchor } from '$lib/markdown';
	import { JOURNAL_TYPE } from '$lib/print';

	const journal = $derived([...campaign.data.journal].sort((a, b) => a.order - b.order));
	const quests = $derived(campaign.data.quests);
	const sources = $derived(campaign.data.sources);
	const srcTitle = (id: string) => sources.find((s) => s.id === id)?.title ?? id;
	const questTitle = (id: string) => quests.find((q) => q.id === id)?.title ?? id;
</script>

<PDoc id="journal" eyebrow="Journal" title="Chronik der Kampagne" subtitle="{journal.length} Einträge. Daten ohne festen Termin sind aus den Zeitstempeln der Dokumente abgeleitet (siehe „Datierung“).">
	{#each journal as j (j.id)}
		<article class="grid" id={printAnchor(`journal:${j.id}`)} style="grid-template-columns: 30mm 1fr; gap: 4mm; margin-bottom: 5mm">
			<div style="border-right: 0.6pt solid var(--p-line-2); padding-right: 3mm; text-align: right">
				{#if j.chapter}<div class="label" style="color: var(--p-accent)">{j.chapter}</div>{/if}
				<div class="small" style="font-weight: 650">{j.dateLabel}</div>
				<div class="tiny muted" style="margin-top: 0.6mm">{JOURNAL_TYPE[j.type] ?? j.type}{j.level ? ` · Stufe ${j.level}` : ''}</div>
			</div>
			<div>
				<h3 style="margin-top: 0; font-family: var(--font-display); font-weight: 400; font-size: 15pt">{j.title}</h3>
				{#if j.ingame}<div class="tiny muted" style="margin: -0.6mm 0 1mm">{j.ingame}</div>{/if}
				{#if j.summary}<p class="soft" style="font-style: italic"><PMd src={j.summary} inline /></p>{/if}
				<ul class="bullets">{#each j.events as e (e)}<li><PMd src={e} inline /></li>{/each}</ul>
				<div class="grid g2 small" style="gap: 1mm 4mm">
					{#if j.places?.length}<div><span class="label">Orte</span> {#each j.places as p (p)}<span class="tag"><PMd src={`[[${p}]]`} inline /></span>{/each}</div>{/if}
					{#if j.people?.length}<div><span class="label">Personen</span> {#each j.people as p (p)}<span class="tag"><PMd src={`[[${p}]]`} inline /></span>{/each}</div>{/if}
					{#if j.loot?.length}<div><span class="label">Beute</span> {j.loot.join(' · ')}</div>{/if}
					{#if j.lost?.length}<div><span class="label">Verloren</span> {j.lost.join(' · ')}</div>{/if}
					{#if j.encounters?.length}<div><span class="label">Gegner</span> {j.encounters.join(' · ')}</div>{/if}
					{#if j.quests?.length}<div><span class="label">Quests</span> {j.quests.map((q) => `${questTitle(q.ref)} (${q.change})`).join(' · ')}</div>{/if}
				</div>
				{#if j.notes?.length}
					<div class="box-soft small" style="margin-top: 1.4mm">{#each j.notes as n (n)}<div><PMd src={n} inline /></div>{/each}</div>
				{/if}
				{#if j.contradictions?.length}
					<div class="callout callout-warning small" style="margin: 1.4mm 0 0"><div class="callout-title" data-label="Widerspruch"></div>{#each j.contradictions as n (n)}<p><PMd src={n} inline /></p>{/each}</div>
				{/if}
				<div class="tiny muted" style="margin-top: 1mm">
					{#if j.dateBasis}Datierung: {j.dateBasis}{/if}{#if j.sources?.length}{j.dateBasis ? ' · ' : ''}Quellen: {j.sources.map(srcTitle).join(', ')}{/if}
				</div>
			</div>
		</article>
	{/each}

	<h2>Neue Einträge</h2>
	<p class="small muted">Für die nächsten Sitzungen. Später ins Grimoire übertragen (Journal → Neuer Eintrag).</p>
	{#each Array(2) as _, i (i)}
		<div class="box" style="margin-top: 3mm">
			<div class="spread small"><span>Datum <span class="write" style="width: 28mm"></span></span><span>Titel <span class="write" style="width: 90mm"></span></span></div>
			<div class="lines" style="height: 92mm; margin-top: 1mm"></div>
		</div>
	{/each}
</PDoc>

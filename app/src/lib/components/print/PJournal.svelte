<script lang="ts">
	import PDoc from './PDoc.svelte';
	import PMd from './PMd.svelte';
	import PImg from './PImg.svelte';
	import { campaign } from '$lib/stores/campaign.svelte';
	import { printAnchor } from '$lib/markdown';
	import { JOURNAL_TYPE } from '$lib/print';

	/** Seitenzahlen der Kapitel (zweiter Durchlauf von npm run druck) */
	let { pages = {} }: { pages?: Record<string, number> } = $props();

	const journal = $derived([...campaign.data.journal].sort((a, b) => a.order - b.order));
	const quests = $derived(campaign.data.quests);
	const sources = $derived(campaign.data.sources);
	const srcTitle = (id: string) => sources.find((s) => s.id === id)?.title ?? id;
	const questTitle = (id: string) => quests.find((q) => q.id === id)?.title ?? id;

	/** Kapitel aus „Kapitel N“: Überschrift beim ersten Eintrag, Einschübe (z. B. „Zwischen den Sitzungen“) zählen zum laufenden Kapitel. */
	const chapters = $derived.by(() => {
		const list: { id: string; label: string; first: string; titles: string[] }[] = [];
		for (const j of journal) {
			const n = j.chapter?.match(/^Kapitel\s+(\d+)/)?.[1];
			if (!n) continue;
			const known = list.find((c) => c.id === `kap-${n}`);
			if (known) known.titles.push(j.title);
			else list.push({ id: `kap-${n}`, label: `Kapitel ${n}`, first: j.id, titles: [j.title] });
		}
		return list;
	});
	const heads = $derived(new Map(chapters.map((c) => [c.first, c])));
</script>

<PDoc id="journal" eyebrow="Journal" title="Chronik der Kampagne" subtitle="{journal.length} Einträge in {chapters.length} Kapiteln. Daten ohne festen Termin sind aus den Zeitstempeln der Dokumente abgeleitet (siehe „Datierung“).">
	{#if chapters.length > 1}
		<nav class="chapter-toc avoid">
			<div class="label">Kapitel</div>
			<ol>
				{#each chapters as c (c.id)}
					<li><a href="#{c.id}"><b>{c.label}</b> <span class="soft">{c.titles.join(' · ')}</span></a><span class="pg num">{pages[c.id] ?? ''}</span></li>
				{/each}
			</ol>
		</nav>
	{/if}
	{#each journal as j (j.id)}
		{@const head = heads.get(j.id)}
		{#if head}
			<h2 class="chapter-head" id={head.id}>{head.label}<span class="count">{head.titles.length} {head.titles.length === 1 ? 'Eintrag' : 'Einträge'}</span></h2>
		{/if}
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
				{#if j.images?.length}
					<div class="journal-imgs avoid" class:two={j.images.length > 1}>
						{#each j.images as im (im.file)}
							<figure><PImg name={im.file} alt={im.caption} /><figcaption class="tiny muted">{im.caption} · KI-Bild</figcaption></figure>
						{/each}
					</div>
				{/if}
				<ul class="bullets">{#each j.events as e (e)}<li><PMd src={e} inline /></li>{/each}</ul>
				<div class="grid g2 small" style="gap: 1mm 4mm">
					{#if j.places?.length}<div><span class="label">Orte</span> {#each j.places as p (p)}<span class="tag"><PMd src={`[[${p}]]`} inline /></span>{/each}</div>{/if}
					{#if j.people?.length}<div><span class="label">Personen</span> {#each j.people as p (p)}<span class="tag"><PMd src={`[[${p}]]`} inline /></span>{/each}</div>{/if}
					{#if j.loot?.length}<div><span class="label">Beute</span> {#each j.loot as l, i (l)}{i ? ' · ' : ''}<PMd src={l} inline />{/each}</div>{/if}
					{#if j.lost?.length}<div><span class="label">Verloren</span> {#each j.lost as l, i (l)}{i ? ' · ' : ''}<PMd src={l} inline />{/each}</div>{/if}
					{#if j.encounters?.length}<div><span class="label">Gegner</span> {#each j.encounters as l, i (l)}{i ? ' · ' : ''}<PMd src={l} inline />{/each}</div>{/if}
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

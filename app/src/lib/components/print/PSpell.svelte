<script lang="ts">
	import PMd from './PMd.svelte';
	import type { Spell } from '$lib/types';
	import { campaign } from '$lib/stores/campaign.svelte';
	import { printAnchor } from '$lib/markdown';
	import { SCHOOL_PRINT } from '$lib/print';

	let { spell: sp }: { spell: Spell } = $props();

	const sources = $derived(campaign.data.sources);
	const docTitle = (id: string) => sources.find((x) => x.id === id)?.title ?? id;
	const grade = $derived(sp.level === 0 ? 'Zaubertrick' : `Grad ${sp.level}`);
</script>

<article class="spell" id={printAnchor(`spell:${sp.id}`)} style="--c: {SCHOOL_PRINT[sp.school] ?? 'var(--p-accent)'}">
	<div class="spell-top">
		<div class="spell-head">
			<div class="spread">
				<span class="spell-name">{sp.name}</span>
				<span class="pill" style="--c: {SCHOOL_PRINT[sp.school] ?? 'var(--p-accent)'}">{grade} · {sp.school}</span>
			</div>
			<div class="tiny muted" style="margin-top: 0.4mm">
				{sp.en}{#if sp.ritual} · <b>Ritual</b>{/if}{#if sp.concentration} · <b>Konzentration</b>{/if}
				{#if sp.status === 'buch'}
					{#if sp.level === 0}
						· immer bereit
					{:else}
						· <span class="cb" style="width: 2.6mm; height: 2.6mm; vertical-align: -0.4mm; {sp.prepared ? 'background: var(--p-ink)' : ''}"></span> vorbereitet
					{/if}
				{:else if sp.status === 'vorschlag'}
					· <b style="color: var(--p-life)">Vorschlag, nicht im Buch</b>
				{/if}
			</div>
		</div>
		<dl class="spell-meta">
			<dt>Zeitaufwand</dt><dd>{sp.time}</dd>
			{#if sp.trigger}<dt>Auslöser</dt><dd><PMd src={sp.trigger} inline /></dd>{/if}
			<dt>Reichweite</dt><dd>{sp.range}</dd>
			{#if sp.target}<dt>Ziel</dt><dd>{sp.target}</dd>{/if}
			{#if sp.area}<dt>Fläche</dt><dd>{sp.area}</dd>{/if}
			<dt>Komponenten</dt><dd>{sp.components}</dd>
			<dt>Wirkungsdauer</dt><dd>{sp.duration}</dd>
			{#if sp.attack}<dt>Angriff</dt><dd>{sp.attack}</dd>{/if}
			{#if sp.save}<dt>Rettungswurf</dt><dd>{sp.save}</dd>{/if}
			{#if sp.damage}<dt>Wirkung</dt><dd>{sp.damage}</dd>{/if}
		</dl>
	</div>

	<PMd src={sp.text} />
	{#if sp.higher}<p><b>Auf höheren Graden.</b> <PMd src={sp.higher} inline /></p>{/if}

	{#if sp.valerius}
		<div class="for-val"><div class="label">Für Valerius</div><PMd src={sp.valerius} /></div>
	{/if}
	{#if sp.why}
		<div class="for-val">
			<div class="label">Warum dieser Zauber{sp.slot ? ` · passt in ${sp.slot}` : ''}</div>
			<PMd src={sp.why} />
		</div>
	{/if}

	{#if sp.tips?.length}
		<h4>Tipps</h4>
		<ul class="bullets">{#each sp.tips as t (t)}<li><PMd src={t} inline /></li>{/each}</ul>
	{/if}
	{#if sp.uses?.length}
		<h4>Einsatzideen</h4>
		<ul class="bullets">{#each sp.uses as t (t)}<li><PMd src={t} inline /></li>{/each}</ul>
	{/if}
	{#if sp.rulings?.length}
		<h4>Regelklärungen</h4>
		<ul class="bullets">{#each sp.rulings as t (t)}<li><PMd src={t} inline /></li>{/each}</ul>
	{/if}
	{#if sp.synergies?.length}
		<h4>Synergien</h4>
		<ul class="bullets">{#each sp.synergies as r (r.with)}<li><b><PMd src={`[[${r.with}]]`} inline /></b>: <PMd src={r.text} inline /></li>{/each}</ul>
	{/if}
	{#if sp.conflicts?.length}
		<h4>Konflikte</h4>
		<ul class="bullets">{#each sp.conflicts as r (r.with)}<li><b><PMd src={`[[${r.with}]]`} inline /></b>: <PMd src={r.text} inline /></li>{/each}</ul>
	{/if}
	{#if sp.corrections?.length}
		<h4>Korrekturen</h4>
		<ul class="bullets">{#each sp.corrections as k (k.text)}<li><span class="muted">{docTitle(k.doc)}:</span> <PMd src={k.text} inline /></li>{/each}</ul>
	{/if}
	{#if sp.note}<div class="box-soft small" style="margin-top: 1.6mm"><PMd src={sp.note} /></div>{/if}
	<p class="tiny muted" style="margin: 1.4mm 0 0">
		{sp.source ?? ''}{#if sp.docs?.length} · Dokumente: {sp.docs.map(docTitle).join(', ')}{/if}
	</p>
</article>

<script lang="ts">
	import PImg from './PImg.svelte';
	import { campaign } from '$lib/stores/campaign.svelte';

	/** pages: Seitenzahlen je Teil aus dem ersten Durchlauf von npm run druck (leer im Browser) */
	let { toc, pages = {} }: { toc: { id: string; label: string }[]; pages?: Record<string, number> } = $props();

	const c = $derived(campaign.data.character);
	const today = new Date().toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });
</script>

<section class="sheet cover-sheet" id="doc-deckblatt">
	<div class="cover">
		<div class="cover-frame"></div>
		<div class="eyebrow">Grimoire · D&amp;D 5e</div>
		<PImg class="cover-portrait" name={c.portrait} />
		<div class="cover-title">{c.name}</div>
		<div class="cover-sub">
			{c.race} · {c.className} {c.level} · {c.subclass}{#if c.alias}<br />als „{c.alias}“{c.aliasTitle ? `, ${c.aliasTitle}` : ''}{/if}
		</div>
		<div class="cover-ornament">✦ ✦ ✦</div>
		{#if toc.length}
			<ol class="cover-toc" style="grid-template-rows: repeat({Math.ceil(toc.length / 2)}, auto)">
				{#each toc as t, i (t.id)}
					<li><span class="n">{String(i + 1).padStart(2, '0')}</span><a href="#doc-{t.id}">{t.label}</a><span class="pg num">{pages[t.id] ?? ''}</span></li>
				{/each}
			</ol>
		{/if}
		<div class="cover-foot">Stand {today} · Spieler: {c.player ?? '—'} · Daten aus campaign/</div>
	</div>
</section>

<script lang="ts">
	import PDoc from './PDoc.svelte';
	import PMd from './PMd.svelte';
	import PImg from './PImg.svelte';
	import { campaign } from '$lib/stores/campaign.svelte';
	import type { MapPin } from '$lib/types';

	const map = $derived(campaign.data.map);

	const KINDS: Record<MapPin['kind'], { label: string; color: string }> = {
		ziel: { label: 'Ziel', color: '#b4233a' },
		gefahr: { label: 'Gefahr', color: '#a35f00' },
		bestie: { label: 'Bestien', color: '#c2410c' },
		ort: { label: 'Ort', color: '#17805a' },
		unklar: { label: 'Ungedeutet', color: '#6b6780' },
		eigen: { label: 'Eigene', color: '#5b47d6' }
	};
</script>

<PDoc id="karte" refs={['page:karte']} eyebrow="Karte" title={map.title} subtitle="Nummern auf der Karte entsprechen der Liste darunter.">
	<div class="map avoid" style="width: 120mm; margin: 0 auto">
		<PImg name={map.image} alt={map.title} />
		{#each map.pins as p, i (p.id)}
			<span class="pin" style="left: {p.x}%; top: {p.y}%; --c: {KINDS[p.kind]?.color}">{i + 1}</span>
		{/each}
	</div>
	<p class="small soft" style="margin-top: 3mm"><PMd src={map.note} inline /></p>
	<div class="row small" style="flex-wrap: wrap; gap: 1mm 4mm; margin-bottom: 2mm">
		{#each Object.entries(KINDS) as [k, v] (k)}<span><span style="color: {v.color}">●</span> {v.label}</span>{/each}
	</div>
	<div class="cols-3">
		{#each map.pins as p, i (p.id)}
			<div class="avoid small" style="margin-bottom: 2mm; line-height: 1.38">
				<b class="num" style="color: {KINDS[p.kind]?.color}">{i + 1}</b>
				<b>{p.label}</b>{#if p.uncertain} <span class="muted">(unsicher)</span>{/if}
				<span class="tiny muted">· {KINDS[p.kind]?.label}</span>
				<div class="soft"><PMd src={p.text} inline /></div>
				{#if p.link}<div class="tiny">→ <PMd src={`[[${p.link}]]`} inline /></div>{/if}
			</div>
		{/each}
	</div>
</PDoc>

<script lang="ts">
	import PDoc from './PDoc.svelte';
	import { campaign } from '$lib/stores/campaign.svelte';
	import { SOURCE_STATUS, dateDe } from '$lib/print';

	const sources = $derived(campaign.data.sources);
	const groups = $derived([...new Set(sources.map((s) => s.group))]);
	const COLOR: Record<string, string> = { kanon: '#17805a', referenz: '#2563a8', teilweise: '#a35f00', veraltet: '#6b6780', gemini: '#b02a74' };
</script>

<PDoc id="quellen" eyebrow="Archiv" title="Quellenverzeichnis" subtitle="Alle Originale aus Google Drive mit Stand und Bewertung. Die Links führen zu den Dokumenten.">
	<div class="row small" style="flex-wrap: wrap; gap: 1mm 4mm; margin-bottom: 2mm">
		{#each Object.entries(SOURCE_STATUS) as [k, v] (k)}<span><span class="pill" style="--c: {COLOR[k]}">{v.label}</span> <span class="muted tiny">{v.hint}</span></span>{/each}
	</div>
	{#each groups as g (g)}
		<h2>{g}</h2>
		<table>
			<thead><tr><th style="width: 30%">Dokument</th><th style="width: 15%">Bewertung</th><th style="width: 12%">Stand</th><th>Inhalt und Fehler</th></tr></thead>
			<tbody>
				{#each sources.filter((s) => s.group === g) as s (s.id)}
					<tr>
						<td><a href={s.url}><b>{s.title}</b></a><div class="tiny muted">{s.kind === 'bild' ? 'Bild' : 'Dokument'}</div></td>
						<td><span class="pill" style="--c: {COLOR[s.status]}">{SOURCE_STATUS[s.status]?.label}</span></td>
						<td class="num small">{dateDe(s.modified)}</td>
						<td class="small">{s.summary}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{/each}
</PDoc>

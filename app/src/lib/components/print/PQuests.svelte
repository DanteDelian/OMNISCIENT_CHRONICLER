<script lang="ts">
	import PDoc from './PDoc.svelte';
	import PMd from './PMd.svelte';
	import { campaign } from '$lib/stores/campaign.svelte';
	import { printAnchor } from '$lib/markdown';
	import type { Quest } from '$lib/types';

	const quests = $derived(campaign.data.quests);
	const journal = $derived(campaign.data.journal);

	const SECTIONS: { id: string; label: string; hint: string; filter: (q: Quest) => boolean; color: string }[] = [
		{ id: 'dringend', label: 'Dringend', hint: 'Zuerst angehen', filter: (q) => q.status === 'aktiv' && !!q.urgent, color: 'var(--p-blood)' },
		{ id: 'aktiv', label: 'Aktiv', hint: 'Laufende Ziele', filter: (q) => q.status === 'aktiv' && !q.urgent, color: 'var(--p-accent)' },
		{ id: 'geruecht', label: 'Gerüchte und Erkundung', hint: 'Noch nicht angegangen', filter: (q) => q.status === 'geruecht', color: 'var(--p-info)' },
		{ id: 'erledigt', label: 'Erledigt', hint: '', filter: (q) => q.status === 'erledigt', color: 'var(--p-life)' },
		{ id: 'gescheitert', label: 'Gescheitert', hint: '', filter: (q) => q.status === 'gescheitert', color: 'var(--p-ink-3)' }
	];

	/** Journal-Einträge, die die Quest erwähnen (Verlauf). */
	function history(q: Quest) {
		return journal.filter((j) => j.quests?.some((x) => x.ref === q.id)).map((j) => ({ title: j.title, date: j.dateLabel, change: j.quests?.find((x) => x.ref === q.id)?.change ?? '' }));
	}
</script>

<PDoc
	id="quests"
	eyebrow="Quests"
	title="Ziele und Aufträge"
	subtitle="{quests.filter((q) => q.status === 'aktiv').length} aktiv · {quests.filter((q) => q.status === 'geruecht').length} Gerüchte · {quests.filter((q) => q.status === 'erledigt').length} erledigt · {quests.filter((q) => q.status === 'gescheitert').length} gescheitert"
>
	{#each SECTIONS as sec (sec.id)}
		{@const list = quests.filter(sec.filter)}
		{#if list.length}
			<h2 style="color: {sec.color}">{sec.label} <span class="count">{list.length}{sec.hint ? ` · ${sec.hint}` : ''}</span></h2>
			<div class="cols-2">
				{#each list as q (q.id)}
					{@const h = history(q)}
					<div class="avoid" id={printAnchor(`quest:${q.id}`)} style="margin-bottom: 3.2mm; border-left: 1.6pt solid {sec.color}; padding-left: 2.6mm">
						<div class="spread">
							<b style="font-size: 10pt">{q.title}</b>
							<span class="cb" style="flex: none"></span>
						</div>
						<div class="tiny muted">{[q.kind, q.giver ? `von ${q.giver}` : ''].filter(Boolean).join(' · ')}</div>
						{#if q.next}<p class="small" style="margin: 0.8mm 0 0"><span class="label">Nächster Schritt</span> <PMd src={q.next} inline /></p>{/if}
						{#if q.reward}<p class="small" style="margin: 0.8mm 0 0"><span class="label">Lohn</span> <PMd src={q.reward} inline /></p>{/if}
						{#if q.notes}<div class="small soft" style="margin-top: 0.8mm"><PMd src={q.notes} /></div>{/if}
						{#if q.links?.length}<div style="margin-top: 0.6mm">{#each q.links as l (l)}<span class="tag"><PMd src={`[[${l}]]`} inline /></span>{/each}</div>{/if}
						{#if h.length}
							<div class="tiny muted" style="margin-top: 0.6mm">Verlauf: {h.map((x) => `${x.title} (${x.date}${x.change ? `, ${x.change}` : ''})`).join(' · ')}</div>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	{/each}
</PDoc>

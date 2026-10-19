<script lang="ts">
	import PDoc from './PDoc.svelte';
	import PMd from './PMd.svelte';
	import FamilyTree from '../FamilyTree.svelte';
	import { campaign } from '$lib/stores/campaign.svelte';
	import { printAnchor } from '$lib/markdown';
	import { TONE_PRINT, WORLD_GROUPS } from '$lib/print';

	const world = $derived(campaign.data.world);
	const backlinks = $derived(campaign.data.backlinks);
	const trees = $derived(campaign.data.trees);
	const KIND: Record<string, string> = { person: 'Person', fraktion: 'Fraktion', ort: 'Ort' };

	/** Der erste #-Titel im Text wiederholt nur den Namen. */
	const body = (md: string) => md.replace(/^#\s+.*\n+/, '');
</script>

<PDoc id="welt" eyebrow="Welt" title="Personen, Fraktionen, Orte" subtitle="{world.length} Einträge mit Status, Einschätzung und Rückverweisen.">
	{#each WORLD_GROUPS as g (g.id)}
		{@const list = world.filter((w) => w.group === g.id).sort((a, b) => (a.kind === b.kind ? a.name.localeCompare(b.name, 'de') : a.kind.localeCompare(b.kind)))}
		{#if list.length}
			<h2>{g.label} <span class="count">{list.length}</span></h2>
			{#each trees.filter((t) => world.find((w) => w.slug === t.world)?.group === g.id) as tree (tree.id)}
				<figure class="tree-fig avoid">
					<FamilyTree {tree} print />
					<figcaption class="tiny soft"><b>{tree.title}.</b> <PMd src={tree.note ?? ''} inline /></figcaption>
				</figure>
			{/each}
			<div class="cols-2">
				{#each list as w (w.slug)}
					{@const tone = TONE_PRINT[w.tone]}
					{@const back = backlinks[`world:${w.slug}`] ?? []}
					<article id={printAnchor(`world:${w.slug}`)} style="margin-bottom: 4mm">
						<div class="avoid">
							<div class="spread" style="border-top: 1.6pt solid {tone.color}; padding-top: 1.2mm">
								<b style="font-size: 10.5pt">{w.name}</b>
								<span class="pill" style="--c: {tone.color}">{tone.label}</span>
							</div>
							<div class="tiny muted">{KIND[w.kind] ?? w.kind}{w.status ? ` · ${w.status}` : ''}{w.aliases.length ? ` · auch: ${w.aliases.join(', ')}` : ''}</div>
							{#if w.summary}<p class="small soft" style="font-style: italic; margin: 0.8mm 0 1mm">{w.summary}</p>{/if}
						</div>
						<PMd src={body(w.body)} class="small" />
						{#if back.length}<div class="tiny muted">Erwähnt in: {back.map((b) => b.title).join(', ')}</div>{/if}
					</article>
				{/each}
			</div>
		{/if}
	{/each}
</PDoc>

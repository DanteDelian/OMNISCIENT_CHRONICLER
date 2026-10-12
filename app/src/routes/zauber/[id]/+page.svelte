<script lang="ts">
	import { page } from '$app/state';
	import { ArrowLeft, ChevronLeft, ChevronRight } from '@lucide/svelte';
	import SpellDetail from '$lib/components/SpellDetail.svelte';
	import { campaign } from '$lib/stores/campaign.svelte';

	const all = $derived(campaign.data.spells);
	const spell = $derived(all.find((s) => s.id === page.params.id));
	// Reihenfolge wie im Zauberbuch: erst das Buch, dann Klärungsfälle, dann Vorschläge.
	const ordered = $derived(
		[...all].sort((a, b) => {
			const rank = { buch: 0, frage: 1, vorschlag: 2 } as const;
			return rank[a.status] - rank[b.status] || a.level - b.level || a.name.localeCompare(b.name);
		})
	);
	const idx = $derived(ordered.findIndex((s) => s.id === page.params.id));
	const prev = $derived(idx > 0 ? ordered[idx - 1] : null);
	const next = $derived(idx >= 0 && idx < ordered.length - 1 ? ordered[idx + 1] : null);
</script>

<svelte:head><title>{spell?.name ?? 'Zauber'} · Zauberbuch</title></svelte:head>

<div class="mx-auto max-w-5xl">
	<div class="mb-5 flex items-center justify-between gap-2">
		<a class="btn btn-sm btn-ghost" href="/zauber"><ArrowLeft size={14} />Zauberbuch</a>
		<div class="flex gap-2">
			{#if prev}<a class="btn btn-sm" href="/zauber/{prev.id}" title={prev.name}><ChevronLeft size={14} /><span class="hidden sm:inline">{prev.name}</span></a>{/if}
			{#if next}<a class="btn btn-sm" href="/zauber/{next.id}" title={next.name}><span class="hidden sm:inline">{next.name}</span><ChevronRight size={14} /></a>{/if}
		</div>
	</div>

	{#if spell}
		<SpellDetail {spell} />
	{:else}
		<div class="panel p-10 text-center text-ink-2">Diesen Zauber gibt es nicht im Grimoire.</div>
	{/if}
</div>

<script lang="ts">
	import { BookMarked, Brain, Clock, Crosshair, Hourglass } from '@lucide/svelte';
	import { campaign } from '$lib/stores/campaign.svelte';
	import { SCHOOL_COLOR } from '$lib/rules';
	import { stripMd } from '$lib/refs';
	import type { Spell } from '$lib/types';

	let { spell }: { spell: Spell } = $props();

	const summary = $derived(spell.summary ?? stripMd(spell.text).split(/(?<=[.!?])\s/)[0]);
	const color = $derived(SCHOOL_COLOR[spell.school] ?? 'var(--color-ink-2)');

	function togglePrepared(e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		campaign.change('spells', (list) => {
			const s = list.find((x) => x.id === spell.id);
			if (s) s.prepared = !s.prepared;
		});
	}
</script>

<a href="/zauber/{spell.id}" class="panel panel-hover group relative flex flex-col overflow-hidden p-4" data-ref="spell:{spell.id}">
	<span class="absolute inset-y-0 left-0 w-1" style="background: {color}"></span>
	<div class="flex items-start justify-between gap-2">
		<div class="min-w-0">
			<h3 class="truncate text-[1.02rem] font-semibold group-hover:text-astral">{spell.name}</h3>
			<p class="truncate text-xs text-ink-3 italic">{spell.en}</p>
		</div>
		{#if spell.status === 'buch' && spell.level > 0}
			<button
				class="grid h-8 w-8 shrink-0 place-items-center rounded-lg border transition {spell.prepared ? 'border-astral/50 bg-astral/15 text-astral' : 'border-line text-ink-3 hover:text-ink'}"
				onclick={togglePrepared}
				title={spell.prepared ? 'Vorbereitet (klicken = entfernen)' : 'Nicht vorbereitet (klicken = vorbereiten)'}
				aria-label="Vorbereitet umschalten"
			>
				<BookMarked size={15} />
			</button>
		{/if}
	</div>

	<div class="mt-2 flex flex-wrap gap-1.5">
		<span class="badge" style="--c: {color}">{spell.school}</span>
		{#if spell.ritual}<span class="badge" style="--c: var(--color-gold)">Ritual</span>{/if}
		{#if spell.concentration}<span class="badge" style="--c: var(--color-warn)"><Brain size={10} />K</span>{/if}
		{#if spell.economy === 'reaktion'}<span class="badge" style="--c: var(--color-astral-2)">Reaktion</span>{/if}
		{#if spell.economy === 'bonus'}<span class="badge" style="--c: var(--color-astral-2)">Bonus</span>{/if}
		{#if spell.status === 'frage'}<span class="badge" style="--c: var(--color-warn)">klären</span>{/if}
		{#if spell.status === 'vorschlag'}<span class="badge" style="--c: var(--color-life)">Vorschlag</span>{/if}
	</div>

	<p class="mt-2.5 line-clamp-3 flex-1 text-[0.84rem] leading-relaxed text-ink-2">{summary}</p>

	<div class="mt-3 flex flex-wrap gap-x-3 gap-y-1 border-t border-line pt-2.5 text-[0.72rem] text-ink-3">
		<span class="flex items-center gap-1"><Clock size={11} />{spell.time}</span>
		<span class="flex items-center gap-1"><Crosshair size={11} />{spell.range.replace(/\s*\(.*?\)/, '')}</span>
		<span class="flex items-center gap-1"><Hourglass size={11} />{spell.duration.replace('Konzentration, ', 'K, ')}</span>
	</div>
</a>

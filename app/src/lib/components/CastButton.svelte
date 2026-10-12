<script lang="ts">
	/** „Wirken“: verbraucht den passenden Zauberplatz, setzt Konzentration und Schild. */
	import { ChevronDown, Wand2, Hourglass } from '@lucide/svelte';
	import { campaign } from '$lib/stores/campaign.svelte';
	import { castSpell } from '$lib/game';
	import { lowestFreeSlot, slotTotals, slotsLeft } from '$lib/rules';
	import type { Spell } from '$lib/types';

	let { spell, size = 'sm' }: { spell: Spell; size?: 'sm' | 'xs' } = $props();
	let open = $state(false);

	const c = $derived(campaign.data.character);
	const s = $derived(campaign.data.state);
	const free = $derived(spell.level > 0 ? lowestFreeSlot(c, s, spell.level) : null);
	const higher = $derived(slotTotals(c).filter((x) => x.level >= spell.level && x.level > 0));
	const canSlot = $derived(spell.level === 0 || (!!spell.prepared && free !== null));
</script>

<div class="relative inline-flex gap-1">
	{#if spell.level === 0}
		<button class="btn btn-{size} btn-primary" onclick={() => castSpell(spell, null)}><Wand2 size={13} />Wirken</button>
	{:else}
		{#if spell.prepared}
			<div class="inline-flex">
				<button class="btn btn-{size} btn-primary !rounded-r-none" disabled={!canSlot} onclick={() => castSpell(spell, free)}>
					<Wand2 size={13} />{free === null ? 'Kein Platz frei' : `Wirken · Grad ${free}`}
				</button>
				<button class="btn btn-{size} btn-primary !rounded-l-none !px-1.5 border-l border-black/20" disabled={!canSlot} onclick={() => (open = !open)} aria-label="Höheren Grad wählen">
					<ChevronDown size={13} />
				</button>
			</div>
		{/if}
		{#if spell.ritual}
			<button class="btn btn-{size}" onclick={() => castSpell(spell, null, true)} title="Ohne Zauberplatz, Wirkzeit +10 Minuten">
				<Hourglass size={13} />Als Ritual
			</button>
		{/if}
		{#if !spell.prepared && !spell.ritual}
			<span class="text-xs text-ink-3">Nicht vorbereitet</span>
		{/if}
	{/if}

	{#if open}
		<div class="panel absolute top-full left-0 z-30 mt-1 w-48 p-1.5">
			{#each higher as h (h.level)}
				{@const left = slotsLeft(c, s, h.level)}
				<button
					class="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-sm hover:bg-white/[0.06] disabled:opacity-40"
					disabled={left <= 0}
					onclick={() => {
						castSpell(spell, h.level);
						open = false;
					}}
				>
					<span>Grad {h.level}</span><span class="num text-xs text-ink-3">{left} frei</span>
				</button>
			{/each}
		</div>
	{/if}
</div>

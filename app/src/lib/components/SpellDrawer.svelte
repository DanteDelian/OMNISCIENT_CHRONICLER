<script lang="ts">
	/** Rechte Schublade: Zauber nachlesen, ohne den Spieltisch zu verlassen. */
	import { fade, fly } from 'svelte/transition';
	import { ArrowUpRight, X } from '@lucide/svelte';
	import { campaign } from '$lib/stores/campaign.svelte';
	import { ui } from '$lib/stores/ui.svelte';
	import SpellDetail from './SpellDetail.svelte';

	const spell = $derived(ui.spellDrawer ? campaign.data.spells.find((s) => s.id === ui.spellDrawer) : null);
</script>

{#if spell}
	<div class="fixed inset-0 z-[55]">
		<button class="absolute inset-0 bg-black/50" aria-label="Schließen" onclick={() => (ui.spellDrawer = null)} transition:fade={{ duration: 120 }}></button>
		<aside
			class="absolute inset-y-0 right-0 w-full max-w-[560px] overflow-y-auto border-l border-line bg-bg-2/95 p-6 backdrop-blur-xl"
			transition:fly={{ x: 560, duration: 200 }}
			aria-label="Zauberdetails"
		>
			<div class="mb-4 flex items-center justify-between">
				<a class="chip" href="/zauber/{spell.id}" onclick={() => (ui.spellDrawer = null)}><ArrowUpRight size={13} />Ganze Seite</a>
				<button class="icon-btn" onclick={() => (ui.spellDrawer = null)} aria-label="Schließen"><X size={18} /></button>
			</div>
			<SpellDetail {spell} compact />
		</aside>
	</div>
{/if}

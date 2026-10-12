<script lang="ts">
	import { Sparkles, RotateCcw } from '@lucide/svelte';
	import Pips from '../Pips.svelte';
	import { campaign } from '$lib/stores/campaign.svelte';
	import { ui } from '$lib/stores/ui.svelte';
	import { toggleFeatureUse, toggleSlot, useFeature } from '$lib/game';
	import { featureLeft, hitDiceLeft, slotTotals, slotsLeft } from '$lib/rules';

	const c = $derived(campaign.data.character);
	const s = $derived(campaign.data.state);
	const tracked = $derived(c.features.filter((f) => f.uses && !f.upcoming));
	const LEVEL_COLOR = ['', 'var(--color-astral-2)', 'var(--color-astral)', '#e879f9'];
</script>

<section class="panel p-5">
	<div class="mb-3 flex items-center justify-between">
		<div class="eyebrow">Zauberplätze</div>
		<button class="btn btn-xs btn-ghost text-ink-3" onclick={() => (ui.rest = 'kurz')} title="Kurze Rast: Arkane Erholung">
			<RotateCcw size={12} />Arkane Erholung
		</button>
	</div>
	<div class="space-y-3">
		{#each slotTotals(c) as sl (sl.level)}
			{@const left = slotsLeft(c, s, sl.level)}
			<div class="flex items-center gap-3">
				<span class="w-14 text-sm text-ink-2">Grad {sl.level}</span>
				<div class="flex-1">
					<Pips total={sl.total} {left} color={LEVEL_COLOR[sl.level]} label="Grad {sl.level}" ontoggle={(full) => toggleSlot(sl.level, full)} />
				</div>
				<span class="num text-sm {left === 0 ? 'text-blood' : 'text-ink-2'}">{left}/{sl.total}</span>
			</div>
		{/each}
	</div>

	<div class="my-4 border-t border-line"></div>
	<div class="eyebrow mb-3">Kräfte</div>
	<div class="space-y-3">
		{#each tracked as f (f.id)}
			{@const left = featureLeft(c, s, f.id)}
			<div class="flex items-center gap-3">
				<a class="w-[8.5rem] truncate text-sm text-ink-2 hover:text-ink" href="/bogen#{f.id}" data-ref="feature:{f.id}">{f.name}</a>
				<div class="flex-1">
					<Pips total={f.uses!.max} {left} color="var(--color-gold)" label={f.name} ontoggle={(full) => toggleFeatureUse(f.id, full)} />
				</div>
				{#if f.id === 'sternenschritt'}
					<button class="btn btn-xs" disabled={left <= 0} onclick={() => useFeature(f.id)} title="Bonusaktion: 9 m teleportieren"><Sparkles size={11} />Nutzen</button>
				{:else}
					<span class="num text-sm text-ink-2">{left}/{f.uses!.max}</span>
				{/if}
			</div>
		{/each}
		<div class="flex items-center gap-3">
			<span class="w-[8.5rem] text-sm text-ink-2">Trefferwürfel</span>
			<div class="flex-1"><Pips total={c.level} left={hitDiceLeft(c, s)} color="var(--color-life)" label="Trefferwürfel" size="sm" /></div>
			<span class="num text-sm text-ink-2">{hitDiceLeft(c, s)}W{c.hp.hitDie}</span>
		</div>
	</div>
</section>

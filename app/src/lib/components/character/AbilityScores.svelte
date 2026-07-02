<script lang="ts">
	import { character } from '$lib/stores/character.svelte';
	import { ABILITY_KEYS, ABILITY_LABELS, abilityMod, fmtMod, type AbilityKey } from '$lib/types';
	import { performCheck } from '$lib/rolls';
	import Dices from '@lucide/svelte/icons/dices';

	const c = $derived(character.current);

	function setScore(key: AbilityKey, v: number) {
		if (!c) return;
		character.patch({ abilities: { [key]: Math.max(1, Math.min(30, v || 10)) } });
	}

	function rollCheck(key: AbilityKey) {
		if (!c) return;
		performCheck(`${ABILITY_LABELS[key]}-Probe`, abilityMod(c.abilities[key]));
	}
</script>

{#if c}
	<div class="grid grid-cols-3 gap-2 sm:gap-3">
		{#each ABILITY_KEYS as key (key)}
			{@const mod = abilityMod(c.abilities[key])}
			<div class="stat-tile gap-1">
				<span class="text-[11px] font-semibold uppercase tracking-wide text-muted">
					{ABILITY_LABELS[key].slice(0, 3)}
				</span>
				<button
					class="font-display text-2xl font-bold leading-none transition hover:text-primary"
					onclick={() => rollCheck(key)}
					title="Probe würfeln (1d20 {fmtMod(mod)})"
				>
					{fmtMod(mod)}
				</button>
				<input
					class="w-12 rounded-md bg-transparent text-center text-sm tabular-nums text-muted outline-none focus:bg-surface"
					type="number"
					value={c.abilities[key]}
					onchange={(e) => setScore(key, +e.currentTarget.value)}
					aria-label={ABILITY_LABELS[key]}
				/>
			</div>
		{/each}
	</div>
	<p class="mt-2 flex items-center gap-1 text-xs text-muted">
		<Dices class="h-3.5 w-3.5" /> Modifier antippen, um eine Probe zu würfeln · Zahl ändern zum Bearbeiten
	</p>
{/if}

<script lang="ts">
	import { character } from '$lib/stores/character.svelte';
	import type { SpellSlot } from '$lib/types';
	import Plus from '@lucide/svelte/icons/plus';
	import Sparkles from '@lucide/svelte/icons/sparkles';

	const c = $derived(character.current);

	function update(slots: SpellSlot[]) {
		character.patch({ spellSlots: slots });
	}

	function usePip(level: number, i: number) {
		if (!c) return;
		const slots = c.spellSlots.map((s) =>
			s.level === level ? { ...s, used: s.used === i + 1 ? i : i + 1 } : s
		);
		update(slots);
	}

	function changeTotal(level: number, d: number) {
		if (!c) return;
		const slots = c.spellSlots
			.map((s) =>
				s.level === level
					? { ...s, total: Math.max(0, s.total + d), used: Math.min(s.used, Math.max(0, s.total + d)) }
					: s
			)
			.filter((s) => s.total > 0);
		update(slots);
	}

	function addLevel() {
		if (!c) return;
		const next = (c.spellSlots.reduce((m, s) => Math.max(m, s.level), 0) || 0) + 1;
		update([...c.spellSlots, { level: next, total: 1, used: 0 }].sort((a, b) => a.level - b.level));
	}
</script>

{#if c}
	{#if c.spellSlots.length === 0}
		<p class="text-sm text-muted">Keine Zauberplätze.</p>
	{/if}
	<div class="flex flex-col gap-2.5">
		{#each c.spellSlots as slot (slot.level)}
			<div class="flex items-center gap-2">
				<span class="w-14 shrink-0 text-sm font-semibold">Grad {slot.level}</span>
				<div class="flex flex-1 flex-wrap items-center gap-1.5">
					{#each Array(slot.total) as _, i (i)}
						<button
							class="h-5 w-5 rounded-md border-2 border-primary transition
								{slot.used > i ? 'bg-transparent opacity-40' : 'bg-primary'}"
							onclick={() => usePip(slot.level, i)}
							aria-label="Platz {i + 1}"
						></button>
					{/each}
				</div>
				<div class="flex items-center gap-1">
					<button class="btn btn-icon !h-7 !w-7 text-xs" onclick={() => changeTotal(slot.level, -1)}>−</button>
					<button class="btn btn-icon !h-7 !w-7 text-xs" onclick={() => changeTotal(slot.level, 1)}>+</button>
				</div>
			</div>
		{/each}
	</div>
	<button class="btn mt-3 w-full text-sm" onclick={addLevel}>
		<Sparkles class="h-4 w-4" /> Grad hinzufügen
	</button>
{/if}

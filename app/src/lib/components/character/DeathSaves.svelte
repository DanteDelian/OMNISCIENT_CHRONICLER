<script lang="ts">
	import { character } from '$lib/stores/character.svelte';
	import Skull from '@lucide/svelte/icons/skull';

	const c = $derived(character.current);

	function setSaves(kind: 'successes' | 'failures', n: number) {
		if (!c) return;
		const clamped = Math.max(0, Math.min(3, n));
		character.patch({ deathSaves: { [kind]: clamped } });
	}

	function dot(kind: 'successes' | 'failures', i: number) {
		if (!c) return;
		const cur = c.deathSaves[kind];
		// Klick auf gefüllten höchsten Punkt = eins zurück
		setSaves(kind, cur === i + 1 ? i : i + 1);
	}
</script>

{#if c}
	<div class="flex items-center justify-between gap-4">
		<div class="flex items-center gap-2 text-sm font-medium">
			<Skull class="h-4 w-4 text-muted" /> Rettungswürfe
		</div>
		<div class="flex flex-col gap-1.5">
			<div class="flex items-center gap-1">
				<span class="w-16 text-right text-xs text-success">Erfolg</span>
				{#each [0, 1, 2] as i (i)}
					<button class="grid h-9 w-9 place-items-center" onclick={() => dot('successes', i)} aria-label="Erfolg {i + 1}">
						<span
							class="h-5 w-5 rounded-full border-2 border-success transition
								{c.deathSaves.successes > i ? 'bg-success' : 'bg-transparent'}"
						></span>
					</button>
				{/each}
			</div>
			<div class="flex items-center gap-1">
				<span class="w-16 text-right text-xs text-danger">Fehlschlag</span>
				{#each [0, 1, 2] as i (i)}
					<button class="grid h-9 w-9 place-items-center" onclick={() => dot('failures', i)} aria-label="Fehlschlag {i + 1}">
						<span
							class="h-5 w-5 rounded-full border-2 border-danger transition
								{c.deathSaves.failures > i ? 'bg-danger' : 'bg-transparent'}"
						></span>
					</button>
				{/each}
			</div>
		</div>
	</div>
{/if}

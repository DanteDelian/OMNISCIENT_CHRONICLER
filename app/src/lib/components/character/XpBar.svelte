<script lang="ts">
	import { character } from '$lib/stores/character.svelte';
	import { XP_THRESHOLDS } from '$lib/types';
	import Plus from '@lucide/svelte/icons/plus';

	const c = $derived(character.current);
	let adding = $state(false);
	let amount = $state(100);

	const floor = $derived(c ? (XP_THRESHOLDS[c.level - 1] ?? 0) : 0);
	const ceil = $derived(c ? (XP_THRESHOLDS[c.level] ?? null) : null);
	const progress = $derived.by(() => {
		if (!c || ceil === null) return 1;
		return Math.max(0, Math.min(1, (c.xp - floor) / Math.max(1, ceil - floor)));
	});

	function addXp() {
		if (!c || !amount) return;
		character.patch({ xp: Math.max(0, c.xp + Math.round(amount)) });
		adding = false;
	}

	const fmt = (n: number) => n.toLocaleString('de-DE');
</script>

{#if c}
	<div class="flex items-center gap-2">
		<div class="relative h-2.5 flex-1 overflow-hidden rounded-full bg-surface2" title="Erfahrungspunkte">
			<div
				class="h-full rounded-full transition-all duration-700"
				style="width:{progress * 100}%; background:linear-gradient(90deg, var(--color-accent), var(--color-primary))"
			></div>
		</div>
		{#if adding}
			<form
				class="flex items-center gap-1"
				onsubmit={(e) => {
					e.preventDefault();
					addXp();
				}}
			>
				<!-- svelte-ignore a11y_autofocus -->
				<input class="input !w-20 !py-0.5 text-center text-xs" type="number" bind:value={amount} autofocus />
				<button class="btn !px-2 !py-0.5 text-xs" type="submit">OK</button>
			</form>
		{:else}
			<button class="chip shrink-0 gap-1 !py-0.5 text-[11px]" onclick={() => (adding = true)} title="EP hinzufügen">
				<Plus class="h-3 w-3" />
				{fmt(c.xp)}{ceil !== null ? ` / ${fmt(ceil)}` : ''} EP
			</button>
		{/if}
	</div>
{/if}

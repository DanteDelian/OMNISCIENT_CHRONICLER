<script lang="ts">
	import { ambience, MOODS } from '$lib/stores/ambience.svelte';
	import Beer from '@lucide/svelte/icons/beer';
	import Compass from '@lucide/svelte/icons/compass';
	import Swords from '@lucide/svelte/icons/swords';
	import Moon from '@lucide/svelte/icons/moon';
	import VolumeX from '@lucide/svelte/icons/volume-x';
	import Volume2 from '@lucide/svelte/icons/volume-2';

	const ICONS = { tavern: Beer, travel: Compass, combat: Swords, rest: Moon } as const;
</script>

<div class="flex flex-col gap-3">
	<div class="grid grid-cols-2 gap-2">
		{#each MOODS as m (m.id)}
			{@const Icon = ICONS[m.id]}
			{@const active = ambience.mood === m.id}
			<button
				class="btn min-h-16 flex-col gap-1 {active ? '!border-primary/60 !bg-primary/15' : ''}"
				onclick={() => ambience.toggle(m.id)}
				aria-pressed={active}
			>
				<Icon class="h-5 w-5 {active ? 'text-primary' : 'text-muted'}" />
				<span class="text-xs font-semibold">{m.label}</span>
				<span class="text-[10px] text-muted">{m.hint}</span>
			</button>
		{/each}
	</div>

	<div class="flex items-center gap-2">
		{#if ambience.mood}
			<button class="btn btn-icon !h-9 !w-9" onclick={() => ambience.stop()} aria-label="Musik stoppen">
				<VolumeX class="h-4 w-4" />
			</button>
		{:else}
			<Volume2 class="ml-2 h-4 w-4 shrink-0 text-muted" />
		{/if}
		<input
			class="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-surface2 accent-[var(--color-primary)]"
			type="range"
			min="0"
			max="1"
			step="0.05"
			value={ambience.volume}
			oninput={(e) => ambience.setVolume(+e.currentTarget.value)}
			aria-label="Lautstärke"
		/>
	</div>
	<p class="text-[11px] text-muted">
		Generative Klangwelten — komplett offline synthetisiert, kein Loop, keine Dateien.
	</p>
</div>

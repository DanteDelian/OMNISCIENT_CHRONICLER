<script lang="ts">
	import { fly } from 'svelte/transition';
	import { rolls } from '$lib/stores/rolls.svelte';
	import { ui } from '$lib/stores/ui.svelte';
</script>

<div class="pointer-events-none fixed right-4 bottom-4 z-40 flex w-[320px] flex-col-reverse gap-2 {ui.dice ? 'opacity-0' : ''}" aria-live="polite">
	{#each rolls.toasts as t (t.id)}
		<button
			class="panel pointer-events-auto flex items-center gap-3 px-3.5 py-2.5 text-left"
			in:fly={{ x: 24, duration: 180 }}
			out:fly={{ x: 24, duration: 140 }}
			onclick={() => rolls.dismiss(t.id)}
		>
			{#if t.kind === 'event'}
				<span class="h-2 w-2 shrink-0 rounded-full {t.tone === 'good' ? 'bg-life' : t.tone === 'bad' ? 'bg-blood' : 'bg-astral'}"></span>
			{:else}
				<span
					class="num grid h-11 w-11 shrink-0 place-items-center rounded-xl text-xl font-semibold {t.crit === 'hit'
						? 'bg-life/15 text-life'
						: t.crit === 'miss'
							? 'bg-blood/15 text-blood'
							: 'bg-white/[0.06] text-ink'}">{t.total}</span
				>
			{/if}
			<span class="min-w-0">
				<span class="block truncate text-sm font-medium">{t.label}{t.crit === 'hit' ? ' · Natürliche 20!' : t.crit === 'miss' ? ' · Natürliche 1' : ''}</span>
				{#if t.detail}<span class="block truncate text-xs text-ink-3">{t.detail}</span>{/if}
			</span>
		</button>
	{/each}
</div>

<script lang="ts">
	import { fly } from 'svelte/transition';
	import { backOut } from 'svelte/easing';
	import { Undo2 } from '@lucide/svelte';
	import RollNumber from './RollNumber.svelte';
	import { campaign } from '$lib/stores/campaign.svelte';
	import { rolls, type LogEntry } from '$lib/stores/rolls.svelte';
	import { ui } from '$lib/stores/ui.svelte';

	/** Die Meldung gehört zum letzten Verlaufsschritt: Dann lässt er sich direkt hier zurücknehmen. */
	function undoable(t: LogEntry): boolean {
		const h = campaign.history.at(-1);
		return !!h && t.kind === 'event' && t.label !== 'Rückgängig' && Math.abs(h.at - t.at) < 1500;
	}
</script>

<div class="pointer-events-none fixed right-4 bottom-4 z-40 flex w-[min(340px,calc(100vw-2rem))] flex-col-reverse gap-2 {ui.dice ? 'opacity-0' : ''}" aria-live="polite">
	{#each rolls.toasts as t (t.id)}
		<div
			class="panel pointer-events-auto flex items-center gap-2 py-2.5 pr-2.5 pl-3.5 {t.crit === 'hit' ? 'toast-crit' : t.crit === 'miss' ? 'toast-fumble' : ''}"
			in:fly={{ x: 32, duration: 260, easing: backOut }}
			out:fly={{ x: 24, duration: 140 }}
		>
			<button class="flex min-w-0 flex-1 items-center gap-3 text-left" onclick={() => rolls.dismiss(t.id)} title="Ausblenden">
				{#if t.kind === 'event'}
					<span class="h-2 w-2 shrink-0 rounded-full {t.tone === 'good' ? 'bg-life' : t.tone === 'bad' ? 'bg-blood' : 'bg-astral'}"></span>
				{:else}
					<span
						class="num grid h-11 w-11 shrink-0 place-items-center rounded-xl text-xl font-semibold {t.crit === 'hit'
							? 'bg-gold/15 text-gold'
							: t.crit === 'miss'
								? 'bg-blood/15 text-blood'
								: 'bg-white/[0.06] text-ink'}"><RollNumber value={t.total ?? 0} range={t.range} /></span
					>
				{/if}
				<span class="min-w-0">
					<span class="block truncate text-sm font-medium">{t.label}{t.crit === 'hit' ? ' · Natürliche 20!' : t.crit === 'miss' ? ' · Natürliche 1' : ''}</span>
					{#if t.detail}<span class="block truncate text-xs text-ink-3">{t.detail}</span>{/if}
				</span>
			</button>
			{#if undoable(t)}
				<button
					class="btn btn-xs shrink-0"
					onclick={() => {
						campaign.undo();
						rolls.dismiss(t.id);
					}}
					title="Diesen Schritt zurücknehmen (Strg+Z)"><Undo2 size={11} />Zurück</button
				>
			{/if}
		</div>
	{/each}
</div>

<style>
	.toast-crit {
		border-color: color-mix(in oklab, var(--color-gold) 55%, transparent);
		animation: toast-glow 1.8s ease-out 0.5s;
	}
	.toast-fumble {
		border-color: color-mix(in oklab, var(--color-blood) 50%, transparent);
	}
	@keyframes toast-glow {
		30% {
			box-shadow: 0 0 28px color-mix(in oklab, var(--color-gold) 45%, transparent);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.toast-crit {
			animation: none;
		}
	}
</style>

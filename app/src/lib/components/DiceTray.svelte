<script lang="ts">
	/** Würfelschale (rechts unten): freie Würfe, Vorteil/Nachteil, Protokoll. */
	import { fly } from 'svelte/transition';
	import { X, Dices } from '@lucide/svelte';
	import { rolls } from '$lib/stores/rolls.svelte';
	import { ui } from '$lib/stores/ui.svelte';
	import { timeHM } from '$lib/format';

	let custom = $state('');
	const DICE = [4, 6, 8, 10, 12, 20, 100];

	function rollCustom() {
		const e = custom.trim();
		if (!e) return;
		if (/^[+-]?\d+$/.test(e)) rolls.check(`W20 ${e}`, Number(e));
		else rolls.damage(e.replace(/w/gi, 'd'), e.replace(/w/gi, 'd'));
	}
</script>

{#if ui.dice}
	<aside class="panel panel-glow fixed right-4 bottom-4 z-50 w-[360px] p-4" transition:fly={{ y: 12, duration: 160 }}>
		<div class="mb-3 flex items-center justify-between">
			<div class="flex items-center gap-2">
				<Dices size={18} class="text-astral" />
				<h3 class="font-semibold">Würfelschale</h3>
			</div>
			<button class="icon-btn" onclick={() => (ui.dice = false)} aria-label="Schließen"><X size={16} /></button>
		</div>

		<div class="mb-3 grid grid-cols-3 gap-1 rounded-xl bg-black/30 p-1 text-xs">
			{#each [['normal', 'Normal'], ['vorteil', 'Vorteil'], ['nachteil', 'Nachteil']] as [m, l] (m)}
				<button
					class="rounded-lg py-1.5 font-medium {rolls.mode === m ? 'bg-white/10 text-ink' : 'text-ink-3 hover:text-ink'}"
					onclick={() => (rolls.mode = m as typeof rolls.mode)}>{l}</button
				>
			{/each}
		</div>

		<div class="grid grid-cols-7 gap-1.5">
			{#each DICE as d (d)}
				<button class="btn btn-sm !px-0 num" onclick={() => (d === 20 ? rolls.check('W20', 0) : rolls.damage(`W${d}`, `1d${d}`))}>W{d}</button>
			{/each}
		</div>

		<form
			class="mt-2 flex gap-2"
			onsubmit={(e) => {
				e.preventDefault();
				rollCustom();
			}}
		>
			<input class="input !h-8 num text-xs" bind:value={custom} placeholder="z. B. 2W6+3 oder +7" aria-label="Eigener Wurf" />
			<button class="btn btn-sm btn-primary">Würfeln</button>
		</form>
		<p class="mt-1.5 text-[0.7rem] text-ink-3">Vorteil/Nachteil gilt für den nächsten W20-Wurf, auch beim Klick auf einen Wert.</p>

		<div class="mt-3 max-h-64 space-y-1 overflow-y-auto">
			{#each rolls.log as r (r.id)}
				<div class="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-white/[0.03]">
					<span
						class="num w-10 text-right text-lg font-semibold {r.crit === 'hit' ? 'text-life' : r.crit === 'miss' ? 'text-blood' : r.kind === 'event' ? 'text-ink-3' : 'text-ink'}"
						>{r.total ?? '•'}</span
					>
					<span class="min-w-0 flex-1">
						<span class="block truncate text-xs font-medium">{r.label}</span>
						<span class="block truncate text-[0.7rem] text-ink-3">{r.detail}</span>
					</span>
					<span class="num text-[0.65rem] text-ink-3">{timeHM(r.at)}</span>
				</div>
			{:else}
				<p class="py-4 text-center text-xs text-ink-3">Noch nichts gewürfelt.</p>
			{/each}
		</div>
	</aside>
{/if}

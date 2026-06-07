<script lang="ts">
	import { character } from '$lib/stores/character.svelte';
	import Coins from '@lucide/svelte/icons/coins';

	const c = $derived(character.current);
	const coins = [
		{ key: 'gp', label: 'Gold', cls: 'text-accent' },
		{ key: 'sp', label: 'Silber', cls: 'text-muted' },
		{ key: 'cp', label: 'Kupfer', cls: 'text-[#b87333]' }
	] as const;

	function set(key: 'gp' | 'sp' | 'cp', v: number) {
		character.patch({ currency: { [key]: Math.max(0, Math.round(v || 0)) } });
	}

	const totalGp = $derived(c ? c.currency.gp + c.currency.sp / 10 + c.currency.cp / 100 : 0);
</script>

{#if c}
	<div class="grid grid-cols-3 gap-2">
		{#each coins as coin (coin.key)}
			<div class="stat-tile gap-1">
				<span class="text-xs font-semibold {coin.cls}">{coin.label}</span>
				<input
					class="w-full bg-transparent text-center font-display text-xl font-bold tabular-nums outline-none"
					type="number"
					min="0"
					value={c.currency[coin.key]}
					onchange={(e) => set(coin.key, +e.currentTarget.value)}
				/>
			</div>
		{/each}
	</div>
	<p class="mt-2 flex items-center justify-center gap-1.5 text-sm text-muted">
		<Coins class="h-4 w-4 text-accent" /> Gesamtwert: <span class="font-semibold text-ink"
			>{totalGp.toFixed(2)} GM</span
		>
	</p>
{/if}

<script lang="ts">
	import { fade, scale } from 'svelte/transition';
	import { roll } from '$lib/stores/roll.svelte';
	import { sound } from '$lib/sound';
	import D20Icon from '$lib/components/D20Icon.svelte';

	let display = $state(0);
	let rolling = $state(false);
	let settledCrit = $state<'hit' | 'miss' | undefined>(undefined);

	$effect(() => {
		const r = roll.current;
		if (!r) {
			rolling = false;
			settledCrit = undefined;
			return;
		}
		// Zahlen-Ticker: rattern, dann Ergebnis
		rolling = true;
		settledCrit = undefined;
		let ticks = 0;
		const iv = setInterval(() => {
			display = 1 + Math.floor(Math.random() * 20) + r.bonus;
			if (++ticks >= 8) {
				clearInterval(iv);
				display = r.total;
				rolling = false;
				settledCrit = r.crit;
				if (r.crit === 'hit') sound.crit();
				else if (r.crit === 'miss') sound.fumble();
			}
		}, 45);
		return () => clearInterval(iv);
	});
</script>

{#if roll.current}
	{@const r = roll.current}
	<div
		class="pointer-events-none fixed inset-0 z-[72] grid place-items-center"
		transition:fade={{ duration: 130 }}
	>
		<button
			class="pointer-events-auto relative grid place-items-center overflow-visible rounded-3xl border border-border bg-surface/95 px-10 py-6 shadow-2xl backdrop-blur
				{settledCrit === 'hit' ? 'border-accent shadow-[0_0_60px_-10px_var(--color-accent)]' : ''}
				{settledCrit === 'miss' ? 'animate-shake border-danger' : ''}"
			onclick={() => roll.dismiss()}
			transition:scale={{ duration: 170, start: 0.88 }}
			aria-label="Wurf schließen"
		>
			<!-- Krit-Funken -->
			{#if settledCrit === 'hit'}
				<span class="pointer-events-none absolute inset-0 overflow-visible">
					{#each Array(20) as _, i (i)}
						<span
							class="crit-particle"
							style="--a:{i * 18}deg; --d:{55 + (i % 4) * 18}px; background:{i % 2
								? 'var(--color-accent)'
								: 'var(--color-primary)'}; animation-delay:{(i % 5) * 16}ms"
						></span>
					{/each}
				</span>
			{/if}

			<span class="relative grid h-28 w-28 place-items-center">
				<span
					class="absolute inset-0 grid place-items-center {rolling ? 'roll-spin' : ''}
						{settledCrit === 'hit' ? 'text-accent' : settledCrit === 'miss' ? 'text-danger' : 'text-primary'}"
				>
					<D20Icon class="h-28 w-28 opacity-90" />
				</span>
				<span
					class="relative font-display text-4xl font-bold tabular-nums {rolling
						? 'opacity-70 blur-[0.5px]'
						: 'animate-pop'} {settledCrit === 'hit' ? 'text-accent' : settledCrit === 'miss' ? 'text-danger' : ''}"
				>
					{display}
				</span>
			</span>

			<span class="mt-1 max-w-56 truncate font-display text-sm font-semibold">{r.label}</span>
			<span class="text-xs text-muted">{r.detail}</span>
			{#if settledCrit === 'hit'}
				<span class="mt-0.5 text-xs font-bold uppercase tracking-widest text-accent" in:fade>Kritisch!</span>
			{:else if settledCrit === 'miss'}
				<span class="mt-0.5 text-xs font-bold uppercase tracking-widest text-danger" in:fade>Patzer!</span>
			{/if}
		</button>
	</div>
{/if}

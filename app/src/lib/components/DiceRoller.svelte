<script lang="ts">
	import { toasts } from '$lib/stores/toast.svelte';
	import Dices from '@lucide/svelte/icons/dices';

	const DICE = [4, 6, 8, 10, 12, 20, 100];
	let count = $state(1);
	let modifier = $state(0);
	let mode = $state<'normal' | 'adv' | 'dis'>('normal');

	interface Roll {
		id: number;
		label: string;
		rolls: number[];
		total: number;
		crit?: 'hit' | 'miss';
	}
	let history = $state<Roll[]>([]);
	let _id = 0;

	// Anzeige / Animation
	let display = $state<number | null>(null);
	let rolling = $state(false);
	let lastCrit = $state<Roll['crit'] | undefined>(undefined);
	let lastLabel = $state('');
	let popKey = $state(0);
	let burstKey = $state(0);
	let shaking = $state(false);

	function rollDie(sides: number): number {
		return 1 + Math.floor(Math.random() * sides);
	}

	function roll(sides: number) {
		if (rolling) return;
		let rolls: number[];
		let label = `${count}d${sides}`;
		if (sides === 20 && mode !== 'normal') {
			const a = rollDie(20);
			const b = rollDie(20);
			const chosen = mode === 'adv' ? Math.max(a, b) : Math.min(a, b);
			rolls = [chosen];
			label = `d20 ${mode === 'adv' ? 'Vorteil' : 'Nachteil'} (${a}/${b})`;
		} else {
			rolls = Array.from({ length: Math.max(1, count) }, () => rollDie(sides));
		}
		const sum = rolls.reduce((a, b) => a + b, 0);
		const total = sum + modifier;
		let crit: Roll['crit'] | undefined;
		if (sides === 20 && rolls.length === 1) {
			if (rolls[0] === 20) crit = 'hit';
			else if (rolls[0] === 1) crit = 'miss';
		}
		const modStr = modifier ? (modifier > 0 ? `+${modifier}` : `${modifier}`) : '';
		const entry: Roll = { id: ++_id, label: `${label}${modStr}`, rolls, total, crit };

		// Würfel-Animation: Zahlen rattern, dann Ergebnis poppen
		rolling = true;
		lastCrit = undefined;
		const maxFace = sides * Math.max(1, count);
		let ticks = 0;
		const iv = setInterval(() => {
			display = rollDie(maxFace) + modifier;
			if (++ticks >= 9) {
				clearInterval(iv);
				display = total;
				lastCrit = crit;
				lastLabel = entry.label;
				rolling = false;
				popKey++;
				if (crit === 'hit') burstKey++;
				if (crit === 'miss') {
					shaking = true;
					setTimeout(() => (shaking = false), 360);
				}
				history = [entry, ...history].slice(0, 8);
				toasts.push(
					`🎲 ${total}`,
					`${entry.label} → [${rolls.join(', ')}]`,
					crit === 'hit' ? 'good' : crit === 'miss' ? 'bad' : 'default'
				);
			}
		}, 45);
	}
</script>

<div class="flex flex-col gap-3">
	<!-- Ergebnis-Anzeige -->
	<div
		class="relative grid place-items-center overflow-hidden rounded-2xl border border-border bg-surface2/60 py-4
			{lastCrit === 'hit' ? 'border-success/50' : lastCrit === 'miss' ? 'border-danger/50' : ''}"
		class:animate-shake={shaking}
	>
		{#if lastCrit === 'hit'}
			{#key burstKey}
				<div class="pointer-events-none absolute inset-0">
					{#each Array(18) as _, i (i)}
						<span
							class="crit-particle"
							style="--a:{i * 20}deg; --d:{42 + (i % 3) * 16}px; background:{i % 2
								? 'var(--color-accent)'
								: 'var(--color-primary)'}; animation-delay:{(i % 4) * 18}ms"
						></span>
					{/each}
				</div>
			{/key}
		{/if}
		{#if display === null}
			<span class="flex items-center gap-2 text-sm text-muted"><Dices class="h-4 w-4" /> Würfel wählen</span>
		{:else}
			{#key popKey}
				<span
					class="font-display text-5xl font-bold tabular-nums {rolling
						? 'opacity-60 blur-[1px]'
						: 'animate-pop'} {lastCrit === 'hit' ? 'text-success' : lastCrit === 'miss' ? 'text-danger' : ''}"
				>
					{display}
				</span>
			{/key}
			{#if !rolling && lastLabel}
				<span class="mt-0.5 text-xs text-muted">{lastLabel}</span>
			{/if}
		{/if}
	</div>

	<!-- d20-Modus -->
	<div class="flex gap-1.5">
		{#each [['normal', 'Normal'], ['adv', 'Vorteil'], ['dis', 'Nachteil']] as [val, lbl] (val)}
			<button
				class="chip flex-1 justify-center {mode === val ? 'chip-active' : ''}"
				onclick={() => (mode = val as typeof mode)}
			>
				{lbl}
			</button>
		{/each}
	</div>

	<!-- Würfel -->
	<div class="grid grid-cols-4 gap-2">
		{#each DICE as d (d)}
			<button
				class="btn flex-col gap-0.5 py-3 font-display font-bold transition hover:-translate-y-0.5 hover:border-primary/50"
				onclick={() => roll(d)}
				disabled={rolling}
			>
				<Dices class="h-4 w-4 text-primary" />
				d{d}
			</button>
		{/each}
		<div class="flex flex-col items-center justify-center rounded-xl border border-border bg-surface2 px-1">
			<span class="text-[10px] text-muted">Anzahl</span>
			<input class="w-full bg-transparent text-center font-bold outline-none" type="number" min="1" bind:value={count} />
		</div>
		<div class="flex flex-col items-center justify-center rounded-xl border border-border bg-surface2 px-1">
			<span class="text-[10px] text-muted">Bonus</span>
			<input class="w-full bg-transparent text-center font-bold outline-none" type="number" bind:value={modifier} />
		</div>
	</div>

	<!-- Verlauf -->
	{#if history.length}
		<div class="flex flex-col gap-1">
			{#each history as h (h.id)}
				<div class="flex items-center justify-between rounded-lg bg-surface2 px-3 py-1.5 text-sm">
					<span class="text-muted">{h.label}</span>
					<span
						class="font-display font-bold {h.crit === 'hit'
							? 'text-success'
							: h.crit === 'miss'
								? 'text-danger'
								: ''}">{h.total}</span
					>
				</div>
			{/each}
		</div>
	{/if}
</div>

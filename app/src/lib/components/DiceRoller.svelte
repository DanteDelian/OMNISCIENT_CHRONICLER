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

	function rollDie(sides: number): number {
		return 1 + Math.floor(Math.random() * sides);
	}

	function roll(sides: number) {
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
		const entry: Roll = { id: ++_id, label: `${label}${modifier ? (modifier > 0 ? `+${modifier}` : modifier) : ''}`, rolls, total, crit };
		history = [entry, ...history].slice(0, 8);
		toasts.push(
			`🎲 ${total}`,
			`${entry.label} → [${rolls.join(', ')}]`,
			crit === 'hit' ? 'good' : crit === 'miss' ? 'bad' : 'default'
		);
	}
</script>

<div class="flex flex-col gap-3">
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
			<button class="btn flex-col gap-0.5 py-3 font-display font-bold" onclick={() => roll(d)}>
				<Dices class="h-4 w-4 text-primary" />
				d{d}
			</button>
		{/each}
		<div class="col-span-1 flex flex-col items-center justify-center rounded-xl border border-border bg-surface2 px-1">
			<span class="text-[10px] text-muted">Anzahl</span>
			<input class="w-full bg-transparent text-center font-bold outline-none" type="number" min="1" bind:value={count} />
		</div>
		<div class="col-span-1 flex flex-col items-center justify-center rounded-xl border border-border bg-surface2 px-1">
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

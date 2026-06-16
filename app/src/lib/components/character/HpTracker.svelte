<script lang="ts">
	import { character } from '$lib/stores/character.svelte';
	import AnimatedNumber from '$lib/components/AnimatedNumber.svelte';
	import Heart from '@lucide/svelte/icons/heart';
	import Shield from '@lucide/svelte/icons/shield-plus';
	import Minus from '@lucide/svelte/icons/minus';
	import Plus from '@lucide/svelte/icons/plus';

	let amount = $state(1);
	let flash = $state('');
	const c = $derived(character.current);

	function doFlash(kind: 'dmg' | 'heal') {
		flash = kind === 'dmg' ? 'flash-bad' : 'flash-good';
		setTimeout(() => (flash = ''), 700);
	}

	function applyDamage(n: number) {
		if (!c || n <= 0) return;
		let temp = c.hp.temp;
		let rest = n;
		if (temp > 0) {
			const absorbed = Math.min(temp, rest);
			temp -= absorbed;
			rest -= absorbed;
		}
		const cur = Math.max(0, c.hp.current - rest);
		character.patch({ hp: { current: cur, temp } });
		doFlash('dmg');
	}

	function heal(n: number) {
		if (!c || n <= 0) return;
		const cur = Math.min(c.hp.max, c.hp.current + n);
		character.patch({ hp: { current: cur } });
		doFlash('heal');
	}

	function setTemp(v: number) {
		if (!c) return;
		character.patch({ hp: { temp: Math.max(0, v || 0) } });
	}

	function setMax(v: number) {
		if (!c) return;
		const max = Math.max(1, v || 1);
		character.patch({ hp: { max, current: Math.min(c.hp.current, max) } });
	}

	const ratio = $derived(c ? Math.max(0, Math.min(1, c.hp.current / Math.max(1, c.hp.max))) : 0);
	const barColor = $derived(
		ratio > 0.5 ? 'var(--color-success)' : ratio > 0.25 ? 'var(--color-accent)' : 'var(--color-danger)'
	);
	const low = $derived(!!c && c.hp.current > 0 && ratio <= 0.25);
</script>

{#if c}
	<div class="flex flex-col gap-4">
		<div class="flex items-center justify-between gap-3">
			<Heart class="h-5 w-5 text-danger" />
			{#if c.hp.temp > 0}
				<span class="chip chip-active gap-1"><Shield class="h-3.5 w-3.5" />+{c.hp.temp} temp</span>
			{/if}
		</div>

		<!-- Große HP-Anzeige -->
		<div class="flex items-baseline justify-center gap-1 rounded-2xl py-1 font-display {flash}">
			<AnimatedNumber
				value={c.hp.current}
				class="text-6xl font-bold tabular-nums {low ? 'lowhp text-danger' : ''}"
			/>
			<span class="text-2xl text-muted">/</span>
			<input
				class="w-16 bg-transparent text-2xl text-muted tabular-nums outline-none"
				type="number"
				value={c.hp.max}
				onchange={(e) => setMax(+e.currentTarget.value)}
				aria-label="Maximale TP"
			/>
		</div>

		<!-- HP-Leiste -->
		<div class="h-3 w-full overflow-hidden rounded-full bg-surface2">
			<div
				class="h-full rounded-full transition-all duration-300"
				style="width: {ratio * 100}%; background-color: {barColor}"
			></div>
		</div>

		<!-- Schaden / Heilung -->
		<div class="flex items-stretch gap-2">
			<button
				class="btn btn-danger flex-1 text-lg font-bold"
				onclick={() => applyDamage(amount)}
				aria-label="Schaden"
			>
				<Minus class="h-5 w-5" /> Schaden
			</button>
			<input
				class="input w-20 text-center text-lg font-bold"
				type="number"
				min="1"
				bind:value={amount}
				aria-label="Menge"
			/>
			<button
				class="btn flex-1 text-lg font-bold !border-success/40 !text-success"
				onclick={() => heal(amount)}
				aria-label="Heilung"
			>
				<Plus class="h-5 w-5" /> Heilen
			</button>
		</div>

		<!-- Schnellaktionen -->
		<div class="flex flex-wrap items-center gap-2 text-sm">
			<button class="chip" onclick={() => heal(c.hp.max)}>Voll heilen</button>
			<label class="chip gap-1">
				temp
				<input
					class="w-12 bg-transparent text-center outline-none"
					type="number"
					min="0"
					value={c.hp.temp}
					onchange={(e) => setTemp(+e.currentTarget.value)}
				/>
			</label>
		</div>
	</div>
{/if}

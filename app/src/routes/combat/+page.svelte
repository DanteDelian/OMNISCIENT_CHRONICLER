<script lang="ts">
	import { onMount } from 'svelte';
	import { flip } from 'svelte/animate';
	import { combat } from '$lib/stores/combat.svelte';
	import { character } from '$lib/stores/character.svelte';
	import { abilityMod } from '$lib/types';
	import { rollDie } from '$lib/dice';
	import { toasts } from '$lib/stores/toast.svelte';
	import Swords from '@lucide/svelte/icons/swords';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
	import Plus from '@lucide/svelte/icons/plus';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import UserPlus from '@lucide/svelte/icons/user-plus';
	import Shield from '@lucide/svelte/icons/shield';

	onMount(() => combat.load());

	const QUICK_CONDITIONS = ['Vergiftet', 'Liegend', 'Betäubt', 'Gepackt', 'Verängstigt', 'Bewusstlos'];

	let name = $state('');
	let init = $state(10);
	let hp = $state(10);
	let ac = $state(12);

	function addEnemy() {
		if (!name.trim()) return;
		combat.add({ name: name.trim(), initiative: init, hp, maxHp: hp, ac, isPlayer: false });
		name = '';
	}

	function addHero() {
		const c = character.current;
		if (!c) return;
		const roll = rollDie(20) + c.initiativeBonus;
		combat.add({
			name: c.name,
			initiative: roll,
			hp: c.hp.current,
			maxHp: c.hp.max,
			ac: c.ac,
			isPlayer: true
		});
		toasts.push(`${c.name} tritt ein`, `Initiative ${roll}`, 'good');
	}

	function toggleCond(id: string, cond: string, current: string[]) {
		combat.patch(id, {
			conditions: current.includes(cond) ? current.filter((x) => x !== cond) : [...current, cond]
		});
	}

	function hpRatio(c: { hp: number; maxHp: number }) {
		return Math.max(0, Math.min(1, c.hp / Math.max(1, c.maxHp)));
	}
</script>

<svelte:head><title>Kampf · Omniscient Chronicler</title></svelte:head>

<!-- Kopf -->
<div class="card card-pad mb-4 flex flex-wrap items-center justify-between gap-3">
	<div class="flex items-center gap-3">
		<span class="grid h-12 w-12 place-items-center rounded-xl bg-danger/15 text-danger">
			<Swords class="h-6 w-6" />
		</span>
		<div>
			<h1 class="font-display text-2xl font-bold leading-none">Kampf</h1>
			<span class="text-sm text-muted">Runde {combat.round}</span>
		</div>
	</div>
	<div class="flex items-center gap-2">
		<button class="btn btn-ghost text-muted" onclick={() => combat.reset()} title="Kampf zurücksetzen">
			<RotateCcw class="h-4 w-4" />
		</button>
		<button class="btn btn-primary text-base" onclick={() => combat.next()} disabled={!combat.combatants.length}>
			Nächster Zug <ChevronRight class="h-5 w-5" />
		</button>
	</div>
</div>

<!-- Hinzufügen -->
<div class="card card-pad mb-4">
	<div class="flex flex-wrap items-end gap-2">
		<label class="flex flex-1 flex-col gap-1 text-xs text-muted">
			Name
			<input class="input" placeholder="Goblin-Anführer" bind:value={name} onkeydown={(e) => e.key === 'Enter' && addEnemy()} />
		</label>
		<label class="flex flex-col gap-1 text-xs text-muted">Init<input class="input !w-16 text-center" type="number" bind:value={init} /></label>
		<label class="flex flex-col gap-1 text-xs text-muted">TP<input class="input !w-16 text-center" type="number" bind:value={hp} /></label>
		<label class="flex flex-col gap-1 text-xs text-muted">RK<input class="input !w-16 text-center" type="number" bind:value={ac} /></label>
		<button class="btn btn-primary" onclick={addEnemy}><Plus class="h-4 w-4" /></button>
		<button class="btn" onclick={addHero} disabled={!character.current}><UserPlus class="h-4 w-4" /> Held</button>
	</div>
</div>

<!-- Initiative-Liste -->
<div class="flex flex-col gap-2">
	{#each combat.combatants as c (c.id)}
		{@const active = c.id === combat.activeId}
		{@const ratio = hpRatio(c)}
		<div
			animate:flip={{ duration: 200 }}
			class="card overflow-hidden p-0 transition {active
				? 'ring-2 ring-accent shadow-[0_0_24px_-6px_var(--color-accent)]'
				: ''}"
		>
			<div class="flex items-stretch">
				<!-- Initiative -->
				<div
					class="flex w-14 shrink-0 flex-col items-center justify-center gap-0 {active
						? 'bg-accent/15 text-accent'
						: 'bg-surface2 text-muted'}"
				>
					<span class="text-[9px] uppercase">Init</span>
					<input
						class="w-full bg-transparent text-center font-display text-xl font-bold outline-none"
						type="number"
						value={c.initiative}
						onchange={(e) => combat.patch(c.id, { initiative: +e.currentTarget.value })}
					/>
				</div>

				<div class="min-w-0 flex-1 p-3">
					<div class="flex items-center justify-between gap-2">
						<span class="flex items-center gap-1.5 truncate font-semibold">
							{#if c.isPlayer}<Shield class="h-3.5 w-3.5 shrink-0 text-primary" />{/if}
							{c.name}
						</span>
						<div class="flex items-center gap-1 text-sm">
							<span class="chip !py-0.5 text-xs">RK {c.ac}</span>
							<button class="btn btn-icon btn-ghost !h-7 !w-7 text-danger" onclick={() => combat.remove(c.id)} aria-label="Entfernen">
								<Trash2 class="h-4 w-4" />
							</button>
						</div>
					</div>

					<!-- HP-Leiste + Steuerung -->
					<div class="mt-2 flex items-center gap-2">
						<button class="btn btn-icon !h-7 !w-7 !border-danger/40 text-danger" onclick={() => combat.patch(c.id, { hp: Math.max(0, c.hp - 1) })}>−</button>
						<div class="relative h-5 flex-1 overflow-hidden rounded-full bg-surface2">
							<div
								class="h-full rounded-full transition-all duration-300"
								style="width:{ratio * 100}%; background:{ratio > 0.5 ? 'var(--color-success)' : ratio > 0.25 ? 'var(--color-accent)' : 'var(--color-danger)'}"
							></div>
							<span class="absolute inset-0 grid place-items-center text-xs font-bold tabular-nums">
								{c.hp} / {c.maxHp}
							</span>
						</div>
						<button class="btn btn-icon !h-7 !w-7 !border-success/40 text-success" onclick={() => combat.patch(c.id, { hp: Math.min(c.maxHp, c.hp + 1) })}>+</button>
					</div>

					<!-- Zustände -->
					<div class="mt-2 flex flex-wrap gap-1">
						{#each QUICK_CONDITIONS as cond (cond)}
							<button
								class="chip !py-0.5 text-[11px] {c.conditions.includes(cond) ? 'chip-active' : ''}"
								onclick={() => toggleCond(c.id, cond, c.conditions)}
							>
								{cond}
							</button>
						{/each}
					</div>
				</div>
			</div>
		</div>
	{:else}
		<div class="card card-pad grid place-items-center py-12 text-center text-muted">
			<Swords class="mb-2 h-10 w-10 opacity-40" />
			<p>Noch keine Kämpfer. Füge Gegner hinzu oder übernimm deinen Helden.</p>
		</div>
	{/each}
</div>

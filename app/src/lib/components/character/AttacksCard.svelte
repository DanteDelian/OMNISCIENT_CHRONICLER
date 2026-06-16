<script lang="ts">
	import { character } from '$lib/stores/character.svelte';
	import { toasts } from '$lib/stores/toast.svelte';
	import { fmtMod, type Attack } from '$lib/types';
	import { rollDie, rollExpr } from '$lib/dice';
	import Swords from '@lucide/svelte/icons/swords';
	import Dices from '@lucide/svelte/icons/dices';
	import Plus from '@lucide/svelte/icons/plus';
	import Trash2 from '@lucide/svelte/icons/trash-2';

	const c = $derived(character.current);

	let adding = $state(false);
	let name = $state('');
	let bonus = $state(4);
	let damage = $state('1d8+2');
	let damageType = $state('');

	function rollAttack(a: Attack) {
		const d = rollDie(20);
		const total = d + a.bonus;
		toasts.push(
			`${a.name}: ${total}${d === 20 ? ' — KRIT!' : d === 1 ? ' — Patzer' : ''}`,
			`Angriff · d20 (${d}) ${fmtMod(a.bonus)}`,
			d === 20 ? 'good' : d === 1 ? 'bad' : 'default'
		);
	}

	function rollDamage(a: Attack) {
		const r = rollExpr(a.damage);
		if (!r) {
			toasts.push('Ungültiger Würfelausdruck', a.damage, 'bad');
			return;
		}
		toasts.push(
			`${a.name}: ${r.total} Schaden`,
			`${a.damage} → ${r.detail}${a.damageType ? ' · ' + a.damageType : ''}`
		);
	}

	function add() {
		if (!c || !name.trim()) return;
		const attack: Attack = {
			id: crypto.randomUUID(),
			name: name.trim(),
			bonus,
			damage: damage.trim() || '1d6',
			damageType: damageType.trim()
		};
		character.patch({ attacks: [...c.attacks, attack] });
		name = '';
		damageType = '';
		adding = false;
	}

	function remove(id: string) {
		if (!c) return;
		character.patch({ attacks: c.attacks.filter((a) => a.id !== id) });
	}
</script>

{#if c}
	<div class="flex flex-col gap-2">
		{#each c.attacks as a (a.id)}
			<div class="flex items-center gap-2 rounded-xl border border-border bg-surface2 p-2.5">
				<div class="min-w-0 flex-1">
					<span class="block truncate text-sm font-semibold">{a.name}</span>
					<span class="text-xs text-muted">{a.damageType || 'Waffe'}</span>
				</div>
				<button
					class="btn !px-2.5 !py-1.5 text-sm font-bold"
					onclick={() => rollAttack(a)}
					title="Angriffswurf (d20 {fmtMod(a.bonus)})"
				>
					<Swords class="h-4 w-4 text-primary" /> {fmtMod(a.bonus)}
				</button>
				<button
					class="btn !px-2.5 !py-1.5 text-sm font-bold"
					onclick={() => rollDamage(a)}
					title="Schadenswurf"
				>
					<Dices class="h-4 w-4 text-accent" /> {a.damage}
				</button>
				<button
					class="btn btn-icon btn-ghost !h-8 !w-8 text-danger"
					onclick={() => remove(a.id)}
					aria-label="Löschen"
				>
					<Trash2 class="h-4 w-4" />
				</button>
			</div>
		{:else}
			<p class="py-2 text-center text-sm text-muted">Noch keine Angriffe angelegt.</p>
		{/each}
	</div>

	{#if adding}
		<div class="mt-3 flex flex-col gap-2 rounded-xl border border-border bg-surface2 p-3">
			<input class="input" placeholder="Name (z.B. Rapier)" bind:value={name} />
			<div class="grid grid-cols-3 gap-2">
				<label class="flex flex-col gap-1 text-xs text-muted">
					Bonus
					<input class="input" type="number" bind:value={bonus} />
				</label>
				<label class="flex flex-col gap-1 text-xs text-muted">
					Schaden
					<input class="input" placeholder="1d8+2" bind:value={damage} />
				</label>
				<label class="flex flex-col gap-1 text-xs text-muted">
					Typ
					<input class="input" placeholder="Stich" bind:value={damageType} />
				</label>
			</div>
			<div class="flex justify-end gap-2">
				<button class="btn" onclick={() => (adding = false)}>Abbrechen</button>
				<button class="btn btn-primary" onclick={add}>Hinzufügen</button>
			</div>
		</div>
	{:else}
		<button class="btn mt-3 w-full text-sm" onclick={() => (adding = true)}>
			<Plus class="h-4 w-4" /> Angriff hinzufügen
		</button>
	{/if}
{/if}

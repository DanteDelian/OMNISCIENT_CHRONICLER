<script lang="ts">
	import { character } from '$lib/stores/character.svelte';
	import { toasts } from '$lib/stores/toast.svelte';
	import Moon from '@lucide/svelte/icons/moon';
	import Coffee from '@lucide/svelte/icons/coffee';

	const c = $derived(character.current);

	function shortRest() {
		if (!c) return;
		const trackers = c.customTrackers.map((t) =>
			t.resetOn === 'short' && t.max != null ? { ...t, value: t.max } : t
		);
		const features = c.features.map((f) =>
			f.uses && f.uses.resetOn === 'short' ? { ...f, uses: { ...f.uses, current: f.uses.max } } : f
		);
		character.patch({ customTrackers: trackers, features }, 'rest');
		const arkane = c.features.find((f) => f.id === 'feat-arkane-erholung');
		toasts.push(
			'Kurze Rast',
			arkane && arkane.uses && arkane.uses.current > 0
				? '💡 Arkane Erholung verfügbar: Slots mit Gesamtgrad ≤ 3 zurückholen!'
				: 'Kurzrast-Ressourcen aufgefrischt'
		);
	}

	function longRest() {
		if (!c) return;
		character.patch(
			{
				hp: { current: c.hp.max, temp: 0 },
				deathSaves: { successes: 0, failures: 0 },
				hitDiceRemaining: c.level,
				spellSlots: c.spellSlots.map((s) => ({ ...s, used: 0 })),
				customTrackers: c.customTrackers.map((t) =>
					(t.resetOn === 'short' || t.resetOn === 'long') && t.max != null
						? { ...t, value: t.max }
						: t
				),
				features: c.features.map((f) =>
					f.uses ? { ...f, uses: { ...f.uses, current: f.uses.max } } : f
				)
			},
			'rest'
		);
		toasts.push('Lange Rast', 'TP, Zauberplätze, Merkmale & Ressourcen aufgefrischt', 'good');
	}
</script>

<div class="flex gap-2">
	<button class="btn flex-1" onclick={shortRest}>
		<Coffee class="h-4 w-4" /> Kurze Rast
	</button>
	<button class="btn btn-primary flex-1" onclick={longRest}>
		<Moon class="h-4 w-4" /> Lange Rast
	</button>
</div>

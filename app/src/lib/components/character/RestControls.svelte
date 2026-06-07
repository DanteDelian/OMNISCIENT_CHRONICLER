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
		character.patch({ customTrackers: trackers }, 'rest');
		toasts.push('Kurze Rast', 'Kurzrast-Ressourcen aufgefrischt');
	}

	function longRest() {
		if (!c) return;
		character.patch(
			{
				hp: { current: c.hp.max, temp: 0 },
				deathSaves: { successes: 0, failures: 0 },
				spellSlots: c.spellSlots.map((s) => ({ ...s, used: 0 })),
				customTrackers: c.customTrackers.map((t) =>
					(t.resetOn === 'short' || t.resetOn === 'long') && t.max != null
						? { ...t, value: t.max }
						: t
				)
			},
			'rest'
		);
		toasts.push('Lange Rast', 'TP, Zauberplätze & Ressourcen aufgefrischt', 'good');
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

<script lang="ts">
	import { character } from '$lib/stores/character.svelte';
	import { DND_CONDITIONS } from '$lib/types';

	const c = $derived(character.current);
	let custom = $state('');

	function toggle(name: string) {
		if (!c) return;
		const set = new Set(c.conditions);
		if (set.has(name)) set.delete(name);
		else set.add(name);
		character.patch({ conditions: [...set] });
	}

	function addCustom() {
		const name = custom.trim();
		if (!c || !name) return;
		if (!c.conditions.includes(name)) character.patch({ conditions: [...c.conditions, name] });
		custom = '';
	}

	const extras = $derived(c ? c.conditions.filter((x) => !DND_CONDITIONS.includes(x)) : []);
</script>

{#if c}
	<div class="flex flex-wrap gap-1.5">
		{#each DND_CONDITIONS as cond (cond)}
			<button
				class="chip {c.conditions.includes(cond) ? 'chip-active' : ''}"
				onclick={() => toggle(cond)}
			>
				{cond}
			</button>
		{/each}
		{#each extras as cond (cond)}
			<button class="chip chip-active" onclick={() => toggle(cond)}>{cond} ✕</button>
		{/each}
	</div>
	<form
		class="mt-3 flex gap-2"
		onsubmit={(e) => {
			e.preventDefault();
			addCustom();
		}}
	>
		<input class="input" placeholder="Eigener Zustand…" bind:value={custom} />
		<button class="btn" type="submit">+</button>
	</form>
{/if}

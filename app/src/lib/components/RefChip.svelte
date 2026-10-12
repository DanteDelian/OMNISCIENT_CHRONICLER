<script lang="ts">
	/** Ein Verweis als Chip: löst Namen über den Index auf (Person, Ort, Zauber …). */
	import { campaign } from '$lib/stores/campaign.svelte';
	let { name, label = '' }: { name: string; label?: string } = $props();
	const hit = $derived(campaign.resolve(name));
</script>

{#if hit}
	<a class="chip" href={hit.href} data-ref={hit.key}>
		<span class="h-1.5 w-1.5 rounded-full bg-astral/70"></span>{label || hit.title}
	</a>
{:else}
	<span class="chip opacity-70" title="Noch kein Eintrag">{label || name}</span>
{/if}

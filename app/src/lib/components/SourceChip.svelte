<script lang="ts">
	/** Verweis auf ein Original in Google Drive (sources.json). */
	import { ExternalLink } from '@lucide/svelte';
	import { campaign } from '$lib/stores/campaign.svelte';
	let { id }: { id: string } = $props();
	const src = $derived(campaign.data.sources.find((s) => s.id === id));
</script>

{#if src}
	<a class="chip" href={src.url} target="_blank" rel="noreferrer" title={`${src.title} · Stand ${src.modified}`}>
		<ExternalLink size={12} />{src.title.length > 38 ? src.title.slice(0, 36) + '…' : src.title}
	</a>
{/if}

<script lang="ts">
	import { renderPrint } from '$lib/markdown';
	import { campaign } from '$lib/stores/campaign.svelte';

	let { src = '', inline = false, class: cls = '' }: { src?: string; inline?: boolean; class?: string } = $props();

	const html = $derived(renderPrint(src, campaign.resolve, inline));
</script>

{#if inline}
	<span class={cls}>{@html html}</span>
{:else}
	<div class="md {cls}">{@html html}</div>
{/if}

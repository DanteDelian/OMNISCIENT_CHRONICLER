<script lang="ts">
	import { renderInline, renderMarkdown } from '$lib/markdown';
	import { campaign } from '$lib/stores/campaign.svelte';

	let { src = '', inline = false, class: cls = '' }: { src?: string; inline?: boolean; class?: string } = $props();

	const html = $derived(inline ? renderInline(src, campaign.resolve) : renderMarkdown(src, campaign.resolve));
</script>

{#if inline}
	<span class={cls}>{@html html}</span>
{:else}
	<div class="prose-grim {cls}">{@html html}</div>
{/if}

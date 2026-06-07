<script lang="ts">
	import type { Snippet } from 'svelte';
	let {
		title = '',
		class: cls = '',
		actions,
		children
	}: { title?: string; class?: string; actions?: Snippet; children: Snippet } = $props();
</script>

<section class="card card-pad {cls}">
	{#if title || actions}
		<div class="mb-3 flex items-center justify-between gap-2">
			{#if title}<h3 class="panel-title">{title}</h3>{/if}
			{#if actions}<div class="flex items-center gap-1">{@render actions()}</div>{/if}
		</div>
	{/if}
	{@render children()}
</section>

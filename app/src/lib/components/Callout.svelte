<script lang="ts">
	import type { Snippet } from 'svelte';
	const LABEL = { tip: 'Tipp', rule: 'Regel', warning: 'Achtung', note: 'Hinweis', fix: 'Korrigiert' };
	let {
		type = 'note',
		title = '',
		children
	}: { type?: keyof typeof LABEL; title?: string; children: Snippet } = $props();
</script>

<div class="callout callout-{type}">
	{#if title}<div class="callout-title" data-label={LABEL[type]}>{title}</div>{/if}
	<div class="text-sm leading-relaxed">{@render children()}</div>
</div>

<script lang="ts">
	import type { Snippet } from 'svelte';
	let { eyebrow = '', title, subtitle = '', actions }: { eyebrow?: string; title: string; subtitle?: string; actions?: Snippet } = $props();
</script>

<header class="mb-6 flex flex-wrap items-end justify-between gap-4">
	<div class="min-w-0">
		{#if eyebrow}<div class="eyebrow mb-1.5">{eyebrow}</div>{/if}
		<h1 class="title-display text-[2.8rem] leading-none">{title}</h1>
		{#if subtitle}<p class="mt-2 max-w-3xl text-[0.95rem] text-ink-2">{subtitle}</p>{/if}
	</div>
	{#if actions}<div class="flex flex-wrap items-center gap-2">{@render actions()}</div>{/if}
</header>

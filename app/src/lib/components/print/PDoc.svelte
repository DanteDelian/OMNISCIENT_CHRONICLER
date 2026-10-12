<script lang="ts">
	import type { Snippet } from 'svelte';
	import { printAnchor } from '$lib/markdown';

	let {
		id,
		eyebrow,
		title,
		subtitle = '',
		refs = [],
		compact = false,
		onePage = false,
		children
	}: {
		id: string;
		eyebrow: string;
		title: string;
		subtitle?: string;
		refs?: string[];
		/** Kleinere Kopfzeile, z. B. für Formulare */
		compact?: boolean;
		/** Genau eine Seite: der Inhalt kann mit flex: 1 den Rest füllen */
		onePage?: boolean;
		children: Snippet;
	} = $props();
</script>

<section class="sheet {onePage ? 'one-page' : ''}" id="doc-{id}">
	{#each refs as r (r)}<span id={printAnchor(r)}></span>{/each}
	<header class="doc-head {compact ? 'compact' : ''}">
		<div class="eyebrow">{eyebrow}</div>
		<h1>{title}</h1>
		{#if subtitle}<p class="doc-sub">{subtitle}</p>{/if}
	</header>
	{@render children()}
</section>

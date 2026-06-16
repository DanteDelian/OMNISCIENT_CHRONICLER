<script lang="ts">
	import { renderMarkdown } from '$lib/markdown';
	let { data } = $props();
</script>

<svelte:head><title>Chronik · Omniscient Chronicler</title></svelte:head>

<h1 class="mb-4 font-display text-2xl font-bold">Chronik</h1>

<div class="card card-pad">
	{#if data.body.trim()}
		<article class="prose max-w-none dark:prose-invert">
			<!-- eslint-disable-next-line svelte/no-at-html-tags -->
			{@html renderMarkdown(data.body)}
		</article>
	{:else}
		<p class="text-muted">Noch keine Chronik vorhanden.</p>
	{/if}
	<p class="mt-6 border-t border-border pt-4 text-sm text-muted">
		Die Chronik liegt in <code>campaign/chronicle.md</code> — bearbeite sie im Dashboard oder gemeinsam
		mit Claude Code.
	</p>
</div>

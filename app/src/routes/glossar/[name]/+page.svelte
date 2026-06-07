<script lang="ts">
	import { renderMarkdown } from '$lib/markdown';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	let { data } = $props();
</script>

<svelte:head><title>{data.name} · Glossar</title></svelte:head>

<a href="/glossar" class="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
	<ArrowLeft class="h-4 w-4" /> Glossar
</a>

<div class="card card-pad">
	{#if data.note}
		<article class="prose max-w-none dark:prose-invert">
			<!-- eslint-disable-next-line svelte/no-at-html-tags -->
			{@html renderMarkdown(data.note.body)}
		</article>
	{:else}
		<h1 class="font-display text-xl font-bold">{data.name}</h1>
		<p class="mt-2 text-muted">
			Zu „{data.name}" gibt es noch keinen Eintrag. Lege ihn als Notiz an oder lass ihn beim
			nächsten KI-Import erzeugen.
		</p>
		<a class="btn btn-primary mt-4" href="/notes">Notiz erstellen</a>
	{/if}
</div>

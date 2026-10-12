<script lang="ts">
	import { page } from '$app/state';
	import { ArrowLeft, Link2 } from '@lucide/svelte';
	import Markdown from '$lib/components/Markdown.svelte';
	import DocIcon from '$lib/components/DocIcon.svelte';
	import { campaign } from '$lib/stores/campaign.svelte';
	import { fmtDate } from '$lib/format';
	import { slugify } from '$lib/refs';

	const doc = $derived(campaign.data.docs.find((d) => d.slug === page.params.slug));
	const toc = $derived(
		(doc?.body.match(/^## .+$/gm) ?? []).map((h) => {
			const text = h.replace(/^## /, '').replace(/[*_`]/g, '');
			return { text, id: slugify(text) };
		})
	);
	const links = $derived(doc ? (campaign.data.backlinks[`doc:${doc.slug}`] ?? []) : []);

	let article: HTMLElement | undefined = $state();
	// Überschriften bekommen Anker für das Inhaltsverzeichnis.
	$effect(() => {
		void doc?.body;
		article?.querySelectorAll('h2').forEach((h) => (h.id = slugify(h.textContent ?? '')));
	});
</script>

<svelte:head><title>{doc?.title ?? 'Dokument'} · Archiv</title></svelte:head>

<div class="mx-auto max-w-6xl">
	<a class="btn btn-sm btn-ghost mb-5" href="/archiv"><ArrowLeft size={14} />Archiv</a>
	{#if doc}
		<div class="grid gap-6 lg:grid-cols-[1fr_260px]">
			<article bind:this={article} class="panel p-6 lg:p-10">
				<div class="mb-6 flex items-center gap-3 text-sm text-ink-3">
					<span class="grid h-9 w-9 place-items-center rounded-xl bg-astral/10 text-astral"><DocIcon name={doc.icon} size={17} /></span>
					<span>{doc.group}{doc.updated ? ` · Stand ${fmtDate(doc.updated)}` : ''}</span>
				</div>
				<Markdown src={doc.body} />
			</article>
			<aside class="space-y-4 lg:sticky lg:top-6 lg:self-start">
				{#if toc.length}
					<nav class="panel p-4" aria-label="Inhalt">
						<div class="eyebrow mb-2">Inhalt</div>
						<ul class="space-y-1 text-sm">
							{#each toc as t (t.id)}<li><a class="block rounded-md px-2 py-1 text-ink-2 hover:bg-white/[0.04] hover:text-ink" href="#{t.id}">{t.text}</a></li>{/each}
						</ul>
					</nav>
				{/if}
				{#if links.length}
					<div class="panel p-4">
						<div class="mb-2 flex items-center gap-2 text-sm font-medium"><Link2 size={14} class="text-ink-3" />Verweist hierher</div>
						<div class="flex flex-wrap gap-1.5">{#each links as l (l.key)}<a class="chip" href={l.href} data-ref={l.key}>{l.title}</a>{/each}</div>
					</div>
				{/if}
			</aside>
		</div>
	{:else}
		<div class="panel p-10 text-center text-ink-2">Dokument nicht gefunden.</div>
	{/if}
</div>

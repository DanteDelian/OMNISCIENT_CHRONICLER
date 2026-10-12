<script lang="ts">
	import { page } from '$app/state';
	import { ArrowLeft, NotebookPen, Flag, Link2, Tag } from '@lucide/svelte';
	import Markdown from '$lib/components/Markdown.svelte';
	import { campaign } from '$lib/stores/campaign.svelte';
	import { TONE, KIND_LABEL } from '../tone';

	const w = $derived(campaign.data.world.find((x) => x.slug === page.params.slug));
	const links = $derived(w ? (campaign.data.backlinks[`world:${w.slug}`] ?? []) : []);
	const journal = $derived(links.filter((l) => l.kind === 'Journal'));
	const quests = $derived(links.filter((l) => l.kind === 'Quest'));
	const others = $derived(links.filter((l) => l.kind !== 'Journal' && l.kind !== 'Quest'));
	const journalEntries = $derived(journal.map((l) => campaign.data.journal.find((j) => `journal:${j.id}` === l.key)).filter((j) => !!j));
</script>

<svelte:head><title>{w?.name ?? 'Welt'} · Valerius</title></svelte:head>

<div class="mx-auto max-w-6xl">
	<a class="btn btn-sm btn-ghost mb-5" href="/welt"><ArrowLeft size={14} />Welt</a>

	{#if w}
		{@const t = TONE[w.tone]}
		<div class="grid gap-6 lg:grid-cols-[1fr_320px]">
			<article class="panel p-6 lg:p-8">
				<div class="mb-3 flex flex-wrap items-center gap-2">
					<span class="badge" style="--c: {t.color}">{KIND_LABEL[w.kind]}</span>
					<span class="badge" style="--c: {t.color}">{t.label}</span>
					{#if w.status}<span class="text-sm text-ink-3">{w.status}</span>{/if}
				</div>
				<Markdown src={w.body} />
			</article>

			<aside class="space-y-4">
				{#if w.aliases.length}
					<div class="panel p-4">
						<div class="mb-2 flex items-center gap-2 text-sm font-medium"><Tag size={14} class="text-ink-3" />Auch genannt</div>
						<div class="flex flex-wrap gap-1.5">{#each w.aliases as a (a)}<span class="chip">{a}</span>{/each}</div>
					</div>
				{/if}

				<div class="panel p-4">
					<div class="mb-2 flex items-center gap-2 text-sm font-medium"><NotebookPen size={14} class="text-astral" />Im Journal <span class="text-ink-3">· {journalEntries.length}</span></div>
					{#if journalEntries.length}
						<ul class="space-y-2">
							{#each journalEntries as j (j.id)}
								<li>
									<a class="block rounded-lg px-2 py-1.5 hover:bg-white/[0.04]" href="/journal#{j.id}" data-ref="journal:{j.id}">
										<span class="num block text-[0.68rem] text-ink-3">{j.dateLabel}</span>
										<span class="text-sm text-ink">{j.title}</span>
									</a>
								</li>
							{/each}
						</ul>
					{:else}
						<p class="text-xs text-ink-3">Noch in keinem Eintrag erwähnt.</p>
					{/if}
				</div>

				{#if quests.length}
					<div class="panel p-4">
						<div class="mb-2 flex items-center gap-2 text-sm font-medium"><Flag size={14} class="text-warn" />Quests</div>
						<div class="flex flex-wrap gap-1.5">{#each quests as l (l.key)}<a class="chip" href={l.href} data-ref={l.key}>{l.title}</a>{/each}</div>
					</div>
				{/if}

				{#if others.length}
					<div class="panel p-4">
						<div class="mb-2 flex items-center gap-2 text-sm font-medium"><Link2 size={14} class="text-ink-3" />Erwähnt in</div>
						<div class="flex flex-wrap gap-1.5">{#each others as l (l.key)}<a class="chip" href={l.href} data-ref={l.key}>{l.title}</a>{/each}</div>
					</div>
				{/if}
			</aside>
		</div>
	{:else}
		<div class="panel p-10 text-center text-ink-2">Kein Eintrag gefunden.</div>
	{/if}
</div>

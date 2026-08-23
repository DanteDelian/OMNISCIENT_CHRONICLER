<script lang="ts">
	import { renderMarkdown } from '$lib/markdown';
	import type { Session } from '$lib/types';
	import BookOpen from '@lucide/svelte/icons/book-open';
	import ScrollText from '@lucide/svelte/icons/scroll-text';
	let { data } = $props();

	// aufsteigend: Kapitel 1 zuerst (Chronik-/Geschichts-Reihenfolge)
	const sessions = $derived([...(data.sessions as Session[])].sort((a, b) => a.number - b.number));
	let view = $state<'kapitel' | 'erzaehlung'>('kapitel');
</script>

<svelte:head><title>Chronik · Omniscient Chronicler</title></svelte:head>

<div class="mx-auto max-w-3xl">
	<div class="mb-5 flex flex-wrap items-end justify-between gap-3">
		<div>
			<p class="panel-title" style="color:var(--color-accent)">Die Chroniken von Xantus</p>
			<h1 class="mt-1 font-display text-3xl font-semibold tracking-tight">Chronik</h1>
			<p class="text-sm text-muted">Die Geschichte deiner Kampagne — Kapitel für Kapitel.</p>
		</div>
		<div class="flex rounded-xl border border-border p-0.5">
			<button
				class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition {view === 'kapitel' ? 'bg-primary/15 text-ink' : 'text-muted hover:text-ink'}"
				onclick={() => (view = 'kapitel')}
			><ScrollText class="h-4 w-4" /> Kapitel</button>
			<button
				class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition {view === 'erzaehlung' ? 'bg-primary/15 text-ink' : 'text-muted hover:text-ink'}"
				onclick={() => (view = 'erzaehlung')}
			><BookOpen class="h-4 w-4" /> Erzählung</button>
		</div>
	</div>

	{#if view === 'kapitel'}
		{#if sessions.length}
			<div class="relative">
				<div class="absolute bottom-4 left-[17px] top-4 w-px bg-gradient-to-b from-primary/50 via-border to-transparent"></div>
				<div class="flex flex-col gap-4">
					{#each sessions as s (s.id)}
						<div class="relative flex gap-4">
							<div class="relative z-10 grid h-9 w-9 shrink-0 place-items-center rounded-full border border-primary/40 bg-surface font-display text-sm font-semibold text-primary">
								{s.number}
							</div>
							<article class="card card-hover card-pad flex-1">
								<div class="flex items-baseline justify-between gap-2">
									<span class="panel-title" style="color:var(--color-accent)">Session {s.number}</span>
									<span class="text-xs text-muted">{s.date}</span>
								</div>
								<h2 class="mt-1 font-display text-xl font-semibold leading-snug">{s.title}</h2>
								{#if s.summary}<p class="mt-1.5 leading-relaxed text-ink/85">{s.summary}</p>{/if}
								{#if s.highlights?.length}
									<div class="mt-2.5 flex flex-wrap gap-1.5">
										{#each s.highlights as h, i (i)}<span class="chip text-xs">{h}</span>{/each}
									</div>
								{/if}
							</article>
						</div>
					{/each}
				</div>
			</div>
		{:else}
			<div class="card card-pad text-center text-muted">
				<ScrollText class="mx-auto mb-2 h-8 w-8 opacity-50" />
				<p>Noch keine Kapitel.</p>
				<p class="text-sm">Verarbeite deine erste Session in der <a href="/werkstatt" class="text-primary underline">Werkstatt</a>.</p>
			</div>
		{/if}
	{:else if data.body.trim()}
		<article class="card card-pad prose max-w-none dark:prose-invert">
			<!-- eslint-disable-next-line svelte/no-at-html-tags -->
			{@html renderMarkdown(data.body)}
		</article>
	{:else}
		<div class="card card-pad text-muted">Noch keine Erzählung vorhanden.</div>
	{/if}

	<p class="mt-6 text-center text-xs text-muted">
		Die Erzählung liegt in <code>campaign/chronicle.md</code> · Kapitel entstehen aus deinen Sessions.
	</p>
</div>

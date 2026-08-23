<script lang="ts">
	import { renderMarkdown } from '$lib/markdown';
	import { KNOWLEDGE_TIER_LABELS, type KnowledgeTier } from '$lib/types';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import Eye from '@lucide/svelte/icons/eye';
	import EyeOff from '@lucide/svelte/icons/eye-off';
	import Link2 from '@lucide/svelte/icons/link-2';
	let { data } = $props();

	const TIER_COLOR: Record<KnowledgeTier, string> = {
		fact: 'var(--color-success)',
		rumor: 'var(--color-accent)',
		theory: 'var(--color-primary)'
	};
	const TIER_ORDER: KnowledgeTier[] = ['fact', 'rumor', 'theory'];
	const byTier = $derived(
		TIER_ORDER.map((t) => ({ tier: t, entries: data.knowledge.filter((k) => k.tier === t) })).filter(
			(g) => g.entries.length
		)
	);
</script>

<svelte:head><title>{data.name} · Glossar</title></svelte:head>

<a href="/glossar" class="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
	<ArrowLeft class="h-4 w-4" /> Glossar
</a>

<div class="mx-auto grid max-w-3xl gap-4">
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
				nächsten KI-Import (Werkstatt) erzeugen.
			</p>
			<a class="btn btn-primary mt-4" href="/notes">Notiz erstellen</a>
		{/if}
	</div>

	<!-- Was wir wissen -->
	{#if byTier.length}
		<section class="card card-pad">
			<h2 class="panel-title mb-3">Was wir über {data.name} wissen</h2>
			<div class="grid gap-4">
				{#each byTier as g (g.tier)}
					<div>
						<p class="mb-1.5 text-xs font-medium" style="color:{TIER_COLOR[g.tier]}">
							{g.tier === 'theory' ? 'Theorien & offene Fragen' : KNOWLEDGE_TIER_LABELS[g.tier] + 'en'}
						</p>
						<ul class="grid gap-1.5">
							{#each g.entries as k (k.id)}
								<li class="flex items-start gap-2 text-sm">
									<span
										class="mt-1.5 h-2 w-2 shrink-0"
										style="background:{g.tier === 'theory' ? 'transparent' : TIER_COLOR[g.tier]};border:{g.tier === 'theory' ? '2px solid ' + TIER_COLOR.theory : 'none'};border-radius:{g.tier === 'fact' ? '2px' : '50%'}"
									></span>
									<span class="min-w-0">
										{k.statement}
										<span class="ml-1 whitespace-nowrap text-xs text-muted">
											{#if k.view === 'player'}<EyeOff class="inline h-3 w-3" />{:else}<Eye class="inline h-3 w-3" />{/if}
											{#if k.sourceSession}· S{k.sourceSession}{/if}
										</span>
									</span>
								</li>
							{/each}
						</ul>
					</div>
				{/each}
			</div>
			<p class="mt-3 text-xs text-muted">
				<Eye class="inline h-3 w-3" /> Charakterwissen · <EyeOff class="inline h-3 w-3" /> nur Spielerwissen —
				pflegen unter <a href="/wissen" class="text-primary underline">Wissen</a>.
			</p>
		</section>
	{/if}

	<!-- Verwoben mit (Backlinks) -->
	{#if data.backlinks.length}
		<section class="card card-pad">
			<h2 class="panel-title mb-3"><Link2 class="mr-1 inline h-4 w-4" /> Verwoben mit</h2>
			<div class="flex flex-wrap gap-1.5">
				{#each data.backlinks as b (b.path)}
					<a href="/glossar/{encodeURIComponent(b.title)}" class="chip hover:chip-active">{b.title}</a>
				{/each}
			</div>
		</section>
	{/if}
</div>

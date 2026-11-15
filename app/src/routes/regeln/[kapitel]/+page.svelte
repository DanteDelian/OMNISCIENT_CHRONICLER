<script lang="ts">
	/** Ein Kapitel des Regelwerks: Inhaltsverzeichnis links, jede Regel im vollen Wortlaut mit Sprungmarke. */
	import { page } from '$app/state';
	import { ArrowLeft, ArrowRight, Hash } from '@lucide/svelte';
	import Markdown from '$lib/components/Markdown.svelte';
	import DocIcon from '$lib/components/DocIcon.svelte';
	import { campaign } from '$lib/stores/campaign.svelte';
	import { ruleHref } from '$lib/rulebook';

	const chapters = $derived(campaign.data.rules);
	const idx = $derived(chapters.findIndex((c) => c.slug === page.params.kapitel));
	const ch = $derived(idx >= 0 ? chapters[idx] : undefined);
	const prev = $derived(idx > 0 ? chapters[idx - 1] : undefined);
	const next = $derived(idx >= 0 && idx < chapters.length - 1 ? chapters[idx + 1] : undefined);

	// Welche Regel gerade im Blick ist (für das Inhaltsverzeichnis)
	let current = $state('');
	$effect(() => {
		if (!ch) return;
		const obs = new IntersectionObserver(
			(entries) => {
				for (const e of entries) if (e.isIntersecting) current = e.target.id;
			},
			{ rootMargin: '-15% 0px -75% 0px' }
		);
		for (const r of ch.rules) {
			const el = document.getElementById(r.id);
			if (el) obs.observe(el);
		}
		return () => obs.disconnect();
	});
</script>

<svelte:head><title>{ch ? `${ch.title} · Regelwerk` : 'Regelwerk'} · Valerius</title></svelte:head>

{#if !ch}
	<div class="panel mx-auto mt-10 max-w-lg p-8 text-center">
		<p class="text-ink-2">Dieses Kapitel gibt es nicht.</p>
		<a class="btn mt-4" href="/regeln"><ArrowLeft size={15} />Zum Regelwerk</a>
	</div>
{:else}
	<div class="grid gap-10 xl:grid-cols-[236px_minmax(0,1fr)]">
		<aside class="hidden xl:block">
			<nav class="sticky top-6 max-h-[calc(100dvh-3rem)] overflow-y-auto pr-2 pb-6" aria-label="Inhalt des Kapitels">
				<a class="mb-5 flex items-center gap-1.5 text-xs text-ink-3 hover:text-ink" href="/regeln"><ArrowLeft size={13} />Regelwerk</a>
				<div class="eyebrow mb-2">Kapitel {ch.order}</div>
				<ul class="space-y-0.5 border-l border-line">
					{#each ch.rules as r (r.id)}
						<li>
							<a
								href="#{r.id}"
								class="-ml-px block border-l py-1 pr-2 pl-3 text-[0.82rem] leading-snug transition {current === r.id
									? 'border-gold text-ink'
									: 'border-transparent text-ink-3 hover:border-line-2 hover:text-ink-2'}">{r.name}</a
							>
						</li>
					{/each}
				</ul>
				<div class="eyebrow mt-8 mb-2">Weitere Kapitel</div>
				<ul class="space-y-0.5">
					{#each chapters as c (c.slug)}
						<li>
							<a class="flex items-center gap-2 rounded-lg px-2 py-1 text-[0.8rem] transition {c.slug === ch.slug ? 'bg-white/[0.06] text-ink' : 'text-ink-3 hover:text-ink-2'}" href={ruleHref(c.slug)}>
								<DocIcon name={c.icon} size={13} />{c.title}
							</a>
						</li>
					{/each}
				</ul>
			</nav>
		</aside>

		<article class="min-w-0 max-w-[880px]">
			<header class="mb-8">
				<a class="mb-4 flex items-center gap-1.5 text-xs text-ink-3 hover:text-ink xl:hidden" href="/regeln"><ArrowLeft size={13} />Regelwerk</a>
				<div class="flex items-start gap-4">
					<span class="mt-1 grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-line-2 bg-white/[0.03] text-gold"><DocIcon name={ch.icon} size={26} /></span>
					<div class="min-w-0">
						<div class="eyebrow">Regelwerk · Kapitel {ch.order} · {ch.rules.length} Regeln</div>
						<h1 class="title-display mt-1 text-[2.8rem] leading-none">{ch.title}</h1>
						{#if ch.en}<div class="mt-1 text-sm text-ink-3 italic">{ch.en}{#if ch.source}{' '}· {ch.source}{/if}</div>{/if}
					</div>
				</div>
				{#if ch.intro}<Markdown src={ch.intro} class="mt-6 text-[1rem]" />{/if}
				<div class="mt-5 flex flex-wrap gap-1.5 xl:hidden">
					{#each ch.rules as r (r.id)}<a class="chip !h-7" href="#{r.id}">{r.name}</a>{/each}
				</div>
			</header>

			{#each ch.rules as r (r.id)}
				<section id={r.id} class="scroll-mt-24 border-t border-line pt-8 pb-2">
					<div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
						<h2 class="title-display text-[1.95rem] leading-tight">
							<a class="group inline-flex items-baseline gap-2 hover:text-gold" href="#{r.id}">{r.name}<Hash size={16} class="opacity-0 transition group-hover:opacity-60" /></a>
						</h2>
						{#if r.en}<span class="text-sm text-ink-3 italic">{r.en}</span>{/if}
						{#if r.source}<span class="badge" style="--c: var(--color-warn)" title="Nicht aus dem SRD, in eigenen Worten">{r.source.replace(/, in eigenen Worten$/, '')}</span>{/if}
					</div>
					<Markdown src={r.text} class="mt-3" />
					{#if r.valerius}
						<div class="callout callout-val mt-5">
							<div class="callout-title" data-label="Für Valerius"></div>
							<Markdown src={r.valerius} class="prose-sm" />
						</div>
					{/if}
				</section>
			{/each}

			<nav class="mt-12 grid gap-3 border-t border-line pt-6 sm:grid-cols-2" aria-label="Kapitel blättern">
				{#if prev}
					<a class="panel panel-hover p-4" href={ruleHref(prev.slug)}>
						<span class="flex items-center gap-1 text-xs text-ink-3"><ArrowLeft size={12} />Vorheriges Kapitel</span>
						<span class="mt-1 block font-semibold text-ink">{prev.title}</span>
					</a>
				{:else}<span></span>{/if}
				{#if next}
					<a class="panel panel-hover p-4 text-right" href={ruleHref(next.slug)}>
						<span class="flex items-center justify-end gap-1 text-xs text-ink-3">Nächstes Kapitel<ArrowRight size={12} /></span>
						<span class="mt-1 block font-semibold text-ink">{next.title}</span>
					</a>
				{/if}
			</nav>

			<p class="mt-8 text-xs leading-relaxed text-ink-3">
				Enthält Regelinhalte aus dem System Reference Document 5.1 von Wizards of the Coast LLC, lizenziert unter CC BY 4.0, in eigener deutscher
				Übersetzung. Regeln aus anderen Büchern stehen in eigenen Worten und tragen ihre Quelle.
			</p>
		</article>
	</div>
{/if}

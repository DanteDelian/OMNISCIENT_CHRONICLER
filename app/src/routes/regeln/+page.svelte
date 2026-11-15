<script lang="ts">
	import { Search, ArrowRight } from '@lucide/svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import DocIcon from '$lib/components/DocIcon.svelte';
	import { campaign } from '$lib/stores/campaign.svelte';
	import { glossaryGroups } from '$lib/terms';
	import { normalizeName } from '$lib/refs';
	import { ruleHref, searchRules } from '$lib/rulebook';

	const chapters = $derived(campaign.data.rules);
	const total = $derived(chapters.reduce((n, c) => n + c.rules.length, 0));

	let q = $state('');
	const hits = $derived(searchRules(chapters, q, normalizeName));

	/** Treffer im Text hervorheben (HTML wird vorher maskiert). */
	function mark(text: string, query: string): string {
		const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
		const needle = query.trim();
		if (!needle) return esc(text);
		const re = new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
		let out = '';
		let last = 0;
		for (const m of text.matchAll(re)) {
			out += esc(text.slice(last, m.index)) + `<mark>${esc(m[0])}</mark>`;
			last = (m.index ?? 0) + m[0].length;
		}
		return out + esc(text.slice(last));
	}

	// Deutsch und Englisch, die häufigsten Begriffe zuerst, dazu alle übrigen Regeln
	const groups = $derived(glossaryGroups(campaign.data.character.features, chapters, true));
	let gq = $state('');
	const shown = $derived.by(() => {
		const f = gq.trim().toLowerCase();
		if (!f) return groups;
		return groups
			.map((g) => ({ ...g, terms: g.terms.filter(([de, en]) => de.toLowerCase().includes(f) || en.toLowerCase().includes(f)) }))
			.filter((g) => g.terms.length);
	});
</script>

<svelte:head><title>Regelwerk · Valerius</title></svelte:head>

<PageHeader
	eyebrow="Regeln"
	title="Regelwerk"
	subtitle="D&D 5e im vollen Wortlaut: das SRD 5.1 übersetzt, ergänzt um Regeln aus Xanathars Ratgeber und dem Spielleiterhandbuch in eigenen Worten. Bei jeder Regel steht, was sie für Valerius bedeutet."
/>

<div class="relative mb-8 max-w-2xl">
	<Search size={18} class="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-ink-3" />
	<input class="input !h-12 !rounded-2xl !pl-11 text-[1rem]" placeholder="{total} Regeln durchsuchen: Deckung, Opportunity Attack, Konzentration …" bind:value={q} aria-label="Regeln durchsuchen" />
</div>

{#if q.trim()}
	<section class="mb-12" aria-live="polite">
		<div class="eyebrow mb-3">{hits.length ? `${hits.length} Treffer` : 'Keine Treffer'}</div>
		<ul class="space-y-2">
			{#each hits as h (`${h.chapter.slug}/${h.rule.id}`)}
				<li>
					<a class="panel panel-hover flex items-start gap-4 p-4" href={ruleHref(h.chapter.slug, h.rule.id)}>
						<span class="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/[0.04] text-astral"><DocIcon name={h.chapter.icon} size={17} /></span>
						<span class="min-w-0 flex-1">
							<span class="flex flex-wrap items-baseline gap-x-2">
								<span class="font-semibold text-ink">{@html mark(h.rule.name, q)}</span>
								{#if h.rule.en}<span class="text-xs text-ink-3 italic">{@html mark(h.rule.en, q)}</span>{/if}
								<span class="text-xs text-ink-3">· {h.chapter.title}</span>
							</span>
							<span class="mt-1 block text-sm leading-relaxed text-ink-2">{@html mark(h.snippet, q)}</span>
						</span>
					</a>
				</li>
			{/each}
		</ul>
	</section>
{:else}
	<section class="stagger mb-12 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
		{#each chapters as ch (ch.slug)}
			<a class="panel panel-hover group flex flex-col p-5" href={ruleHref(ch.slug)}>
				<div class="flex items-start gap-3">
					<span class="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-line-2 bg-white/[0.03] text-astral transition group-hover:text-gold">
						<DocIcon name={ch.icon} size={20} />
					</span>
					<div class="min-w-0">
						<div class="eyebrow">Kapitel {ch.order} · {ch.rules.length} Regeln</div>
						<h2 class="title-display mt-1 text-[1.65rem]">{ch.title}</h2>
						{#if ch.en}<div class="text-xs text-ink-3 italic">{ch.en}</div>{/if}
					</div>
				</div>
				{#if ch.summary}<p class="mt-3 text-sm leading-relaxed text-ink-2">{ch.summary}</p>{/if}
				<div class="mt-auto flex flex-wrap gap-1.5 pt-4">
					{#each ch.rules.slice(0, 6) as r (r.id)}<span class="chip !h-6 !px-2 !text-[0.7rem]">{r.name}</span>{/each}
					{#if ch.rules.length > 6}<span class="chip !h-6 !px-2 !text-[0.7rem] text-ink-3">+{ch.rules.length - 6}</span>{/if}
				</div>
				<span class="mt-3 flex items-center gap-1 text-xs text-ink-3 transition group-hover:text-ink">Lesen <ArrowRight size={12} /></span>
			</a>
		{/each}
	</section>
{/if}

<section id="begriffe" class="mb-10 scroll-mt-24">
	<div class="mb-3 flex flex-wrap items-end justify-between gap-3">
		<div>
			<h2 class="title-display text-3xl">Deutsch – Englisch</h2>
			<p class="mt-1 text-sm text-ink-3">Für den DM, der gern Denglisch spricht. Die Suche findet beide Sprachen.</p>
		</div>
		<div class="relative w-full sm:w-64">
			<Search size={14} class="absolute top-1/2 left-3 -translate-y-1/2 text-ink-3" />
			<input class="input !pl-8" placeholder="z. B. Perception" bind:value={gq} aria-label="Begriffe durchsuchen" />
		</div>
	</div>
	<div class="columns-1 gap-4 md:columns-2 xl:columns-3">
		{#each shown as g (g.group)}
			<article class="panel mb-4 break-inside-avoid p-4">
				<h3 class="mb-2 font-semibold">{g.group}</h3>
				<table class="w-full text-sm">
					<tbody>
						{#each g.terms as [de, en] (de)}
							<tr class="border-b border-line last:border-0">
								<td class="py-1 pr-3 text-ink">{de}</td>
								<td class="py-1 text-ink-2 italic">{en}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</article>
		{:else}
			<p class="text-sm text-ink-3">Kein Begriff gefunden.</p>
		{/each}
	</div>
</section>

<p class="mt-4 text-xs leading-relaxed text-ink-3">
	Enthält Regelinhalte aus dem System Reference Document 5.1 („SRD 5.1“) von Wizards of the Coast LLC, verfügbar unter
	https://dnd.wizards.com/resources/systems-reference-document, lizenziert unter der Creative Commons Attribution 4.0 International License
	(https://creativecommons.org/licenses/by/4.0/legalcode), in eigener deutscher Übersetzung. Regeln aus anderen Büchern stehen in eigenen Worten
	und sind mit ihrer Quelle gekennzeichnet.
</p>

<script lang="ts">
	import { ExternalLink, ArrowRight, Image, FileText, RefreshCw } from '@lucide/svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import DocIcon from '$lib/components/DocIcon.svelte';
	import { campaign } from '$lib/stores/campaign.svelte';
	import { fmtDate } from '$lib/format';
	import type { Source } from '$lib/types';

	const docs = $derived(campaign.data.docs);
	const sources = $derived(campaign.data.sources);

	const STATUS: Record<Source['status'], { label: string; color: string; hint: string }> = {
		kanon: { label: 'Kanon', color: 'var(--color-life)', hint: 'Original, gilt so' },
		referenz: { label: 'Referenz', color: 'var(--color-astral-2)', hint: 'Nützlich, Fehler sind im Grimoire korrigiert' },
		teilweise: { label: 'Teilweise falsch', color: 'var(--color-warn)', hint: 'Enthält Fehler, im Grimoire korrigiert' },
		veraltet: { label: 'Veraltet', color: 'var(--color-ink-3)', hint: 'Durch das Grimoire ersetzt' },
		gemini: { label: 'Gemini-Entwurf', color: 'var(--color-s-verz)', hint: 'Nur Vorschläge, nicht übernommen' }
	};

	const groups = $derived([...new Set(sources.map((s) => s.group))]);

	const PAGES = [
		{ href: '/bogen', title: 'Charakterbogen', text: 'Alle Werte, Fertigkeiten, Merkmale. Druckbar.' },
		{ href: '/zauber', title: 'Zauberbuch', text: 'Vollständige Regeltexte, Tipps, Rechner, Korrekturen.' },
		{ href: '/gefolge', title: 'Gefolge', text: 'Vertraute, Diener, Untote, Gefährtin.' },
		{ href: '/journal', title: 'Journal', text: 'Die Chronik mit Daten und Quellen.' },
		{ href: '/karte', title: 'Echsen-Karte', text: 'Mit gedeuteten und eigenen Markierungen.' },
		{ href: '/regeln', title: 'Regeln', text: 'Zustände, Aktionen, Konzentration, Rasten.' }
	];
</script>

<svelte:head><title>Archiv · Valerius</title></svelte:head>

<PageHeader
	eyebrow="Archiv"
	title="Dokumente und Quellen"
	subtitle="Die Grimoire-Dokumente (korrigiert und verlinkt) und alle Originale aus deinem Google Drive mit Bewertung. Gemini-Entwürfe sind gekennzeichnet."
/>

<section class="mb-10">
	<h2 class="title-display mb-3 text-2xl">Im Grimoire</h2>
	<div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
		{#each docs as d (d.slug)}
			<a href="/archiv/{d.slug}" class="panel panel-hover flex flex-col p-4 {d.slug === 'pruefbericht' ? 'panel-glow' : ''}" data-ref="doc:{d.slug}">
				<div class="mb-3 flex items-center justify-between">
					<span class="grid h-9 w-9 place-items-center rounded-xl bg-astral/10 text-astral"><DocIcon name={d.icon} size={17} /></span>
					<span class="eyebrow">{d.group}</span>
				</div>
				<h3 class="font-semibold">{d.title}</h3>
				{#if d.subtitle}<p class="mt-1 flex-1 text-[0.84rem] text-ink-2">{d.subtitle}</p>{/if}
				{#if d.updated}<p class="mt-3 text-[0.7rem] text-ink-3">Stand {fmtDate(d.updated)}</p>{/if}
			</a>
		{/each}
		{#each PAGES as p (p.href)}
			<a href={p.href} class="panel panel-hover flex flex-col p-4">
				<div class="mb-3 flex items-center justify-between">
					<span class="grid h-9 w-9 place-items-center rounded-xl bg-white/5 text-ink-2"><ArrowRight size={17} /></span>
					<span class="eyebrow">Seite</span>
				</div>
				<h3 class="font-semibold">{p.title}</h3>
				<p class="mt-1 text-[0.84rem] text-ink-2">{p.text}</p>
			</a>
		{/each}
	</div>
</section>

<section>
	<div class="mb-3 flex flex-wrap items-end justify-between gap-3">
		<h2 class="title-display text-2xl">Originale in Google Drive</h2>
		<div class="flex flex-wrap gap-2 text-xs">
			{#each Object.entries(STATUS) as [k, st] (k)}
				<span class="badge" style="--c: {st.color}" title={st.hint}>{st.label}</span>
			{/each}
		</div>
	</div>

	{#each groups as g (g)}
		<div class="mb-6">
			<div class="eyebrow mb-2">{g}</div>
			<div class="grid gap-3 lg:grid-cols-2">
				{#each sources.filter((s) => s.group === g) as s (s.id)}
					{@const st = STATUS[s.status]}
					<article class="panel flex gap-4 p-4">
						<span class="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/5 text-ink-2">
							{#if s.kind === 'bild'}<Image size={18} />{:else}<FileText size={18} />{/if}
						</span>
						<div class="min-w-0 flex-1">
							<div class="flex flex-wrap items-center gap-2">
								<h3 class="font-medium">{s.title}</h3>
								<span class="badge" style="--c: {st.color}" title={st.hint}>{st.label}</span>
							</div>
							<p class="mt-1 text-[0.84rem] leading-relaxed text-ink-2">{s.summary}</p>
							<div class="mt-2.5 flex flex-wrap items-center gap-2">
								<a class="btn btn-xs" href={s.url} target="_blank" rel="noreferrer"><ExternalLink size={11} />In Drive öffnen</a>
								{#if s.local}<a class="btn btn-xs btn-ghost" href={s.local}>Im Grimoire<ArrowRight size={11} /></a>{/if}
								<span class="text-[0.7rem] text-ink-3">geändert {fmtDate(s.modified)}</span>
							</div>
						</div>
					</article>
				{/each}
			</div>
		</div>
	{/each}

	<div class="callout callout-note mt-2">
		<div class="callout-title" data-label="Abgleich"><RefreshCw size={14} />Neue Notizen in Drive?</div>
		<p class="text-sm">
			Sag Claude Code: „Gleiche das Grimoire mit meinem Drive-Ordner Valerius ab.“ Claude liest die Dokumente, prüft sie gegen die Regeln und trägt Änderungen in
			<code>campaign/</code> ein. Das Grimoire aktualisiert sich dabei live.
		</p>
	</div>
</section>

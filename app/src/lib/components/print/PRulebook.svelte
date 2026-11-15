<script lang="ts">
	/**
	 * Regelwerk im vollen Wortlaut (campaign/regeln/*.md). Jede Regel trägt eine Sprungmarke,
	 * damit [[Verweise]] aus allen anderen Teilen im PDF hierher springen.
	 */
	import PDoc from './PDoc.svelte';
	import PMd from './PMd.svelte';
	import { campaign } from '$lib/stores/campaign.svelte';
	import { printAnchor } from '$lib/markdown';
	import { SRD_NOTICE } from '$lib/rulebook';

	const chapters = $derived(campaign.data.rules);
	/** Kurze Regeln bleiben am Stück, lange dürfen über die Spalte umbrechen */
	const SHORT = 700;
</script>

<PDoc
	id="regelwerk"
	eyebrow="Regelwerk"
	title="Regeln im vollen Wortlaut"
	subtitle="D&D 5e: das SRD 5.1 übersetzt, ergänzt um Regeln aus Xanathars Ratgeber und dem Spielleiterhandbuch in eigenen Worten. Gold markiert, was für Valerius gilt."
>
	<div class="rb-toc small">
		{#each chapters as ch (ch.slug)}
			<a href="#{printAnchor(`rulechapter:${ch.slug}`)}"><b>{ch.title}</b> <span class="muted">· {ch.rules.length} Regeln</span></a>
		{/each}
	</div>

	{#each chapters as ch, i (ch.slug)}
		<section class={i > 0 ? 'page-break' : ''}>
			<h2 id={printAnchor(`rulechapter:${ch.slug}`)} style={i === 0 ? 'margin-top: 5mm' : 'margin-top: 0'}>
				{ch.title}{#if ch.en}<span class="count">{ch.en}</span>{/if}
			</h2>
			{#if ch.source}<p class="tiny muted" style="margin-top: -1.4mm">Quelle: {ch.source}</p>{/if}
			{#if ch.intro}<PMd src={ch.intro} class="small" />{/if}
			<div class="cols-2">
				{#each ch.rules as r (r.id)}
					<div class="rb-rule {r.text.length < SHORT ? 'avoid' : ''}" id={printAnchor(`rule:${ch.slug}/${r.id}`)}>
						<h3>{r.name}{#if r.en}{' '}<i class="tiny muted" style="font-weight: 400">{r.en}</i>{/if}</h3>
						<PMd src={r.text} class="small" />
						{#if r.valerius}<div class="for-val small"><span class="label">Für Valerius</span> <PMd src={r.valerius} inline /></div>{/if}
						{#if r.source}<p class="tiny muted">Quelle: {r.source}</p>{/if}
					</div>
				{/each}
			</div>
		</section>
	{/each}

	<p class="tiny muted" style="margin-top: 5mm">{SRD_NOTICE}</p>
</PDoc>


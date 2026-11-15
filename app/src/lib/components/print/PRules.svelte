<script lang="ts">
	/** Spickzettel: die Zustände im Wortlaut, dazu Kurzfassungen der Regeln, die am Tisch am häufigsten fallen. */
	import PDoc from './PDoc.svelte';
	import PMd from './PMd.svelte';
	import { campaign } from '$lib/stores/campaign.svelte';
	import { conditionRules, rulesOf } from '$lib/rulebook';
	import { EXHAUSTION } from '$lib/rules';
	import type { Rule } from '$lib/types';

	const PICK: { slug: string; title: string; ids?: string[] }[] = [
		{ slug: 'aktionen', title: 'Aktionen im Kampf' },
		{ slug: 'kampf', title: 'Kampfablauf', ids: ['ueberraschung', 'dein-zug', 'bonusaktionen', 'andere-taetigkeiten', 'reaktionen', 'schwieriges-gelaende', 'liegen-und-aufstehen', 'zwaengen', 'berittener-kampf'] },
		{ slug: 'angriffe', title: 'Angriffe und Deckung', ids: ['ungesehene-angreifer-und-ziele', 'fernkampfangriffe', 'gelegenheitsangriffe', 'packen', 'stossen', 'deckung'] },
		{ slug: 'schaden', title: 'Schaden und Sterben', ids: ['kritische-treffer', 'resistenz-und-anfaelligkeit', 'auf-0-trefferpunkte-fallen', 'todesrettungswuerfe', 'stabilisieren', 'bewusstlos-schlagen', 'temporaere-trefferpunkte'] },
		{ slug: 'zauberwirken', title: 'Zauberwirken', ids: ['wirkzeit', 'komponenten', 'konzentration', 'rituale', 'zauberwirken-wahrnehmen', 'einen-zauber-erkennen', 'ungueltige-ziele'] },
		{ slug: 'wuerfe', title: 'Würfe', ids: ['vorteil-und-nachteil', 'passive-wuerfe', 'sich-verstecken'] },
		{ slug: 'abenteuer', title: 'Sicht und Rasten', ids: ['sicht-und-licht', 'besondere-sinne', 'stuerzen', 'kurze-rast', 'lange-rast'] }
	];

	const conditions = $derived(conditionRules(campaign.data.rules));
	const groups = $derived(
		PICK.map((p) => {
			const all = rulesOf(campaign.data.rules, p.slug);
			const rules = p.ids ? p.ids.map((id) => all.find((r) => r.id === id)).filter((r): r is Rule => !!r) : all;
			return { ...p, rules };
		}).filter((g) => g.rules.length)
	);
</script>

<PDoc
	id="regeln"
	refs={['page:regeln']}
	eyebrow="Regeln"
	title="Spickzettel"
	subtitle="D&D 5e (SRD 5.1, ergänzt aus Xanathars). Die Zustände im Wortlaut, die übrigen Regeln als Kurzfassung. Der volle Text steht im Regelwerk. Gold markiert, was für Valerius gilt."
>
	<h2 style="margin-top: 0">Zustände <span class="count">Conditions</span></h2>
	<div class="cols-2">
		{#each conditions as cond (cond.id)}
			<div class="avoid" style="margin-bottom: 2.4mm">
				<b>{cond.name}</b>{#if cond.en}{' '}<i class="tiny muted">{cond.en}</i>{/if}
				<PMd src={cond.text} class="small" />
				{#if cond.valerius}<div class="for-val small" style="margin: 0.6mm 0 0"><PMd src={cond.valerius} inline /></div>{/if}
			</div>
		{/each}
		<div class="avoid" style="margin-bottom: 2.4mm">
			<b>Erschöpfung</b> <i class="tiny muted">Exhaustion</i> <span class="tiny muted">(Stufen sind kumulativ, eine lange Rast mit Essen und Trinken senkt um 1)</span>
			<ol class="small" style="list-style: decimal; padding-left: 4.4mm; margin-top: 0.6mm">{#each EXHAUSTION as e (e)}<li>{e}</li>{/each}</ol>
		</div>
	</div>

	{#each groups as g (g.slug)}
		<h2>{g.title}</h2>
		<div class="cols-2">
			{#each g.rules as r (r.id)}
				<div class="avoid" style="margin-bottom: 2.2mm">
					<b>{r.name}</b>{#if r.en}{' '}<i class="tiny muted">{r.en}</i>{/if}<b>.</b> <span class="small"><PMd src={r.short ?? r.summary} inline /></span>
					{#if r.valerius}<div class="for-val small" style="margin: 0.8mm 0 0"><PMd src={r.valerius} inline /></div>{/if}
				</div>
			{/each}
		</div>
	{/each}
</PDoc>

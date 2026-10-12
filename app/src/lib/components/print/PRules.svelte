<script lang="ts">
	import PDoc from './PDoc.svelte';
	import PMd from './PMd.svelte';
	import { ACTIONS, COMBAT_RULES, CONDITIONS, DEATH_RULES, EXHAUSTION, REST_RULES, SPELL_RULES, VISION_RULES, type RuleItem } from '$lib/rules-ref';

	const GROUPS: { title: string; items: RuleItem[] }[] = [
		{ title: 'Aktionen im Kampf', items: ACTIONS },
		{ title: 'Zaubern', items: SPELL_RULES },
		{ title: 'Kampfregeln', items: COMBAT_RULES },
		{ title: 'Sicht und Licht', items: VISION_RULES },
		{ title: 'Tod und Sterben', items: DEATH_RULES },
		{ title: 'Rasten', items: REST_RULES }
	];
</script>

<PDoc id="regeln" refs={['page:regeln']} eyebrow="Regeln" title="Spickzettel" subtitle="D&D 5e (Spielerhandbuch 2014 / SRD 5.1). Gold markiert, was für Valerius besonders gilt.">
	<h2 style="margin-top: 0">Zustände</h2>
	<div class="cols-2">
		{#each CONDITIONS as cond (cond.id)}
			<div class="avoid" style="margin-bottom: 2.4mm">
				<b>{cond.name}</b>
				<ul class="bullets small" style="margin-bottom: 0.6mm">{#each cond.effects as e (e)}<li><PMd src={e} inline /></li>{/each}</ul>
				{#if cond.valerius}<div class="for-val small" style="margin: 0.6mm 0 0"><PMd src={cond.valerius} inline /></div>{/if}
			</div>
		{/each}
		<div class="avoid" style="margin-bottom: 2.4mm">
			<b>Erschöpfung</b> <span class="tiny muted">(Stufen sind kumulativ)</span>
			<ol class="small" style="list-style: decimal; padding-left: 4.4mm; margin-top: 0.6mm">{#each EXHAUSTION as e (e)}<li>{e}</li>{/each}</ol>
		</div>
	</div>

	{#each GROUPS as g (g.title)}
		<h2>{g.title}</h2>
		<div class="cols-2">
			{#each g.items as r (r.name)}
				<div class="avoid" style="margin-bottom: 2.2mm">
					<b>{r.name}.</b> <span class="small"><PMd src={r.text} inline /></span>
					{#if r.valerius}<div class="for-val small" style="margin: 0.8mm 0 0"><PMd src={r.valerius} inline /></div>{/if}
				</div>
			{/each}
		</div>
	{/each}
</PDoc>

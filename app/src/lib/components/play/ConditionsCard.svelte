<script lang="ts">
	/** Zustände am Spieltisch: antippen setzt sie, aktive zeigen den vollen Regeltext. */
	import Markdown from '../Markdown.svelte';
	import { campaign } from '$lib/stores/campaign.svelte';
	import { toggleCondition } from '$lib/game';
	import { conditionRules, ruleHref, rulesOf } from '$lib/rulebook';
	import { EXHAUSTION } from '$lib/rules';

	const s = $derived(campaign.data.state);
	const conditions = $derived(conditionRules(campaign.data.rules));
	const active = $derived(conditions.filter((x) => s.conditions.includes(x.id)));
	const exhaustion = $derived(rulesOf(campaign.data.rules, 'zustaende').find((r) => r.id === 'erschoepfung'));

	function setExhaustion(n: number) {
		campaign.change('state', (st) => (st.exhaustion = Math.max(0, Math.min(6, n))));
	}
</script>

<section class="panel p-5">
	<div class="mb-3 flex items-center justify-between">
		<div class="eyebrow">Zustände</div>
		<a class="text-xs text-ink-3 hover:text-ink" href={ruleHref('zustaende')}>Wortlaut →</a>
	</div>
	<div class="flex flex-wrap gap-1.5">
		{#each conditions as cond (cond.id)}
			{@const on = s.conditions.includes(cond.id)}
			<button
				class="chip {on ? '!border-blood/60 !bg-blood/15 !text-ink' : ''}"
				aria-pressed={on}
				onclick={() => toggleCondition(cond.id)}
				title={(cond.en ? `${cond.en}: ` : '') + cond.summary}>{cond.name}</button
			>
		{/each}
	</div>

	{#if active.length}
		<div class="mt-3 space-y-2">
			{#each active as cond (cond.id)}
				<div class="rounded-xl border border-blood/30 bg-blood/[0.06] p-3">
					<div class="flex items-baseline justify-between gap-2">
						<div class="text-sm font-semibold">{cond.name}{#if cond.en}{' '}<span class="font-normal text-ink-3 italic">{cond.en}</span>{/if}</div>
						<a class="shrink-0 text-[0.7rem] text-ink-3 hover:text-ink" href={ruleHref('zustaende', cond.id)} data-ref="rule:zustaende/{cond.id}">Regel</a>
					</div>
					<Markdown src={cond.text} class="prose-sm mt-1" />
					{#if cond.valerius}<div class="mt-2 rounded-lg bg-gold/[0.08] px-2.5 py-1.5 text-xs text-ink-2"><b class="text-gold">Für Valerius:</b> <Markdown src={cond.valerius} inline /></div>{/if}
				</div>
			{/each}
		</div>
	{/if}

	<div class="mt-4 flex items-center gap-3 border-t border-line pt-3">
		<span class="text-sm text-ink-2" title={exhaustion?.summary}>Erschöpfung</span>
		<div class="flex gap-1">
			{#each [0, 1, 2, 3, 4, 5, 6] as n (n)}
				<button
					class="num h-7 w-7 rounded-lg text-xs font-semibold transition {s.exhaustion === n
						? n === 0
							? 'bg-white/10 text-ink'
							: 'bg-blood/25 text-ink'
						: 'text-ink-3 hover:bg-white/5'}"
					aria-label="Erschöpfungsstufe {n}"
					onclick={() => setExhaustion(n)}>{n}</button
				>
			{/each}
		</div>
	</div>
	{#if s.exhaustion > 0}
		<p class="mt-2 text-xs text-ink-2">Aktiv: {EXHAUSTION.slice(0, s.exhaustion).join(' · ')}</p>
	{/if}
</section>

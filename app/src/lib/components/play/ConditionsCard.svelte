<script lang="ts">
	import { campaign } from '$lib/stores/campaign.svelte';
	import { toggleCondition } from '$lib/game';
	import { CONDITIONS, EXHAUSTION } from '$lib/rules-ref';

	const s = $derived(campaign.data.state);
	const active = $derived(CONDITIONS.filter((x) => s.conditions.includes(x.id)));

	function setExhaustion(n: number) {
		campaign.change('state', (st) => (st.exhaustion = Math.max(0, Math.min(6, n))));
	}
</script>

<section class="panel p-5">
	<div class="mb-3 flex items-center justify-between">
		<div class="eyebrow">Zustände</div>
		<a class="text-xs text-ink-3 hover:text-ink" href="/regeln#zustaende">Regeln →</a>
	</div>
	<div class="flex flex-wrap gap-1.5">
		{#each CONDITIONS as cond (cond.id)}
			{@const on = s.conditions.includes(cond.id)}
			<button
				class="chip {on ? '!border-blood/60 !bg-blood/15 !text-ink' : ''}"
				onclick={() => toggleCondition(cond.id)}
				title={(cond.en ? `${cond.en}\n\n` : '') + cond.effects.join('\n') + (cond.valerius ? `\n\nFür Valerius: ${cond.valerius}` : '')}>{cond.name}</button
			>
		{/each}
	</div>

	{#if active.length}
		<div class="mt-3 space-y-2">
			{#each active as cond (cond.id)}
				<div class="rounded-xl border border-blood/30 bg-blood/[0.06] p-3">
					<div class="text-sm font-semibold">{cond.name}{#if cond.en} <span class="font-normal text-ink-3 italic">{cond.en}</span>{/if}</div>
					<ul class="mt-1 space-y-0.5 text-xs text-ink-2">
						{#each cond.effects as e (e)}<li>• {e}</li>{/each}
					</ul>
					{#if cond.valerius}<p class="mt-1 text-xs text-astral">{cond.valerius}</p>{/if}
				</div>
			{/each}
		</div>
	{/if}

	<div class="mt-4 flex items-center gap-3 border-t border-line pt-3">
		<span class="text-sm text-ink-2">Erschöpfung</span>
		<div class="flex gap-1">
			{#each [0, 1, 2, 3, 4, 5, 6] as n (n)}
				<button
					class="num h-7 w-7 rounded-lg text-xs font-semibold transition {s.exhaustion === n
						? n === 0
							? 'bg-white/10 text-ink'
							: 'bg-blood/25 text-ink'
						: 'text-ink-3 hover:bg-white/5'}"
					onclick={() => setExhaustion(n)}>{n}</button
				>
			{/each}
		</div>
	</div>
	{#if s.exhaustion > 0}
		<p class="mt-2 text-xs text-ink-2">Aktiv: {EXHAUSTION.slice(0, s.exhaustion).join(' · ')}</p>
	{/if}
</section>

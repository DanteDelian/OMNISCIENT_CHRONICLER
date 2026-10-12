<script lang="ts">
	/** Trefferrechner: Chance und erwarteter Schaden gegen ein frei wählbares Ziel. */
	import { averageOf, failChance, hitChance, pct, spellAttack, spellDc } from '$lib/rules';
	import { campaign } from '$lib/stores/campaign.svelte';
	import type { Spell } from '$lib/types';

	let { spell }: { spell: Spell } = $props();

	let ac = $state(13);
	let save = $state(2);

	const c = $derived(campaign.data.character);
	const atk = $derived(spellAttack(c));
	const dc = $derived(spellDc(c));
	const rays = $derived(spell.id === 'sengender-strahl' ? 3 : 1);
	const hit = $derived(hitChance(atk, ac));
	const fail = $derived(failChance(save, dc));
	const firstAvg = $derived(spell.rolls?.[0] ? averageOf(spell.rolls[0].expr) : 0);
	const secondAvg = $derived(spell.rolls?.[1] ? averageOf(spell.rolls[1].expr) : 0);

	const expected = $derived.by(() => {
		if (spell.id === 'eismesser') return hit * firstAvg + fail * secondAvg;
		if (spell.id === 'totenglocke') return fail * secondAvg;
		if (!spell.damage) return 0;
		if (spell.attack) return hit * firstAvg * rays;
		if (spell.save && firstAvg) return fail * firstAvg;
		return 0;
	});
</script>

<div class="sunken space-y-3 p-3.5">
	<div class="eyebrow">Rechner</div>
	{#if spell.attack}
		<label class="block">
			<div class="mb-1 flex justify-between text-xs"><span class="text-ink-2">RK des Ziels</span><span class="num text-ink">{ac}</span></div>
			<input type="range" min="8" max="22" bind:value={ac} class="w-full accent-[var(--color-astral)]" />
		</label>
	{/if}
	{#if spell.save}
		<label class="block">
			<div class="mb-1 flex justify-between text-xs"><span class="text-ink-2">{spell.save}-Rettungswurf des Ziels</span><span class="num text-ink">{save >= 0 ? '+' : ''}{save}</span></div>
			<input type="range" min="-3" max="10" bind:value={save} class="w-full accent-[var(--color-astral-2)]" />
		</label>
	{/if}
	<div class="grid grid-cols-2 gap-2 text-center">
		{#if spell.attack}
			<div class="rounded-lg bg-white/[0.03] p-2">
				<div class="num text-xl font-semibold">{pct(hit)}</div>
				<div class="text-[0.7rem] text-ink-3">Treffer (+{atk}){rays > 1 ? ' je Strahl' : ''}</div>
			</div>
		{/if}
		{#if spell.save}
			<div class="rounded-lg bg-white/[0.03] p-2">
				<div class="num text-xl font-semibold">{pct(fail)}</div>
				<div class="text-[0.7rem] text-ink-3">Ziel scheitert (SG {dc})</div>
			</div>
		{/if}
		{#if expected}
			<div class="rounded-lg bg-white/[0.03] p-2">
				<div class="num text-xl font-semibold text-astral-2">{expected.toFixed(1).replace('.', ',')}</div>
				<div class="text-[0.7rem] text-ink-3">Ø Schaden pro Wirken{spell.id === 'totenglocke' ? ' (verletztes Ziel)' : ''}</div>
			</div>
		{/if}
	</div>
</div>

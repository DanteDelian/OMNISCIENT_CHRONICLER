<script lang="ts">
	/** Wertblock einer Kreatur (Vertrauter oder Untoter), Angriffe sind würfelbar. */
	import type { Snippet } from 'svelte';
	import { Dices } from '@lucide/svelte';
	import { ABILITIES, fmtMod, mod, diceDe } from '$lib/rules';
	import { rolls } from '$lib/stores/rolls.svelte';
	import type { Ability, StatTrait } from '$lib/types';

	let {
		id,
		name,
		subtitle = '',
		ac,
		acNote = '',
		hp,
		hpFormula = '',
		speed,
		abilities,
		lines = [],
		traits = [],
		actions = [],
		actionsNote = '',
		verdict = '',
		note = '',
		highlight = false,
		top
	}: {
		id: string;
		name: string;
		subtitle?: string;
		ac: number;
		acNote?: string;
		hp: number;
		hpFormula?: string;
		speed: string;
		abilities: Record<Ability, number>;
		lines?: [string, string | undefined][];
		traits?: StatTrait[];
		actions?: { name: string; bonus: number; damage: string; type: string; range: string }[];
		actionsNote?: string;
		verdict?: string;
		note?: string;
		highlight?: boolean;
		top?: Snippet;
	} = $props();
</script>

<article {id} class="panel scroll-mt-24 p-5 {highlight ? 'panel-glow' : ''}">
	<div class="flex items-start justify-between gap-3">
		<div>
			<h3 class="title-display text-3xl">{name}</h3>
			{#if subtitle}<p class="text-sm text-ink-3 italic">{subtitle}</p>{/if}
		</div>
		{@render top?.()}
	</div>

	<div class="mt-3 grid grid-cols-3 gap-2 text-center">
		<div class="sunken px-2 py-2"><div class="num text-xl font-semibold">{ac}</div><div class="text-[0.65rem] text-ink-3">RK{acNote ? ` (${acNote})` : ''}</div></div>
		<div class="sunken px-2 py-2"><div class="num text-xl font-semibold">{hp}</div><div class="text-[0.65rem] text-ink-3">TP{hpFormula ? ` (${hpFormula})` : ''}</div></div>
		<div class="sunken px-2 py-2"><div class="num text-sm leading-7 font-semibold">{speed}</div><div class="text-[0.65rem] text-ink-3">Bewegung</div></div>
	</div>

	<div class="mt-2 grid grid-cols-6 gap-1 text-center">
		{#each ABILITIES as a (a.key)}
			<div class="rounded-lg bg-white/[0.03] py-1.5">
				<div class="text-[0.6rem] font-semibold text-ink-3">{a.short}</div>
				<div class="num text-sm font-semibold">{abilities[a.key]}</div>
				<div class="num text-[0.65rem] text-ink-3">{fmtMod(mod(abilities[a.key]))}</div>
			</div>
		{/each}
	</div>

	{#if lines.some(([, v]) => v)}
		<dl class="mt-3 space-y-1 text-[0.82rem]">
			{#each lines.filter(([, v]) => v) as [k, v] (k)}
				<div class="flex gap-2"><dt class="w-28 shrink-0 text-ink-3">{k}</dt><dd class="text-ink-2">{v}</dd></div>
			{/each}
		</dl>
	{/if}

	{#if traits.length}
		<div class="mt-3 space-y-1.5">
			{#each traits as t (t.name)}
				<p class="text-[0.84rem] leading-relaxed text-ink-2"><b class="text-ink italic">{t.name}.</b> {t.text}</p>
			{/each}
		</div>
	{/if}

	{#if actions.length}
		<div class="mt-3 border-t border-line pt-3">
			<div class="eyebrow mb-2">Aktionen {actionsNote}</div>
			<ul class="space-y-1.5">
				{#each actions as a (a.name)}
					<li class="flex flex-wrap items-center gap-2 text-sm">
						<span class="flex-1 text-ink-2"><b class="text-ink">{a.name}</b> · {a.range} · {diceDe(a.damage)} {a.type}</span>
						<button class="btn btn-xs" onclick={() => rolls.check(`${name}: ${a.name}`, a.bonus)}>{fmtMod(a.bonus)}</button>
						<button class="btn btn-xs" onclick={() => rolls.damage(`${name}: ${a.name}`, a.damage)}><Dices size={11} />{diceDe(a.damage)}</button>
					</li>
				{/each}
			</ul>
		</div>
	{/if}

	{#if verdict}<p class="mt-3 rounded-xl bg-astral/[0.07] px-3 py-2 text-[0.84rem] text-ink-2">{@html verdict.replace(/\*\*(.+?)\*\*/g, '<b class="text-ink">$1</b>')}</p>{/if}
	{#if note}<p class="mt-2 rounded-xl bg-blood/[0.07] px-3 py-2 text-[0.8rem] text-ink-2"><b class="text-blood">Korrigiert:</b> {note.replace(/^Korrigiert:\s*/, '')}</p>{/if}
</article>

<script lang="ts">
	import PMd from './PMd.svelte';
	import type { Ability, StatTrait } from '$lib/types';
	import { ABILITIES, diceDe, fmtMod, mod } from '$lib/rules';

	let {
		anchor,
		name,
		subtitle,
		ac,
		acNote = '',
		hp,
		hpFormula = '',
		speed,
		abilities,
		lines = [],
		traits = [],
		actions = [],
		verdict = '',
		note = '',
		current = false
	}: {
		anchor: string;
		name: string;
		subtitle: string;
		ac: number;
		acNote?: string;
		hp: number;
		hpFormula?: string;
		speed: string;
		abilities: Record<Ability, number>;
		lines?: [string, string | undefined][];
		traits?: StatTrait[];
		actions?: { name: string; bonus: number; damage: string; type: string; range: string }[];
		verdict?: string;
		note?: string;
		current?: boolean;
	} = $props();
</script>

<div class="statblock {current ? 'current' : ''}" id={anchor}>
	<div class="spread"><span class="sb-name">{name}</span>{#if current}<span class="pill" style="--c: var(--p-accent)">aktuell</span>{/if}</div>
	<div class="sb-sub">{subtitle}</div>
	<div class="sb-line" style="margin-top: 1mm"><b>Rüstungsklasse</b> {ac}{acNote ? ` (${acNote})` : ''}</div>
	<div class="sb-line"><b>Trefferpunkte</b> {hp}{hpFormula ? ` (${hpFormula})` : ''}</div>
	<div class="sb-line"><b>Bewegungsrate</b> {speed}</div>
	<div class="sb-abil">
		{#each ABILITIES as a (a.key)}
			<div><div class="k">{a.short}</div><div class="num small">{abilities[a.key]} ({fmtMod(mod(abilities[a.key]))})</div></div>
		{/each}
	</div>
	{#each lines.filter((l) => l[1]) as [k, v] (k)}<div class="sb-line"><b>{k}</b> {v}</div>{/each}
	{#each traits as t (t.name)}<div class="sb-trait"><b><i>{t.name}.</i></b> <PMd src={t.text} inline /></div>{/each}
	{#if actions.length}
		<div class="label" style="margin-top: 1.4mm; color: #7a1d2c">Aktionen</div>
		{#each actions as a (a.name)}
			<div class="sb-trait"><b><i>{a.name}.</i></b> Waffenangriff {fmtMod(a.bonus)}, {a.range}. Treffer: {diceDe(a.damage)} {a.type}.</div>
		{/each}
	{/if}
	{#if verdict}<div class="small soft" style="margin-top: 1.2mm; border-top: 0.4pt solid #e3c9c9; padding-top: 1mm"><PMd src={verdict} inline /></div>{/if}
	{#if note}<div class="tiny muted" style="margin-top: 0.8mm"><PMd src={note} inline /></div>{/if}
</div>

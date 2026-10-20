<script lang="ts">
	/** Wer weiß was? Floshems Ruf, Gefahren, die Tabelle der Mitwisser und alle Geheimnisse. */
	import PDoc from './PDoc.svelte';
	import PMd from './PMd.svelte';
	import { campaign } from '$lib/stores/campaign.svelte';
	import { shortName as short, witnesses } from '$lib/secrets';
	import type { Secret } from '$lib/types';

	const STATUS: Record<Secret['status'], { label: string; color: string }> = {
		sicher: { label: 'Sicher', color: 'var(--p-life)' },
		gefaehrdet: { label: 'Gefährdet', color: 'var(--p-warn)' },
		aufgeflogen: { label: 'Aufgeflogen', color: 'var(--p-blood)' }
	};
	const g = $derived(campaign.data.geheimnisse);
	const people = $derived(witnesses(g.secrets));
	const mark = (s: Secret, who: string) => (s.knownBy.some((w) => w.who === who) ? '●' : s.suspects.some((w) => w.who === who) ? '○' : '');
</script>

<PDoc id="geheimnisse" refs={['page:geheimnisse']} eyebrow="Kampagne" title="Wer weiß was?" subtitle="Was über Valerius wirklich stimmt, was die Leute glauben und wer was weiß. ● weiß es · ○ ahnt es.">
	<div class="grid g2">
		<div class="box-soft">
			<div class="label" style="margin-bottom: 1mm">Floshems Ruf</div>
			<PMd src={g.ruf} class="small" />
		</div>
		<div class="box-soft">
			<div class="label" style="margin-bottom: 1mm">Gefahr für alle Geheimnisse</div>
			<PMd src={g.gefahren} class="small" />
		</div>
	</div>

	<h2>Die Tabelle</h2>
	<table class="tight matrix">
		<thead>
			<tr>
				<th style="width: 30%">Geheimnis</th>
				<th style="width: 11%">Status</th>
				{#each people as who (who)}<th class="c">{short(who)}</th>{/each}
			</tr>
		</thead>
		<tbody>
			{#each g.secrets as s (s.id)}
				<tr>
					<td><b>{s.title}</b></td>
					<td class="nowrap" style="color: {STATUS[s.status].color}">{STATUS[s.status].label}</td>
					{#each people as who (who)}<td class="c">{mark(s, who)}</td>{/each}
				</tr>
			{/each}
		</tbody>
	</table>

	<h2>Die Geheimnisse</h2>
	<div class="cols-2">
		{#each g.secrets as s (s.id)}
			<div class="secret avoid">
				<h4>{s.title} <span class="tiny" style="color: {STATUS[s.status].color}">· {STATUS[s.status].label}</span></h4>
				<p class="small"><b>Wahrheit:</b> <PMd src={s.truth} inline /></p>
				{#if s.cover}<p class="small"><b>Die Leute glauben:</b> <PMd src={s.cover} inline /></p>{/if}
				{#if s.risk}<p class="small"><b>Wenn es herauskommt:</b> <PMd src={s.risk} inline /></p>{/if}
				{#if s.knownBy.length}<p class="small"><b>Wissen es:</b> {#each s.knownBy as w, i (w.who)}{i ? '; ' : ''}{w.who}{#if w.how}{' '}<span class="muted">({w.how})</span>{/if}{/each}</p>{/if}
				{#if s.suspects.length}<p class="small"><b>Ahnen es:</b> {#each s.suspects as w, i (w.who)}{i ? '; ' : ''}{w.who}{#if w.how}{' '}<span class="muted">({w.how})</span>{/if}{/each}</p>{/if}
				{#if s.note}<div class="small muted"><PMd src={s.note} /></div>{/if}
			</div>
		{/each}
	</div>
</PDoc>

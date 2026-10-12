<script lang="ts">
	import PDoc from './PDoc.svelte';
	import PSpell from './PSpell.svelte';
	import { campaign } from '$lib/stores/campaign.svelte';
	import { cantripsKnown, fmtMod, slotTotals, spellAttack, spellDc, wizardPicks } from '$lib/rules';
	import { printAnchor } from '$lib/markdown';
	import { SCHOOL_PRINT } from '$lib/print';

	const c = $derived(campaign.data.character);
	const all = $derived(campaign.data.spells);
	const book = $derived(all.filter((s) => s.status === 'buch').sort((a, b) => a.level - b.level || a.name.localeCompare(b.name, 'de')));
	const proposals = $derived(all.filter((s) => s.status === 'vorschlag'));
	const picks = $derived(wizardPicks(c.level, book.filter((s) => s.level > 0).map((s) => s.level)));
	const free = $derived(picks.reduce((n, g) => n + g.total - g.used, 0));
	const prepared = $derived(book.filter((s) => s.level > 0 && s.prepared).length);
	const levels = $derived([...new Set(book.map((s) => s.level))]);
</script>

<PDoc id="zauber" refs={['page:zauber']} eyebrow="Zauberbuch" title="Valerius' Grimoire" subtitle="Alle Zauber im Buch mit vollständigem Regeltext (Spielerhandbuch 2014 / SRD 5.1), deinen Werten, Tipps und Korrekturen.">
	<div class="grid g6">
		<div class="stat"><div class="v">{spellDc(c)}</div><div class="l">Zauber-SG</div></div>
		<div class="stat"><div class="v">{fmtMod(spellAttack(c))}</div><div class="l">Zauberangriff</div></div>
		<div class="stat"><div class="v">{prepared}/{c.spellcasting.preparedMax}</div><div class="l">Vorbereitet</div></div>
		<div class="stat"><div class="v">{slotTotals(c).map((s) => s.total).join('/')}</div><div class="l">Plätze 1/2/3</div></div>
		<div class="stat"><div class="v">{book.filter((s) => s.level === 0).length}/{cantripsKnown(c.level)}</div><div class="l">Zaubertricks</div></div>
		<div class="stat"><div class="v">{free}</div><div class="l">Freie Einträge</div><div class="s">{picks.filter((g) => g.used < g.total).map((g) => `${g.total - g.used} bis Grad ${g.maxGrade}`).join(', ')}</div></div>
	</div>

	<h2>Übersicht</h2>
	<table>
		<thead>
			<tr><th>Zauber</th><th>Grad</th><th>Schule</th><th>Zeit</th><th>Reichweite</th><th>Dauer</th><th class="c">K</th><th class="c">R</th><th class="c">Vorb.</th></tr>
		</thead>
		<tbody>
			{#each book as sp (sp.id)}
				<tr>
					<td><a href="#{printAnchor(`spell:${sp.id}`)}"><b>{sp.name}</b></a></td>
					<td class="num">{sp.level === 0 ? 'ZT' : sp.level}</td>
					<td><span style="color: {SCHOOL_PRINT[sp.school]}">●</span> {sp.school}</td>
					<td>{sp.time}</td>
					<td>{sp.range}</td>
					<td>{sp.duration}</td>
					<td class="c">{sp.concentration ? '●' : ''}</td>
					<td class="c">{sp.ritual ? '●' : ''}</td>
					<td class="c">{#if sp.level === 0}–{:else}<span class="cb" style="width: 2.8mm; height: 2.8mm; {sp.prepared ? 'background: var(--p-ink)' : ''}"></span>{/if}</td>
				</tr>
			{/each}
		</tbody>
	</table>
	<p class="tiny muted" style="margin-top: 1mm">K = Konzentration · R = Ritual (als Magier ohne Vorbereitung direkt aus dem Buch, +10 Minuten) · ZT = Zaubertrick</p>

	{#each levels as lvl, i (lvl)}
		<h2 class={i === 0 ? 'page-break' : ''} style={i === 0 ? 'margin-top: 0' : ''}>
			{lvl === 0 ? 'Zaubertricks' : `Grad ${lvl}`}
			<span class="count">{book.filter((s) => s.level === lvl).length} Zauber{lvl > 0 ? ` · ${c.spellcasting.slots[String(lvl)] ?? 0} Plätze` : ' · unbegrenzt'}</span>
		</h2>
		<div class="cols-2">
			{#each book.filter((s) => s.level === lvl) as sp (sp.id)}<PSpell spell={sp} />{/each}
		</div>
	{/each}

	{#if proposals.length}
		<h2 class="page-break" style="margin-top: 0">Vorschläge für die freien Einträge <span class="count">{proposals.length}</span></h2>
		<p class="soft">
			Nicht im Buch. Ein Magier der Stufe {c.level} hat {picks.reduce((n, g) => n + g.total, 0)} kostenlose Einträge, {free} davon sind frei. Jeder Vorschlag mit Begründung und vollem
			Regeltext. Abschreiben aus Rollen kostet 50 GM und 2 Stunden pro Grad, als Beschwörer bei Beschwörungszaubern die Hälfte.
		</p>
		<div class="cols-2">
			{#each proposals as sp (sp.id)}<PSpell spell={sp} />{/each}
		</div>
	{/if}
</PDoc>

<script lang="ts">
	import PDoc from './PDoc.svelte';
	import PMd from './PMd.svelte';
	import PImg from './PImg.svelte';
	import { campaign } from '$lib/stores/campaign.svelte';
	import { printAnchor } from '$lib/markdown';
	import {
		ABILITIES,
		ECONOMY_LABEL,
		SKILLS,
		abilityMod,
		attackBonus,
		cantripsKnown,
		diceDe,
		fmtMod,
		initiative,
		passivePerception,
		saveBonus,
		skillBonus,
		slotTotals,
		spellAttack,
		spellDc
	} from '$lib/rules';

	const c = $derived(campaign.data.character);
	const s = $derived(campaign.data.state);
	const book = $derived(campaign.data.spells.filter((s) => s.status === 'buch'));
	const cantrips = $derived(book.filter((s) => s.level === 0));
	const prepared = $derived(book.filter((s) => s.level > 0 && s.prepared));
	const rituals = $derived(book.filter((s) => s.level > 0 && !s.prepared && s.ritual));
	const features = $derived(c.features.filter((f) => !f.upcoming));
	const upcoming = $derived(c.features.filter((f) => f.upcoming));
	const skillCols = $derived([SKILLS.slice(0, 9), SKILLS.slice(9)]);
	const short = (a: string) => ABILITIES.find((x) => x.key === a)?.short ?? '';
</script>

<PDoc id="bogen" compact eyebrow="Charakterbogen" title={c.name} subtitle="{c.race} · {c.className} {c.level} · {c.subclass} · {c.alignment}{c.player ? ` · Spieler: ${c.player}` : ''}">
	<div class="grid" style="grid-template-columns: 1fr 30mm; align-items: start; gap: 5mm">
		<div>
			{#if c.alias}
				<div class="box-accent small" style="margin-bottom: 2mm">
					<span class="label">Tarnidentität</span> <b>{c.alias}</b>{c.aliasTitle ? `, ${c.aliasTitle}` : ''}
					{#if c.aliasNote}<PMd src={c.aliasNote} class="soft" />{/if}
				</div>
			{/if}
			<div class="grid g2 small" style="gap: 4mm">
				{#if c.goal}<div class="tiny"><div class="label">Ziel</div>{c.goal}</div>{/if}
				{#if c.appearance}<div class="tiny soft"><div class="label">Aussehen</div>{c.appearance}</div>{/if}
			</div>
		</div>
		<PImg name={c.portrait} style="width: 30mm; height: 30mm; border-radius: 50%; border: 1pt solid #c9a24a" />
	</div>

	<div class="grid g6" style="margin-top: 3mm; gap: 2.2mm">
		<div class="stat"><div class="v">{c.ac.base}</div><div class="l">Rüstungsklasse</div><div class="s">{c.ac.formula.replace(/\s*\(.*\)/, '')}</div></div>
		<div class="stat"><div class="v">{c.hp.max}</div><div class="l">TP-Maximum</div><div class="s">Trefferwürfel {c.level}W{c.hp.hitDie}</div></div>
		<div class="stat"><div class="v">{fmtMod(initiative(c))}</div><div class="l">Initiative</div><div class="s">GE-Modifikator</div></div>
		<div class="stat"><div class="v">{c.speed} m</div><div class="l">Bewegung</div><div class="s">zu Fuß</div></div>
		<div class="stat"><div class="v">{fmtMod(c.proficiencyBonus)}</div><div class="l">Übungsbonus</div><div class="s">Stufe {c.level}</div></div>
		<div class="stat"><div class="v">{passivePerception(c, null)}</div><div class="l">Passive WN</div><div class="s">10 + Wahrnehmung</div></div>
		<div class="stat"><div class="v">{spellDc(c)}</div><div class="l">Zauber-SG</div><div class="s">8 + ÜB + IN</div></div>
		<div class="stat"><div class="v">{fmtMod(spellAttack(c))}</div><div class="l">Zauberangriff</div><div class="s">ÜB + IN</div></div>
		<div class="stat"><div class="v">{prepared.length}/{c.spellcasting.preparedMax}</div><div class="l">Vorbereitet</div><div class="s">IN-Mod. + Stufe</div></div>
		<div class="stat"><div class="v">{cantrips.length}/{cantripsKnown(c.level)}</div><div class="l">Zaubertricks</div><div class="s">bekannt</div></div>
		<div class="stat"><div class="v" style="font-size: 13pt; line-height: 1.27">{slotTotals(c).map((s) => s.total).join('/')}</div><div class="l">Zauberplätze</div><div class="s">Grad {slotTotals(c).map((s) => s.level).join(' / ')}</div></div>
		<div class="stat"><div class="v">{c.darkvision} m</div><div class="l">Dunkelsicht</div><div class="s">Grautöne</div></div>
	</div>

	<h2 style="margin-top: 2.6mm; font-size: 15pt">Attribute und Rettungswürfe</h2>
	<div class="grid g6" style="gap: 2.2mm">
		{#each ABILITIES as a (a.key)}
			<div class="stat">
				<div class="l" style="margin: 0 0 0.6mm">{a.name}</div>
				<div class="v">{fmtMod(abilityMod(c, a.key))}</div>
				<div class="s">Wert {c.abilities[a.key]}</div>
				<div class="small" style="margin-top: 0.8mm; border-top: 0.4pt solid var(--p-line); padding-top: 0.6mm">
					<span class="dot" style="width: 2.4mm; height: 2.4mm; vertical-align: -0.2mm; {c.saves.includes(a.key) ? 'background: var(--p-ink)' : ''}"></span>
					RW <b class="num">{fmtMod(saveBonus(c, a.key))}</b>
				</div>
			</div>
		{/each}
	</div>

	<div class="grid" style="grid-template-columns: 1.6fr 1fr; gap: 6mm; align-items: start">
		<div>
			<h2 style="margin-top: 2.6mm; font-size: 15pt">Fertigkeiten</h2>
			<div class="grid g2" style="gap: 0 5mm">
				{#each skillCols as col, ci (ci)}
					<div>
						{#each col as sk (sk.key)}
							<div class="spread small" style="border-bottom: 0.4pt solid var(--p-line); padding: 0.6mm 0">
								<span>
									<span class="dot" style="width: 2.4mm; height: 2.4mm; vertical-align: -0.2mm; {c.skills[sk.key] ? 'background: var(--p-ink)' : ''}"></span>
									{sk.name} <span class="tiny muted">{short(sk.ability)}</span>
								</span>
								<b class="num">{fmtMod(skillBonus(c, null, sk.key))}</b>
							</div>
						{/each}
					</div>
				{/each}
			</div>
			<p class="tiny muted" style="margin: 1.2mm 0 0">
				Geübt: {Object.entries(c.skills)
					.map(([k, src]) => `${SKILLS.find((s) => s.key === k)?.name} (${src})`)
					.join(' · ')}.
			</p>
			<p class="tiny soft" style="margin: 1mm 0 0">
				<span class="label">Rüstung</span> {c.proficiencies.armor} · <span class="label">Waffen</span> {c.proficiencies.weapons} · <span class="label">Werkzeuge</span>
				{c.proficiencies.tools} · <span class="label">Sprachen</span> {c.proficiencies.languages}
			</p>
		</div>
		<div>
			<h2 style="margin-top: 2.6mm; font-size: 15pt">Zauberwirken</h2>
			<div class="box-soft small">
				<div><span class="label">Fokus</span> {c.spellcasting.focus}</div>
				<div style="margin-top: 1mm"><span class="label">Zaubertricks</span> {cantrips.map((s) => s.name).join(', ')}</div>
				<div style="margin-top: 1mm"><span class="label">Vorbereitet</span> {prepared.map((s) => s.name).join(', ')}</div>
				{#if rituals.length}<div style="margin-top: 1mm"><span class="label">Rituale aus dem Buch</span> {rituals.map((s) => s.name).join(', ')}</div>{/if}
				{#if s.trance.tool}<div style="margin-top: 1mm"><span class="label">Astrale Trance heute</span> {s.trance.tool}</div>{/if}
			</div>
		</div>
	</div>

	<h2 style="margin-top: 2.6mm; font-size: 15pt">Angriffe</h2>
	<table class="tight">
		<thead><tr><th>Waffe</th><th>Reichweite</th><th class="r">Angriff</th><th>Schaden</th><th>Eigenschaften</th></tr></thead>
		<tbody>
			{#each c.attacks as a (a.id)}
				<tr>
					<td><b>{a.name}</b></td>
					<td class="small" style="white-space: nowrap">{a.range}</td>
					<td class="r num"><b>{fmtMod(attackBonus(c, s, a))}</b></td>
					<td style="white-space: nowrap">{diceDe(a.damage)} {a.damageType}{#if a.damageAlt}<br /><span class="tiny muted">zweihändig {diceDe(a.damageAlt)}</span>{/if}</td>
					<td class="tiny soft">{a.props ?? ''}</td>
				</tr>
			{/each}
		</tbody>
	</table>

	<h2 class="page-break" style="margin-top: 0">Merkmale und Fähigkeiten <span class="count">{features.length}</span></h2>
	<div class="cols-2" style="font-size: 8.8pt">
		{#each features as f (f.id)}
			<div class="avoid" id={printAnchor(`feature:${f.id}`)} style="margin-bottom: 2.4mm">
				<h3 style="margin-top: 0">{f.name}</h3>
				<div class="tiny muted" style="margin-bottom: 1mm">
					{f.source} · {ECONOMY_LABEL[f.economy] ?? f.economy}{#if f.uses}
						· {f.uses.max}× pro {f.uses.reset === 'long' ? 'langer' : 'kurzer'} Rast <span class="boxes" style="margin-left: 1mm">{#each Array(f.uses.max) as _, i (i)}<span class="cb" style="width: 2.8mm; height: 2.8mm"></span>{/each}</span>{/if}
				</div>
				<PMd src={f.text} />
				{#if f.note}<p class="tiny muted">{f.note}</p>{/if}
			</div>
		{/each}
		{#each upcoming as f (f.id)}
			<div class="box avoid" style="margin-bottom: 3mm">
				<div class="label">Ab der nächsten Stufe</div>
				<h3 style="margin-top: 0.6mm">{f.name}</h3>
				<PMd src={f.text} />
			</div>
		{/each}
	</div>
</PDoc>

<script lang="ts">
	import PDoc from './PDoc.svelte';
	import PMd from './PMd.svelte';
	import PStat from './PStat.svelte';
	import { campaign } from '$lib/stores/campaign.svelte';
	import { printAnchor } from '$lib/markdown';

	const s = $derived(campaign.data.state);
	const cr = $derived(campaign.data.creatures);
	const plan = $derived(cr.familiarPlan);
	const current = $derived(cr.familiars.find((f) => f.id === s.familiar.form));
	const fallen = $derived(s.familiar.hp <= 0);
	const currentLabel = $derived(fallen ? `keiner (${current?.name ?? 'Vertrauter'} gefallen)` : (current?.name ?? '—'));
</script>

<PDoc id="gefolge" refs={['page:gefolge']} eyebrow="Gefolge" title="Vertraute, Untote, Diener" subtitle="Wertblöcke nach SRD 5.1 · Vertrauter aktuell: {currentLabel}">
	<h2 style="margin-top: 0">Deine Untoten</h2>
	<div class="grid g2" style="gap: 4mm">
		{#each cr.undead as u (u.id)}
			<PStat
				anchor={printAnchor(`creature:${u.id}`)}
				name={u.name}
				subtitle="{u.type} · HG {u.cr}"
				ac={u.ac}
				acNote={u.acNote}
				hp={u.hp}
				hpFormula={u.hpFormula}
				speed={u.speed}
				abilities={u.abilities}
				lines={[
					['Rettungswürfe', u.saves],
					['Anfällig', u.vulnerable],
					['Immun', u.immune],
					['Sinne', u.senses],
					['Sprachen', u.languages]
				]}
				traits={u.traits ?? []}
				actions={u.actions}
				verdict={u.verdict}
			/>
		{/each}
	</div>
	<div class="grid g3" style="gap: 3mm; margin-top: 3mm">
		<div class="callout callout-rule"><div class="callout-title" data-label="Regel">24-Stunden-Kontrolle</div><p class="small">Vor Ablauf erneut wirken (1 Minute, alle in 3 m). Ein Grad-3-Platz hält bis zu 4 Untote. Verfallene Untote sind frei und meist feindlich.</p></div>
		<div class="callout callout-tip"><div class="callout-title" data-label="Tipp">Ein Befehl für alle</div><p class="small">Eine Bonusaktion steuert alle Untoten in 18 m mit demselben Befehl. Allgemeine Befehle laufen ohne weitere Bonusaktionen.</p></div>
		<div class="callout callout-warning"><div class="callout-title" data-label="Achtung">Nur Humanoide</div><p class="small">Knochen werden zum Skelett, Leichen zum Zombie, immer von kleinen oder mittelgroßen Humanoiden.</p></div>
	</div>

	<div class="grid g2" style="gap: 4mm; margin-top: 2mm">
		<div class="box">
			<h3 style="margin-top: 0">{cr.servant.name}</h3>
			<div class="small soft">RK {cr.servant.ac} · {cr.servant.hp} TP · ST {cr.servant.str} · {cr.servant.speed}</div>
			<ul class="bullets small">{#each cr.servant.rules as r (r)}<li><PMd src={r} inline /></li>{/each}</ul>
		</div>
		{#each cr.party as p (p.id)}
			<div class="box">
				<h3 style="margin-top: 0">{p.name}</h3>
				{#if p.altName}<div class="tiny muted">{p.altName}</div>{/if}
				<div class="small soft">{p.role}</div>
				<div class="small" style="margin-top: 1mm"><b>RK</b> {p.ac} · <b>TP</b> {p.hp} · <b>Bewegung</b> {p.speed}</div>
				<ul class="bullets small">{#each p.notes as n (n)}<li><PMd src={n} inline /></li>{/each}</ul>
			</div>
		{/each}
	</div>

	<h2 class="page-break" style="margin-top: 0">Vertrauter</h2>
	<p class="soft">
		Aktuell: <b>{currentLabel}</b>. Ein Geist (Himmlisches Wesen, Feenwesen oder Unhold) in Tiergestalt. Kann nicht angreifen, aber helfen, spähen und Berührungszauber
		überbringen. Telepathie bis 30 m. Neue Gestalt = neues Wirken (als Ritual 1 Stunde 10 Minuten, 10 GM).
	</p>

	{#if plan}
		<h3>{plan.title}</h3>
		<PMd src={plan.intro} class="small soft" />
		<div class="grid g4" style="gap: 2.5mm; margin-top: 2mm">
			{#each plan.options as o (o.form)}
				{@const f = cr.familiars.find((x) => x.id === o.form)}
				<div class="box small" style={o.form === s.familiar.form && !fallen ? 'border-color: var(--p-accent)' : ''}>
					<div class="spread"><b>{o.label}</b>{#if o.dm}<span class="pill" style="--c: var(--p-warn)">DM fragen</span>{/if}</div>
					<div class="tiny muted">{f && !o.label.includes(f.name.replace(/\s*\(.*\)/, '')) ? `Werte: ${f.name} · ` : ''}RK {f?.ac} · {f?.hp} TP · {f?.speed}</div>
					<ul style="margin-top: 1mm">
						{#each o.pro as l (l)}<li class="tiny"><b style="color: var(--p-life)">+</b> <PMd src={l} inline /></li>{/each}
						{#each o.con as l (l)}<li class="tiny"><b style="color: var(--p-blood)">−</b> <PMd src={l} inline /></li>{/each}
					</ul>
					<div class="tiny" style="margin-top: 1mm"><span class="cb" style="width: 2.6mm; height: 2.6mm"></span> gewählt</div>
				</div>
			{/each}
		</div>
	{/if}

	<h3>Alle Gestalten im Vergleich</h3>
	<table class="tight">
		<thead><tr><th>Gestalt</th><th class="c">RK</th><th class="c">TP</th><th>Bewegung</th><th>Sinne</th><th>Stärke</th></tr></thead>
		<tbody>
			{#each cr.familiars as f (f.id)}
				<tr>
					<td><a href="#{printAnchor(`creature:${f.id}`)}"><b>{f.name}</b></a>{f.id === s.familiar.form && !fallen ? ' ●' : ''}</td>
					<td class="c num">{f.ac}</td>
					<td class="c num">{f.hp}</td>
					<td>{f.speed}</td>
					<td class="tiny">{f.senses}</td>
					<td class="tiny"><PMd src={f.verdict} inline /></td>
				</tr>
			{/each}
		</tbody>
	</table>

	<h2>Wertblöcke der Vertrauten <span class="count">{cr.familiars.length}</span></h2>
	<div class="grid g3" style="gap: 3mm">
		{#each cr.familiars as f (f.id)}
			<PStat
				anchor={printAnchor(`creature:${f.id}`)}
				name={f.name}
				subtitle="Winziger Geist in Tiergestalt"
				ac={f.ac}
				hp={f.hp}
				speed={f.speed}
				abilities={f.abilities}
				lines={[
					['Fertigkeiten', f.skills || undefined],
					['Sinne', f.senses]
				]}
				traits={f.traits}
				verdict={f.verdict}
				note={f.note}
				current={f.id === s.familiar.form && !fallen}
			/>
		{/each}
	</div>
</PDoc>

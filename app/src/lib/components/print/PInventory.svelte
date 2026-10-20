<script lang="ts">
	import PDoc from './PDoc.svelte';
	import PMd from './PMd.svelte';
	import { campaign } from '$lib/stores/campaign.svelte';
	import { printAnchor } from '$lib/markdown';
	import { diceDe } from '$lib/rules';
	import { ITEM_GROUPS, PHASE, PRIO } from '$lib/print';
	import { fmtGold } from '$lib/format';
	import { RECIPES } from '$lib/werkstatt';

	const WAY_LABEL: Record<string, string> = { herstellen: 'herstellen', erfragen: 'erfragen', klauen: 'klauen', erbeuten: 'erbeuten' };
	/** Preis lesbar: unter 1 GM in Silber oder Kupfer */
	function price(gm: number): string {
		if (gm === 0) return 'Holz';
		if (gm >= 1) return `${fmtGold(gm)} GM`;
		if (gm >= 0.1 && Math.round(gm * 100) % 10 === 0) return `${Math.round(gm * 10)} SM`;
		return `${Math.round(gm * 100)} KM`;
	}

	const inv = $derived(campaign.data.inventory);
	const total = $derived(inv.currency.gm + inv.currency.sm / 10 + inv.currency.km / 100);
	const phases = $derived((['jetzt', 'nach-saladin', 'saladin'] as const).filter((ph) => inv.wishlist.some((w) => w.phase === ph)));
</script>

<PDoc id="inventar" eyebrow="Inventar" title="Besitz und Pläne" subtitle="Alles, was Valerius trägt, lagert, verloren hat und noch kaufen will.">
	<div class="grid g4">
		<div class="stat"><div class="v">{inv.currency.gm}</div><div class="l">Goldmünzen</div></div>
		<div class="stat"><div class="v">{inv.currency.sm}</div><div class="l">Silbermünzen</div></div>
		<div class="stat"><div class="v">{inv.currency.km}</div><div class="l">Kupfermünzen</div></div>
		<div class="stat"><div class="v">{total.toLocaleString('de-DE', { maximumFractionDigits: 2 })}</div><div class="l">Gesamt in GM</div><div class="s">1 GM = 10 SM = 100 KM</div></div>
	</div>

	{#each ITEM_GROUPS as g (g.id)}
		{@const items = inv.items.filter((i) => i.group === g.id)}
		{#if items.length}
			<h2>{g.label} <span class="count">{g.hint}</span></h2>
			<table>
				<thead><tr><th style="width: 34%">Gegenstand</th><th class="c" style="width: 9%">Anzahl</th><th>Beschreibung</th></tr></thead>
				<tbody>
					{#each items as it (it.id)}
						<tr id={printAnchor(`item:${it.id}`)}>
							<td><b>{it.name}</b>{#if it.magic}{' '}<span class="pill" style="--c: var(--p-accent)">magisch</span>{/if}</td>
							<td class="c num">{it.qty}</td>
							<td>
								{#if it.desc}<PMd src={it.desc} inline />{/if}
								{#if it.heal}<span class="soft"> Heilt {diceDe(it.heal)}.</span>{/if}
								{#if it.note}<div class="tiny muted"><PMd src={it.note} inline /></div>{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	{/each}

	{#if inv.wishlist.length}
		<h2 class="avoid">Einkaufszettel <span class="count">{inv.wishlist.filter((w) => !w.done).length} offen · im Beutel {fmtGold(total)} GM</span></h2>
		{#each phases as ph (ph)}
			<h4>{PHASE[ph] ?? ph}</h4>
			<table>
				<thead><tr><th style="width: 5mm"></th><th style="width: 30%">Gegenstand</th><th style="width: 12%">Priorität</th><th class="r" style="width: 12%">Preis</th><th>Warum</th></tr></thead>
				<tbody>
					{#each inv.wishlist.filter((w) => w.phase === ph).sort((a, b) => Number(!!a.done) - Number(!!b.done)) as w (w.id)}
						<tr>
							<td><span class="cb" style="width: 2.8mm; height: 2.8mm; {w.done ? 'background: var(--p-ink)' : ''}"></span></td>
							<td><b>{w.name}</b>{#if w.qty && w.qty > 1}{' '}<span class="tiny muted">× {w.qty}</span>{/if}</td>
							<td>{PRIO[w.priority] ?? w.priority}</td>
							<td class="r num">{w.priceText ?? (w.price != null ? `${fmtGold(w.price)} GM` : '–')}</td>
							<td class="small">
								<PMd src={w.why} inline />
								{#if w.ways?.length && !w.done}<div class="tiny" style="margin-top: 0.6mm"><b>Ohne Gold:</b> {w.ways.map((x) => WAY_LABEL[x] ?? x).join(', ')}{#if w.how}{' '}· <PMd src={w.how} inline />{/if}</div>{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/each}
	{/if}

	<h2 class="avoid">Werkstatt <span class="count">eine Herstellung pro langer Rast · Übung aus der Astralen Trance</span></h2>
	<table>
		<thead><tr><th style="width: 13%">Erzeugnis</th><th style="width: 15%">Werkzeug</th><th style="width: 9%">Zeit</th><th class="r" style="width: 8%">Zutaten</th><th class="r" style="width: 7%">Wert</th><th>Regeln</th></tr></thead>
		<tbody>
			{#each RECIPES as r (r.id)}
				<tr>
					<td><b>{r.name}</b>{#if r.yield > 1}{' '}<span class="tiny muted">bis {r.yield}</span>{/if}</td>
					<td style="hyphens: auto">{r.tool}</td>
					<td>{r.time === 'tag' ? '1 Tag Arbeit' : 'lange Rast'}</td>
					<td class="r num">{price(r.cost)}</td>
					<td class="r num">{price(r.value * r.yield)}</td>
					<td class="small"><PMd src={r.rules.replaceAll('\n\n', ' ')} inline /></td>
				</tr>
			{/each}
		</tbody>
	</table>
	<p class="tiny muted" style="margin-top: 1mm">
		Alchemie nach Xanathars: eine Dosis pro langer Rast, Rohstoffe zum halben Marktpreis. Heiltränke: Kräuterkundeausrüstung, 1 Tag und 25 GM. Pfeile: Holzschnitzwerkzeug,
		bis zu 20 pro langer Rast. Händler zahlen meist die Hälfte (Spielerhandbuch), Gewinn bringt nur der Verkauf zum vollen Preis.
	</p>
</PDoc>

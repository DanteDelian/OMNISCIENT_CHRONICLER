<script lang="ts">
	import PDoc from './PDoc.svelte';
	import PMd from './PMd.svelte';
	import { campaign } from '$lib/stores/campaign.svelte';
	import { printAnchor } from '$lib/markdown';
	import { diceDe } from '$lib/rules';
	import { ITEM_GROUPS, PHASE, PRIO } from '$lib/print';

	const inv = $derived(campaign.data.inventory);
	const total = $derived(inv.currency.gm + inv.currency.sm / 10 + inv.currency.km / 100);
	const phases = $derived([...new Set(inv.wishlist.map((w) => w.phase))]);
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
							<td><b>{it.name}</b>{#if it.magic} <span class="pill" style="--c: var(--p-accent)">magisch</span>{/if}</td>
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
		<h2 class="avoid">Wunschliste <span class="count">{inv.wishlist.length} Einträge</span></h2>
		{#each phases as ph (ph)}
			<h4>{PHASE[ph] ?? ph}</h4>
			<table>
				<thead><tr><th style="width: 5mm"></th><th style="width: 30%">Gegenstand</th><th style="width: 12%">Priorität</th><th class="r" style="width: 12%">Preis</th><th>Warum</th></tr></thead>
				<tbody>
					{#each inv.wishlist.filter((w) => w.phase === ph) as w (w.id)}
						<tr>
							<td><span class="cb" style="width: 2.8mm; height: 2.8mm; {w.done ? 'background: var(--p-ink)' : ''}"></span></td>
							<td><b>{w.name}</b></td>
							<td>{PRIO[w.priority] ?? w.priority}</td>
							<td class="r num">{w.priceText ?? (w.price != null ? `${w.price} GM` : '–')}</td>
							<td class="small"><PMd src={w.why} inline /></td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/each}
	{/if}
</PDoc>

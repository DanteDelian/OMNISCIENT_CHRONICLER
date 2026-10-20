<script lang="ts">
	import { Check, Clock, Coins, FlaskConical, Hammer, HandCoins, Package, TriangleAlert } from '@lucide/svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Markdown from '$lib/components/Markdown.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import TranceSelect from '$lib/components/TranceSelect.svelte';
	import { campaign } from '$lib/stores/campaign.svelte';
	import { RECIPES, craft, stock, trained, usedThisRest, type Recipe } from '$lib/werkstatt';
	import { fmtCoins, fmtGold, goldValue } from '$lib/format';

	const s = $derived(campaign.data.state);
	const items = $derived(campaign.data.inventory.items);
	const gold = $derived(goldValue(campaign.data.inventory.currency));
	const used = $derived(usedThisRest(s));

	/** Werkzeug im Gepäck? */
	const owned = (r: Recipe) => items.some((i) => i.group !== 'verloren' && i.name.toLowerCase().includes(r.tool.toLowerCase()));
	/** Zutaten für Pfeile: das Holz, das du findest */
	const price = (gm: number) => fmtCoins(gm, 'Holz');
	const timeLabel = (r: Recipe) => (r.time === 'tag' ? '1 Tag Arbeit' : 'in einer langen Rast');
	const stockIds = ['alchemistenfeuer', 'saeure', 'gegengift', 'oel', 'heiltrank', 'pfeile'];

	// ---------- Herstellen ----------
	let making = $state<Recipe | null>(null);
	let qty = $state(1);
	let fromStock = $state(false);
	const cost = $derived(making && !fromStock ? making.cost * Math.ceil(qty / making.yield) : 0);
	const blocked = $derived(!!making && making.time === 'rast' && used);

	function open(r: Recipe) {
		making = r;
		qty = r.yield;
		fromStock = false;
	}
	function confirm() {
		if (!making || blocked || qty < 1) return;
		if (craft(making, qty, fromStock)) making = null;
	}
</script>

<svelte:head><title>Werkstatt · Valerius</title></svelte:head>

<PageHeader
	eyebrow="Werkstatt"
	title="Herstellen statt kaufen"
	subtitle="Was du mit deinen Werkzeugen selbst machst, was es kostet und was es der Unsichtbaren Hand bringt. Regeln aus dem Spielerhandbuch 2014 und Xanathars Ratgeber für alles."
/>

<div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
	<section class="panel p-4 xl:col-span-2">
		<div class="eyebrow mb-2">Astrale Trance: heute geübt</div>
		<TranceSelect />
	</section>
	<section class="panel p-4">
		<div class="eyebrow">Werkstatt in dieser Rast</div>
		{#if used}
			<div class="mt-1 flex items-center gap-2 text-lg font-semibold text-ink-2"><Check size={18} class="text-life" />benutzt</div>
			<p class="text-xs text-ink-3">{s.workshop?.item} hergestellt. Wieder frei nach der nächsten langen Rast.</p>
		{:else}
			<div class="mt-1 flex items-center gap-2 text-lg font-semibold text-life"><Hammer size={18} />frei</div>
			<p class="text-xs text-ink-3">Eine Herstellung pro langer Rast: eine Dosis Alchemie oder bis zu 20 Pfeile.</p>
		{/if}
	</section>
	<section class="panel p-4">
		<div class="eyebrow">Im Beutel</div>
		<div class="num mt-1 text-3xl font-semibold text-gold">{fmtGold(gold)} <span class="text-lg text-ink-3">GM</span></div>
		<div class="mt-2 flex flex-wrap gap-1.5">
			{#each stockIds as id (id)}
				{@const r = RECIPES.find((x) => x.id === id)}
				{#if r}<span class="chip !py-0.5 !text-xs {stock(items, id) ? '' : 'opacity-50'}"><Package size={11} />{r.name} <b class="num text-ink">{stock(items, id)}</b></span>{/if}
			{/each}
		</div>
	</section>
</div>

<h2 class="title-display mt-8 mb-3 text-3xl">Rezepte</h2>
<div class="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
	{#each RECIPES as r (r.id)}
		{@const isTrained = trained(s, r)}
		{@const hasTool = owned(r)}
		<article class="panel flex flex-col p-5">
			<header class="flex items-start justify-between gap-3">
				<div>
					<h3 class="text-lg font-semibold">{r.name}</h3>
					<p class="text-xs text-ink-3 italic">{r.en}</p>
				</div>
				<span class="badge shrink-0" style="--c: {isTrained ? 'var(--color-life)' : hasTool ? 'var(--color-warn)' : 'var(--color-blood)'}" title={r.toolEn}>
					{#if isTrained}<Check size={11} />{:else}<TriangleAlert size={11} />{/if}{r.tool}
				</span>
			</header>

			<dl class="mt-3 grid grid-cols-4 gap-px overflow-hidden rounded-xl border border-line bg-line text-center">
				<div class="bg-panel px-1 py-2"><dt class="eyebrow !text-[0.55rem]">Zeit</dt><dd class="text-xs text-ink">{r.time === 'tag' ? '1 Tag' : 'Rast'}</dd></div>
				<div class="bg-panel px-1 py-2"><dt class="eyebrow !text-[0.55rem]">Zutaten</dt><dd class="num text-xs text-ink">{price(r.cost)}</dd></div>
				<div class="bg-panel px-1 py-2"><dt class="eyebrow !text-[0.55rem]">Wert</dt><dd class="num text-xs text-gold">{price(r.value * r.yield)}{r.yield > 1 ? ` / ${r.yield}` : ''}</dd></div>
				<div class="bg-panel px-1 py-2"><dt class="eyebrow !text-[0.55rem]">Vorrat</dt><dd class="num text-xs text-ink">{stock(items, r.id)}</dd></div>
			</dl>

			<div class="mt-3 flex-1">
				<Markdown src={r.rules} class="prose-sm" />
				{#if r.use}<p class="mt-2 rounded-lg bg-astral/[0.08] px-3 py-1.5 text-xs leading-relaxed text-ink-2"><b class="text-astral">Für Valerius:</b> {r.use}</p>{/if}
			</div>

			<footer class="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
				<span class="text-xs text-ink-3">
					{#if !hasTool}Werkzeug fehlt noch{:else if !isTrained}heute nicht geübt{:else if r.time === 'rast' && used}diese Rast schon benutzt{:else}<span class="text-life">bereit</span>{/if}
					· {timeLabel(r)}
				</span>
				<button class="btn btn-sm btn-primary" onclick={() => open(r)}><FlaskConical size={14} />Herstellen</button>
			</footer>
		</article>
	{/each}
</div>

<!-- Geld für die Hand -->
<section class="panel panel-glow mt-8 p-6">
	<div class="mb-2 flex items-center gap-2"><HandCoins size={18} class="text-gold" /><h2 class="title-display text-3xl">Geld für die Unsichtbare Hand</h2></div>
	<div class="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
		<div class="space-y-3 text-sm leading-relaxed text-ink-2">
			<p>
				<b class="text-ink">Die Faustregel des Spielerhandbuchs:</b> Händler zahlen für Ausrüstung meist die Hälfte des Preises. Weil die Zutaten auch die Hälfte kosten,
				bleibt beim Verkauf an Händler nichts übrig. Die Werkstatt spart dir dann nur Geld für den eigenen Bedarf.
			</p>
			<p>
				<b class="text-ink">Gewinn</b> entsteht, wenn ihr zum vollen Preis verkauft: in Saladins Laden in Freistadt, an Stammkunden der Hand oder an eine Stadt im Krieg, die
				Feuer und Heiltränke braucht. Oder wenn ihr Zutaten selbst sammelt. Beides entscheidet der DM.
			</p>
			<Markdown
				class="prose-sm"
				src={'**Pro Tag geht eine Sache:** Die Trance gibt dir nur ein Werkzeug. Entweder ein Heiltrank (Kräuterkunde) oder ein Alchemistenfeuer (Alchemistenwerkzeug), beides bringt zum vollen Preis 25 GM. Ein gelernter Helfer kostet 2 GM pro Tag (Spielerhandbuch). Was er für die Hand herstellen darf, klärt ihr mit dem DM. Mehr Ideen im [[Aufbauplan der Unsichtbaren Hand|Aufbauplan]] und im [[Alchemie-Kompendium]].'}
			/>
		</div>
		<div class="overflow-x-auto">
			<table class="w-full text-sm">
				<thead>
					<tr class="border-b border-line text-left text-xs text-ink-3">
						<th class="py-1.5 pr-2 font-medium">Erzeugnis</th>
						<th class="py-1.5 pr-2 text-right font-medium">Zutaten</th>
						<th class="py-1.5 pr-2 text-right font-medium">Händler zahlt</th>
						<th class="py-1.5 pr-2 text-right font-medium">Voller Preis</th>
						<th class="py-1.5 text-right font-medium">Gewinn</th>
					</tr>
				</thead>
				<tbody>
					{#each RECIPES.filter((r) => r.value * r.yield >= 1) as r (r.id)}
						<tr class="border-b border-line last:border-0">
							<td class="py-1.5 pr-2">{r.name}{r.yield > 1 ? ` (${r.yield})` : ''}</td>
							<td class="num py-1.5 pr-2 text-right">{price(r.cost)}</td>
							<td class="num py-1.5 pr-2 text-right text-ink-3">{price((r.value * r.yield) / 2)}</td>
							<td class="num py-1.5 pr-2 text-right text-gold">{price(r.value * r.yield)}</td>
							<td class="num py-1.5 text-right text-life">+{price(r.value * r.yield - r.cost)}</td>
						</tr>
					{/each}
				</tbody>
			</table>
			<p class="mt-2 flex items-center gap-1.5 text-xs text-ink-3"><Coins size={12} />Gewinn beim Verkauf zum vollen Preis. Öl und Seife lohnen nicht.</p>
		</div>
	</div>
</section>

<Modal open={!!making} title={making ? `${making.name} herstellen` : ''} subtitle={making ? `${making.tool} · ${timeLabel(making)}` : ''} onclose={() => (making = null)}>
	{#if making}
		<div class="space-y-4 text-sm">
			<Markdown src={making.how} class="prose-sm" />
			{#if !owned(making)}
				<p class="callout callout-warning !my-0 text-xs">Das {making.tool} hast du noch nicht. Ohne Werkzeug keine Herstellung.</p>
			{/if}
			{#if !trained(campaign.data.state, making)}
				<p class="callout callout-warning !my-0 text-xs">Heute hast du Übung mit „{campaign.data.state.trance.tool || 'nichts'}“. Für dieses Rezept wählst du in der Trance das {making.tool}.</p>
			{/if}
			{#if blocked}
				<p class="callout callout-warning !my-0 text-xs">In dieser Rast hast du schon {campaign.data.state.workshop?.item} hergestellt. Wieder möglich nach der nächsten langen Rast.</p>
			{/if}
			{#if making.time === 'tag' || making.yield > 1}
				<label class="flex items-center gap-3">
					<span class="text-ink-2">{making.time === 'tag' ? 'Tränke (je 1 Tag Arbeit)' : `Anzahl (höchstens ${making.yield})`}</span>
					<input class="input num !w-24" type="number" min="1" max={making.time === 'tag' ? 30 : making.yield} bind:value={qty} />
				</label>
			{/if}
			<label class="flex items-center gap-2 text-ink-2"><input type="checkbox" bind:checked={fromStock} />Zutaten habe ich schon (kein Geld abziehen)</label>
			<p class="text-ink-2">
				{#if cost > 0}Zutaten: <b class="num text-ink">{price(cost)}</b>, danach im Beutel <b class="num {gold - cost < 0 ? 'text-blood' : 'text-gold'}">{fmtGold(Math.max(0, gold - cost))} GM</b>.{:else}Es wird kein Geld abgezogen.{/if}
				Das Erzeugnis landet unter „Verbrauchsgüter“ im Inventar.
			</p>
		</div>
	{/if}
	{#snippet footer()}
		<button class="btn" onclick={() => (making = null)}>Abbrechen</button>
		<button class="btn btn-primary" disabled={blocked || qty < 1 || gold - cost < 0} onclick={confirm}><Clock size={14} />Herstellen</button>
	{/snippet}
</Modal>

<script lang="ts">
	import { Coins, Plus, Minus, Pencil, Trash2, FlaskConical, ShoppingBag, Check, Gem } from '@lucide/svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Markdown from '$lib/components/Markdown.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import { campaign } from '$lib/stores/campaign.svelte';
	import { rolls } from '$lib/stores/rolls.svelte';
	import { heal } from '$lib/game';
	import { fmtGold, goldValue, uid } from '$lib/format';
	import { diceDe } from '$lib/rules';
	import type { Item, ItemGroup, WishItem } from '$lib/types';

	const inv = $derived(campaign.data.inventory);
	const total = $derived(goldValue(inv.currency));

	const GROUPS: { id: ItemGroup; label: string; hint: string }[] = [
		{ id: 'koerper', label: 'Am Körper', hint: 'Ausgerüstet und immer dabei' },
		{ id: 'verbrauch', label: 'Verbrauchsgüter', hint: 'Tränke, Gift, Vorräte, Zutaten' },
		{ id: 'beute', label: 'Beute und Handelsware', hint: 'Zum Verkaufen, Tauschen, Tarnen' },
		{ id: 'plot', label: 'Dokumente und Plot', hint: 'Beweise, Briefe, Karten' },
		{ id: 'gelagert', label: 'Gelagert', hint: 'Nicht im Gepäck' },
		{ id: 'verloren', label: 'Verloren oder gestohlen', hint: 'Noch offen' }
	];

	const PRIO: Record<WishItem['priority'], { label: string; color: string }> = {
		kritisch: { label: 'Kritisch', color: 'var(--color-blood)' },
		hoch: { label: 'Hoch', color: 'var(--color-warn)' },
		mittel: { label: 'Mittel', color: 'var(--color-astral-2)' },
		vorschlag: { label: 'Vorschlag', color: 'var(--color-life)' },
		saladin: { label: 'Von Saladin', color: 'var(--color-gold)' }
	};

	// ---------- Geld ----------
	function coin(k: 'gm' | 'sm' | 'km', d: number) {
		campaign.change('inventory', (i) => (i.currency[k] = Math.max(0, i.currency[k] + d)));
	}
	function setCoin(k: 'gm' | 'sm' | 'km', v: number) {
		campaign.change('inventory', (i) => (i.currency[k] = Math.max(0, Math.floor(v) || 0)));
	}
	let txAmount = $state<number | null>(null);
	let txUnit = $state<'gm' | 'sm' | 'km'>('gm');
	function transaction(sign: 1 | -1) {
		if (!txAmount) return;
		const inKm = txAmount * (txUnit === 'gm' ? 100 : txUnit === 'sm' ? 10 : 1) * sign;
		const cur = inv.currency;
		let km = cur.gm * 100 + cur.sm * 10 + cur.km + inKm;
		if (km < 0) {
			rolls.event('Nicht genug Geld', `Dir fehlen ${fmtGold(-km / 100)} GM`, 'bad');
			return;
		}
		campaign.change('inventory', (i) => {
			if (sign > 0) {
				i.currency[txUnit] += txAmount!;
			} else {
				// Ausgeben: in Kupfer rechnen und möglichst große Münzen behalten.
				i.currency.gm = Math.floor(km / 100);
				km -= i.currency.gm * 100;
				i.currency.sm = Math.floor(km / 10);
				i.currency.km = km - i.currency.sm * 10;
			}
		});
		rolls.event(sign > 0 ? 'Einnahme' : 'Ausgabe', `${txAmount} ${txUnit.toUpperCase()}`, sign > 0 ? 'good' : 'info');
		txAmount = null;
	}

	// ---------- Gegenstände ----------
	function qty(id: string, d: number) {
		campaign.change('inventory', (i) => {
			const it = i.items.find((x) => x.id === id);
			if (it) it.qty = Math.max(0, it.qty + d);
		});
	}
	function useItem(it: Item) {
		if (it.qty <= 0) return;
		if (it.heal) {
			const r = rolls.damage(`${it.name} getrunken`, it.heal);
			if (r) heal(r.total);
		} else {
			rolls.event(`${it.name} benutzt`, `noch ${it.qty - 1}`);
		}
		qty(it.id, -1);
	}

	let editing = $state<Item | null>(null);
	let isNew = $state(false);
	function openNew(group: ItemGroup = 'koerper') {
		editing = { id: uid('item'), name: '', group, qty: 1, desc: '' };
		isNew = true;
	}
	function openEdit(it: Item) {
		editing = { ...it };
		isNew = false;
	}
	function saveItem() {
		if (!editing || !editing.name.trim()) return;
		const draft = $state.snapshot(editing);
		campaign.change('inventory', (i) => {
			const idx = i.items.findIndex((x) => x.id === draft.id);
			if (idx >= 0) i.items[idx] = draft;
			else i.items.push(draft);
		});
		editing = null;
	}
	let confirmDelete = $state<Item | null>(null);
	function removeItem(it: Item) {
		campaign.change('inventory', (i) => (i.items = i.items.filter((x) => x.id !== it.id)));
		confirmDelete = null;
	}

	// ---------- Wunschliste ----------
	let buying = $state<WishItem | null>(null);
	function buy(w: WishItem) {
		const priceKm = (w.price ?? 0) * 100;
		const cur = inv.currency;
		let km = cur.gm * 100 + cur.sm * 10 + cur.km - priceKm;
		if (km < 0) return;
		campaign.change('inventory', (i) => {
			i.currency.gm = Math.floor(km / 100);
			km -= i.currency.gm * 100;
			i.currency.sm = Math.floor(km / 10);
			i.currency.km = km - i.currency.sm * 10;
			const wi = i.wishlist.find((x) => x.id === w.id);
			if (wi) wi.done = true;
			i.items.push({ id: uid('item'), name: w.name, group: 'koerper', qty: 1, desc: w.why });
		});
		rolls.event('Gekauft', `${w.name} für ${w.price} GM`, 'good');
		buying = null;
	}
	function toggleDone(w: WishItem) {
		campaign.change('inventory', (i) => {
			const wi = i.wishlist.find((x) => x.id === w.id);
			if (wi) wi.done = !wi.done;
		});
	}
</script>

<svelte:head><title>Inventar · Valerius</title></svelte:head>

<PageHeader eyebrow="Inventar" title="Besitz und Pläne" subtitle="Alles, was Valerius trägt, lagert, verloren hat und noch kaufen will. Änderungen landen sofort in campaign/inventory.json.">
	{#snippet actions()}
		<button class="btn btn-primary" onclick={() => openNew()}><Plus size={15} />Gegenstand</button>
	{/snippet}
</PageHeader>

<div class="grid gap-4 xl:grid-cols-3">
	<!-- Geld -->
	<section class="panel panel-glow p-5">
		<div class="mb-3 flex items-center gap-2"><Coins size={17} class="text-gold" /><h2 class="font-semibold">Geldbeutel</h2></div>
		<div class="grid grid-cols-3 gap-2">
			{#each [['gm', 'Gold', 'var(--color-gold)'], ['sm', 'Silber', '#c9d2e3'], ['km', 'Kupfer', '#d08a5a']] as [k, label, col] (k)}
				{@const key = k as 'gm' | 'sm' | 'km'}
				<div class="sunken p-3 text-center">
					<input
						class="num w-full bg-transparent text-center text-3xl font-semibold outline-none"
						style="color: {col}"
						type="number"
						min="0"
						value={inv.currency[key]}
						onchange={(e) => setCoin(key, Number(e.currentTarget.value))}
						aria-label={label}
					/>
					<div class="text-xs text-ink-3">{label}</div>
					<div class="mt-2 flex justify-center gap-1">
						<button class="icon-btn !h-6 !w-6" onclick={() => coin(key, -1)} aria-label="{label} −1"><Minus size={12} /></button>
						<button class="icon-btn !h-6 !w-6" onclick={() => coin(key, 1)} aria-label="{label} +1"><Plus size={12} /></button>
					</div>
				</div>
			{/each}
		</div>
		<div class="mt-3 flex items-baseline justify-between text-sm">
			<span class="text-ink-3">Gesamtwert</span><span class="num text-lg font-semibold text-gold">{fmtGold(total)} GM</span>
		</div>
		<div class="mt-3 flex flex-wrap gap-2">
			<input class="input num !h-9 w-20" type="number" min="0" placeholder="0" bind:value={txAmount} aria-label="Betrag" />
			<select class="input !h-9 w-20" bind:value={txUnit} aria-label="Münze">
				<option value="gm">GM</option><option value="sm">SM</option><option value="km">KM</option>
			</select>
			<button class="btn btn-danger btn-sm !h-9 flex-1" onclick={() => transaction(-1)}>Ausgeben</button>
			<button class="btn btn-life btn-sm !h-9 flex-1" onclick={() => transaction(1)}>Einnehmen</button>
		</div>
		<p class="mt-2 text-[0.7rem] text-ink-3">1 GM = 10 SM = 100 KM. Beim Ausgeben wird automatisch gewechselt.</p>
	</section>

	<!-- Wunschliste -->
	<section class="panel p-5 xl:col-span-2">
		<div class="mb-3 flex items-center justify-between">
			<div class="flex items-center gap-2"><ShoppingBag size={17} class="text-astral" /><h2 class="font-semibold">Wunschliste</h2></div>
			<a class="text-xs text-ink-3 hover:text-ink" href="/archiv/einkauf">Ganze Liste und Strategie →</a>
		</div>
		<div class="grid gap-2 md:grid-cols-2">
			{#each inv.wishlist as w (w.id)}
				{@const affordable = w.price !== undefined && w.price <= total}
				<div class="rounded-xl border border-line bg-white/[0.02] p-3 {w.done ? 'opacity-50' : ''}">
					<div class="flex items-start justify-between gap-2">
						<div class="min-w-0">
							<div class="flex flex-wrap items-center gap-1.5">
								<span class="text-sm font-medium {w.done ? 'line-through' : ''}">{w.name}</span>
								<span class="badge" style="--c: {PRIO[w.priority].color}">{PRIO[w.priority].label}</span>
							</div>
							<p class="mt-1 text-xs leading-relaxed text-ink-2">{w.why}</p>
						</div>
						<div class="shrink-0 text-right">
							{#if w.price !== undefined}
								<div class="num text-sm font-semibold">{w.priceText ?? `${w.price} GM`}</div>
								<div class="text-[0.65rem] {affordable ? 'text-life' : 'text-ink-3'}">{affordable ? 'leistbar' : `fehlen ${fmtGold(w.price - total)} GM`}</div>
							{:else}
								<Gem size={14} class="text-gold" />
							{/if}
						</div>
					</div>
					<div class="mt-2 flex justify-end gap-1.5">
						{#if !w.done && affordable && w.priority !== 'saladin'}<button class="btn btn-xs btn-primary" onclick={() => (buying = w)}>Kaufen</button>{/if}
						<button class="btn btn-xs" onclick={() => toggleDone(w)}><Check size={11} />{w.done ? 'Wieder offen' : 'Erledigt'}</button>
					</div>
				</div>
			{/each}
		</div>
	</section>
</div>

<!-- Gegenstände -->
{#each GROUPS as g (g.id)}
	{@const items = inv.items.filter((i) => i.group === g.id)}
	{#if items.length}
		<section class="mt-8">
			<div class="mb-3 flex items-baseline gap-3">
				<h2 class="title-display text-2xl">{g.label}</h2>
				<span class="text-sm text-ink-3">{g.hint} · {items.length}</span>
				<button class="btn btn-xs btn-ghost ml-auto" onclick={() => openNew(g.id)}><Plus size={11} />Hinzufügen</button>
			</div>
			<div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
				{#each items as it (it.id)}
					<article id={it.id} class="panel scroll-mt-24 flex flex-col p-4 {g.id === 'verloren' ? 'opacity-70' : ''}">
						<div class="flex items-start justify-between gap-2">
							<h3 class="flex items-center gap-1.5 font-medium">
								{#if it.magic}<Gem size={14} class="text-gold" />{/if}{it.name}
							</h3>
							<div class="flex shrink-0 items-center gap-1">
								<button class="icon-btn !h-6 !w-6" onclick={() => qty(it.id, -1)} aria-label="Weniger"><Minus size={12} /></button>
								<span class="num w-7 text-center text-sm font-semibold">{it.qty}</span>
								<button class="icon-btn !h-6 !w-6" onclick={() => qty(it.id, 1)} aria-label="Mehr"><Plus size={12} /></button>
							</div>
						</div>
						{#if it.desc}<Markdown src={it.desc} class="prose-sm mt-1.5 flex-1" />{:else}<div class="flex-1"></div>{/if}
						{#if it.note}<p class="mt-2 rounded-lg bg-warn/[0.07] px-2.5 py-1.5 text-xs text-ink-2"><Markdown src={it.note} inline /></p>{/if}
						<div class="mt-3 flex items-center gap-1.5 border-t border-line pt-2.5">
							{#if g.id === 'verbrauch'}
								<button class="btn btn-xs {it.heal ? 'btn-life' : ''}" disabled={it.qty <= 0} onclick={() => useItem(it)}>
									<FlaskConical size={11} />{it.heal ? `Trinken (${diceDe(it.heal)})` : 'Benutzen'}
								</button>
							{/if}
							<span class="flex-1"></span>
							<button class="icon-btn !h-7 !w-7" onclick={() => openEdit(it)} aria-label="Bearbeiten"><Pencil size={13} /></button>
							<button class="icon-btn !h-7 !w-7 hover:!text-blood" onclick={() => (confirmDelete = it)} aria-label="Löschen"><Trash2 size={13} /></button>
						</div>
					</article>
				{/each}
			</div>
		</section>
	{/if}
{/each}

<Modal open={!!editing} title={isNew ? 'Neuer Gegenstand' : 'Gegenstand bearbeiten'} onclose={() => (editing = null)}>
	{#if editing}
		<form
			class="space-y-3"
			onsubmit={(e) => {
				e.preventDefault();
				saveItem();
			}}
		>
			<label class="block"><span class="mb-1 block text-xs text-ink-3">Name</span><input class="input" bind:value={editing.name} required /></label>
			<div class="grid grid-cols-2 gap-3">
				<label class="block">
					<span class="mb-1 block text-xs text-ink-3">Gruppe</span>
					<select class="input" bind:value={editing.group}>
						{#each GROUPS as g (g.id)}<option value={g.id}>{g.label}</option>{/each}
					</select>
				</label>
				<label class="block"><span class="mb-1 block text-xs text-ink-3">Anzahl</span><input class="input num" type="number" min="0" bind:value={editing.qty} /></label>
			</div>
			<label class="block"><span class="mb-1 block text-xs text-ink-3">Beschreibung (Markdown, [[Verweise]] erlaubt)</span><textarea class="input" rows="4" bind:value={editing.desc}></textarea></label>
			<label class="block"><span class="mb-1 block text-xs text-ink-3">Notiz</span><input class="input" bind:value={editing.note} /></label>
			<div class="grid grid-cols-2 gap-3">
				<label class="flex items-center gap-2 text-sm"><input type="checkbox" bind:checked={editing.magic} />Magisch</label>
				<label class="block"><span class="mb-1 block text-xs text-ink-3">Heilt (z. B. 2d4+2)</span><input class="input num" bind:value={editing.heal} /></label>
			</div>
			<div class="flex justify-end gap-2 pt-2">
				<button type="button" class="btn" onclick={() => (editing = null)}>Abbrechen</button>
				<button class="btn btn-primary">Speichern</button>
			</div>
		</form>
	{/if}
</Modal>

<Modal open={!!confirmDelete} title="Gegenstand löschen?" subtitle={confirmDelete?.name} onclose={() => (confirmDelete = null)}>
	<p class="text-sm text-ink-2">Der Eintrag verschwindet aus inventory.json. Über Git lässt er sich wiederherstellen.</p>
	{#snippet footer()}
		<button class="btn" onclick={() => (confirmDelete = null)}>Abbrechen</button>
		<button class="btn btn-danger" onclick={() => confirmDelete && removeItem(confirmDelete)}>Löschen</button>
	{/snippet}
</Modal>

<Modal open={!!buying} title="Kaufen?" subtitle={buying ? `${buying.name} für ${buying.price} GM` : ''} onclose={() => (buying = null)}>
	<p class="text-sm text-ink-2">Das Geld wird abgezogen (danach {fmtGold(total - (buying?.price ?? 0))} GM) und der Gegenstand landet unter „Am Körper“.</p>
	{#snippet footer()}
		<button class="btn" onclick={() => (buying = null)}>Abbrechen</button>
		<button class="btn btn-primary" onclick={() => buying && buy(buying)}>Kaufen</button>
	{/snippet}
</Modal>

<script lang="ts">
	import { Bird, Ghost, Skull, Users, Plus, Minus, X, CircleCheck, CircleAlert, Info, Trees, Swords } from '@lucide/svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import StatBlock from '$lib/components/StatBlock.svelte';
	import Callout from '$lib/components/Callout.svelte';
	import Markdown from '$lib/components/Markdown.svelte';
	import SourceChip from '$lib/components/SourceChip.svelte';
	import { campaign } from '$lib/stores/campaign.svelte';
	import { FAMILIAR_MATERIAL, addMinion, removeMinion, summonFamiliar } from '$lib/game';
	import { diceDe, fmtMod } from '$lib/rules';

	const s = $derived(campaign.data.state);
	const cr = $derived(campaign.data.creatures);
	const current = $derived(cr.familiars.find((f) => f.id === s.familiar.form));
	/** Bei 0 TP ist der Vertraute verschwunden, bis Valerius den Zauber neu wirkt. */
	const fallen = $derived(s.familiar.hp <= 0);
	const material = $derived(campaign.data.inventory.items.find((i) => i.id === FAMILIAR_MATERIAL)?.qty ?? 0);
	const plan = $derived(cr.familiarPlan);
	const gold = $derived(campaign.data.inventory.currency.gm);

	const setForm = (id: string) => summonFamiliar(id);

	function minion(id: string, fn: (m: (typeof s.minions)[number]) => void) {
		campaign.change('state', (st) => {
			const m = st.minions.find((x) => x.id === id);
			if (m) fn(m);
		});
	}
</script>

<svelte:head><title>Gefolge · Valerius</title></svelte:head>

<PageHeader
	eyebrow="Gefolge"
	title="Vertraute, Diener und Untote"
	subtitle="Wertblöcke nach den Regeln (SRD 5.1), mit Live-Tracking für deine Untoten. Angriffe sind würfelbar."
/>

{#if cr.retinueImage}
	{@const img = cr.retinueImage}
	<figure class="panel relative mb-6 overflow-hidden">
		<img src="/api/assets/{img.file}" alt={img.title} class="h-56 w-full object-cover object-[50%_42%] sm:h-72" />
		<figcaption class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/55 to-transparent px-5 pt-12 pb-4">
			<div class="title-display text-2xl text-white sm:text-3xl">{img.title}</div>
			<p class="mt-1 max-w-2xl text-sm leading-relaxed text-white/80">{img.caption}</p>
			{#if img.credit}<p class="mt-1 text-[0.65rem] text-white/50">{img.credit}</p>{/if}
		</figcaption>
	</figure>
{/if}

<!-- Untote: Live -->
<section class="panel panel-glow mb-6 p-5">
	<div class="mb-4 flex flex-wrap items-center justify-between gap-3">
		<div class="flex items-center gap-2"><Skull size={18} class="text-s-nekro" /><h2 class="title-display text-3xl">Deine Untoten</h2></div>
		<div class="flex gap-2">
			<button class="btn btn-sm" onclick={() => addMinion('skelett')}><Plus size={13} />Skelett</button>
			<button class="btn btn-sm" onclick={() => addMinion('zombie')}><Plus size={13} />Zombie</button>
		</div>
	</div>
	{#if s.minions.length}
		<div class="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
			{#each s.minions as m (m.id)}
				{@const block = cr.undead.find((u) => u.id === m.kind)}
				{@const act = block?.actions.find((a) => a.name === block.loadout?.find((l) => l.item === m.gear)?.action)}
				<div class="sunken p-3">
					<div class="flex items-center gap-3">
						<button onclick={() => minion(m.id, (x) => (x.renewed = !x.renewed))} title={m.renewed ? 'Kontrolle erneuert' : 'Kontrolle läuft aus! Erneuern: 1 Minute, Grad-3-Platz für bis zu 4'}>
							{#if m.renewed}<CircleCheck size={18} class="text-life" />{:else}<CircleAlert size={18} class="text-warn" />{/if}
						</button>
						<input class="min-w-0 flex-1 bg-transparent text-sm font-medium outline-none" value={m.name} onchange={(e) => minion(m.id, (x) => (x.name = e.currentTarget.value))} aria-label="Name" />
						<span class="num text-sm">{m.hp}/{m.maxHp}</span>
						<button class="icon-btn !h-7 !w-7" onclick={() => minion(m.id, (x) => (x.hp = Math.max(0, x.hp - 1)))} aria-label="−1 TP"><Minus size={13} /></button>
						<button class="icon-btn !h-7 !w-7" onclick={() => minion(m.id, (x) => (x.hp = Math.min(x.maxHp, x.hp + 1)))} aria-label="+1 TP"><Plus size={13} /></button>
						<button class="icon-btn !h-7 !w-7" onclick={() => removeMinion(m.id)} aria-label="Entfernen"><X size={13} /></button>
					</div>
					{#if block?.loadout?.length}
						<div class="mt-2 flex items-center gap-2 border-t border-line pt-2 text-xs text-ink-3">
							<Swords size={12} class="shrink-0" />
							<select class="min-w-0 flex-1 truncate bg-transparent outline-none" value={m.gear ?? ''} onchange={(e) => minion(m.id, (x) => (x.gear = e.currentTarget.value || undefined))} aria-label="Waffe">
								{#each [...new Set(block.loadout.map((l) => l.item))] as item (item)}<option value={item}>{item}</option>{/each}
								<option value="">ohne Waffe</option>
							</select>
							{#if act}<span class="num shrink-0 text-ink-2">{fmtMod(act.bonus)} · {diceDe(act.damage)} {act.type}</span>{/if}
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{:else}
		<p class="text-sm text-ink-3">Noch keine Untoten erschaffen. Beim Erwecken bekommen sie ihre Waffen: erst den Kurzbogen, dann die beiden Society-Dolche. Nach jeder langen Rast markiert das Grimoire sie als „Kontrolle erneuern“.</p>
	{/if}
	<div class="mt-4 grid gap-3 md:grid-cols-3">
		<Callout type="rule" title="24-Stunden-Kontrolle">Vor Ablauf erneut wirken (1 Minute, alle in 3 m). Ein Grad-3-Platz hält bis zu 4 Untote. Verfallene Untote sind frei und meist feindlich.</Callout>
		<Callout type="tip" title="Ein Befehl für alle">Eine Bonusaktion steuert alle Untoten in 18 m mit demselben Befehl. Allgemeine Befehle („Bewacht den Gang“) laufen ohne weitere Bonusaktionen.</Callout>
		<Callout type="warning" title="Nur Humanoide">Knochen werden zum Skelett, Leichen zum Zombie, immer von kleinen oder mittelgroßen Humanoiden. Tierkadaver gehen nicht.</Callout>
	</div>
</section>

<div class="grid gap-4 xl:grid-cols-2">
	{#each cr.undead as u (u.id)}
		<StatBlock
			id={u.id}
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

<!-- Vertrauter -->
<section class="mt-10">
	<div class="mb-4 flex flex-wrap items-end justify-between gap-3">
		<div>
			<div class="flex items-center gap-2"><Bird size={18} class="text-astral-2" /><h2 class="title-display text-3xl">Vertrauter</h2></div>
			<p class="mt-1 text-sm text-ink-2">
				Aktuell: {#if fallen}<b class="text-blood">keiner</b> ({current?.name} gefallen, neu beschwören){:else}<b class="text-ink">{current?.name}</b>{/if}. Material für {material}× im Inventar. Ein Geist (Himmlisches Wesen, Feenwesen oder Unhold) in Tiergestalt. Kann nicht angreifen, aber helfen und
				spähen. Gestaltwechsel = neues Wirken (1 Stunde, als Ritual 1 Stunde 10 Minuten, 10 GM). Alle {cr.familiars.length} erlaubten Gestalten stehen unten.
			</p>
		</div>
		<a class="chip" href="/zauber/vertrauten-finden" data-ref="spell:vertrauten-finden">Zauber: Vertrauten finden</a>
	</div>

	{#if plan}
		<div class="panel panel-glow mb-4 p-5">
			<div class="mb-1 flex flex-wrap items-center gap-2">
				<Trees size={16} class="text-life" /><h3 class="font-semibold">{plan.title}</h3>
				<span class="ml-auto text-xs text-ink-3">Gold: <b class="num text-ink-2">{gold} GM</b>{gold >= 10 ? ` · danach ${gold - 10} GM` : ' · reicht nicht!'}</span>
			</div>
			<Markdown src={plan.intro} class="prose-sm text-ink-2" />
			<div class="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
				{#each plan.options as o (o.form)}
					{@const f = cr.familiars.find((x) => x.id === o.form)}
					<div class="sunken flex flex-col gap-2 p-4 {o.form === s.familiar.form && !fallen ? 'ring-1 ring-astral/40' : ''}">
						<div class="flex items-start justify-between gap-2">
							<div class="min-w-0">
								<div class="font-semibold">{o.label}</div>
								<div class="text-xs text-ink-3">{f && !o.label.includes(f.name.replace(/\s*\(.*\)/, '')) ? `Werte: ${f.name} · ` : ''}RK {f?.ac} · {f?.hp} TP · {f?.speed}</div>
							</div>
							{#if o.dm}<span class="badge shrink-0" style="--c: var(--color-warn)">DM fragen</span>{/if}
						</div>
						<ul class="space-y-1 text-sm text-ink-2">
							{#each o.pro as line (line)}<li class="flex gap-1.5"><Plus size={13} class="mt-[3px] shrink-0 text-life" /><Markdown src={line} inline /></li>{/each}
							{#each o.con as line (line)}<li class="flex gap-1.5"><Minus size={13} class="mt-[3px] shrink-0 text-blood" /><Markdown src={line} inline /></li>{/each}
						</ul>
						<div class="mt-auto flex items-center gap-2 pt-1">
							<a class="chip" href="#{o.form}">Wertblock</a>
							{#if o.form === s.familiar.form && !fallen}<span class="badge" style="--c: var(--color-astral)">aktuell</span>{:else}<button class="btn btn-xs" onclick={() => setForm(o.form)}>Beschwören</button>{/if}
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<div class="mb-4 overflow-x-auto rounded-2xl border border-line">
		<table class="w-full text-sm">
			<thead class="bg-white/[0.03] text-left text-[0.7rem] tracking-wider text-ink-3 uppercase">
				<tr>
					<th class="px-4 py-2.5">Gestalt</th><th class="px-3">RK</th><th class="px-3">TP</th><th class="px-3">Bewegung</th><th class="px-3">Sinne</th><th class="px-3">Stärke</th><th class="px-3"></th>
				</tr>
			</thead>
			<tbody>
				{#each cr.familiars as f (f.id)}
					<tr class="border-t border-line {f.id === s.familiar.form && !fallen ? 'bg-astral/[0.07]' : ''}">
						<td class="px-4 py-2.5 font-medium"><a href="#{f.id}" class="hover:text-astral">{f.name}</a></td>
						<td class="num px-3">{f.ac}</td>
						<td class="num px-3">{f.hp}</td>
						<td class="px-3 text-ink-2">{f.speed}</td>
						<td class="px-3 text-xs text-ink-2">{f.senses}</td>
						<td class="px-3 text-xs text-ink-2"><Markdown src={f.verdict} inline /></td>
						<td class="px-3 text-right">
							{#if f.id === s.familiar.form && !fallen}<span class="badge" style="--c: var(--color-astral)">aktuell</span>{:else}<button class="btn btn-xs" onclick={() => setForm(f.id)}>{fallen ? 'Beschwören' : 'Wechseln'}</button>{/if}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	<div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
		{#each cr.familiars as f (f.id)}
			<StatBlock
				id={f.id}
				name={f.name}
				subtitle="{f.size} · Vertrauter (Geist in Tiergestalt)"
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
				highlight={f.id === s.familiar.form && !fallen}
			/>
		{/each}
	</div>
</section>

<!-- Diener & Gefährtin -->
<section class="mt-10 grid gap-4 xl:grid-cols-2">
	<article id="diener" class="panel scroll-mt-24 p-5">
		<div class="flex items-center gap-2"><Ghost size={18} class="text-s-besch" /><h2 class="title-display text-3xl">{cr.servant.name}</h2></div>
		<div class="mt-3 grid grid-cols-4 gap-2 text-center">
			<div class="sunken py-2"><div class="num text-xl font-semibold">{cr.servant.ac}</div><div class="text-[0.65rem] text-ink-3">RK</div></div>
			<div class="sunken py-2"><div class="num text-xl font-semibold">{cr.servant.hp}</div><div class="text-[0.65rem] text-ink-3">TP</div></div>
			<div class="sunken py-2"><div class="num text-xl font-semibold">{cr.servant.str}</div><div class="text-[0.65rem] text-ink-3">ST</div></div>
			<div class="sunken py-2"><div class="num text-sm leading-7 font-semibold">{cr.servant.speed}</div><div class="text-[0.65rem] text-ink-3">Bewegung</div></div>
		</div>
		<ul class="prose-grim prose-sm mt-3">
			{#each cr.servant.rules as r (r)}<li>{@html r.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')}</li>{/each}
		</ul>
		<div class="mt-3 flex items-center justify-between">
			<span class="text-sm text-ink-2">Status</span>
			<button class="chip {s.servant ? 'chip-on' : ''}" onclick={() => campaign.change('state', (st) => (st.servant = !st.servant))}>{s.servant ? 'Aktiv' : 'Inaktiv'}</button>
		</div>
	</article>

	{#each cr.party as p (p.id)}
		<article id={p.id} class="panel scroll-mt-24 p-5">
			<div class="flex items-center gap-2"><Users size={18} class="text-gold" /><h2 class="title-display text-3xl">{p.name}</h2></div>
			{#if p.altName}<p class="mt-1 flex items-center gap-1.5 text-sm text-warn"><Info size={13} />{p.altName}</p>{/if}
			<p class="mt-1 text-sm text-ink-2">{p.role}</p>
			<div class="mt-3 grid grid-cols-3 gap-2 text-center">
				<div class="sunken px-2 py-2"><div class="num text-sm font-semibold">{p.ac}</div><div class="text-[0.65rem] text-ink-3">RK</div></div>
				<div class="sunken px-2 py-2"><div class="num text-xl font-semibold">{p.hp}</div><div class="text-[0.65rem] text-ink-3">TP</div></div>
				<div class="sunken px-2 py-2"><div class="num text-xl font-semibold">{p.speed}</div><div class="text-[0.65rem] text-ink-3">Bewegung</div></div>
			</div>
			<ul class="prose-grim prose-sm mt-3">
				{#each p.notes as n (n)}<li>{n}</li>{/each}
			</ul>
			<div class="mt-3 flex flex-wrap gap-2">
				<a class="chip" href="/welt/aella-rayann" data-ref="world:aella-rayann">Welt-Eintrag</a>
				{#if p.source}<SourceChip id={p.source} />{/if}
				<SourceChip id="kho-bogen" />
			</div>
		</article>
	{/each}
</section>

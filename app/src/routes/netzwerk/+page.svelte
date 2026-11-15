<script lang="ts">
	import { Plus, Pencil, Trash2, Eye, MapPin, Coins, UserPlus, ScrollText, Network, Users, Search } from '@lucide/svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import ForceGraph from '$lib/components/ForceGraph.svelte';
	import GraphSidePanel from '$lib/components/GraphSidePanel.svelte';
	import { WORLD_LAYERS, worldGraph, type WorldLayer } from '$lib/graphs';
	import { WORLD_GROUPS } from '$lib/print';
	import { TONE } from '$lib/tone';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Markdown from '$lib/components/Markdown.svelte';
	import RefChip from '$lib/components/RefChip.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import { campaign } from '$lib/stores/campaign.svelte';
	import { fmtGold, goldValue, uid } from '$lib/format';
	import { mdSection } from '$lib/markdown';
	import type { Agent } from '$lib/types';

	const STATUS: { id: Agent['status']; label: string; one: string; color: string }[] = [
		{ id: 'aktiv', label: 'Aktiv', one: 'Aktiv', color: 'var(--color-life)' },
		{ id: 'kandidat', label: 'Kandidaten', one: 'Kandidat', color: 'var(--color-astral-2)' },
		{ id: 'ruhend', label: 'Ruhend', one: 'Ruhend', color: 'var(--color-ink-3)' },
		{ id: 'verloren', label: 'Verloren', one: 'Verloren', color: 'var(--color-blood)' }
	];
	const statusOf = (id: Agent['status']) => STATUS.find((s) => s.id === id) ?? STATUS[0];

	const net = $derived(campaign.data.netzwerk);
	const active = $derived(net.agents.filter((a) => a.status === 'aktiv'));
	/** Lohn steht in Silber pro Tag, die Woche rechnen wir in Gold. */
	const weekly = $derived((active.reduce((s, a) => s + (a.wage ?? 0), 0) * 7) / 10);
	const gold = $derived(goldValue(campaign.data.inventory.currency));
	const plan = $derived(campaign.data.docs.find((d) => d.slug === 'aufbauplan'));
	const rules = $derived(mdSection(plan?.body, 'Regeln für die Hand'));

	// ---------- Ansicht: Beziehungsnetz oder die Hand ----------
	const view = $derived(page.url.searchParams.get('ansicht') === 'hand' ? 'hand' : 'netz');
	function setView(v: 'netz' | 'hand') {
		const u = new URL(page.url);
		if (v === 'hand') u.searchParams.set('ansicht', 'hand');
		else u.searchParams.delete('ansicht');
		goto(u.pathname + u.search, { replaceState: true, noScroll: true, keepFocus: true });
	}

	function toggled<T>(set: Set<T>, v: T): Set<T> {
		const next = new Set(set);
		if (next.has(v)) next.delete(v);
		else next.add(v);
		return next;
	}
	let layers = $state(new Set<WorldLayer>(['verweise', 'familie', 'geheimnisse']));
	let groups = $state(new Set(WORLD_GROUPS.map((g) => g.id)));
	const graph = $derived(worldGraph(campaign.data, campaign.resolve, layers, groups));
	let selected = $state<string | null>(null);
	let focus = $state<string | null>(null);
	let query = $state('');
	const matches = $derived(
		query.trim()
			? graph.nodes.filter((n) => n.label.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 6)
			: []
	);
	const selectedNode = $derived(graph.nodes.find((n) => n.id === selected));
	const hubs = $derived(
		graph.nodes
			.filter((n) => n.id !== 'valerius' && n.id.startsWith('world:'))
			.sort((a, b) => b.r - a.r)
			.slice(0, 8)
	);
	function pick(id: string) {
		focus = null;
		queueMicrotask(() => (focus = id));
	}

	const roleLabel = (id: string) => net.roles.find((r) => r.id === id)?.label ?? id;
	const fmtWage = (sm: number) => (sm % 10 === 0 ? `${sm / 10} GM` : `${sm} SM`) + ' pro Tag';

	function patch(id: string, fn: (a: Agent) => void) {
		campaign.change('netzwerk', (n) => {
			const a = n.agents.find((x) => x.id === id);
			if (a) fn(a);
		});
	}

	let editing = $state<Agent | null>(null);
	let isNew = $state(false);
	function openNew(role = net.roles[0]?.id ?? '') {
		editing = { id: uid('agent'), name: '', role, status: 'kandidat', loyalty: 2 };
		isNew = true;
	}
	function openEdit(a: Agent) {
		editing = { ...a };
		isNew = false;
	}
	function save() {
		if (!editing?.name.trim()) return;
		const draft = $state.snapshot(editing);
		for (const k of ['place', 'knows', 'ref', 'since', 'notes'] as const) if (!draft[k]?.trim()) delete draft[k];
		if (!draft.wage) delete draft.wage;
		campaign.change('netzwerk', (n) => {
			const i = n.agents.findIndex((x) => x.id === draft.id);
			if (i >= 0) n.agents[i] = draft;
			else n.agents.push(draft);
		});
		editing = null;
	}
	let confirmDelete = $state<Agent | null>(null);
	function remove(a: Agent) {
		campaign.change('netzwerk', (n) => {
			const i = n.agents.findIndex((x) => x.id === a.id);
			if (i >= 0) n.agents.splice(i, 1);
		});
		confirmDelete = null;
	}
</script>

<svelte:head><title>Netzwerk · Valerius</title></svelte:head>

<PageHeader
	eyebrow="Netzwerk"
	title={view === 'hand' ? 'Die Unsichtbare Hand' : 'Beziehungsnetz'}
	subtitle={view === 'hand'
		? 'Deine Leute, ihre Rollen und was sie über dich wissen. Rollen und Phasen stammen aus dem Aufbauplan.'
		: 'Wer mit wem verbunden ist, wer deine Geheimnisse kennt und wie das Haus Lhaaz zusammenhängt. Valerius steht in der Mitte.'}
>
	{#snippet actions()}
		{#if plan}<a class="btn" href="/archiv/{plan.slug}" data-ref="doc:{plan.slug}"><ScrollText size={15} />Aufbauplan</a>{/if}
		<button class="btn btn-primary" onclick={() => openNew()}><Plus size={15} />Person</button>
	{/snippet}
</PageHeader>

<div class="mb-5 flex gap-1 rounded-xl bg-black/30 p-1 sm:inline-flex" role="tablist" aria-label="Ansicht">
	<button role="tab" aria-selected={view === 'netz'} class="flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap transition {view === 'netz' ? 'bg-white/10 text-ink' : 'text-ink-3 hover:text-ink'}" onclick={() => setView('netz')}><Network size={15} />Beziehungsnetz</button>
	<button role="tab" aria-selected={view === 'hand'} class="flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap transition {view === 'hand' ? 'bg-white/10 text-ink' : 'text-ink-3 hover:text-ink'}" onclick={() => setView('hand')}><Users size={15} />Die Hand</button>
</div>

{#if view === 'netz'}
	<div class="mb-3 flex flex-wrap items-center gap-1.5">
		{#each WORLD_LAYERS as l (l.id)}
			<button class="chip {layers.has(l.id) ? 'chip-on' : ''}" aria-pressed={layers.has(l.id)} title={l.hint} onclick={() => (layers = toggled(layers, l.id))}>{l.label}</button>
		{/each}
		<span class="mx-1 hidden h-5 w-px bg-line sm:block"></span>
		{#each WORLD_GROUPS as g (g.id)}
			<button class="chip {groups.has(g.id) ? 'chip-on' : ''}" aria-pressed={groups.has(g.id)} onclick={() => (groups = toggled(groups, g.id))}>{g.label}</button>
		{/each}
		<div class="relative ml-auto w-full sm:w-56">
			<Search size={14} class="absolute top-1/2 left-3 -translate-y-1/2 text-ink-3" />
			<input
				class="input !h-8 !pl-8 text-sm"
				placeholder="Person, Ort, Gruppe finden"
				bind:value={query}
				aria-label="Im Netz suchen"
				onkeydown={(e) => {
					if (e.key === 'Enter' && matches[0]) {
						pick(matches[0].id);
						query = '';
					}
				}}
			/>
			{#if matches.length}
				<ul class="panel absolute top-9 right-0 left-0 z-20 p-1">
					{#each matches as m (m.id)}
						<li><button class="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-white/[0.06]" onclick={() => { pick(m.id); query = ''; }}><span class="h-2 w-2 rounded-full" style="background: {m.color}"></span>{m.label}<span class="ml-auto text-xs text-ink-3">{m.kind}</span></button></li>
					{/each}
				</ul>
			{/if}
		</div>
	</div>

	<div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
		<div class="panel overflow-hidden">
			<ForceGraph nodes={graph.nodes} links={graph.links} bind:selected {focus} label="Beziehungsnetz der Kampagne">
				{#snippet legend()}
					<div class="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-line bg-bg/75 px-3 py-2 text-[0.68rem] text-ink-3 backdrop-blur">
						{#each Object.entries(TONE) as [k, t] (k)}<span class="flex items-center gap-1.5"><span class="h-2 w-2 rounded-full" style="background: {t.color}"></span>{t.label}</span>{/each}
						<span class="text-ink-3/80">● Person · ⬢ Gruppe · ◆ Ort · ■ Geheimnis · ★ du</span>
					</div>
				{/snippet}
			</ForceGraph>
		</div>
		<GraphSidePanel node={selectedNode} nodes={graph.nodes} links={graph.links} onpick={pick} onclose={() => (selected = null)}>
			{#snippet intro()}
				<div class="eyebrow mb-2">So liest du das Netz</div>
				<p class="text-sm leading-relaxed text-ink-2">
					Jeder Punkt ist ein Eintrag aus der Welt, die Farbe zeigt, wie er zu dir steht. Linien entstehen, wo ein Eintrag einen anderen erwähnt, wo der Stammbaum verwandt
					zeigt und wo jemand eines deiner Geheimnisse kennt oder ahnt. Je mehr Fäden, desto größer der Punkt.
				</p>
				<ul class="mt-3 space-y-1 text-xs text-ink-3">
					<li><b class="text-ink-2">Antippen</b> zeigt Einzelheiten und Nachbarn.</li>
					<li><b class="text-ink-2">Ziehen</b> verschiebt einen Punkt, mit Umschalt bleibt er liegen.</li>
					<li><b class="text-ink-2">Rad oder zwei Finger</b> zoomen, die leere Fläche verschiebt.</li>
				</ul>
				<div class="eyebrow mt-6 mb-2">Die meisten Fäden</div>
				<ul class="space-y-1">
					{#each hubs as h (h.id)}
						<li><button class="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-white/[0.05]" onclick={() => pick(h.id)}><span class="h-2 w-2 rounded-full" style="background: {h.color}"></span><span class="flex-1 truncate">{h.label}</span><span class="text-xs text-ink-3">{h.kind}</span></button></li>
					{/each}
				</ul>
				<p class="mt-5 text-xs text-ink-3">{graph.nodes.length} Punkte · {graph.links.length} Verbindungen</p>
			{/snippet}
		</GraphSidePanel>
	</div>
{:else}
<div class="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
	<div class="panel p-4">
		<div class="eyebrow">Aktiv</div>
		<div class="num mt-1 text-2xl text-ink">{active.length}</div>
	</div>
	<div class="panel p-4">
		<div class="eyebrow">Kandidaten</div>
		<div class="num mt-1 text-2xl text-ink">{net.agents.filter((a) => a.status === 'kandidat').length}</div>
	</div>
	<div class="panel p-4">
		<div class="eyebrow">Lohn pro Woche</div>
		<div class="num mt-1 text-2xl text-ink">{fmtGold(weekly)} <span class="text-sm text-ink-3">GM</span></div>
	</div>
	<div class="panel p-4">
		<div class="eyebrow">Gold reicht für</div>
		<div class="num mt-1 text-2xl text-ink">
			{#if weekly > 0}{Math.floor(gold / weekly)} <span class="text-sm text-ink-3">Wochen</span>{:else}<span class="text-ink-3">–</span>{/if}
		</div>
		<div class="text-xs text-ink-3">bei {fmtGold(gold)} GM im Beutel</div>
	</div>
</div>

<div class="grid gap-6 xl:grid-cols-[1fr_360px]">
	<div>
		<h2 class="title-display mb-3 text-2xl">Rollen</h2>
		<div class="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
			{#each net.roles as r (r.id)}
				{@const people = net.agents.filter((a) => a.role === r.id && a.status !== 'verloren')}
				{@const filled = people.some((a) => a.status === 'aktiv')}
				<article class="panel flex flex-col p-4">
					<div class="flex items-start justify-between gap-2">
						<h3 class="font-semibold text-ink">{r.label}</h3>
						<span class="badge shrink-0" style="--c: {filled ? 'var(--color-life)' : 'var(--color-ink-3)'}">{filled ? 'besetzt' : 'offen'}</span>
					</div>
					<p class="mt-1 text-sm text-ink-2"><Markdown src={r.task} inline /></p>
					<p class="mt-2 text-xs leading-relaxed text-ink-3"><b class="font-medium text-ink-2">Wo:</b> <Markdown src={r.where} inline /></p>
					<p class="text-xs text-ink-3"><b class="font-medium text-ink-2">Kosten:</b> {r.cost}</p>
					<div class="mt-auto flex flex-wrap items-center gap-1.5 pt-3">
						{#each people as a (a.id)}
							<a class="chip" href="#{a.id}"><span class="h-1.5 w-1.5 rounded-full" style="background: {statusOf(a.status).color}"></span>{a.name}</a>
						{/each}
						<button class="chip text-ink-3" onclick={() => openNew(r.id)}><UserPlus size={11} />eintragen</button>
					</div>
				</article>
			{/each}
		</div>

		<h2 class="title-display mt-10 mb-1 text-2xl">Leute</h2>
		{#if !net.agents.length}
			<div class="panel mt-3 p-8 text-center">
				<p class="text-sm text-ink-2">Noch niemand angeworben.</p>
				<p class="mt-1 text-xs text-ink-3">Phase 1 im Aufbauplan: einen Lehrling über die Kräuterfrau gewinnen.</p>
				<button class="btn btn-primary mt-4" onclick={() => openNew('lehrling')}><UserPlus size={15} />Erste Person eintragen</button>
			</div>
		{/if}
		{#each STATUS as st (st.id)}
			{@const list = net.agents.filter((a) => a.status === st.id)}
			{#if list.length}
				<div class="eyebrow mt-5 mb-2 flex items-center gap-2"><span class="h-2 w-2 rounded-full" style="background: {st.color}"></span>{st.label} · {list.length}</div>
				<div class="grid gap-3 lg:grid-cols-2">
					{#each list as a (a.id)}
						<article id={a.id} class="panel scroll-mt-24 flex flex-col p-4 {a.status === 'verloren' ? 'opacity-70' : ''}">
							<div class="flex items-start justify-between gap-3">
								<div class="min-w-0">
									<div class="mb-1 flex flex-wrap items-center gap-1.5">
										<span class="badge">{roleLabel(a.role)}</span>
										{#if a.ref}<RefChip name={a.ref} label="Welt-Eintrag" />{/if}
									</div>
									<h3 class="text-[1.05rem] leading-snug font-semibold">{a.name}</h3>
									<p class="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-ink-3">
										{#if a.place}<span class="flex items-center gap-1"><MapPin size={11} />{a.place}</span>{/if}
										{#if a.wage}<span class="flex items-center gap-1"><Coins size={11} />{fmtWage(a.wage)}</span>{/if}
										{#if a.since}<span>seit {a.since}</span>{/if}
									</p>
								</div>
								<select
									class="input !h-8 w-32 shrink-0 text-xs"
									value={a.status}
									onchange={(e) => patch(a.id, (x) => (x.status = e.currentTarget.value as Agent['status']))}
									aria-label="Status"
								>
									{#each STATUS as s (s.id)}<option value={s.id}>{s.one}</option>{/each}
								</select>
							</div>

							<div class="mt-3 flex items-center gap-2 text-xs text-ink-3">
								Treue
								<div class="flex items-center gap-1" role="group" aria-label="Treue">
									{#each [1, 2, 3, 4, 5] as n (n)}
										<button
											type="button"
											class="h-3 w-3 rounded-full border transition {n <= a.loyalty ? 'border-gold bg-gold' : 'border-line-2 hover:border-gold/60'}"
											title="Treue {n} von 5"
											aria-label="Treue auf {n} setzen"
											onclick={() => patch(a.id, (x) => (x.loyalty = x.loyalty === n ? n - 1 : n))}
										></button>
									{/each}
								</div>
								<span class="num">{a.loyalty}/5</span>
							</div>

							{#if a.knows}
								<div class="mt-3 rounded-xl border border-warn/25 bg-warn/[0.06] px-3 py-2">
									<div class="eyebrow flex items-center gap-1 !text-[0.6rem] !text-warn"><Eye size={10} />Weiß über dich</div>
									<p class="mt-0.5 text-sm text-ink"><Markdown src={a.knows} inline /></p>
								</div>
							{/if}
							{#if a.notes}<Markdown src={a.notes} class="prose-sm mt-3" />{/if}

							<div class="mt-auto flex justify-end gap-1 pt-3">
								<button class="icon-btn !h-7 !w-7" onclick={() => openEdit(a)} aria-label="Bearbeiten"><Pencil size={13} /></button>
								<button class="icon-btn !h-7 !w-7 hover:!text-blood" onclick={() => (confirmDelete = a)} aria-label="Löschen"><Trash2 size={13} /></button>
							</div>
						</article>
					{/each}
				</div>
			{/if}
		{/each}
	</div>

	{#if rules}
		<aside>
			<section class="panel sticky top-6 p-5">
				<div class="eyebrow mb-2">Aus dem Aufbauplan</div>
				<h2 class="title-display mb-2 text-xl">Regeln für die Hand</h2>
				<Markdown src={rules} class="prose-sm" />
			</section>
		</aside>
	{/if}
</div>

{/if}

<Modal open={!!editing} title={isNew ? 'Neue Person' : 'Person bearbeiten'} onclose={() => (editing = null)} width="max-w-xl">
	{#if editing}
		<form
			class="space-y-3"
			onsubmit={(e) => {
				e.preventDefault();
				save();
			}}
		>
			<label class="block"><span class="mb-1 block text-xs text-ink-3">Name</span><input class="input" bind:value={editing.name} required /></label>
			<div class="grid grid-cols-3 gap-3">
				<label class="block">
					<span class="mb-1 block text-xs text-ink-3">Rolle</span>
					<select class="input" bind:value={editing.role}>{#each net.roles as r (r.id)}<option value={r.id}>{r.label}</option>{/each}</select>
				</label>
				<label class="block">
					<span class="mb-1 block text-xs text-ink-3">Status</span>
					<select class="input" bind:value={editing.status}>{#each STATUS as s (s.id)}<option value={s.id}>{s.one}</option>{/each}</select>
				</label>
				<label class="block"><span class="mb-1 block text-xs text-ink-3">Treue (0 bis 5)</span><input class="input" type="number" min="0" max="5" bind:value={editing.loyalty} /></label>
			</div>
			<div class="grid grid-cols-3 gap-3">
				<label class="block"><span class="mb-1 block text-xs text-ink-3">Ort</span><input class="input" bind:value={editing.place} placeholder="unterer Ring" /></label>
				<label class="block"><span class="mb-1 block text-xs text-ink-3">Lohn (SM pro Tag)</span><input class="input" type="number" min="0" bind:value={editing.wage} /></label>
				<label class="block"><span class="mb-1 block text-xs text-ink-3">Seit</span><input class="input" bind:value={editing.since} placeholder="Okt. 2026" /></label>
			</div>
			<label class="block"><span class="mb-1 block text-xs text-ink-3">Weiß über dich</span><textarea class="input" rows="2" bind:value={editing.knows} placeholder="Nur Floshem? Deinen echten Namen? Die Zafferas?"></textarea></label>
			<label class="block"><span class="mb-1 block text-xs text-ink-3">Notizen (Markdown, [[Verweise]])</span><textarea class="input" rows="2" bind:value={editing.notes}></textarea></label>
			<label class="block">
				<span class="mb-1 block text-xs text-ink-3">Welt-Eintrag (optional)</span>
				<input class="input" bind:value={editing.ref} placeholder="Name eines Eintrags unter Welt" />
			</label>
			<div class="flex justify-end gap-2 pt-2">
				<button type="button" class="btn" onclick={() => (editing = null)}>Abbrechen</button>
				<button class="btn btn-primary">Speichern</button>
			</div>
		</form>
	{/if}
</Modal>

<Modal open={!!confirmDelete} title="Person löschen?" subtitle={confirmDelete?.name} onclose={() => (confirmDelete = null)}>
	<p class="text-sm text-ink-2">Tipp: Wer abspringt oder auffliegt, lieber auf „Verloren“ setzen. Dann bleibt festgehalten, was die Person über dich weiß.</p>
	{#snippet footer()}
		<button class="btn" onclick={() => (confirmDelete = null)}>Abbrechen</button>
		<button class="btn btn-danger" onclick={() => confirmDelete && remove(confirmDelete)}>Löschen</button>
	{/snippet}
</Modal>

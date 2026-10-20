<script lang="ts">
	import { EyeOff, Eye, Plus, Pencil, Trash2, ShieldCheck, ShieldAlert, ShieldX, Sparkles, TriangleAlert, Users, X } from '@lucide/svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Markdown from '$lib/components/Markdown.svelte';
	import RefChip from '$lib/components/RefChip.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import { campaign } from '$lib/stores/campaign.svelte';
	import { uid } from '$lib/format';
	import { markOf, shortName as short, witnesses } from '$lib/secrets';
	import type { Secret, SecretWitness } from '$lib/types';

	const STATUS: Record<Secret['status'], { label: string; hint: string; color: string; icon: typeof ShieldCheck }> = {
		sicher: { label: 'Sicher', hint: 'nur Eingeweihte', color: 'var(--color-life)', icon: ShieldCheck },
		gefaehrdet: { label: 'Gefährdet', hint: 'jemand ahnt es oder es kann herauskommen', color: 'var(--color-warn)', icon: ShieldAlert },
		aufgeflogen: { label: 'Aufgeflogen', hint: 'öffentlich bekannt', color: 'var(--color-blood)', icon: ShieldX }
	};

	const g = $derived(campaign.data.geheimnisse);
	const secrets = $derived(g.secrets);

	/** Alle Mitwisser, wer am meisten weiß zuerst */
	const people = $derived(witnesses(secrets));
	/** Klick in der Tabelle: nichts → ahnt → weiß → nichts. Die Begründung bleibt beim Wechsel erhalten. */
	function cycle(s: Secret, who: string) {
		campaign.change('geheimnisse', (d) => {
			const x = d.secrets.find((y) => y.id === s.id);
			if (!x) return;
			const k = x.knownBy.findIndex((w) => w.who === who);
			const a = x.suspects.findIndex((w) => w.who === who);
			if (k >= 0) x.knownBy.splice(k, 1);
			else if (a >= 0) {
				const [w] = x.suspects.splice(a, 1);
				x.knownBy.push(w);
			} else x.suspects.push({ who });
		});
	}

	const counts = $derived(
		(Object.keys(STATUS) as Secret['status'][]).map((id) => ({ id, ...STATUS[id], n: secrets.filter((s) => s.status === id).length }))
	);

	// ---------- Bearbeiten ----------
	let editing = $state<Secret | null>(null);
	let isNew = $state(false);
	let confirmDelete = $state(false);
	const names = $derived(campaign.data.world.filter((w) => w.kind !== 'ort').map((w) => w.name));

	function openNew() {
		editing = { id: uid('geheimnis'), title: '', status: 'sicher', truth: '', knownBy: [], suspects: [] };
		isNew = true;
		confirmDelete = false;
	}
	function openEdit(s: Secret) {
		editing = $state.snapshot(s) as Secret;
		isNew = false;
		confirmDelete = false;
	}
	function clean(list: SecretWitness[]): SecretWitness[] {
		return list.filter((w) => w.who.trim()).map((w) => (w.how?.trim() ? { who: w.who.trim(), how: w.how.trim() } : { who: w.who.trim() }));
	}
	function save() {
		if (!editing?.title.trim() || !editing.truth.trim()) return;
		const draft = $state.snapshot(editing) as Secret;
		draft.knownBy = clean(draft.knownBy);
		draft.suspects = clean(draft.suspects);
		for (const k of ['cover', 'risk', 'note'] as const) if (!draft[k]?.trim()) delete draft[k];
		campaign.change('geheimnisse', (d) => {
			const i = d.secrets.findIndex((x) => x.id === draft.id);
			if (i >= 0) d.secrets[i] = draft;
			else d.secrets.push(draft);
		});
		editing = null;
	}
	function remove() {
		if (!editing) return;
		const id = editing.id;
		campaign.change('geheimnisse', (d) => (d.secrets = d.secrets.filter((x) => x.id !== id)));
		editing = null;
	}
</script>

<svelte:head><title>Wer weiß was? · Valerius</title></svelte:head>

<PageHeader
	eyebrow="Wer weiß was?"
	title="Geheimnisse und Mitwisser"
	subtitle="Was über Valerius wirklich stimmt, was die Leute glauben und wer was weiß. Ein Klick in die Tabelle hält fest, wer etwas ahnt oder weiß."
>
	{#snippet actions()}
		<button class="btn btn-primary" onclick={openNew}><Plus size={15} />Geheimnis</button>
	{/snippet}
</PageHeader>

<div class="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
	<section class="panel panel-glow p-5">
		<div class="mb-2 flex items-center gap-2"><Sparkles size={17} class="text-astral" /><h2 class="font-semibold">Floshems Ruf</h2></div>
		<Markdown src={g.ruf} class="prose-sm" />
	</section>
	<section class="panel p-5">
		<div class="mb-2 flex items-center gap-2"><TriangleAlert size={17} class="text-warn" /><h2 class="font-semibold">Gefahr für alle Geheimnisse</h2></div>
		<Markdown src={g.gefahren} class="prose-sm" />
	</section>
</div>

<div class="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
	{#each counts as c (c.id)}
		<div class="panel p-4">
			<div class="flex items-center gap-2 text-xs text-ink-3"><c.icon size={14} style="color: {c.color}" />{c.label}</div>
			<div class="num mt-1 text-3xl font-semibold" style="color: {c.n ? c.color : 'var(--color-ink-3)'}">{c.n}</div>
			<div class="text-[0.7rem] text-ink-3">{c.hint}</div>
		</div>
	{/each}
	<div class="panel p-4">
		<div class="flex items-center gap-2 text-xs text-ink-3"><Users size={14} />Mitwisser</div>
		<div class="num mt-1 text-3xl font-semibold">{people.length}</div>
		<div class="text-[0.7rem] text-ink-3">Personen und Gruppen</div>
	</div>
</div>

<!-- Die Tabelle -->
<section class="panel mt-6 p-5">
	<div class="mb-3 flex flex-wrap items-baseline justify-between gap-2">
		<h2 class="title-display text-3xl">Wer weiß was?</h2>
		<span class="flex items-center gap-3 text-xs text-ink-3">
			<span class="flex items-center gap-1"><span class="inline-block size-3 rounded-full bg-blood/80"></span>weiß es</span>
			<span class="flex items-center gap-1"><span class="inline-block size-3 rounded-full border-2 border-warn"></span>ahnt es</span>
			<span>Klick wechselt</span>
		</span>
	</div>
	<div class="overflow-x-auto">
		<table class="w-full border-separate border-spacing-0 text-sm">
			<thead>
				<tr>
					<th class="sticky left-0 z-10 min-w-44 bg-panel py-2 pr-3 text-left text-xs font-medium text-ink-3">Geheimnis</th>
					{#each people as who (who)}
						<th class="px-1 pb-2 align-bottom text-xs font-medium whitespace-nowrap text-ink-2" title={who}>{short(who)}</th>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#each secrets as s (s.id)}
					{@const st = STATUS[s.status]}
					<tr class="group">
						<td class="sticky left-0 z-10 border-t border-line bg-panel py-2 pr-3">
							<a class="flex items-center gap-2 hover:text-astral" href="#{s.id}"><st.icon size={14} style="color: {st.color}" class="shrink-0" /><span class="leading-snug">{s.title}</span></a>
						</td>
						{#each people as who (who)}
							{@const m = markOf(s, who)}
							<td class="border-t border-line px-1 py-1 text-center">
								<button
									class="grid size-8 place-items-center rounded-lg transition hover:bg-white/[0.06]"
									onclick={() => cycle(s, who)}
									title="{short(who)}: {m.mark === 'weiss' ? 'weiß es' : m.mark === 'ahnt' ? 'ahnt es' : 'weiß nichts'}{m.how ? ` · ${m.how}` : ''}"
									aria-label="{s.title}, {short(who)}: {m.mark === 'weiss' ? 'weiß es' : m.mark === 'ahnt' ? 'ahnt es' : 'weiß nichts'}"
								>
									{#if m.mark === 'weiss'}<span class="size-3.5 rounded-full bg-blood/80 shadow-[0_0_10px_-2px_var(--color-blood)]"></span>
									{:else if m.mark === 'ahnt'}<span class="size-3.5 rounded-full border-2 border-warn"></span>
									{:else}<span class="size-1.5 rounded-full bg-white/10 group-hover:bg-white/25"></span>{/if}
								</button>
							</td>
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
	<p class="mt-3 text-xs text-ink-3">Neue Mitwisser trägst du beim Bearbeiten eines Geheimnisses ein. Danach erscheinen sie als eigene Spalte.</p>
</section>

<!-- Die Geheimnisse -->
<div class="mt-6 grid gap-4 lg:grid-cols-2">
	{#each secrets as s (s.id)}
		{@const st = STATUS[s.status]}
		<article id={s.id} class="panel scroll-mt-24 p-5">
			<header class="flex items-start justify-between gap-3">
				<div class="min-w-0">
					<span class="badge" style="--c: {st.color}"><st.icon size={11} />{st.label}</span>
					<h3 class="mt-2 text-xl font-semibold">{s.title}</h3>
				</div>
				<button class="icon-btn" onclick={() => openEdit(s)} aria-label="{s.title} bearbeiten"><Pencil size={15} /></button>
			</header>

			<div class="mt-3 space-y-3">
				<div>
					<div class="eyebrow mb-1 flex items-center gap-1.5"><EyeOff size={11} />Die Wahrheit</div>
					<Markdown src={s.truth} class="prose-sm" />
				</div>
				{#if s.cover}
					<div>
						<div class="eyebrow mb-1 flex items-center gap-1.5"><Eye size={11} />Was die Leute glauben</div>
						<Markdown src={s.cover} class="prose-sm" />
					</div>
				{/if}
				{#if s.risk}
					<div class="rounded-xl border border-warn/25 bg-warn/[0.06] px-3 py-2">
						<div class="eyebrow mb-0.5 !text-warn">Wenn es herauskommt</div>
						<Markdown src={s.risk} class="prose-sm" />
					</div>
				{/if}

				<div class="grid gap-3 sm:grid-cols-2">
					<div>
						<div class="eyebrow mb-1.5">Wissen es</div>
						{#if s.knownBy.length}
							<ul class="space-y-1.5">
								{#each s.knownBy as w (w.who)}
									<li class="text-sm"><RefChip name={w.who} />{#if w.how}<span class="mt-0.5 block text-xs text-ink-3"><Markdown src={w.how} inline /></span>{/if}</li>
								{/each}
							</ul>
						{:else}<p class="text-xs text-ink-3">Nur du.</p>{/if}
					</div>
					<div>
						<div class="eyebrow mb-1.5">Ahnen es</div>
						{#if s.suspects.length}
							<ul class="space-y-1.5">
								{#each s.suspects as w (w.who)}
									<li class="text-sm"><RefChip name={w.who} />{#if w.how}<span class="mt-0.5 block text-xs text-ink-3"><Markdown src={w.how} inline /></span>{/if}</li>
								{/each}
							</ul>
						{:else}<p class="text-xs text-ink-3">Niemand, soweit du weißt.</p>{/if}
					</div>
				</div>

				{#if s.note}<div class="border-t border-line pt-3"><Markdown src={s.note} class="prose-sm" /></div>{/if}
				{#if s.links?.length}
					<div class="flex flex-wrap gap-1.5">{#each s.links as l (l)}<RefChip name={l} />{/each}</div>
				{/if}
			</div>
		</article>
	{/each}
</div>

<Modal open={!!editing} title={isNew ? 'Neues Geheimnis' : 'Geheimnis bearbeiten'} subtitle="Nur was belegt ist. Vermutungen als *Theorie:*, offene Punkte als **Offen:**." onclose={() => (editing = null)} width="max-w-2xl">
	{#if editing}
		<div class="space-y-3">
			<div class="grid gap-3 sm:grid-cols-[1fr_auto]">
				<label class="block"><span class="mb-1 block text-xs text-ink-3">Titel</span><input class="input" bind:value={editing.title} /></label>
				<label class="block">
					<span class="mb-1 block text-xs text-ink-3">Status</span>
					<select class="input" bind:value={editing.status}>
						{#each Object.entries(STATUS) as [id, st] (id)}<option value={id}>{st.label}</option>{/each}
					</select>
				</label>
			</div>
			<label class="block"><span class="mb-1 block text-xs text-ink-3">Die Wahrheit</span><textarea class="input min-h-20" bind:value={editing.truth}></textarea></label>
			<label class="block"><span class="mb-1 block text-xs text-ink-3">Was die Leute glauben (optional)</span><textarea class="input min-h-14" bind:value={editing.cover}></textarea></label>
			<label class="block"><span class="mb-1 block text-xs text-ink-3">Wenn es herauskommt (optional)</span><textarea class="input min-h-14" bind:value={editing.risk}></textarea></label>

			{#each [{ key: 'knownBy', label: 'Wissen es' }, { key: 'suspects', label: 'Ahnen es' }] as const as part (part.key)}
				<div>
					<div class="mb-1 flex items-center justify-between">
						<span class="text-xs text-ink-3">{part.label}</span>
						<button class="btn btn-xs" onclick={() => editing && editing[part.key].push({ who: '', how: '' })}><Plus size={11} />Person</button>
					</div>
					<div class="space-y-1.5">
						{#each editing[part.key] as w, i (i)}
							<div class="flex gap-1.5">
								<input class="input !w-44 shrink-0" list="secret-people" placeholder="Name" bind:value={w.who} />
								<input class="input" placeholder="Woher weiß sie es?" bind:value={w.how} />
								<button class="icon-btn shrink-0" onclick={() => editing && editing[part.key].splice(i, 1)} aria-label="entfernen"><X size={14} /></button>
							</div>
						{/each}
					</div>
				</div>
			{/each}
			<datalist id="secret-people">{#each names as n (n)}<option value={n}></option>{/each}</datalist>

			<label class="block"><span class="mb-1 block text-xs text-ink-3">Theorien und offene Punkte (optional, erscheinen auf der Rätselwand)</span><textarea class="input min-h-14" bind:value={editing.note}></textarea></label>
		</div>
	{/if}
	{#snippet footer()}
		{#if !isNew}
			{#if confirmDelete}
				<button class="btn btn-danger mr-auto" onclick={remove}><Trash2 size={14} />Wirklich löschen</button>
			{:else}
				<button class="btn btn-ghost mr-auto" onclick={() => (confirmDelete = true)}><Trash2 size={14} />Löschen</button>
			{/if}
		{/if}
		<button class="btn" onclick={() => (editing = null)}>Abbrechen</button>
		<button class="btn btn-primary" disabled={!editing?.title.trim() || !editing?.truth.trim()} onclick={save}>Speichern</button>
	{/snippet}
</Modal>

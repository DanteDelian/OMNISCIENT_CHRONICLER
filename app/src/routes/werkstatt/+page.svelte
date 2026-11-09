<script lang="ts">
	import { Check, Clock, Coins, FlaskConical, Hammer, HandCoins, Info, Leaf, Package, Plus, Shirt, Sprout, Trash2, TreePine, TriangleAlert, Wrench } from '@lucide/svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Markdown from '$lib/components/Markdown.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import TranceSelect from '$lib/components/TranceSelect.svelte';
	import { campaign } from '$lib/stores/campaign.svelte';
	import {
		MATERIALS,
		PROJECT_PRESETS,
		RECIPES,
		TOOL_MATERIAL,
		adjustMaterial,
		craft,
		dropProject,
		finishProject,
		materialStock,
		nightsLeft,
		startProject,
		stock,
		trained,
		usedThisRest,
		workOn,
		type MaterialSource,
		type Recipe
	} from '$lib/werkstatt';
	import { fmtCoins, fmtGold, goldValue } from '$lib/format';
	import { mdSection } from '$lib/markdown';

	const s = $derived(campaign.data.state);
	const items = $derived(campaign.data.inventory.items);
	const gold = $derived(goldValue(campaign.data.inventory.currency));
	const used = $derived(usedThisRest(s));

	/** Werkzeug im Gepäck? */
	const hasTool = (tool: string) => items.some((i) => i.group !== 'verloren' && i.name.toLowerCase().includes(tool.toLowerCase()));
	const owned = (r: Recipe) => hasTool(r.tool);
	/** Heute in der Trance geübt? */
	const isTrained = (tool: string) => !!tool && s.trance.tool.trim().toLowerCase() === tool.toLowerCase();

	// ---------- Handwerke (Abschnitte aus dem Handwerks-Handbuch) ----------
	const handbook = $derived(campaign.data.docs.find((d) => d.slug === 'handwerk'));
	const CRAFTS = [
		{ heading: 'So funktioniert Herstellen', label: 'So geht es', icon: Info, tool: '' },
		{ heading: 'Zutaten und Material', label: 'Zutaten', icon: Package, tool: '' },
		{ heading: 'Alchemie', label: 'Alchemie', icon: FlaskConical, tool: 'Alchemistenwerkzeug' },
		{ heading: 'Kräuterkunde', label: 'Kräuterkunde', icon: Leaf, tool: 'Kräuterkundeausrüstung' },
		{ heading: 'Kräuter sammeln nebenbei', label: 'Kräuter sammeln', icon: Sprout, tool: '' },
		{ heading: 'Leder', label: 'Leder', icon: Hammer, tool: 'Lederwerkzeug' },
		{ heading: 'Schneidern', label: 'Schneidern', icon: Shirt, tool: 'Weberwerkzeug' },
		{ heading: 'Holz', label: 'Holz', icon: TreePine, tool: 'Holzschnitzwerkzeug' },
		{ heading: 'Weitere Werkzeuge für die Trance', label: 'Weitere', icon: Wrench, tool: '' }
	];
	let tab = $state('');
	/** Ohne Auswahl: das Handwerk, das du heute geübt hast */
	const activeTab = $derived(tab || CRAFTS.find((c) => isTrained(c.tool))?.heading || CRAFTS[0].heading);
	const activeCraft = $derived(CRAFTS.find((c) => c.heading === activeTab) ?? CRAFTS[0]);

	// ---------- Projekte ----------
	const projects = $derived(s.projects ?? []);
	let newProject = $state(false);
	let presetIdx = $state(0);
	let custom = $state({ name: '', tool: 'Lederwerkzeug', value: 5 });
	let projectSource = $state<MaterialSource>('kaufen');
	const chosen = $derived(presetIdx >= 0 ? PROJECT_PRESETS[presetIdx] : { name: custom.name.trim(), tool: custom.tool.trim(), value: Number(custom.value) || 0 });
	function createProject() {
		if (!chosen.name || chosen.value <= 0) return;
		if (startProject(chosen, projectSource)) newProject = false;
	}
	let bannerBroken = $state(false);
	/** Zutaten für Pfeile: das Holz, das du findest */
	const price = (gm: number) => fmtCoins(gm, 'Holz');
	const timeLabel = (r: Recipe) => (r.time === 'tag' ? '1 Tag Arbeit' : 'in einer langen Rast');
	const stockIds = ['alchemistenfeuer', 'saeure', 'gegengift', 'oel', 'heiltrank', 'pfeile'];

	// ---------- Herstellen ----------
	let making = $state<Recipe | null>(null);
	let qty = $state(1);
	let source = $state<MaterialSource>('kaufen');
	/** Material laut Regel (halber Marktwert), und was davon vom Geld abgeht */
	const fullCost = $derived(making ? making.cost * Math.ceil(qty / making.yield) : 0);
	const cost = $derived(source === 'kaufen' ? fullCost : 0);
	const poolShort = $derived(!!making && source === 'vorrat' && materialStock(making.material) + 1e-9 < fullCost);
	const blocked = $derived(!!making && making.time === 'rast' && used);

	function open(r: Recipe) {
		making = r;
		qty = r.yield;
		source = 'kaufen';
	}
	function confirm() {
		if (!making || blocked || qty < 1) return;
		if (craft(making, qty, source)) making = null;
	}
</script>

<svelte:head><title>Werkstatt · Valerius</title></svelte:head>

<PageHeader
	eyebrow="Werkstatt"
	title="Herstellen statt kaufen"
	subtitle="Was du mit deinen Werkzeugen selbst machst, was es kostet und was es der Unsichtbaren Hand bringt. Regeln aus dem Spielerhandbuch 2014 und Xanathars Ratgeber für alles."
/>

{#if !bannerBroken}
	<figure class="panel relative mb-6 overflow-hidden">
		<img src="/api/assets/werkstatt.webp" alt="Die Werkstatt im Lager" class="h-52 w-full object-cover object-[50%_55%] sm:h-72" onerror={() => (bannerBroken = true)} />
		<figcaption class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/55 to-transparent px-5 pt-12 pb-4">
			<div class="title-display text-2xl text-white sm:text-3xl">Die Werkstatt im Lager</div>
			<p class="mt-1 max-w-2xl text-sm leading-relaxed text-white/80">Alchemie am Lagerfeuer, Leder und Stoff für Rüstungen und Vermummungen, Kräuter zum Trocknen. Was du wie herstellst, steht unten bei den Handwerken.</p>
			<p class="mt-1 text-[0.65rem] text-white/50">KI-Bild (Gemini über Antigravity), ein Stimmungsbild</p>
		</figcaption>
	</figure>
{/if}

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

<!-- Materialvorrat -->
<section class="panel mt-6 p-5">
	<div class="mb-1 flex flex-wrap items-center justify-between gap-2">
		<div class="flex items-center gap-2"><Package size={18} class="text-astral" /><h2 class="title-display text-3xl">Materialvorrat</h2></div>
		<a class="text-xs text-ink-3 hover:text-ink" href="/archiv/handwerk#zutaten-und-material">Was in welches Erzeugnis gehört →</a>
	</div>
	<p class="text-xs leading-relaxed text-ink-3">
		In Gold, wie Xanathars rechnet. Was du kaufst oder sammelst, trägst du mit dem Wert ein, den der DM nennt. Beim Herstellen nimmst du es dann aus dem Vorrat statt zu bezahlen.
	</p>
	<div class="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
		{#each MATERIALS as m (m.id)}
			<div class="rounded-xl border border-line bg-white/[0.02] p-3">
				<div class="text-sm font-medium">{m.label}</div>
				<div class="text-[0.7rem] leading-snug text-ink-3">{m.hint}</div>
				<div class="mt-2 flex items-center justify-between gap-2">
					<span class="num text-lg font-semibold {materialStock(m.id) ? 'text-gold' : 'text-ink-3'}">{fmtCoins(materialStock(m.id))}</span>
					<span class="flex gap-1">
						<button class="btn btn-xs btn-ghost" disabled={!materialStock(m.id)} onclick={() => adjustMaterial(m.id, -1)} aria-label="{m.label}: 1 GM weniger">−1</button>
						<button class="btn btn-xs" onclick={() => adjustMaterial(m.id, 1)} aria-label="{m.label}: 1 GM mehr">+1</button>
						<button class="btn btn-xs" onclick={() => adjustMaterial(m.id, 5)} aria-label="{m.label}: 5 GM mehr">+5</button>
					</span>
				</div>
			</div>
		{/each}
	</div>
</section>

<!-- Projekte -->
<section class="panel mt-6 p-5">
	<div class="mb-1 flex flex-wrap items-center justify-between gap-2">
		<div class="flex items-center gap-2"><Hammer size={18} class="text-gold" /><h2 class="title-display text-3xl">Projekte</h2></div>
		<button class="btn btn-sm" onclick={() => (newProject = true)}><Plus size={13} />Neues Projekt</button>
	</div>
	<p class="text-xs leading-relaxed text-ink-3">
		Spielerhandbuch: 5 GM Marktwert pro 8 Stunden Arbeit, Material für die Hälfte. Deine freien 4 Stunden nach der Trance bringen 2,5 GM. Xanathars rechnet 10 GM pro Tag,
		welche Regel gilt, entscheidet der DM.
	</p>
	{#if projects.length}
		<ul class="mt-4 grid gap-3 lg:grid-cols-2">
			{#each projects as p (p.id)}
				{@const pct = Math.round((p.done / p.value) * 100)}
				<li class="rounded-xl border border-line bg-white/[0.02] p-3.5">
					<div class="flex flex-wrap items-start justify-between gap-2">
						<div class="min-w-0">
							<div class="font-semibold">{p.name}</div>
							<div class="text-xs text-ink-3">{p.tool}{p.note ? ` · ${p.note}` : ''}</div>
						</div>
						<span class="badge shrink-0" style="--c: {isTrained(p.tool) ? 'var(--color-life)' : 'var(--color-warn)'}">{isTrained(p.tool) ? 'heute geübt' : 'heute nicht geübt'}</span>
					</div>
					<div class="mt-2.5 h-2 overflow-hidden rounded-full bg-white/[0.06]"><div class="h-full rounded-full bg-gold/80" style="width: {pct}%"></div></div>
					<div class="mt-2 flex flex-wrap items-center justify-between gap-2">
						<span class="num text-xs text-ink-2">{fmtGold(p.done)} / {fmtGold(p.value)} GM{p.done < p.value ? ` · noch ${nightsLeft(p.value, p.done)} freie ${nightsLeft(p.value, p.done) === 1 ? 'Nacht' : 'Nächte'}` : ''}</span>
						<div class="flex flex-wrap items-center gap-1.5">
							{#if p.done < p.value}
								<button class="btn btn-xs" onclick={() => workOn(p.id, 4)}>+ freie Nacht</button>
								<button class="btn btn-xs btn-ghost" onclick={() => workOn(p.id, 8)}>+ Arbeitstag</button>
							{:else}
								<button class="btn btn-xs btn-life" onclick={() => finishProject(p.id)}><Check size={12} />Ins Inventar</button>
							{/if}
							<button class="icon-btn !h-7 !w-7 hover:!text-blood" onclick={() => dropProject(p.id)} aria-label="{p.name} verwerfen"><Trash2 size={13} /></button>
						</div>
					</div>
				</li>
			{/each}
		</ul>
	{:else}
		<p class="mt-3 text-sm text-ink-3">Noch kein Projekt. Zum Beispiel eine Lederrüstung für ein Skelett: 10 GM Wert, 5 GM Material, 4 freie Nächte.</p>
	{/if}
</section>

<!-- Handwerke -->
<section class="mt-8">
	<h2 class="title-display mb-3 text-3xl">Handwerke</h2>
	<div class="mb-3 flex flex-wrap gap-1.5">
		{#each CRAFTS as c (c.heading)}
			<button class="chip {activeTab === c.heading ? 'chip-on' : ''}" onclick={() => (tab = c.heading)}>
				<c.icon size={13} />{c.label}{#if isTrained(c.tool)}<span class="ml-0.5 h-1.5 w-1.5 rounded-full bg-life" title="heute geübt"></span>{/if}
			</button>
		{/each}
	</div>
	<article class="panel p-5 lg:p-6">
		{#if activeCraft.tool}
			<div class="mb-3 flex flex-wrap items-center gap-2">
				<span class="badge" style="--c: {hasTool(activeCraft.tool) ? 'var(--color-life)' : 'var(--color-warn)'}">{hasTool(activeCraft.tool) ? 'im Gepäck' : 'fehlt noch, Einkaufszettel oder beschwören'}</span>
				{#if isTrained(activeCraft.tool)}<span class="badge" style="--c: var(--color-life)"><Check size={11} />heute geübt</span>{/if}
			</div>
		{/if}
		{#if handbook}
			<Markdown src={mdSection(handbook.body, activeTab)} class="prose-sm max-w-none" />
			<a class="mt-4 inline-block text-xs text-ink-3 hover:text-ink" href="/archiv/handwerk">Ganzes Handwerks-Handbuch →</a>
		{:else}
			<p class="text-sm text-ink-3">Das Handwerks-Handbuch (campaign/docs/handwerk.md) fehlt.</p>
		{/if}
	</article>
</section>

<h2 class="title-display mt-8 mb-3 text-3xl">Rezepte</h2>
<div class="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
	{#each RECIPES as r (r.id)}
		{@const rTrained = trained(s, r)}
		{@const rHasTool = owned(r)}
		<article class="panel flex flex-col p-5">
			<header class="flex items-start justify-between gap-3">
				<div>
					<h3 class="text-lg font-semibold">{r.name}</h3>
					<p class="text-xs text-ink-3 italic">{r.en}</p>
				</div>
				<span class="badge shrink-0" style="--c: {rTrained ? 'var(--color-life)' : rHasTool ? 'var(--color-warn)' : 'var(--color-blood)'}" title={r.toolEn}>
					{#if rTrained}<Check size={11} />{:else}<TriangleAlert size={11} />{/if}{r.tool}
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
					{#if !rHasTool}Werkzeug fehlt noch{:else if !rTrained}heute nicht geübt{:else if r.time === 'rast' && used}diese Rast schon benutzt{:else}<span class="text-life">bereit</span>{/if}
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

{#snippet sourcePicker(set: (v: MaterialSource) => void, value: MaterialSource, mat: string | undefined)}
	{@const m = MATERIALS.find((x) => x.id === mat)}
	<div class="space-y-1.5 text-ink-2">
		<div class="text-xs text-ink-3">Material (halber Marktwert)</div>
		<label class="flex items-center gap-2"><input type="radio" checked={value === 'kaufen'} onchange={() => set('kaufen')} />kaufen, Geld abziehen</label>
		{#if m}<label class="flex items-center gap-2"><input type="radio" checked={value === 'vorrat'} onchange={() => set('vorrat')} />aus dem Vorrat „{m.label}“ ({price(materialStock(m.id))} da)</label>{/if}
		<label class="flex items-center gap-2"><input type="radio" checked={value === 'frei'} onchange={() => set('frei')} />habe ich schon, nichts verbuchen</label>
	</div>
{/snippet}

<Modal open={newProject} title="Neues Projekt" subtitle="Herstellen nach Spielerhandbuch: 5 GM pro 8 Stunden Arbeit" onclose={() => (newProject = false)}>
	<div class="space-y-4 text-sm">
		<label class="block">
			<span class="mb-1 block text-xs text-ink-3">Was?</span>
			<select class="input" bind:value={presetIdx}>
				{#each PROJECT_PRESETS as p, i (p.name)}<option value={i}>{p.name} · {p.tool} · {fmtCoins(p.value)}</option>{/each}
				<option value={-1}>Eigenes Projekt …</option>
			</select>
		</label>
		{#if presetIdx < 0}
			<div class="grid gap-3 sm:grid-cols-[1fr_1fr_6rem]">
				<label class="block"><span class="mb-1 block text-xs text-ink-3">Name</span><input class="input" bind:value={custom.name} placeholder="Sattel für fünf" /></label>
				<label class="block"><span class="mb-1 block text-xs text-ink-3">Werkzeug</span><input class="input" bind:value={custom.tool} /></label>
				<label class="block"><span class="mb-1 block text-xs text-ink-3">Wert (GM)</span><input class="input num" type="number" min="0.1" step="0.5" bind:value={custom.value} /></label>
			</div>
		{/if}
		{#if chosen.value > 0}
			<p class="text-ink-2">
				Material: <b class="num text-ink">{fmtCoins(chosen.value / 2)}</b> · Arbeit: <b class="num text-ink">{nightsLeft(chosen.value, 0)}</b> freie {nightsLeft(chosen.value, 0) === 1 ? 'Nacht' : 'Nächte'} oder
				<b class="num text-ink">{Math.ceil(chosen.value / 5)}</b> {Math.ceil(chosen.value / 5) === 1 ? 'Arbeitstag' : 'Arbeitstage'}.
			</p>
		{/if}
		{@render sourcePicker((v) => (projectSource = v), projectSource, TOOL_MATERIAL[chosen.tool])}
	</div>
	{#snippet footer()}
		<button class="btn" onclick={() => (newProject = false)}>Abbrechen</button>
		<button class="btn btn-primary" disabled={!chosen.name || chosen.value <= 0 || (projectSource === 'kaufen' && gold < chosen.value / 2) || (projectSource === 'vorrat' && materialStock(TOOL_MATERIAL[chosen.tool]) + 1e-9 < chosen.value / 2)} onclick={createProject}><Hammer size={14} />Beginnen</button>
	{/snippet}
</Modal>

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
			{@render sourcePicker((v) => (source = v), source, making.material)}
			<p class="text-ink-2">
				{#if cost > 0}Zutaten: <b class="num text-ink">{price(cost)}</b>, danach im Beutel <b class="num {gold - cost < 0 ? 'text-blood' : 'text-gold'}">{fmtGold(Math.max(0, gold - cost))} GM</b>.{:else if source === 'vorrat'}Aus dem Vorrat: <b class="num {poolShort ? 'text-blood' : 'text-ink'}">{price(fullCost)}</b> von {price(materialStock(making.material))}.{:else}Es wird nichts abgezogen.{/if}
				Das Erzeugnis landet unter „Verbrauchsgüter“ im Inventar.
			</p>
		</div>
	{/if}
	{#snippet footer()}
		<button class="btn" onclick={() => (making = null)}>Abbrechen</button>
		<button class="btn btn-primary" disabled={blocked || qty < 1 || gold - cost < 0 || poolShort} onclick={confirm}><Clock size={14} />Herstellen</button>
	{/snippet}
</Modal>

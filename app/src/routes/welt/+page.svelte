<script lang="ts">
	import { Search, Link2 } from '@lucide/svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Markdown from '$lib/components/Markdown.svelte';
	import { campaign } from '$lib/stores/campaign.svelte';
	import { normalizeName } from '$lib/refs';
	import { TONE, KIND_LABEL } from './tone';

	let kind = $state<'alle' | 'person' | 'fraktion' | 'ort'>('alle');
	let q = $state('');

	const world = $derived(campaign.data.world);
	const backlinks = $derived(campaign.data.backlinks);
	const lage = $derived(campaign.data.docs.find((d) => d.slug === 'lage'));

	const GROUPS = [
		{ id: 'gruppe', label: 'Die Gruppe' },
		{ id: 'lhaaz', label: 'Haus Lhaaz' },
		{ id: 'kontakt', label: 'Kontakte und Verbündete' },
		{ id: 'bedrohung', label: 'Bedrohungen' },
		{ id: 'vergangenheit', label: 'Vergangenheit' },
		{ id: 'ort', label: 'Orte' }
	];

	const visible = $derived(
		world.filter((w) => {
			if (kind !== 'alle' && w.kind !== kind) return false;
			if (q) {
				const hay = normalizeName([w.name, ...w.aliases, w.summary, w.status].join(' '));
				if (!hay.includes(normalizeName(q))) return false;
			}
			return true;
		})
	);
</script>

<svelte:head><title>Welt · Valerius</title></svelte:head>

<PageHeader eyebrow="Welt" title="Personen, Mächte und Orte" subtitle="{world.length} Einträge. Fahr über einen Verweis für eine Vorschau, klick für alle Details und Rückverweise." />

{#if lage}
	<section class="panel panel-glow mb-6 p-5">
		<div class="mb-2 flex items-center justify-between">
			<div class="eyebrow">Aktuelle Lage</div>
			<a class="text-xs text-ink-3 hover:text-ink" href="/archiv/pruefbericht">Prüfbericht: Korrekturen und offene Fragen →</a>
		</div>
		<Markdown src={lage.body.replace(/^# .*\n/, '')} class="prose-sm" />
	</section>
{/if}

<div class="mb-6 flex flex-wrap items-center gap-2">
	{#each [['alle', 'Alle'], ['person', 'Personen'], ['fraktion', 'Fraktionen'], ['ort', 'Orte']] as [id, label] (id)}
		<button class="chip {kind === id ? 'chip-on' : ''}" onclick={() => (kind = id as typeof kind)}>{label}</button>
	{/each}
	<span class="ml-2 hidden items-center gap-3 text-xs text-ink-3 md:flex">
		{#each Object.entries(TONE) as [k, t] (k)}<span class="flex items-center gap-1"><span class="h-2 w-2 rounded-full" style="background: {t.color}"></span>{t.label}</span>{/each}
	</span>
	<div class="relative ml-auto w-full sm:w-64">
		<Search size={14} class="absolute top-1/2 left-3 -translate-y-1/2 text-ink-3" />
		<input class="input !pl-8" placeholder="Suchen …" bind:value={q} />
	</div>
</div>

{#each GROUPS as g (g.id)}
	{@const list = visible.filter((w) => w.group === g.id)}
	{#if list.length}
		<section class="mb-8">
			<h2 class="title-display mb-3 text-2xl">{g.label} <span class="text-base text-ink-3">· {list.length}</span></h2>
			<div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
				{#each list as w (w.slug)}
					{@const t = TONE[w.tone]}
					{@const refs = backlinks[`world:${w.slug}`]?.length ?? 0}
					<a href="/welt/{w.slug}" class="panel panel-hover relative flex flex-col overflow-hidden p-4" data-ref="world:{w.slug}">
						<span class="absolute inset-y-0 left-0 w-1" style="background: {t.color}"></span>
						<div class="flex items-center gap-2">
							<span class="badge" style="--c: {t.color}">{KIND_LABEL[w.kind]}</span>
							<span class="truncate text-xs text-ink-3">{w.status}</span>
						</div>
						<h3 class="mt-2 text-[1.05rem] font-semibold">{w.name}</h3>
						<p class="mt-1 line-clamp-3 flex-1 text-[0.84rem] leading-relaxed text-ink-2">{w.summary}</p>
						{#if refs}<div class="mt-3 flex items-center gap-1 text-[0.7rem] text-ink-3"><Link2 size={11} />{refs} Verweise</div>{/if}
					</a>
				{/each}
			</div>
		</section>
	{/if}
{/each}

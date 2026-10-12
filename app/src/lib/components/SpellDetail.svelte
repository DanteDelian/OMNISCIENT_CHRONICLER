<script lang="ts">
	import { BookMarked, Brain, Dices, Flame, Lightbulb, Link2, ShieldAlert, Sparkle, Swords, Wand2, TriangleAlert, CircleHelp } from '@lucide/svelte';
	import Markdown from './Markdown.svelte';
	import SchoolBadge from './SchoolBadge.svelte';
	import RefChip from './RefChip.svelte';
	import SourceChip from './SourceChip.svelte';
	import HitCalc from './HitCalc.svelte';
	import CastButton from './CastButton.svelte';
	import { campaign } from '$lib/stores/campaign.svelte';
	import { rolls } from '$lib/stores/rolls.svelte';
	import { averageOf, diceDe, maxOf, preparedCount, spellDc } from '$lib/rules';
	import type { Spell } from '$lib/types';

	let { spell, compact = false }: { spell: Spell; compact?: boolean } = $props();

	const backlinks = $derived(campaign.data.backlinks[`spell:${spell.id}`] ?? []);
	const prepared = $derived(preparedCount(campaign.data.spells));
	const max = $derived(campaign.data.character.spellcasting.preparedMax);

	function togglePrepared() {
		campaign.change('spells', (list) => {
			const s = list.find((x) => x.id === spell.id);
			if (s) s.prepared = !s.prepared;
		});
	}

	const facts = $derived(
		[
			['Wirkzeit', spell.time + (spell.ritual ? ' (oder als Ritual +10 Min.)' : '') + (spell.trigger ? `, ${spell.trigger}` : '')],
			['Reichweite', spell.range],
			['Ziel', spell.target],
			['Bereich', spell.area],
			['Komponenten', spell.components],
			['Wirkungsdauer', spell.duration],
			['Angriff', spell.attack],
			['Rettungswurf', spell.save ? `${spell.save} gegen SG ${spellDc(campaign.data.character)}` : undefined],
			['Schaden', spell.damage],
			['Quelle', spell.source]
		].filter(([, v]) => v) as [string, string][]
	);
</script>

<article class="space-y-5">
	<!-- Kopf -->
	<header class="space-y-3">
		<div class="flex flex-wrap items-center gap-2">
			<SchoolBadge school={spell.school} level={spell.level} />
			{#if spell.ritual}<span class="badge" style="--c: var(--color-gold)">Ritual</span>{/if}
			{#if spell.concentration}<span class="badge" style="--c: var(--color-warn)"><Brain size={11} />Konzentration</span>{/if}
			{#if spell.economy === 'reaktion'}<span class="badge" style="--c: var(--color-astral-2)">Reaktion</span>{/if}
			{#if spell.economy === 'bonus'}<span class="badge" style="--c: var(--color-astral-2)">Bonusaktion</span>{/if}
			{#if spell.status === 'vorschlag'}<span class="badge" style="--c: var(--color-life)"><Sparkle size={11} />Vorschlag · nicht im Buch</span>{/if}
			{#if spell.status === 'frage'}<span class="badge" style="--c: var(--color-warn)"><CircleHelp size={11} />Mit DM klären</span>{/if}
		</div>
		<div>
			<h1 class="title-display {compact ? 'text-3xl' : 'text-5xl'}">{spell.name}</h1>
			<p class="mt-1 text-sm text-ink-3 italic">{spell.en}</p>
		</div>
		{#if spell.status === 'buch' && spell.level > 0}
			<div class="flex flex-wrap items-center gap-2">
				<button class="chip {spell.prepared ? 'chip-on' : ''}" onclick={togglePrepared}>
					<BookMarked size={13} />{spell.prepared ? 'Vorbereitet' : 'Nicht vorbereitet'}
				</button>
				<span class="text-xs text-ink-3">{prepared}/{max} vorbereitet{spell.ritual ? ' · Rituale gehen auch ohne Vorbereitung' : ''}</span>
			</div>
		{/if}
	</header>

	<!-- Eckdaten -->
	<dl class="grid gap-px overflow-hidden rounded-2xl border border-line bg-line {compact ? 'grid-cols-1' : 'sm:grid-cols-2'}">
		{#each facts as [k, v] (k)}
			<div class="bg-panel px-4 py-2.5">
				<dt class="eyebrow !text-[0.6rem]">{k}</dt>
				<dd class="mt-0.5 text-sm text-ink"><Markdown src={v} inline /></dd>
			</div>
		{/each}
	</dl>

	<!-- Für Valerius -->
	{#if spell.valerius || spell.rolls?.length || spell.attack || spell.save}
		<section class="panel panel-glow space-y-3 p-4">
			<div class="flex items-center gap-2"><Wand2 size={16} class="text-astral" /><h2 class="font-semibold">Deine Werte</h2></div>
			{#if spell.valerius}<Markdown src={spell.valerius} class="prose-sm" />{/if}
			<div class="flex flex-wrap gap-2">
				{#if spell.status === 'buch'}<CastButton {spell} />{/if}
				{#each spell.rolls ?? [] as r (r.label)}
					<button class="btn btn-sm" onclick={() => rolls.damage(`${spell.name}: ${r.label}`, r.expr)} title="Ø {averageOf(r.expr)} · max. {maxOf(r.expr)}">
						<Dices size={14} />{r.label} <span class="num text-ink-3">{diceDe(r.expr)}</span>
					</button>
				{/each}
			</div>
			{#if spell.attack || spell.save}<HitCalc {spell} />{/if}
		</section>
	{/if}

	{#if spell.why}
		<section class="callout callout-tip">
			<div class="callout-title" data-label="Warum">Warum dieser Zauber zu Valerius passt{spell.slot ? ` · freier Platz: ${spell.slot}` : ''}</div>
			<Markdown src={spell.why} class="prose-sm" />
		</section>
	{/if}

	<!-- Regeltext -->
	<section>
		<div class="mb-2 flex items-center gap-2"><BookMarked size={16} class="text-ink-3" /><h2 class="font-semibold">Vollständiger Regeltext</h2></div>
		<Markdown src={spell.text} />
		{#if spell.higher}
			<div class="mt-3 rounded-xl border border-line bg-white/[0.02] p-3">
				<div class="eyebrow mb-1">Auf höheren Graden</div>
				<Markdown src={spell.higher} class="prose-sm" />
			</div>
		{/if}
	</section>

	{#if spell.tips?.length}
		<section>
			<div class="mb-2 flex items-center gap-2"><Lightbulb size={16} class="text-life" /><h2 class="font-semibold">Tipps & Tricks</h2></div>
			<ul class="grid gap-2 {compact ? '' : 'md:grid-cols-2'}">
				{#each spell.tips as t, i (i)}
					<li class="rounded-xl border border-life/15 bg-life/[0.04] p-3 text-sm leading-relaxed text-ink-2"><Markdown src={t} inline /></li>
				{/each}
			</ul>
		</section>
	{/if}

	{#if spell.uses?.length}
		<section>
			<div class="mb-2 flex items-center gap-2"><Swords size={16} class="text-astral" /><h2 class="font-semibold">Einsatzideen für Valerius</h2></div>
			<p class="mb-2 text-xs text-ink-3">Größtenteils aus deinen Dokumenten (vor allem „Zauber von Val“), teils ergänzt.</p>
			<ul class="prose-grim prose-sm">
				{#each spell.uses as u, i (i)}<li><Markdown src={u} inline /></li>{/each}
			</ul>
		</section>
	{/if}

	{#if spell.rulings?.length}
		<section>
			<div class="mb-2 flex items-center gap-2"><ShieldAlert size={16} class="text-astral-2" /><h2 class="font-semibold">Regelklarstellungen</h2></div>
			<ul class="prose-grim prose-sm">
				{#each spell.rulings as r, i (i)}<li><Markdown src={r} inline /></li>{/each}
			</ul>
		</section>
	{/if}

	{#if spell.synergies?.length || spell.conflicts?.length}
		<section class="grid gap-3 {compact ? '' : 'md:grid-cols-2'}">
			{#if spell.synergies?.length}
				<div class="rounded-2xl border border-line p-3.5">
					<div class="mb-2 flex items-center gap-2"><Link2 size={15} class="text-life" /><h3 class="text-sm font-semibold">Passt gut zu</h3></div>
					<ul class="space-y-2">
						{#each spell.synergies as s (s.with)}
							<li class="text-sm text-ink-2"><RefChip name={s.with} /> <span class="mt-1 block text-[0.82rem]">{s.text}</span></li>
						{/each}
					</ul>
				</div>
			{/if}
			{#if spell.conflicts?.length}
				<div class="rounded-2xl border border-line p-3.5">
					<div class="mb-2 flex items-center gap-2"><Flame size={15} class="text-warn" /><h3 class="text-sm font-semibold">Konkurriert mit</h3></div>
					<ul class="space-y-2">
						{#each spell.conflicts as s (s.with)}
							<li class="text-sm text-ink-2"><RefChip name={s.with} /> <span class="mt-1 block text-[0.82rem]">{s.text}</span></li>
						{/each}
					</ul>
				</div>
			{/if}
		</section>
	{/if}

	{#if spell.corrections?.length || spell.note}
		<section class="space-y-2">
			{#each spell.corrections ?? [] as c, i (i)}
				<div class="callout callout-fix">
					<div class="callout-title" data-label="Korrigiert"><TriangleAlert size={14} />Fehler im Dokument</div>
					<Markdown src={c.text} class="prose-sm" />
					<div class="mt-2"><SourceChip id={c.doc} /></div>
				</div>
			{/each}
			{#if spell.note}
				<div class="callout callout-warning">
					<div class="callout-title" data-label="Hinweis">Offen</div>
					<Markdown src={spell.note} class="prose-sm" />
				</div>
			{/if}
		</section>
	{/if}

	{#if spell.docs?.length || backlinks.length}
		<section class="flex flex-wrap items-center gap-2 border-t border-line pt-4">
			{#if spell.docs?.length}
				<span class="eyebrow mr-1">Quellen</span>
				{#each spell.docs as d (d)}<SourceChip id={d} />{/each}
			{/if}
			{#if backlinks.length}
				<span class="eyebrow mr-1 ml-2">Erwähnt in</span>
				{#each backlinks as b (b.key)}<a class="chip" href={b.href} data-ref={b.key}>{b.title}</a>{/each}
			{/if}
		</section>
	{/if}
</article>

<script lang="ts">
	import PDoc from './PDoc.svelte';
	import PMd from './PMd.svelte';
	import { campaign } from '$lib/stores/campaign.svelte';
	import { printAnchor } from '$lib/markdown';
	import { QUESTION_TO, collectClues, groupClues } from '$lib/raetsel';
	import { fmtDate } from '$lib/format';

	const clues = $derived(collectClues(campaign.data));
	const groups = $derived(groupClues(clues));
	const mysteries = $derived(campaign.data.quests.filter((q) => q.kind === 'Mysterium' && (q.status === 'aktiv' || q.status === 'geruecht')));
	const contradictions = $derived(campaign.data.journal.flatMap((j) => (j.contradictions ?? []).map((text) => ({ text, entry: j }))));
	const solved = $derived(campaign.data.fragen.filter((q) => q.status === 'geklaert').sort((a, b) => (b.answered ?? '').localeCompare(a.answered ?? '')));
</script>

<PDoc
	id="raetsel"
	refs={['page:raetsel']}
	eyebrow="Kampagne"
	title="Rätselwand"
	subtitle="{clues.length} Theorien und offene Punkte · {contradictions.length} Widersprüche · {mysteries.length} Mysterien. Gesammelt aus allen Einträgen."
>
	{#if mysteries.length}
		<h2>Mysterien <span class="count">{mysteries.length}</span></h2>
		<div class="cols-2">
			{#each mysteries as q (q.id)}
				<div class="avoid small" style="margin-bottom: 2.4mm">
					<b>{q.title}</b>
					{#if q.next}<div class="soft"><PMd src={q.next} inline /></div>{/if}
				</div>
			{/each}
		</div>
	{/if}

	<h2>Theorien und offene Punkte <span class="count">{clues.length} in {groups.length} Einträgen</span></h2>
	<div class="cols-2">
		{#each groups as g (g.source.key)}
			<div class="avoid clue-group">
				<div class="spread"><b class="small">{g.source.title}</b><span class="tiny muted">{g.source.kind}</span></div>
				{#each g.clues as c, i (i)}
					<p class="small soft clue">
						<span class="tag" style="color: {c.kind === 'theorie' ? 'var(--p-accent)' : 'var(--p-warn)'}">{c.kind === 'theorie' ? 'Theorie' : 'Offen'}</span>
						<PMd src={c.text} inline />{#if c.when}<span class="muted"> · {c.when}</span>{/if}
					</p>
				{/each}
			</div>
		{/each}
	</div>

	{#if contradictions.length}
		<h2>Widersprüche <span class="count">{contradictions.length}</span></h2>
		{#each contradictions as c, i (i)}
			<div class="avoid small" style="margin-bottom: 2.4mm">
				<b>{c.entry.title}</b> <span class="tiny muted">{c.entry.dateLabel}</span>
				<div class="soft"><PMd src={c.text} inline /></div>
			</div>
		{/each}
	{/if}

	{#if solved.length}
		<h2>Geklärte Fragen <span class="count">{solved.length}</span></h2>
		<div class="cols-2">
			{#each solved as q (q.id)}
				<div class="avoid small" id={printAnchor(`frage:${q.id}`)} style="margin-bottom: 2.4mm">
					<b>{q.topic}</b> <span class="tiny muted">{QUESTION_TO[q.to].label}{q.answered ? ` · ${fmtDate(q.answered)}` : ''}</span>
					{#if q.answer}<div class="soft"><PMd src={q.answer} inline /></div>{/if}
				</div>
			{/each}
		</div>
	{/if}
</PDoc>

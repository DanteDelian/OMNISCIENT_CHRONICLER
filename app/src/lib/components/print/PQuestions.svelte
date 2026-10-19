<script lang="ts">
	import PDoc from './PDoc.svelte';
	import PMd from './PMd.svelte';
	import { campaign } from '$lib/stores/campaign.svelte';
	import { QUESTION_TO } from '$lib/raetsel';
	import { fmtDate, todayIso } from '$lib/format';
	import type { Question } from '$lib/types';

	const TO = Object.keys(QUESTION_TO) as Question['to'][];
	const open = $derived(campaign.data.fragen.filter((q) => q.status === 'offen'));
</script>

<PDoc id="fragen" eyebrow="Am Tisch" title="Fragen an den DM" subtitle="{open.length} offen · Stand {fmtDate(todayIso())} · Antworten notieren und danach auf der Rätselwand eintragen." compact>
	{#each TO as to (to)}
		{@const list = open.filter((q) => q.to === to)}
		{#if list.length}
			<h2>{QUESTION_TO[to].label} <span class="count">{list.length} · {QUESTION_TO[to].hint}</span></h2>
			{#each list as q (q.id)}
				<div class="question avoid">
					<div class="q-head"><span class="cb"></span><b>{q.topic}</b></div>
					<div class="q-text small soft"><PMd src={q.question} inline /></div>
					<div class="q-lines lines"></div>
				</div>
			{/each}
		{/if}
	{/each}
	<h2>Neue Fragen</h2>
	{#each [1, 2, 3] as n (n)}
		<div class="question avoid">
			<div class="q-head"><span class="cb"></span><span class="write" style="flex: 1"></span></div>
			<div class="q-lines lines"></div>
		</div>
	{/each}
</PDoc>

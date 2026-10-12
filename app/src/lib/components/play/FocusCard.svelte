<script lang="ts">
	/** Aktuelle Lage, dringende Quests und eine Schnellnotiz fürs Journal. */
	import { Flag, NotebookPen, Send } from '@lucide/svelte';
	import Markdown from '../Markdown.svelte';
	import { campaign } from '$lib/stores/campaign.svelte';
	import { rolls } from '$lib/stores/rolls.svelte';
	import { addQuickNote } from '$lib/journal';

	const lage = $derived(campaign.data.docs.find((d) => d.slug === 'lage'));
	const firstPara = $derived(lage?.body.split('\n\n').find((p) => p && !p.startsWith('#')) ?? '');
	const urgent = $derived(campaign.data.quests.filter((q) => q.status === 'aktiv' && q.urgent));
	let note = $state('');

	function submit(e: SubmitEvent) {
		e.preventDefault();
		if (!note.trim()) return;
		addQuickNote(note.trim());
		rolls.event('Notiz gespeichert', 'Im Journal unter „Session-Notizen“ von heute', 'good');
		note = '';
	}
</script>

<section class="panel flex flex-col p-5">
	<div class="mb-2 flex items-center justify-between">
		<div class="eyebrow">Aktuelle Lage</div>
		<a class="text-xs text-ink-3 hover:text-ink" href="/archiv/lage">Ganz lesen →</a>
	</div>
	<Markdown src={firstPara} class="prose-sm" />

	<div class="mt-4 mb-2 flex items-center justify-between">
		<div class="flex items-center gap-2 text-sm font-medium"><Flag size={14} class="text-warn" />Dringend</div>
		<a class="text-xs text-ink-3 hover:text-ink" href="/quests">Alle Quests →</a>
	</div>
	<ul class="space-y-1.5">
		{#each urgent as q (q.id)}
			<li class="rounded-xl border border-line bg-white/[0.02] px-3 py-2">
				<a href="/quests#{q.id}" data-ref="quest:{q.id}" class="text-sm font-medium hover:text-astral">{q.title}</a>
				{#if q.next}<p class="mt-0.5 line-clamp-2 text-xs text-ink-3">{q.next}</p>{/if}
			</li>
		{/each}
	</ul>

	<form class="mt-4 border-t border-line pt-4" onsubmit={submit}>
		<label class="mb-1.5 flex items-center gap-2 text-sm font-medium" for="quick-note"><NotebookPen size={14} class="text-astral" />Schnellnotiz</label>
		<div class="flex gap-2">
			<input id="quick-note" class="input" placeholder="Was ist gerade passiert? (landet im Journal)" bind:value={note} />
			<button class="btn btn-primary !px-3" aria-label="Notiz speichern"><Send size={15} /></button>
		</div>
	</form>
</section>

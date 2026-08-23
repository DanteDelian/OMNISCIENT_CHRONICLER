<script lang="ts">
	import { live } from '$lib/stores/live.svelte';
	import { KNOWLEDGE_TIER_LABELS, type Quest, type InventoryItem, type KnowledgeEntry } from '$lib/types';
	import Sparkles from '@lucide/svelte/icons/sparkles';
	import Users from '@lucide/svelte/icons/users';
	import ScrollText from '@lucide/svelte/icons/scroll-text';
	import Package from '@lucide/svelte/icons/package';
	import Lightbulb from '@lucide/svelte/icons/lightbulb';

	let { number, title = '' }: { number: number; title?: string } = $props();

	type NoteRef = { path: string; title: string; excerpt: string };
	let data = $state<{ quests: Quest[]; items: InventoryItem[]; knowledge: KnowledgeEntry[]; notes: NoteRef[] }>({
		quests: [],
		items: [],
		knowledge: [],
		notes: []
	});

	let lastKey = -1;
	$effect(() => {
		const key = number * 1e6 + live.rev; // reagiert auf Session-Wechsel UND Datei-Änderungen
		if (key === lastKey) return;
		lastKey = key;
		fetch(`/api/since/${number}`)
			.then((r) => (r.ok ? r.json() : null))
			.then((d) => d && (data = d))
			.catch(() => {});
	});

	const total = $derived(data.quests.length + data.items.length + data.knowledge.length + data.notes.length);
</script>

{#if total > 0}
	<section class="card card-pad mb-4">
		<div class="mb-3 flex items-center gap-2">
			<Sparkles class="h-4 w-4 text-accent" />
			<h2 class="panel-title !m-0">Seit Session {number}{title ? ' · ' + title : ''}</h2>
			<span class="chip ml-auto text-[11px]">{total} neu</span>
		</div>
		<div class="grid gap-3 sm:grid-cols-2">
			{#if data.notes.length}
				<div>
					<p class="mb-1 flex items-center gap-1.5 text-xs text-muted"><Users class="h-3.5 w-3.5" /> Neue Einträge</p>
					<ul class="flex flex-wrap gap-1.5">
						{#each data.notes as n (n.path)}
							<a href="/glossar/{encodeURIComponent(n.title)}" class="chip hover:chip-active">{n.title}</a>
						{/each}
					</ul>
				</div>
			{/if}
			{#if data.quests.length}
				<div>
					<p class="mb-1 flex items-center gap-1.5 text-xs text-muted"><ScrollText class="h-3.5 w-3.5" /> Neue Quests</p>
					<ul class="grid gap-0.5 text-sm">
						{#each data.quests as q (q.id)}<li class="truncate">{q.title}</li>{/each}
					</ul>
				</div>
			{/if}
			{#if data.items.length}
				<div>
					<p class="mb-1 flex items-center gap-1.5 text-xs text-muted"><Package class="h-3.5 w-3.5" /> Neue Gegenstände</p>
					<ul class="grid gap-0.5 text-sm">
						{#each data.items as it (it.id)}<li class="truncate">{it.quantity}× {it.name}</li>{/each}
					</ul>
				</div>
			{/if}
			{#if data.knowledge.length}
				<div>
					<p class="mb-1 flex items-center gap-1.5 text-xs text-muted"><Lightbulb class="h-3.5 w-3.5" /> Neues Wissen</p>
					<ul class="grid gap-0.5 text-sm">
						{#each data.knowledge as k (k.id)}
							<li class="truncate"><span class="text-muted">{KNOWLEDGE_TIER_LABELS[k.tier]}:</span> {k.statement}</li>
						{/each}
					</ul>
				</div>
			{/if}
		</div>
	</section>
{/if}

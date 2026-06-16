<script lang="ts">
	import { onMount } from 'svelte';
	import { live } from '$lib/stores/live.svelte';
	import type { Quest } from '$lib/types';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';

	let quests = $state<Quest[]>([]);
	async function load() {
		const r = await fetch('/api/quests');
		if (r.ok) quests = await r.json();
	}
	onMount(load);
	$effect(() => {
		if (live.rev) load();
	});

	const active = $derived(quests.filter((q) => q.status === 'active').slice(0, 5));
	const PRIO: Record<string, string> = {
		high: 'var(--color-danger)',
		normal: 'var(--color-primary)',
		low: 'var(--color-muted)'
	};
</script>

<div class="flex flex-col gap-2">
	{#each active as q (q.id)}
		<div class="flex items-center gap-2 rounded-lg bg-surface2 px-3 py-2">
			<span class="h-2 w-2 shrink-0 rounded-full" style="background:{PRIO[q.priority]}"></span>
			<div class="min-w-0 flex-1">
				<span class="block truncate text-sm font-medium">{q.title}</span>
				{#if q.nextStep}<span class="block truncate text-xs text-muted">{q.nextStep}</span>{/if}
			</div>
		</div>
	{:else}
		<p class="py-2 text-center text-sm text-muted">Keine aktiven Quests.</p>
	{/each}
	<a href="/quests" class="mt-1 flex items-center justify-center gap-1 text-xs text-primary hover:underline">
		Quest-Tagebuch <ArrowRight class="h-3.5 w-3.5" />
	</a>
</div>

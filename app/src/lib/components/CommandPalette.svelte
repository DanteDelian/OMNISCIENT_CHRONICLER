<script lang="ts">
	/** ⌘K / Strg+K: Alles durchsuchen und Aktionen auslösen. */
	import { goto } from '$app/navigation';
	import { tick } from 'svelte';
	import { fade, scale } from 'svelte/transition';
	import { Search, CornerDownLeft } from '@lucide/svelte';
	import { campaign } from '$lib/stores/campaign.svelte';
	import { ui } from '$lib/stores/ui.svelte';
	import { rolls } from '$lib/stores/rolls.svelte';
	import { normalizeName, kindRank } from '$lib/refs';

	let query = $state('');
	let active = $state(0);
	let input: HTMLInputElement | undefined = $state();

	interface Item {
		id: string;
		title: string;
		kind: string;
		hint: string;
		run: () => void;
	}

	const actions: Item[] = [
		{ id: 'a:d20', title: 'W20 würfeln', kind: 'Aktion', hint: 'Würfel', run: () => rolls.check('W20', 0) },
		{ id: 'a:dice', title: 'Würfelschale öffnen', kind: 'Aktion', hint: 'Taste D', run: () => (ui.dice = true) },
		{ id: 'a:kurz', title: 'Kurze Rast', kind: 'Aktion', hint: 'Trefferwürfel, Arkane Erholung', run: () => (ui.rest = 'kurz') },
		{ id: 'a:lang', title: 'Lange Rast', kind: 'Aktion', hint: 'Alles zurücksetzen', run: () => (ui.rest = 'lang') },
		{ id: 'a:journal', title: 'Neuer Journal-Eintrag', kind: 'Aktion', hint: 'Was ist passiert?', run: () => goto('/journal?neu=1') }
	];

	const results = $derived.by((): Item[] => {
		const q = normalizeName(query);
		const entries = campaign.data?.index ?? [];
		if (!q) {
			return [
				...actions,
				...entries
					.filter((e) => ['Seite', 'Dokument'].includes(e.kind))
					.map((e) => ({ id: e.key, title: e.title, kind: e.kind, hint: e.meta ?? e.summary, run: () => goto(e.href) }))
			].slice(0, 14);
		}
		const scored: { item: Item; score: number }[] = [];
		for (const a of actions) {
			if (normalizeName(a.title).includes(q)) scored.push({ item: a, score: 5 });
		}
		for (const e of entries) {
			let best = 0;
			for (const n of e.names) {
				if (n === q) best = Math.max(best, 100);
				else if (n.startsWith(q)) best = Math.max(best, 60);
				else if (n.includes(q)) best = Math.max(best, 35);
			}
			if (!best && normalizeName(e.summary).includes(q)) best = 8;
			if (best) scored.push({ item: { id: e.key, title: e.title, kind: e.kind, hint: e.meta ?? e.summary, run: () => goto(e.href) }, score: best - kindRank(e.kind) * 0.5 });
		}
		return scored.sort((a, b) => b.score - a.score).slice(0, 30).map((s) => s.item);
	});

	$effect(() => {
		if (ui.palette) {
			query = '';
			active = 0;
			tick().then(() => input?.focus());
		}
	});

	$effect(() => {
		void results;
		active = 0;
	});

	function run(i: Item) {
		ui.palette = false;
		i.run();
	}

	function onkey(e: KeyboardEvent) {
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			active = Math.min(results.length - 1, active + 1);
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			active = Math.max(0, active - 1);
		} else if (e.key === 'Enter' && results[active]) {
			e.preventDefault();
			run(results[active]);
		} else if (e.key === 'Escape') {
			ui.palette = false;
		}
	}
</script>

{#if ui.palette}
	<div class="fixed inset-0 z-[70] flex items-start justify-center p-4 pt-[12vh]">
		<button class="fixed inset-0 bg-black/60 backdrop-blur-sm" aria-label="Schließen" onclick={() => (ui.palette = false)} transition:fade={{ duration: 100 }}></button>
		<div class="panel panel-glow relative w-full max-w-2xl overflow-hidden" transition:scale={{ start: 0.98, duration: 140 }}>
			<div class="flex items-center gap-3 border-b border-line px-4">
				<Search size={18} class="text-ink-3" />
				<input
					bind:this={input}
					bind:value={query}
					onkeydown={onkey}
					class="h-14 flex-1 bg-transparent text-[1.05rem] outline-none placeholder:text-ink-3"
					placeholder="Zauber, Person, Ort, Quest, Gegenstand, Dokument …"
					aria-label="Suche"
				/>
				<span class="kbd">Esc</span>
			</div>
			<ul class="max-h-[56vh] overflow-y-auto p-2">
				{#each results as r, i (r.id)}
					<li>
						<button
							class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left {i === active ? 'bg-white/[0.07]' : 'hover:bg-white/[0.04]'}"
							onmouseenter={() => (active = i)}
							onclick={() => run(r)}
						>
							<span class="badge w-24 justify-center">{r.kind}</span>
							<span class="min-w-0 flex-1">
								<span class="block truncate text-sm font-medium text-ink">{r.title}</span>
								{#if r.hint}<span class="block truncate text-xs text-ink-3">{r.hint}</span>{/if}
							</span>
							{#if i === active}<CornerDownLeft size={14} class="text-ink-3" />{/if}
						</button>
					</li>
				{:else}
					<li class="px-3 py-8 text-center text-sm text-ink-3">Nichts gefunden.</li>
				{/each}
			</ul>
		</div>
	</div>
{/if}

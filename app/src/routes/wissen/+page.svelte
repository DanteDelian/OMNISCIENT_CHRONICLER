<script lang="ts">
	import { onMount } from 'svelte';
	import { fly, slide } from 'svelte/transition';
	import { live } from '$lib/stores/live.svelte';
	import { toasts } from '$lib/stores/toast.svelte';
	import {
		KNOWLEDGE_TIER_LABELS,
		type KnowledgeEntry,
		type KnowledgeTier,
		type KnowledgeView
	} from '$lib/types';
	import Lightbulb from '@lucide/svelte/icons/lightbulb';
	import Plus from '@lucide/svelte/icons/plus';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import Eye from '@lucide/svelte/icons/eye';
	import EyeOff from '@lucide/svelte/icons/eye-off';
	import Check from '@lucide/svelte/icons/check';

	const TIER_COLOR: Record<KnowledgeTier, string> = {
		fact: 'var(--color-success)',
		rumor: 'var(--color-accent)',
		theory: 'var(--color-primary)'
	};
	// Fakt = gefüllt · Gerücht = Kreis · Theorie = Ring (Form + Farbe, nicht nur Farbe)
	const TIER_SHAPE: Record<KnowledgeTier, string> = { fact: 'square', rumor: 'dot', theory: 'ring' };

	let items = $state<KnowledgeEntry[]>([]);
	let loaded = $state(false);
	let viewFilter = $state<'all' | KnowledgeView>('all');
	let tierFilter = $state<'all' | KnowledgeTier>('all');
	let adding = $state(false);
	let draft = $state({ statement: '', tier: 'rumor' as KnowledgeTier, view: 'character' as KnowledgeView, topic: '' });

	async function load() {
		const r = await fetch('/api/knowledge');
		if (r.ok) items = await r.json();
		loaded = true;
	}
	onMount(load);
	let lastRev = -1;
	$effect(() => {
		if (live.rev !== lastRev) {
			lastRev = live.rev;
			load();
		}
	});

	const filtered = $derived(
		items.filter(
			(k) =>
				(viewFilter === 'all' || k.view === viewFilter) &&
				(tierFilter === 'all' || k.tier === tierFilter)
		)
	);
	const groups = $derived.by(() => {
		const m = new Map<string, KnowledgeEntry[]>();
		for (const k of filtered) {
			const arr = m.get(k.topic) ?? [];
			arr.push(k);
			m.set(k.topic, arr);
		}
		return [...m.entries()]
			.map(([topic, entries]) => ({ topic, entries }))
			.sort((a, b) => b.entries.length - a.entries.length || a.topic.localeCompare(b.topic));
	});
	const counts = $derived({
		fact: items.filter((k) => k.tier === 'fact').length,
		rumor: items.filter((k) => k.tier === 'rumor').length,
		theory: items.filter((k) => k.tier === 'theory').length
	});

	async function add() {
		if (!draft.statement.trim()) return;
		await fetch('/api/knowledge', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(draft)
		});
		draft = { statement: '', tier: draft.tier, view: draft.view, topic: draft.topic };
		adding = false;
		await load();
		toasts.push('Erkenntnis notiert', undefined, 'good');
	}

	async function patch(id: string, data: Partial<KnowledgeEntry>) {
		await fetch(`/api/knowledge/${id}`, {
			method: 'PATCH',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(data)
		});
		await load();
	}

	async function remove(id: string) {
		await fetch(`/api/knowledge/${id}`, { method: 'DELETE' });
		await load();
		toasts.push('Eintrag entfernt', undefined, 'default');
	}

	function cycleTier(k: KnowledgeEntry) {
		const order: KnowledgeTier[] = ['rumor', 'theory', 'fact'];
		const next = order[(order.indexOf(k.tier) + 1) % order.length];
		patch(k.id, { tier: next });
	}
</script>

<svelte:head><title>Wissen · Omniscient Chronicler</title></svelte:head>

<div class="mx-auto max-w-3xl">
	<!-- Kopf -->
	<div class="mb-4 flex flex-wrap items-end justify-between gap-3">
		<div class="flex items-center gap-3">
			<div class="grid h-11 w-11 place-items-center rounded-xl border border-border bg-surface2 text-primary">
				<Lightbulb size={22} />
			</div>
			<div>
				<h1 class="text-xl font-semibold leading-tight">Wissen</h1>
				<p class="text-sm text-muted">Was wir wissen, hören und vermuten — mit Quelle.</p>
			</div>
		</div>
		<button class="btn btn-primary" onclick={() => (adding = !adding)}><Plus size={16} /> Notieren</button>
	</div>

	<!-- Legende / Tier-Filter -->
	<div class="mb-3 flex flex-wrap items-center gap-2">
		<button class="chip" class:chip-active={tierFilter === 'all'} onclick={() => (tierFilter = 'all')}>Alle {items.length}</button>
		{#each ['fact', 'rumor', 'theory'] as const as t}
			<button
				class="chip"
				class:chip-active={tierFilter === t}
				onclick={() => (tierFilter = tierFilter === t ? 'all' : t)}
			>
				<span class="glyph glyph-{TIER_SHAPE[t]}" style="--gc:{TIER_COLOR[t]}"></span>
				{KNOWLEDGE_TIER_LABELS[t]} {counts[t]}
			</button>
		{/each}
		<span class="mx-1 h-4 w-px bg-border"></span>
		<button class="chip" class:chip-active={viewFilter === 'all'} onclick={() => (viewFilter = 'all')}>Alle Sichten</button>
		<button class="chip" class:chip-active={viewFilter === 'character'} onclick={() => (viewFilter = viewFilter === 'character' ? 'all' : 'character')}><Eye size={13} /> Charakter</button>
		<button class="chip" class:chip-active={viewFilter === 'player'} onclick={() => (viewFilter = viewFilter === 'player' ? 'all' : 'player')}><EyeOff size={13} /> Nur Spieler</button>
	</div>

	<!-- Formular -->
	{#if adding}
		<div class="card card-pad mb-4" transition:slide>
			<textarea class="input mb-2" rows="2" placeholder="Was ist bekannt / behauptet / vermutet?" bind:value={draft.statement}></textarea>
			<div class="flex flex-wrap gap-2">
				<select class="input max-w-[10rem]" bind:value={draft.tier}>
					<option value="fact">Fakt</option>
					<option value="rumor">Gerücht</option>
					<option value="theory">Theorie</option>
				</select>
				<select class="input max-w-[12rem]" bind:value={draft.view}>
					<option value="character">Charakter weiß es</option>
					<option value="player">Nur Spielerwissen</option>
				</select>
				<input class="input flex-1" placeholder="Thema (z.B. Der Kult)" bind:value={draft.topic} />
				<button class="btn btn-primary" onclick={add}><Check size={16} /> Speichern</button>
			</div>
		</div>
	{/if}

	<!-- Inhalt -->
	{#if loaded && !items.length}
		<div class="card card-pad text-center text-muted">
			<Lightbulb size={30} class="mx-auto mb-2 opacity-50" />
			<p>Dein Wissen wächst mit jeder Session.</p>
			<p class="text-sm">Verarbeite eine Session in der <a href="/werkstatt" class="text-primary underline">Werkstatt</a> — oder notiere selbst den ersten Hinweis.</p>
		</div>
	{:else}
		<div class="grid gap-4">
			{#each groups as g (g.topic)}
				<section in:fly={{ y: 8, duration: 200 }}>
					<h2 class="panel-title mb-2">{g.topic}</h2>
					<div class="grid gap-2">
						{#each g.entries as k (k.id)}
							<div class="card card-pad group flex items-start gap-3">
								<button
									class="mt-0.5 shrink-0"
									title="Ebene wechseln (Gerücht → Theorie → Fakt)"
									onclick={() => cycleTier(k)}
								>
									<span class="glyph glyph-{TIER_SHAPE[k.tier]}" style="--gc:{TIER_COLOR[k.tier]}"></span>
								</button>
								<div class="min-w-0 flex-1">
									<p class="leading-snug">{k.statement}</p>
									<div class="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
										<span style="color:{TIER_COLOR[k.tier]}">{KNOWLEDGE_TIER_LABELS[k.tier]}</span>
										<span>·</span>
										<span class="inline-flex items-center gap-1">
											{#if k.view === 'player'}<EyeOff size={12} /> Nur Spieler{:else}<Eye size={12} /> Charakter{/if}
										</span>
										{#if k.sourceSession}<span>·</span><span>Session {k.sourceSession}</span>{/if}
									</div>
								</div>
								<button
									class="btn btn-icon btn-ghost h-8 w-8 opacity-0 transition group-hover:opacity-100"
									title="Umschalten: Charakter-/Spielerwissen"
									onclick={() => patch(k.id, { view: k.view === 'player' ? 'character' : 'player' })}
								>{#if k.view === 'player'}<Eye size={14} />{:else}<EyeOff size={14} />{/if}</button>
								<button class="btn btn-icon btn-ghost h-8 w-8 opacity-0 transition group-hover:opacity-100" title="Löschen" onclick={() => remove(k.id)}><Trash2 size={14} /></button>
							</div>
						{/each}
					</div>
				</section>
			{/each}
		</div>
	{/if}
</div>

<style>
	.glyph {
		display: inline-block;
		width: 11px;
		height: 11px;
		vertical-align: -1px;
	}
	.glyph-square {
		background: var(--gc);
		border-radius: 2px;
	}
	.glyph-dot {
		background: var(--gc);
		border-radius: 50%;
	}
	.glyph-ring {
		border: 2px solid var(--gc);
		border-radius: 50%;
	}
</style>

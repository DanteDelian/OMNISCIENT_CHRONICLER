<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import {
		PLAN_STATUS_LABELS,
		type SessionPlan,
		type PlanStatus,
		type ChecklistItem,
		type SecretItem
	} from '$lib/types';
	import Card from '$lib/components/ui/Card.svelte';
	import Plus from '@lucide/svelte/icons/plus';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import Sparkles from '@lucide/svelte/icons/sparkles';
	import Eye from '@lucide/svelte/icons/eye';
	import EyeOff from '@lucide/svelte/icons/eye-off';
	import Rocket from '@lucide/svelte/icons/rocket';
	import Film from '@lucide/svelte/icons/film';
	import KeyRound from '@lucide/svelte/icons/key-round';
	import Users from '@lucide/svelte/icons/users';
	import MapPin from '@lucide/svelte/icons/map-pin';
	import Gem from '@lucide/svelte/icons/gem';
	import ListChecks from '@lucide/svelte/icons/list-checks';

	let { data } = $props();

	let plan = $state<SessionPlan | null>(null);
	let lastId = $state<string | null>(null);
	let confirmDel = $state(false);
	$effect(() => {
		if (data.selected && data.selected.id !== lastId) {
			plan = structuredClone($state.snapshot(data.selected)) as SessionPlan;
			lastId = data.selected.id;
			confirmDel = false;
		} else if (!data.selected) {
			plan = null;
			lastId = null;
		}
	});

	const STATUS: PlanStatus[] = ['planning', 'ready', 'played'];
	const STATUS_COLOR: Record<PlanStatus, string> = {
		planning: 'var(--color-muted)',
		ready: 'var(--color-success)',
		played: 'var(--color-primary)'
	};

	async function save(patch: Partial<SessionPlan>) {
		if (!plan) return;
		Object.assign(plan, patch);
		await fetch(`/api/prep/${plan.id}`, {
			method: 'PATCH',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(patch)
		});
		invalidateAll();
	}

	async function newPlan() {
		const r = await fetch('/api/prep', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ title: 'Neue Session' })
		});
		const p = await r.json();
		await invalidateAll();
		await goto('/prep?id=' + p.id);
	}

	async function delPlan() {
		if (!plan) return;
		await fetch(`/api/prep/${plan.id}`, { method: 'DELETE' });
		confirmDel = false;
		await goto('/prep');
		await invalidateAll();
	}

	// Checklist-/Szenen-Helfer
	function addItem(field: 'scenes' | 'checklist', text: string) {
		if (!plan || !text.trim()) return;
		const item: ChecklistItem = { id: crypto.randomUUID(), text: text.trim(), done: false };
		save({ [field]: [...plan[field], item] });
	}
	function toggleItem(field: 'scenes' | 'checklist', id: string) {
		if (!plan) return;
		save({ [field]: plan[field].map((i) => (i.id === id ? { ...i, done: !i.done } : i)) });
	}
	function removeItem(field: 'scenes' | 'checklist', id: string) {
		if (!plan) return;
		save({ [field]: plan[field].filter((i) => i.id !== id) });
	}

	// Geheimnisse
	function addSecret(text: string) {
		if (!plan || !text.trim()) return;
		const s: SecretItem = { id: crypto.randomUUID(), text: text.trim(), revealed: false };
		save({ secrets: [...plan.secrets, s] });
	}
	function toggleSecret(id: string) {
		if (!plan) return;
		save({ secrets: plan.secrets.map((s) => (s.id === id ? { ...s, revealed: !s.revealed } : s)) });
	}
	function removeSecret(id: string) {
		if (!plan) return;
		save({ secrets: plan.secrets.filter((s) => s.id !== id) });
	}

	let sceneInput = $state('');
	let secretInput = $state('');
	let checkInput = $state('');
</script>

<svelte:head><title>Vorbereitung · Omniscient Chronicler</title></svelte:head>

<div class="mb-4 flex items-center justify-between">
	<div>
		<h1 class="font-display text-2xl font-bold">Session-Vorbereitung</h1>
		<p class="text-sm text-muted">Nach der „Lazy DM"-Methode</p>
	</div>
	<button class="btn btn-primary" onclick={newPlan}><Plus class="h-4 w-4" /> Neue Session</button>
</div>

<div class="grid gap-4 lg:grid-cols-[240px_1fr]">
	<!-- Liste -->
	<aside class="card card-pad lg:max-h-[calc(100dvh-9rem)] lg:overflow-auto" class:hidden={!!plan && data.plans.length > 0 ? false : false}>
		<div class="flex flex-col gap-1">
			{#each data.plans as p (p.id)}
				<a
					href="/prep?id={p.id}"
					class="rounded-lg px-3 py-2 transition hover:bg-surface2 {plan?.id === p.id ? 'bg-surface2' : ''}"
				>
					<span class="flex items-center gap-2">
						<span class="h-2 w-2 shrink-0 rounded-full" style="background:{STATUS_COLOR[p.status]}"></span>
						<span class="truncate text-sm font-medium">{p.title}</span>
					</span>
					<span class="ml-4 text-xs text-muted">{PLAN_STATUS_LABELS[p.status]}{p.sessionDate ? ' · ' + p.sessionDate : ''}</span>
				</a>
			{:else}
				<p class="px-1 py-6 text-center text-sm text-muted">Noch keine Sessions geplant.</p>
			{/each}
		</div>
	</aside>

	<!-- Editor -->
	{#if plan}
		<div class="flex flex-col gap-4">
			<!-- Kopf -->
			<div class="card card-pad">
				<input
					class="w-full bg-transparent font-display text-xl font-bold outline-none focus:text-primary"
					value={plan.title}
					onchange={(e) => save({ title: e.currentTarget.value })}
				/>
				<div class="mt-2 flex flex-wrap items-center gap-2">
					<input class="input !w-40 !py-1 text-sm" type="date" value={plan.sessionDate} onchange={(e) => save({ sessionDate: e.currentTarget.value })} />
					<div class="flex gap-1">
						{#each STATUS as s (s)}
							<button class="chip {plan.status === s ? 'chip-active' : ''}" onclick={() => save({ status: s })}>
								{PLAN_STATUS_LABELS[s]}
							</button>
						{/each}
					</div>
					{#if confirmDel}
						<button class="btn btn-danger ml-auto" onclick={delPlan}>Wirklich löschen?</button>
					{:else}
						<button class="btn btn-ghost ml-auto text-danger" onclick={() => (confirmDel = true)} aria-label="Löschen"><Trash2 class="h-4 w-4" /></button>
					{/if}
				</div>
			</div>

			<div class="gap-4 md:columns-2 [&>*]:mb-4 [&>*]:break-inside-avoid">
				<!-- Starker Auftakt -->
				<Card class="card-hover">
					{#snippet actions()}<Rocket class="h-4 w-4 text-accent" />{/snippet}
					<h3 class="panel-title mb-2">Starker Auftakt</h3>
					<textarea class="input min-h-20 resize-y text-sm" placeholder="Womit beginnt die Session mit einem Knall?" value={plan.strongStart} onchange={(e) => save({ strongStart: e.currentTarget.value })}></textarea>
				</Card>

				<!-- Szenen -->
				<Card class="card-hover">
					{#snippet actions()}<Film class="h-4 w-4 text-primary" />{/snippet}
					<h3 class="panel-title mb-2">Mögliche Szenen</h3>
					<div class="flex flex-col gap-1.5">
						{#each plan.scenes as s (s.id)}
							<div class="flex items-center gap-2">
								<button class="shrink-0" onclick={() => toggleItem('scenes', s.id)}>
									<span class="grid h-4 w-4 place-items-center rounded border-2 {s.done ? 'border-success bg-success text-[10px] text-white' : 'border-muted'}">{s.done ? '✓' : ''}</span>
								</button>
								<span class="flex-1 text-sm {s.done ? 'text-muted line-through' : ''}">{s.text}</span>
								<button class="text-muted hover:text-danger" onclick={() => removeItem('scenes', s.id)}><Trash2 class="h-3.5 w-3.5" /></button>
							</div>
						{/each}
					</div>
					<form class="mt-2 flex gap-2" onsubmit={(e) => { e.preventDefault(); addItem('scenes', sceneInput); sceneInput = ''; }}>
						<input class="input !py-1.5 text-sm" placeholder="Szene hinzufügen…" bind:value={sceneInput} />
						<button class="btn !px-2.5" type="submit"><Plus class="h-4 w-4" /></button>
					</form>
				</Card>

				<!-- Geheimnisse & Hinweise -->
				<Card class="card-hover">
					{#snippet actions()}<KeyRound class="h-4 w-4 text-accent" />{/snippet}
					<h3 class="panel-title mb-2">Geheimnisse & Hinweise</h3>
					<div class="flex flex-col gap-1.5">
						{#each plan.secrets as s (s.id)}
							<div class="flex items-center gap-2 rounded-lg px-2 py-1 {s.revealed ? 'bg-success/10' : 'bg-surface2'}">
								<button class="shrink-0 {s.revealed ? 'text-success' : 'text-muted'}" onclick={() => toggleSecret(s.id)} title={s.revealed ? 'Aufgedeckt' : 'Verborgen'}>
									{#if s.revealed}<Eye class="h-4 w-4" />{:else}<EyeOff class="h-4 w-4" />{/if}
								</button>
								<span class="flex-1 text-sm {s.revealed ? '' : 'text-muted'}">{s.text}</span>
								<button class="text-muted hover:text-danger" onclick={() => removeSecret(s.id)}><Trash2 class="h-3.5 w-3.5" /></button>
							</div>
						{/each}
					</div>
					<form class="mt-2 flex gap-2" onsubmit={(e) => { e.preventDefault(); addSecret(secretInput); secretInput = ''; }}>
						<input class="input !py-1.5 text-sm" placeholder="Geheimnis/Hinweis…" bind:value={secretInput} />
						<button class="btn !px-2.5" type="submit"><Plus class="h-4 w-4" /></button>
					</form>
				</Card>

				<!-- NSCs -->
				<Card class="card-hover">
					{#snippet actions()}<Users class="h-4 w-4 text-primary" />{/snippet}
					<h3 class="panel-title mb-2">Wichtige NSCs</h3>
					<textarea class="input min-h-20 resize-y text-sm" placeholder="Name – Auftreten – Geheimnis…" value={plan.npcs} onchange={(e) => save({ npcs: e.currentTarget.value })}></textarea>
				</Card>

				<!-- Orte -->
				<Card class="card-hover">
					{#snippet actions()}<MapPin class="h-4 w-4 text-accent" />{/snippet}
					<h3 class="panel-title mb-2">Fantastische Orte</h3>
					<textarea class="input min-h-20 resize-y text-sm" placeholder="3 stimmungsvolle Aspekte pro Ort…" value={plan.locations} onchange={(e) => save({ locations: e.currentTarget.value })}></textarea>
				</Card>

				<!-- Schätze -->
				<Card class="card-hover">
					{#snippet actions()}<Gem class="h-4 w-4 text-accent" />{/snippet}
					<h3 class="panel-title mb-2">Schätze & Belohnungen</h3>
					<textarea class="input min-h-20 resize-y text-sm" placeholder="Magische Gegenstände, Gold, Vergünstigungen…" value={plan.treasure} onchange={(e) => save({ treasure: e.currentTarget.value })}></textarea>
				</Card>

				<!-- Checkliste -->
				<Card class="card-hover">
					{#snippet actions()}<ListChecks class="h-4 w-4 text-success" />{/snippet}
					<h3 class="panel-title mb-2">Vorbereitungs-Checkliste</h3>
					<div class="flex flex-col gap-1.5">
						{#each plan.checklist as s (s.id)}
							<div class="flex items-center gap-2">
								<button class="shrink-0" onclick={() => toggleItem('checklist', s.id)}>
									<span class="grid h-4 w-4 place-items-center rounded border-2 {s.done ? 'border-success bg-success text-[10px] text-white' : 'border-muted'}">{s.done ? '✓' : ''}</span>
								</button>
								<span class="flex-1 text-sm {s.done ? 'text-muted line-through' : ''}">{s.text}</span>
								<button class="text-muted hover:text-danger" onclick={() => removeItem('checklist', s.id)}><Trash2 class="h-3.5 w-3.5" /></button>
							</div>
						{/each}
					</div>
					<form class="mt-2 flex gap-2" onsubmit={(e) => { e.preventDefault(); addItem('checklist', checkInput); checkInput = ''; }}>
						<input class="input !py-1.5 text-sm" placeholder="To-do hinzufügen…" bind:value={checkInput} />
						<button class="btn !px-2.5" type="submit"><Plus class="h-4 w-4" /></button>
					</form>
				</Card>
			</div>
		</div>
	{:else}
		<div class="card card-pad grid min-h-[50vh] place-items-center text-center text-muted">
			<div>
				<Sparkles class="mx-auto mb-3 h-10 w-10 opacity-40" />
				<p>Plane deine nächste Session — Auftakt, Szenen, Geheimnisse & mehr.</p>
				<button class="btn btn-primary mt-4" onclick={newPlan}><Plus class="h-4 w-4" /> Neue Session</button>
			</div>
		</div>
	{/if}
</div>

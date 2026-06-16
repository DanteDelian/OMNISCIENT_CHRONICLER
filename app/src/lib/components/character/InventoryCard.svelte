<script lang="ts">
	import { onMount } from 'svelte';
	import { scale, fade } from 'svelte/transition';
	import { live } from '$lib/stores/live.svelte';
	import { renderMarkdown } from '$lib/markdown';
	import {
		ITEM_CATEGORY_LABELS,
		RARITY,
		type InventoryItem,
		type ItemCategory,
		type Rarity
	} from '$lib/types';
	import Plus from '@lucide/svelte/icons/plus';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import Shield from '@lucide/svelte/icons/shield';
	import Sparkles from '@lucide/svelte/icons/sparkles';
	import Weight from '@lucide/svelte/icons/weight';
	import X from '@lucide/svelte/icons/x';

	const CATS: ItemCategory[] = ['weapon', 'armor', 'gear', 'consumable', 'magic', 'treasure'];
	const RARITIES = Object.keys(RARITY) as Rarity[];

	let items = $state<InventoryItem[]>([]);
	let selected = $state<InventoryItem | null>(null);

	async function load() {
		const r = await fetch('/api/inventory');
		if (r.ok) items = await r.json();
	}
	onMount(load);
	$effect(() => {
		if (live.rev) load();
	});

	const totalWeight = $derived(
		Math.round(items.reduce((s, i) => s + i.weight * i.quantity, 0) * 10) / 10
	);
	const attunedCount = $derived(items.filter((i) => i.attuned).length);

	async function patch(id: string, data: Partial<InventoryItem>) {
		items = items.map((i) => (i.id === id ? { ...i, ...data } : i));
		if (selected?.id === id) selected = { ...selected, ...data };
		await fetch(`/api/inventory/${id}`, {
			method: 'PATCH',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(data)
		});
	}

	async function changeQty(it: InventoryItem, d: number) {
		const q = Math.max(0, it.quantity + d);
		if (q === 0) return remove(it.id);
		await patch(it.id, { quantity: q });
	}

	async function remove(id: string) {
		items = items.filter((i) => i.id !== id);
		if (selected?.id === id) selected = null;
		await fetch(`/api/inventory/${id}`, { method: 'DELETE' });
	}

	async function addItem() {
		const r = await fetch('/api/inventory', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ name: 'Neuer Gegenstand' })
		});
		const it = await r.json();
		await load();
		selected = it;
	}
</script>

<div class="mb-2 flex items-center justify-between text-xs text-muted">
	<span>{items.length} Gegenstände</span>
	<span class="flex items-center gap-3">
		{#if attunedCount > 0}<span class="flex items-center gap-1 text-primary"
				><Sparkles class="h-3.5 w-3.5" /> {attunedCount}/3</span
			>{/if}
		<span class="flex items-center gap-1"><Weight class="h-3.5 w-3.5" /> {totalWeight} kg</span>
	</span>
</div>

<div class="flex flex-col gap-1.5">
	{#each items as it (it.id)}
		{@const rar = RARITY[it.rarity]}
		<button
			class="group flex items-center gap-2.5 rounded-xl border border-border bg-surface2 px-2.5 py-2 text-left transition hover:border-[var(--rar)]"
			style="--rar:{rar.color}"
			onclick={() => (selected = it)}
		>
			<span class="h-7 w-1 shrink-0 rounded-full" style="background:{rar.color}"></span>
			<div class="min-w-0 flex-1">
				<span class="flex items-center gap-1.5">
					<span class="truncate text-sm font-semibold" style="color:{rar.color}">{it.name}</span>
					{#if it.equipped}<Shield class="h-3 w-3 shrink-0 fill-current text-primary" />{/if}
					{#if it.attuned}<Sparkles class="h-3 w-3 shrink-0 text-accent" />{/if}
				</span>
				<span class="text-[11px] text-muted">{ITEM_CATEGORY_LABELS[it.category]} · {rar.label}</span>
			</div>
			<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
			<div class="flex shrink-0 items-center gap-0.5" onclick={(e) => e.stopPropagation()}>
				<span
					class="btn btn-icon !h-7 !w-7 text-xs"
					role="button"
					tabindex="0"
					onclick={() => changeQty(it, -1)}>−</span
				>
				<span class="w-6 text-center text-sm tabular-nums">{it.quantity}</span>
				<span
					class="btn btn-icon !h-7 !w-7 text-xs"
					role="button"
					tabindex="0"
					onclick={() => changeQty(it, 1)}>+</span
				>
			</div>
		</button>
	{:else}
		<p class="py-2 text-center text-sm text-muted">Inventar ist leer.</p>
	{/each}
</div>

<button class="btn mt-3 w-full text-sm" onclick={addItem}>
	<Plus class="h-4 w-4" /> Gegenstand hinzufügen
</button>

<!-- Detail-Modal -->
{#if selected}
	{@const rar = RARITY[selected.rarity]}
	<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-[65] flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center"
		transition:fade={{ duration: 150 }}
		onclick={(e) => e.target === e.currentTarget && (selected = null)}
	>
		<div
			class="card rarity-glow w-full max-w-lg overflow-hidden p-0"
			style="--rarity:{rar.color}"
			transition:scale={{ duration: 200, start: 0.95 }}
		>
			<!-- Kopf mit Seltenheits-Farbverlauf -->
			<div
				class="relative p-5"
				style="background:linear-gradient(180deg, color-mix(in oklab, {rar.color} 22%, transparent), transparent)"
			>
				<button
					class="btn btn-icon btn-ghost absolute right-3 top-3"
					onclick={() => (selected = null)}
					aria-label="Schließen"><X class="h-5 w-5" /></button
				>
				<input
					class="w-full bg-transparent font-display text-2xl font-bold outline-none"
					style="color:{rar.color}"
					value={selected.name}
					onchange={(e) => patch(selected!.id, { name: e.currentTarget.value })}
				/>
				<div class="mt-1 flex flex-wrap items-center gap-2 text-xs">
					<span class="chip" style="border-color:{rar.color}55;color:{rar.color}">{rar.label}</span>
					<span class="chip">{ITEM_CATEGORY_LABELS[selected.category]}</span>
				</div>
			</div>

			<div class="flex flex-col gap-3 p-5 pt-0">
				<!-- Eigenschaften -->
				<div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
					<label class="stat-tile gap-0.5">
						<span class="text-[10px] text-muted">Anzahl</span>
						<input
							class="w-full bg-transparent text-center font-bold outline-none"
							type="number"
							min="1"
							value={selected.quantity}
							onchange={(e) => patch(selected!.id, { quantity: +e.currentTarget.value })}
						/>
					</label>
					<label class="stat-tile gap-0.5">
						<span class="text-[10px] text-muted">Gewicht</span>
						<input
							class="w-full bg-transparent text-center font-bold outline-none"
							type="number"
							step="0.1"
							value={selected.weight}
							onchange={(e) => patch(selected!.id, { weight: +e.currentTarget.value })}
						/>
					</label>
					<button
						class="stat-tile gap-0.5 {selected.equipped ? '!border-primary/50 text-primary' : ''}"
						onclick={() => patch(selected!.id, { equipped: !selected!.equipped })}
					>
						<Shield class="h-4 w-4 {selected.equipped ? 'fill-current' : ''}" />
						<span class="text-[10px]">{selected.equipped ? 'Ausgerüstet' : 'Anlegen'}</span>
					</button>
					<button
						class="stat-tile gap-0.5 {selected.attuned ? '!border-accent/50 text-accent' : ''}"
						onclick={() => patch(selected!.id, { attuned: !selected!.attuned })}
					>
						<Sparkles class="h-4 w-4" />
						<span class="text-[10px]">{selected.attuned ? 'Eingestimmt' : 'Einstimmen'}</span>
					</button>
				</div>

				<!-- Kategorie & Seltenheit -->
				<div class="flex gap-2">
					<select
						class="input"
						value={selected.category}
						onchange={(e) => patch(selected!.id, { category: e.currentTarget.value as ItemCategory })}
					>
						{#each CATS as cat (cat)}<option value={cat}>{ITEM_CATEGORY_LABELS[cat]}</option>{/each}
					</select>
					<select
						class="input"
						value={selected.rarity}
						onchange={(e) => patch(selected!.id, { rarity: e.currentTarget.value as Rarity })}
					>
						{#each RARITIES as r (r)}<option value={r}>{RARITY[r].label}</option>{/each}
					</select>
				</div>

				<!-- Beschreibung -->
				<div>
					<span class="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted"
						>Beschreibung</span
					>
					<textarea
						class="input min-h-24 resize-y text-sm"
						placeholder="Was macht diesen Gegenstand besonders? (Markdown erlaubt)"
						value={selected.description}
						onchange={(e) => patch(selected!.id, { description: e.currentTarget.value })}
					></textarea>
					{#if selected.description.trim()}
						<div class="prose prose-sm mt-2 max-w-none rounded-lg bg-surface2 p-3 dark:prose-invert">
							<!-- eslint-disable-next-line svelte/no-at-html-tags -->
							{@html renderMarkdown(selected.description)}
						</div>
					{/if}
				</div>

				<div class="flex justify-between pt-1">
					<button class="btn btn-ghost text-danger" onclick={() => remove(selected!.id)}>
						<Trash2 class="h-4 w-4" /> Löschen
					</button>
					<button class="btn btn-primary" onclick={() => (selected = null)}>Fertig</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<script lang="ts">
	import { character } from '$lib/stores/character.svelte';
	import type { CustomTracker, TrackerType } from '$lib/types';
	import Plus from '@lucide/svelte/icons/plus';
	import Trash2 from '@lucide/svelte/icons/trash-2';

	const c = $derived(character.current);
	let adding = $state(false);
	let label = $state('');
	let type = $state<TrackerType>('resource');
	let max = $state(3);

	function save(trackers: CustomTracker[]) {
		character.patch({ customTrackers: trackers });
	}

	function change(id: string, delta: number) {
		if (!c) return;
		save(
			c.customTrackers.map((t) => {
				if (t.id !== id) return t;
				if (t.type === 'toggle') return { ...t, value: t.value ? 0 : 1 };
				let v = t.value + delta;
				if (t.max != null) v = Math.min(t.max, v);
				return { ...t, value: Math.max(0, v) };
			})
		);
	}

	function remove(id: string) {
		if (!c) return;
		save(c.customTrackers.filter((t) => t.id !== id));
	}

	function add() {
		if (!c || !label.trim()) return;
		const t: CustomTracker = {
			id: crypto.randomUUID(),
			label: label.trim(),
			type,
			value: type === 'toggle' ? 0 : type === 'resource' || type === 'bar' ? max : 0,
			max: type === 'resource' || type === 'bar' ? max : undefined,
			resetOn: 'long',
			color: '#a78bfa'
		};
		save([...c.customTrackers, t]);
		label = '';
		max = 3;
		adding = false;
	}
</script>

{#if c}
	<div class="flex flex-col gap-2.5">
		{#each c.customTrackers as t (t.id)}
			<div class="flex items-center gap-2 rounded-xl border border-border bg-surface2 p-2.5">
				<div class="min-w-0 flex-1">
					<div class="flex items-center justify-between gap-2">
						<span class="truncate text-sm font-medium">{t.label}</span>
						<span class="shrink-0 text-sm tabular-nums text-muted">
							{#if t.type === 'toggle'}{t.value ? 'an' : 'aus'}{:else}{t.value}{t.max != null
									? `/${t.max}`
									: ''}{/if}
						</span>
					</div>
					{#if (t.type === 'bar' || t.type === 'resource') && t.max}
						<div class="mt-1.5 h-2 overflow-hidden rounded-full bg-surface">
							<div
								class="h-full rounded-full transition-all"
								style="width: {Math.min(100, (t.value / t.max) * 100)}%; background-color: {t.color ||
									'var(--color-primary)'}"
							></div>
						</div>
					{/if}
				</div>
				<div class="flex shrink-0 items-center gap-1">
					{#if t.type !== 'toggle'}
						<button class="btn btn-icon !h-8 !w-8" onclick={() => change(t.id, -1)}>−</button>
					{/if}
					<button class="btn btn-icon !h-8 !w-8" onclick={() => change(t.id, 1)}>
						{t.type === 'toggle' ? '⇄' : '+'}
					</button>
					<button class="btn btn-icon btn-ghost !h-8 !w-8 text-danger" onclick={() => remove(t.id)}>
						<Trash2 class="h-4 w-4" />
					</button>
				</div>
			</div>
		{/each}
	</div>

	{#if adding}
		<div class="mt-3 flex flex-col gap-2 rounded-xl border border-border bg-surface2 p-3">
			<input class="input" placeholder="Bezeichnung (z.B. Ki, Wut, Munition)" bind:value={label} />
			<div class="flex gap-2">
				<select class="input" bind:value={type}>
					<option value="resource">Ressource (mit Max)</option>
					<option value="counter">Zähler</option>
					<option value="bar">Leiste</option>
					<option value="toggle">An/Aus</option>
				</select>
				{#if type === 'resource' || type === 'bar'}
					<input class="input w-24" type="number" min="1" bind:value={max} aria-label="Maximum" />
				{/if}
			</div>
			<div class="flex justify-end gap-2">
				<button class="btn" onclick={() => (adding = false)}>Abbrechen</button>
				<button class="btn btn-primary" onclick={add}>Hinzufügen</button>
			</div>
		</div>
	{:else}
		<button class="btn mt-3 w-full text-sm" onclick={() => (adding = true)}>
			<Plus class="h-4 w-4" /> Eigener Tracker
		</button>
	{/if}
{/if}

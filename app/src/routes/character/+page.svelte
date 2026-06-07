<script lang="ts">
	import { onMount } from 'svelte';
	import { character } from '$lib/stores/character.svelte';
	import { toasts } from '$lib/stores/toast.svelte';
	import type { CharacterEvent } from '$lib/types';
	import Card from '$lib/components/ui/Card.svelte';
	import HpTracker from '$lib/components/character/HpTracker.svelte';
	import RestControls from '$lib/components/character/RestControls.svelte';
	import AbilityScores from '$lib/components/character/AbilityScores.svelte';
	import ConditionChips from '$lib/components/character/ConditionChips.svelte';
	import DeathSaves from '$lib/components/character/DeathSaves.svelte';
	import SpellSlots from '$lib/components/character/SpellSlots.svelte';
	import CustomTrackers from '$lib/components/character/CustomTrackers.svelte';
	import CurrencyTracker from '$lib/components/character/CurrencyTracker.svelte';
	import Camera from '@lucide/svelte/icons/camera';

	const c = $derived(character.current);
	let events = $state<CharacterEvent[]>([]);

	async function loadHistory() {
		const res = await fetch('/api/character/history?limit=15');
		if (res.ok) events = (await res.json()).events;
	}
	onMount(loadHistory);

	function setNum(field: string, v: number) {
		character.patch({ [field]: Math.round(v || 0) });
	}
	function setStr(field: string, v: string) {
		character.patch({ [field]: v });
	}

	async function snapshot() {
		const label = prompt('Bezeichnung des Snapshots (z.B. "Session 12 – Ende")');
		if (label === null) return;
		await character.snapshot(label || 'Snapshot');
		toasts.push('Snapshot gespeichert', label || '', 'good');
		loadHistory();
	}

	const META = [
		{ f: 'ac', label: 'RK' },
		{ f: 'initiativeBonus', label: 'Initiative' },
		{ f: 'speed', label: 'Tempo' },
		{ f: 'proficiencyBonus', label: 'Übungsbonus' },
		{ f: 'level', label: 'Stufe' }
	] as const;

	function relTime(ts: number): string {
		const s = Math.round((Date.now() - ts) / 1000);
		if (s < 60) return 'gerade eben';
		if (s < 3600) return `vor ${Math.floor(s / 60)} min`;
		if (s < 86400) return `vor ${Math.floor(s / 3600)} h`;
		return new Date(ts).toLocaleDateString('de-DE');
	}
</script>

<svelte:head><title>Charakter · {c?.name ?? ''}</title></svelte:head>

{#if c}
	<!-- Kopf -->
	<div class="card card-pad mb-4">
		<div class="flex flex-wrap items-start justify-between gap-4">
			<div class="min-w-0 flex-1">
				<input
					class="w-full bg-transparent font-display text-2xl font-bold outline-none focus:text-primary sm:text-3xl"
					value={c.name}
					onchange={(e) => setStr('name', e.currentTarget.value)}
				/>
				<div class="mt-1 flex flex-wrap gap-2 text-sm text-muted">
					<input class="input !w-28 !py-1" value={c.race} placeholder="Volk" onchange={(e) => setStr('race', e.currentTarget.value)} />
					<input class="input !w-32 !py-1" value={c.className} placeholder="Klasse" onchange={(e) => setStr('className', e.currentTarget.value)} />
					<input class="input !w-40 !py-1" value={c.background} placeholder="Hintergrund" onchange={(e) => setStr('background', e.currentTarget.value)} />
				</div>
			</div>
			<button class="btn" onclick={snapshot}><Camera class="h-4 w-4" /> Snapshot</button>
		</div>

		<div class="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5">
			{#each META as m (m.f)}
				<label class="stat-tile gap-0.5">
					<span class="text-[10px] uppercase tracking-wide text-muted">{m.label}</span>
					<input
						class="w-full bg-transparent text-center font-display text-xl font-bold tabular-nums outline-none"
						type="number"
						value={c[m.f as keyof typeof c] as number}
						onchange={(e) => setNum(m.f, +e.currentTarget.value)}
					/>
				</label>
			{/each}
		</div>
	</div>

	<div class="gap-4 md:columns-2 xl:columns-3 [&>*]:mb-4 [&>*]:break-inside-avoid">
		<Card title="Trefferpunkte">
			<HpTracker />
			<div class="mt-4 space-y-3">
				<DeathSaves />
				<RestControls />
			</div>
		</Card>
		<Card title="Attribute"><AbilityScores /></Card>
		<Card title="Zustände"><ConditionChips /></Card>
		<Card title="Zauberplätze"><SpellSlots /></Card>
		<Card title="Ressourcen & Tracker"><CustomTrackers /></Card>
		<Card title="Währung"><CurrencyTracker /></Card>

		<Card title="Notizen zum Charakter">
			<textarea
				class="input min-h-32 resize-y"
				value={c.notes}
				placeholder="Persönlichkeit, Ziele, Geheimnisse…"
				onchange={(e) => setStr('notes', e.currentTarget.value)}
			></textarea>
		</Card>

		<Card title="Verlauf (Event-Log)">
			{#if events.length === 0}
				<p class="text-sm text-muted">Noch keine Änderungen aufgezeichnet.</p>
			{:else}
				<ul class="flex flex-col gap-1.5 text-sm">
					{#each events as e (e.id)}
						<li class="flex items-center justify-between gap-2 border-b border-border/60 pb-1.5">
							<span class="truncate text-muted">{e.field}</span>
							<span class="shrink-0 tabular-nums">
								{#if e.delta != null}<span
										class={e.delta >= 0 ? 'text-success' : 'text-danger'}
										>{e.delta >= 0 ? '+' : ''}{e.delta}</span
									>{/if}
								<span class="ml-2 text-xs text-muted">{relTime(e.ts)}</span>
							</span>
						</li>
					{/each}
				</ul>
			{/if}
		</Card>
	</div>
{/if}

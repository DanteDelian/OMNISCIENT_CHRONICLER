<script lang="ts">
	import { onMount } from 'svelte';
	import { character } from '$lib/stores/character.svelte';
	import { live } from '$lib/stores/live.svelte';
	import { toasts } from '$lib/stores/toast.svelte';
	import type { CharacterEvent } from '$lib/types';
	import Card from '$lib/components/ui/Card.svelte';
	import AnimatedNumber from '$lib/components/AnimatedNumber.svelte';
	import HpTracker from '$lib/components/character/HpTracker.svelte';
	import RestControls from '$lib/components/character/RestControls.svelte';
	import AbilityScores from '$lib/components/character/AbilityScores.svelte';
	import SkillsSaves from '$lib/components/character/SkillsSaves.svelte';
	import AttacksCard from '$lib/components/character/AttacksCard.svelte';
	import InventoryCard from '$lib/components/character/InventoryCard.svelte';
	import ConditionChips from '$lib/components/character/ConditionChips.svelte';
	import DeathSaves from '$lib/components/character/DeathSaves.svelte';
	import SpellSlots from '$lib/components/character/SpellSlots.svelte';
	import CustomTrackers from '$lib/components/character/CustomTrackers.svelte';
	import CurrencyTracker from '$lib/components/character/CurrencyTracker.svelte';
	import Camera from '@lucide/svelte/icons/camera';

	const c = $derived(character.current);
	let events = $state<CharacterEvent[]>([]);

	async function loadHistory() {
		const r = await fetch('/api/character/history?limit=15');
		if (r.ok) events = (await r.json()).events;
	}
	onMount(loadHistory);
	$effect(() => {
		if (live.rev) loadHistory();
	});

	function setNum(field: string, v: number) {
		character.patch({ [field]: Math.round(v || 0) });
	}
	function setStr(field: string, v: string) {
		character.patch({ [field]: v });
	}

	function editPortrait() {
		if (!c) return;
		const v = prompt('Porträt: Emoji (z.B. 🧝) oder Bildpfad (campaign/assets/…)', c.portrait);
		if (v !== null) setStr('portrait', v.trim());
	}

	async function snapshot() {
		const label = prompt('Bezeichnung des Snapshots (z.B. "Session 12 – Ende")');
		if (label === null) return;
		await character.snapshot(label || 'Snapshot');
		toasts.push('Snapshot gespeichert', label || '', 'good');
		loadHistory();
	}

	const isImage = $derived(!!c && (c.portrait.includes('/') || c.portrait.includes('.')));

	const STATS = [
		{ f: 'ac', label: 'RK' },
		{ f: 'initiativeBonus', label: 'Init' },
		{ f: 'speed', label: 'Tempo' },
		{ f: 'proficiencyBonus', label: 'ÜB' },
		{ f: 'level', label: 'Stufe' },
		{ f: 'xp', label: 'EP' }
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
	<!-- Hero mit Porträt -->
	<div class="card card-pad mb-4 overflow-hidden bg-gradient-to-br from-primary/10 via-transparent to-accent/5">
		<div class="flex flex-col gap-4 sm:flex-row sm:items-center">
			<!-- Porträt mit glühendem Rahmen -->
			<button
				class="group relative mx-auto grid h-28 w-28 shrink-0 place-items-center rounded-2xl border-2 border-primary/40 bg-surface2 shadow-[0_0_30px_-6px_var(--color-primary)] transition hover:border-primary sm:mx-0"
				onclick={editPortrait}
				title="Porträt ändern"
			>
				{#if isImage}
					<img src={c.portrait} alt={c.name} class="h-full w-full rounded-2xl object-cover" />
				{:else}
					<span class="text-6xl leading-none">{c.portrait || '🧙'}</span>
				{/if}
				<span
					class="absolute -bottom-2 -right-2 grid h-7 w-7 place-items-center rounded-lg bg-primary text-primary-fg opacity-0 transition group-hover:opacity-100"
				>
					<Camera class="h-4 w-4" />
				</span>
			</button>

			<div class="min-w-0 flex-1">
				<input
					class="w-full bg-transparent font-display text-2xl font-bold leading-tight outline-none focus:text-primary sm:text-3xl"
					value={c.name}
					onchange={(e) => setStr('name', e.currentTarget.value)}
				/>
				<div class="mt-2 flex flex-wrap gap-2 text-sm">
					<input class="input !w-28 !py-1" value={c.race} placeholder="Volk" onchange={(e) => setStr('race', e.currentTarget.value)} />
					<input class="input !w-32 !py-1" value={c.className} placeholder="Klasse" onchange={(e) => setStr('className', e.currentTarget.value)} />
					<input class="input !w-44 !py-1" value={c.background} placeholder="Hintergrund" onchange={(e) => setStr('background', e.currentTarget.value)} />
					<input class="input !w-28 !py-1" value={c.alignment} placeholder="Gesinnung" onchange={(e) => setStr('alignment', e.currentTarget.value)} />
				</div>
			</div>

			<button class="btn shrink-0" onclick={snapshot}><Camera class="h-4 w-4" /> Snapshot</button>
		</div>

		<div class="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
			{#each STATS as m (m.f)}
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
		<Card title="Trefferpunkte" class="card-hover">
			<HpTracker />
			<div class="mt-4 space-y-3">
				<DeathSaves />
				<RestControls />
			</div>
		</Card>
		<Card title="Attribute" class="card-hover"><AbilityScores /></Card>
		<Card title="Fertigkeiten & Rettungswürfe" class="card-hover"><SkillsSaves /></Card>
		<Card title="Angriffe" class="card-hover"><AttacksCard /></Card>
		<Card title="Inventar" class="card-hover"><InventoryCard /></Card>
		<Card title="Zustände" class="card-hover"><ConditionChips /></Card>
		<Card title="Zauberplätze" class="card-hover"><SpellSlots /></Card>
		<Card title="Ressourcen & Tracker" class="card-hover"><CustomTrackers /></Card>
		<Card title="Währung" class="card-hover"><CurrencyTracker /></Card>

		<Card title="Aussehen & Notizen" class="card-hover">
			<textarea
				class="input mb-2 min-h-20 resize-y text-sm"
				value={c.appearance}
				placeholder="Aussehen…"
				onchange={(e) => setStr('appearance', e.currentTarget.value)}
			></textarea>
			<textarea
				class="input min-h-24 resize-y text-sm"
				value={c.notes}
				placeholder="Persönlichkeit, Ziele, Geheimnisse…"
				onchange={(e) => setStr('notes', e.currentTarget.value)}
			></textarea>
		</Card>

		<Card title="Verlauf (Event-Log)" class="card-hover">
			{#if events.length === 0}
				<p class="text-sm text-muted">Noch keine Änderungen aufgezeichnet.</p>
			{:else}
				<ul class="flex flex-col gap-1.5 text-sm">
					{#each events as e (e.id)}
						<li class="flex items-center justify-between gap-2 border-b border-border/60 pb-1.5">
							<span class="truncate text-muted">{e.field}</span>
							<span class="shrink-0 tabular-nums">
								{#if e.delta != null}<span class={e.delta >= 0 ? 'text-success' : 'text-danger'}
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

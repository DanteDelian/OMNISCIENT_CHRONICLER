<script lang="ts">
	import { onMount } from 'svelte';
	import { character } from '$lib/stores/character.svelte';
	import { live } from '$lib/stores/live.svelte';
	import { toasts } from '$lib/stores/toast.svelte';
	import { FIELD_LABELS, type CharacterEvent } from '$lib/types';
	import Card from '$lib/components/ui/Card.svelte';
	import AnimatedNumber from '$lib/components/AnimatedNumber.svelte';
	import HpTracker from '$lib/components/character/HpTracker.svelte';
	import RestControls from '$lib/components/character/RestControls.svelte';
	import AbilityScores from '$lib/components/character/AbilityScores.svelte';
	import SkillsSaves from '$lib/components/character/SkillsSaves.svelte';
	import Spellbook from '$lib/components/character/Spellbook.svelte';
	import FeaturesCard from '$lib/components/character/FeaturesCard.svelte';
	import AttacksCard from '$lib/components/character/AttacksCard.svelte';
	import InventoryCard from '$lib/components/character/InventoryCard.svelte';
	import ConditionChips from '$lib/components/character/ConditionChips.svelte';
	import DeathSaves from '$lib/components/character/DeathSaves.svelte';
	import SpellSlots from '$lib/components/character/SpellSlots.svelte';
	import CustomTrackers from '$lib/components/character/CustomTrackers.svelte';
	import CurrencyTracker from '$lib/components/character/CurrencyTracker.svelte';
	import XpBar from '$lib/components/character/XpBar.svelte';
	import DiceRoller from '$lib/components/DiceRoller.svelte';
	import Camera from '@lucide/svelte/icons/camera';
	import Star from '@lucide/svelte/icons/star';

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

	let editingPortrait = $state(false);
	let portraitDraft = $state('');
	function startPortrait() {
		if (!c) return;
		portraitDraft = c.portrait;
		editingPortrait = true;
	}
	function savePortrait() {
		setStr('portrait', portraitDraft.trim());
		editingPortrait = false;
	}

	async function snapshot() {
		const label = `Snapshot · ${new Date().toLocaleString('de-DE')}`;
		await character.snapshot(label);
		toasts.push('Snapshot gespeichert', label, 'good');
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
	<!-- Charakter-Kopf: großes Porträt + Identität + Vitalwerte -->
	<div class="card card-pad mb-4">
		<div class="flex flex-col gap-5 sm:flex-row">
			<!-- Großes Porträt -->
			<div class="relative mx-auto w-44 shrink-0 sm:mx-0">
				<button
					class="group relative block aspect-square w-full overflow-hidden rounded-2xl border border-border bg-surface2 transition hover:border-primary/50"
					onclick={startPortrait}
					title="Porträt ändern"
				>
					{#if isImage}
						<img src={c.portrait} alt={c.name} class="h-full w-full object-cover" />
					{:else}
						<span class="grid h-full w-full place-items-center text-7xl leading-none">{c.portrait || '🧙'}</span>
					{/if}
					<span
						class="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 bg-black/55 py-1.5 text-xs text-white opacity-0 backdrop-blur-sm transition group-hover:opacity-100"
					>
						<Camera class="h-3.5 w-3.5" /> ändern
					</span>
				</button>
				{#if editingPortrait}
					<div class="absolute left-1/2 top-full z-30 mt-2 w-64 -translate-x-1/2 rounded-xl border border-border bg-surface p-3 shadow-xl">
						<!-- svelte-ignore a11y_autofocus -->
						<input
							class="input"
							bind:value={portraitDraft}
							autofocus
							placeholder="🐉 oder campaign/assets/bild.png"
							onkeydown={(e) => e.key === 'Enter' && savePortrait()}
						/>
						<p class="mt-1 text-[11px] text-muted">Emoji oder Bildpfad (Bilder nach campaign/assets/)</p>
						<div class="mt-2 flex justify-end gap-2">
							<button class="btn btn-ghost !py-1" onclick={() => (editingPortrait = false)}>Abbrechen</button>
							<button class="btn btn-primary !py-1" onclick={savePortrait}>OK</button>
						</div>
					</div>
				{/if}
			</div>

			<!-- Identität -->
			<div class="flex min-w-0 flex-1 flex-col">
				<div class="flex items-start justify-between gap-2">
					<input
						class="w-full min-w-0 bg-transparent font-display text-3xl font-semibold leading-tight tracking-tight outline-none focus:text-primary sm:text-4xl"
						value={c.name}
						onchange={(e) => setStr('name', e.currentTarget.value)}
					/>
					<div class="flex shrink-0 items-center gap-1">
						<button
							class="grid h-9 w-9 place-items-center rounded-lg transition {c.inspiration ? 'text-accent insp-glow' : 'text-muted opacity-40 hover:opacity-80'}"
							onclick={() => character.patch({ inspiration: !c.inspiration })}
							title="Inspiration {c.inspiration ? '(aktiv!)' : ''}"
							aria-pressed={c.inspiration}
						>
							<Star class="h-6 w-6 {c.inspiration ? 'fill-current animate-pop' : ''}" />
						</button>
						<button class="btn btn-ghost btn-icon" onclick={snapshot} title="Snapshot speichern"><Camera class="h-4 w-4" /></button>
					</div>
				</div>
				<div class="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
					<input class="min-w-0 max-w-32 bg-transparent outline-none focus:text-ink" value={c.race} placeholder="Volk" onchange={(e) => setStr('race', e.currentTarget.value)} />
					<span class="opacity-40">·</span>
					<input class="min-w-0 max-w-40 bg-transparent outline-none focus:text-ink" value={c.className} placeholder="Klasse" onchange={(e) => setStr('className', e.currentTarget.value)} />
					<span class="opacity-40">·</span>
					<input class="min-w-0 max-w-32 bg-transparent outline-none focus:text-ink" value={c.alignment} placeholder="Gesinnung" onchange={(e) => setStr('alignment', e.currentTarget.value)} />
				</div>
				<input class="mt-1 w-full bg-transparent text-sm text-muted outline-none focus:text-ink" value={c.background} placeholder="Hintergrund" onchange={(e) => setStr('background', e.currentTarget.value)} />
				<div class="mt-3 max-w-md"><XpBar /></div>
				<div class="mt-auto pt-4">
					<div class="grid grid-cols-3 gap-2 sm:grid-cols-6">
						{#each STATS as m (m.f)}
							<label class="stat-tile gap-0.5">
								<span class="text-[10px] uppercase tracking-wide text-muted">{m.label}</span>
								<input
									class="w-full bg-transparent text-center font-display text-xl font-semibold tabular-nums outline-none"
									type="number"
									value={c[m.f as keyof typeof c] as number}
									onchange={(e) => setNum(m.f, +e.currentTarget.value)}
								/>
							</label>
						{/each}
					</div>
				</div>
			</div>
		</div>
	</div>

	<div class="grid items-start gap-4 sm:grid-cols-2 xl:grid-cols-3">
		<Card title="Trefferpunkte" class="card-hover">
			<HpTracker />
			<div class="mt-4 space-y-3">
				<DeathSaves />
				<RestControls />
			</div>
		</Card>
		<Card title="Attribute" class="card-hover"><AbilityScores /></Card>
		<Card title="Zauberbuch" class="card-hover"><Spellbook /></Card>
		<Card title="Fertigkeiten & Rettungswürfe" class="card-hover"><SkillsSaves /></Card>
		<Card title="Merkmale" class="card-hover"><FeaturesCard /></Card>
		<Card title="Angriffe" class="card-hover"><AttacksCard /></Card>
		<Card title="Inventar" class="card-hover"><InventoryCard /></Card>
		<Card title="Zustände" class="card-hover"><ConditionChips /></Card>
		<Card title="Zauberplätze" class="card-hover"><SpellSlots /></Card>
		<Card title="Ressourcen & Tracker" class="card-hover"><CustomTrackers /></Card>
		<Card title="Währung" class="card-hover"><CurrencyTracker /></Card>
		<Card title="Würfel" class="card-hover"><DiceRoller /></Card>

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
							<span class="truncate text-muted">{FIELD_LABELS[e.field] ?? e.field}</span>
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

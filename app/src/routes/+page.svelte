<script lang="ts">
	import { onMount } from 'svelte';
	import { flip } from 'svelte/animate';
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { dndzone } from 'svelte-dnd-action';
	import { character } from '$lib/stores/character.svelte';
	import { dashboard } from '$lib/stores/dashboard.svelte';
	import { fmtMod } from '$lib/types';
	import AnimatedNumber from '$lib/components/AnimatedNumber.svelte';
	import HpTracker from '$lib/components/character/HpTracker.svelte';
	import RestControls from '$lib/components/character/RestControls.svelte';
	import AbilityScores from '$lib/components/character/AbilityScores.svelte';
	import Spellbook from '$lib/components/character/Spellbook.svelte';
	import FeaturesCard from '$lib/components/character/FeaturesCard.svelte';
	import ConditionChips from '$lib/components/character/ConditionChips.svelte';
	import SpellSlots from '$lib/components/character/SpellSlots.svelte';
	import CustomTrackers from '$lib/components/character/CustomTrackers.svelte';
	import CurrencyTracker from '$lib/components/character/CurrencyTracker.svelte';
	import XpBar from '$lib/components/character/XpBar.svelte';
	import InventoryCard from '$lib/components/character/InventoryCard.svelte';
	import QuestsWidget from '$lib/components/character/QuestsWidget.svelte';
	import HpHistory from '$lib/components/character/HpHistory.svelte';
	import DiceRoller from '$lib/components/DiceRoller.svelte';
	import AmbiencePlayer from '$lib/components/AmbiencePlayer.svelte';
	import SpotifyWidget from '$lib/components/SpotifyWidget.svelte';
	import Shield from '@lucide/svelte/icons/shield';
	import Zap from '@lucide/svelte/icons/zap';
	import Wind from '@lucide/svelte/icons/wind';
	import Award from '@lucide/svelte/icons/award';
	import SlidersHorizontal from '@lucide/svelte/icons/sliders-horizontal';
	import GripVertical from '@lucide/svelte/icons/grip-vertical';
	import Eye from '@lucide/svelte/icons/eye';
	import EyeOff from '@lucide/svelte/icons/eye-off';
	import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
	import Check from '@lucide/svelte/icons/check';
	import Star from '@lucide/svelte/icons/star';

	const c = $derived(character.current);

	const TITLES: Record<string, string> = {
		hp: 'Trefferpunkte',
		dice: 'Würfel',
		spellbook: 'Zauberbuch',
		abilities: 'Attribute',
		conditions: 'Zustände',
		features: 'Merkmale',
		trackers: 'Ressourcen & Tracker',
		spells: 'Zauberplätze',
		currency: 'Währung',
		inventory: 'Inventar',
		quests: 'Aktive Quests',
		history: 'TP-Verlauf',
		ambience: 'Musik (Ambience)',
		spotify: 'Spotify'
	};

	let items = $state<{ id: string }[]>([]);
	onMount(() => dashboard.load());
	$effect(() => {
		if (!dashboard.loaded) return;
		const base = dashboard.customizing
			? dashboard.order
			: dashboard.order.filter((id) => !dashboard.hidden.includes(id));
		items = base.map((id) => ({ id }));
	});

	// Drag nur am Griff starten — sonst wird Touch-Scrollen zur Falle
	let dragActive = $state(false);
	const dndOptions = $derived({
		items,
		flipDurationMs: 180,
		dragDisabled: !dashboard.customizing || !dragActive,
		dropTargetStyle: {}
	});

	function consider(e: CustomEvent<{ items: { id: string }[] }>) {
		items = e.detail.items;
	}
	function finalize(e: CustomEvent<{ items: { id: string }[] }>) {
		items = e.detail.items;
		dashboard.setOrder(items.map((i) => i.id));
		dragActive = false;
	}

	// HP-Ring
	const ratio = $derived(c ? Math.max(0, Math.min(1, c.hp.current / Math.max(1, c.hp.max))) : 0);
	const ringColor = $derived(
		ratio > 0.5 ? 'var(--color-success)' : ratio > 0.25 ? 'var(--color-accent)' : 'var(--color-danger)'
	);
	const RADIUS = 34;
	const CIRC = 2 * Math.PI * RADIUS;
</script>

<svelte:head><title>Dashboard · Omniscient Chronicler</title></svelte:head>
<svelte:window onpointerup={() => (dragActive = false)} />

{#if c}
	<!-- Hero -->
	<div class="card card-ornate card-pad mb-4 overflow-hidden bg-gradient-to-br from-primary/10 via-transparent to-accent/5">
		<div class="flex flex-wrap items-center justify-between gap-4">
			<div class="flex items-center gap-4">
				<!-- HP-Ring -->
				<div class="relative grid h-24 w-24 shrink-0 place-items-center">
					<svg viewBox="0 0 80 80" class="h-24 w-24 -rotate-90">
						<circle cx="40" cy="40" r={RADIUS} fill="none" stroke="var(--color-surface2)" stroke-width="7" />
						<circle
							cx="40"
							cy="40"
							r={RADIUS}
							fill="none"
							stroke={ringColor}
							stroke-width="7"
							stroke-linecap="round"
							stroke-dasharray={CIRC}
							stroke-dashoffset={CIRC * (1 - ratio)}
							style="transition: stroke-dashoffset 0.6s cubic-bezier(.2,.8,.2,1), stroke 0.4s"
						/>
					</svg>
					<div class="absolute flex flex-col items-center leading-none">
						<AnimatedNumber value={c.hp.current} class="font-display text-2xl font-bold" />
						<span class="text-[10px] text-muted">/ {c.hp.max} TP</span>
					</div>
				</div>
				<div class="min-w-0">
					<div class="flex items-center gap-2">
						<h1 class="grad-text truncate font-display text-2xl font-bold sm:text-3xl">{c.name}</h1>
						<button
							class="shrink-0 transition {c.inspiration ? 'text-accent insp-glow' : 'text-muted opacity-40 hover:opacity-80'}"
							onclick={() => character.patch({ inspiration: !c.inspiration })}
							title="Inspiration {c.inspiration ? '(aktiv!)' : ''}"
							aria-pressed={c.inspiration}
						>
							<Star class="h-6 w-6 {c.inspiration ? 'fill-current animate-pop' : ''}" />
						</button>
					</div>
					<p class="text-sm text-muted">Stufe {c.level} · {c.race} · {c.className}</p>
					<div class="mt-2 max-w-72"><XpBar /></div>
				</div>
			</div>
			<div class="grid grid-cols-4 gap-2 sm:gap-3">
				<div class="stat-tile min-w-16">
					<Shield class="mb-1 h-4 w-4 text-primary" />
					<AnimatedNumber value={c.ac} class="font-display text-xl font-bold" />
					<span class="text-[10px] text-muted">RK</span>
				</div>
				<div class="stat-tile min-w-16">
					<Zap class="mb-1 h-4 w-4 text-accent" />
					<span class="font-display text-xl font-bold">{fmtMod(c.initiativeBonus)}</span>
					<span class="text-[10px] text-muted">Init</span>
				</div>
				<div class="stat-tile min-w-16">
					<Wind class="mb-1 h-4 w-4 text-muted" />
					<AnimatedNumber value={c.speed} class="font-display text-xl font-bold" />
					<span class="text-[10px] text-muted">Tempo</span>
				</div>
				<div class="stat-tile min-w-16">
					<Award class="mb-1 h-4 w-4 text-success" />
					<span class="font-display text-xl font-bold">{fmtMod(c.proficiencyBonus)}</span>
					<span class="text-[10px] text-muted">ÜB</span>
				</div>
			</div>
		</div>
	</div>

	<!-- Anpassen-Leiste -->
	<div class="mb-3 flex items-center justify-end gap-2">
		{#if dashboard.customizing}
			<button class="btn btn-ghost text-sm text-muted" onclick={() => dashboard.reset()}>
				<RotateCcw class="h-4 w-4" /> Zurücksetzen
			</button>
			<button class="btn btn-primary text-sm" onclick={() => (dashboard.customizing = false)}>
				<Check class="h-4 w-4" /> Fertig
			</button>
		{:else}
			<button class="btn text-sm" onclick={() => (dashboard.customizing = true)}>
				<SlidersHorizontal class="h-4 w-4" /> Anpassen
			</button>
		{/if}
	</div>

	<!-- Widget-Grid (verschiebbar) -->
	<section
		use:dndzone={dndOptions}
		onconsider={consider}
		onfinalize={finalize}
		class="grid grid-cols-1 items-start gap-4 sm:grid-cols-2 xl:grid-cols-3"
	>
		{#each items as item, i (item.id)}
			{@const hidden = dashboard.hidden.includes(item.id)}
			<div
				animate:flip={{ duration: 180 }}
				in:fly={{ y: 24, duration: 380, delay: Math.min(i, 9) * 55, easing: cubicOut }}
				class="card card-pad {dashboard.customizing ? 'ring-2 ring-primary/20' : 'card-hover'} {hidden
					? 'opacity-40'
					: ''}"
			>
				<div class="mb-3 flex items-center justify-between gap-2">
					<h3 class="panel-title">{TITLES[item.id] ?? item.id}</h3>
					{#if dashboard.customizing}
						<div class="flex items-center gap-1">
							<button
								class="btn btn-icon btn-ghost !h-9 !w-9"
								onclick={() => dashboard.toggle(item.id)}
								aria-label="Sichtbarkeit"
							>
								{#if hidden}<EyeOff class="h-4 w-4" />{:else}<Eye class="h-4 w-4" />{/if}
							</button>
							<button
								class="drag-handle grid h-9 w-9 cursor-grab place-items-center rounded-lg text-muted transition hover:bg-surface2 hover:text-ink"
								onpointerdown={() => (dragActive = true)}
								title="Zum Verschieben ziehen"
								aria-label="Widget verschieben"
							>
								<GripVertical class="h-5 w-5" />
							</button>
						</div>
					{/if}
				</div>

				{#if item.id === 'hp'}
					<HpTracker />
					<div class="mt-4"><RestControls /></div>
				{:else if item.id === 'dice'}
					<DiceRoller />
				{:else if item.id === 'spellbook'}
					<Spellbook />
				{:else if item.id === 'features'}
					<FeaturesCard />
				{:else if item.id === 'abilities'}
					<AbilityScores />
				{:else if item.id === 'conditions'}
					<ConditionChips />
				{:else if item.id === 'trackers'}
					<CustomTrackers />
				{:else if item.id === 'spells'}
					<SpellSlots />
				{:else if item.id === 'currency'}
					<CurrencyTracker />
				{:else if item.id === 'inventory'}
					<InventoryCard />
				{:else if item.id === 'quests'}
					<QuestsWidget />
				{:else if item.id === 'history'}
					<HpHistory />
				{:else if item.id === 'ambience'}
					<AmbiencePlayer />
				{:else if item.id === 'spotify'}
					<SpotifyWidget />
				{/if}
			</div>
		{/each}
	</section>
{:else if character.error}
	<div class="grid min-h-[60vh] place-items-center">
		<div class="card card-pad max-w-sm text-center">
			<p class="font-display text-lg font-bold">Die Chronik schweigt…</p>
			<p class="mt-1 text-sm text-muted">Der Charakter konnte nicht geladen werden.</p>
			<button class="btn btn-primary mt-4" onclick={() => character.refresh()}>Erneut versuchen</button>
		</div>
	</div>
{:else}
	<div class="grid min-h-[60vh] place-items-center text-muted">
		<div class="animate-pulse font-display text-lg">Die Chronik erwacht…</div>
	</div>
{/if}

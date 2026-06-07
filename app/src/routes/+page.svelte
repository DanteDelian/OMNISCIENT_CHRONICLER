<script lang="ts">
	import { character } from '$lib/stores/character.svelte';
	import { fmtMod } from '$lib/types';
	import Card from '$lib/components/ui/Card.svelte';
	import HpTracker from '$lib/components/character/HpTracker.svelte';
	import RestControls from '$lib/components/character/RestControls.svelte';
	import AbilityScores from '$lib/components/character/AbilityScores.svelte';
	import ConditionChips from '$lib/components/character/ConditionChips.svelte';
	import SpellSlots from '$lib/components/character/SpellSlots.svelte';
	import CustomTrackers from '$lib/components/character/CustomTrackers.svelte';
	import CurrencyTracker from '$lib/components/character/CurrencyTracker.svelte';
	import DiceRoller from '$lib/components/DiceRoller.svelte';
	import Shield from '@lucide/svelte/icons/shield';
	import Zap from '@lucide/svelte/icons/zap';
	import Wind from '@lucide/svelte/icons/wind';
	import Award from '@lucide/svelte/icons/award';

	const c = $derived(character.current);
</script>

<svelte:head><title>Dashboard · Omniscient Chronicler</title></svelte:head>

{#if c}
	<!-- Hero -->
	<div class="card card-pad mb-4 bg-gradient-to-br from-primary/10 to-transparent">
		<div class="flex flex-wrap items-center justify-between gap-4">
			<div>
				<h1 class="font-display text-2xl font-bold sm:text-3xl">{c.name}</h1>
				<p class="text-sm text-muted">
					Stufe {c.level} · {c.race} · {c.className}
				</p>
			</div>
			<div class="grid grid-cols-4 gap-2 sm:gap-3">
				<div class="stat-tile min-w-16">
					<Shield class="mb-1 h-4 w-4 text-primary" />
					<span class="font-display text-xl font-bold">{c.ac}</span>
					<span class="text-[10px] text-muted">RK</span>
				</div>
				<div class="stat-tile min-w-16">
					<Zap class="mb-1 h-4 w-4 text-accent" />
					<span class="font-display text-xl font-bold">{fmtMod(c.initiativeBonus)}</span>
					<span class="text-[10px] text-muted">Init</span>
				</div>
				<div class="stat-tile min-w-16">
					<Wind class="mb-1 h-4 w-4 text-muted" />
					<span class="font-display text-xl font-bold">{c.speed}</span>
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

	<!-- Masonry-Widget-Grid -->
	<div class="gap-4 md:columns-2 xl:columns-3 [&>*]:mb-4 [&>*]:break-inside-avoid">
		<Card title="Trefferpunkte">
			<HpTracker />
			<div class="mt-4"><RestControls /></div>
		</Card>

		<Card title="Würfel">
			<DiceRoller />
		</Card>

		<Card title="Attribute">
			<AbilityScores />
		</Card>

		<Card title="Zustände">
			<ConditionChips />
		</Card>

		<Card title="Ressourcen & Tracker">
			<CustomTrackers />
		</Card>

		<Card title="Zauberplätze">
			<SpellSlots />
		</Card>

		<Card title="Währung">
			<CurrencyTracker />
		</Card>
	</div>
{:else}
	<div class="grid min-h-[60vh] place-items-center text-muted">
		<div class="animate-pulse font-display text-lg">Die Chronik erwacht…</div>
	</div>
{/if}

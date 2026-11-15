<script lang="ts">
	/** Kampfansicht fürs Tablet: nur, was in einer Runde zählt. */
	import CombatCard from '$lib/components/play/CombatCard.svelte';
	import HealthCard from '$lib/components/play/HealthCard.svelte';
	import MagicCard from '$lib/components/play/MagicCard.svelte';
	import ActionsCard from '$lib/components/play/ActionsCard.svelte';
	import ConditionsCard from '$lib/components/play/ConditionsCard.svelte';
	import RetinueCard from '$lib/components/play/RetinueCard.svelte';
	import { campaign } from '$lib/stores/campaign.svelte';

	const round = $derived(campaign.data.state.combat?.round);
</script>

<svelte:head><title>{round ? `Runde ${round} · ` : ''}Kampf · Valerius</title></svelte:head>

<div class="stagger space-y-4">
	<CombatCard />
	<div class="stagger grid gap-4 lg:grid-cols-12">
		<div class="space-y-4 lg:col-span-5 xl:col-span-4">
			<HealthCard />
			<MagicCard />
		</div>
		<div class="space-y-4 lg:col-span-7 xl:col-span-8">
			<ActionsCard />
			<div class="grid gap-4 xl:grid-cols-2">
				<ConditionsCard />
				<RetinueCard />
			</div>
		</div>
	</div>
</div>

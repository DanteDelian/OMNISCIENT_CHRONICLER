<script lang="ts">
	import HeroBar from '$lib/components/play/HeroBar.svelte';
	import CombatCard from '$lib/components/play/CombatCard.svelte';
	import HealthCard from '$lib/components/play/HealthCard.svelte';
	import MagicCard from '$lib/components/play/MagicCard.svelte';
	import ActionsCard from '$lib/components/play/ActionsCard.svelte';
	import ChecksCard from '$lib/components/play/ChecksCard.svelte';
	import ConditionsCard from '$lib/components/play/ConditionsCard.svelte';
	import RetinueCard from '$lib/components/play/RetinueCard.svelte';
	import FocusCard from '$lib/components/play/FocusCard.svelte';
	import ClocksCard from '$lib/components/play/ClocksCard.svelte';
</script>

<svelte:head><title>Spieltisch · Valerius</title></svelte:head>

<div class="stagger space-y-4">
	<HeroBar />
	<!-- Im Kampf steht die Rundenleiste direkt unter dem Kopf -->
	<CombatCard showIdle={false} />
	<div class="stagger grid gap-4 lg:grid-cols-12">
		<div class="space-y-4 lg:col-span-5 xl:col-span-4 2xl:col-span-3">
			<HealthCard />
			<MagicCard />
		</div>
		<div class="space-y-4 lg:col-span-7 xl:col-span-8 2xl:col-span-6">
			<ActionsCard />
			<div class="grid gap-4 xl:grid-cols-2">
				<ConditionsCard />
				<RetinueCard />
			</div>
		</div>
		<div class="space-y-4 lg:col-span-12 2xl:col-span-3">
			<div class="grid gap-4 lg:grid-cols-2 2xl:grid-cols-1">
				<div class="lg:col-span-2 2xl:col-span-1"><ClocksCard limit={4} /></div>
				<ChecksCard />
				<FocusCard />
			</div>
		</div>
	</div>
</div>

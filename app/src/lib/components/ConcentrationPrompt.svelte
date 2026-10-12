<script lang="ts">
	/** Nach Schaden während Konzentration: KO-Rettungswurf direkt anbieten. */
	import { fly } from 'svelte/transition';
	import { Brain } from '@lucide/svelte';
	import { campaign } from '$lib/stores/campaign.svelte';
	import { rolls } from '$lib/stores/rolls.svelte';
	import { ui } from '$lib/stores/ui.svelte';
	import { endConcentration } from '$lib/game';
	import { chanceAtLeast, pct, saveBonus } from '$lib/rules';

	let result = $state<number | null>(null);

	const check = $derived(ui.concentrationCheck);
	const conc = $derived(campaign.data.state.concentration);
	const bonus = $derived(saveBonus(campaign.data.character, 'con'));

	$effect(() => {
		if (!check) result = null;
	});

	function roll() {
		if (!check) return;
		const r = rolls.check(`Konzentration (SG ${check.dc})`, bonus);
		result = r.total;
	}

	function held() {
		rolls.event('Konzentration gehalten', conc?.name ?? '', 'good');
		ui.concentrationCheck = null;
	}
</script>

{#if check && conc}
	<div class="fixed top-5 left-1/2 z-[58] w-[min(440px,92vw)] -translate-x-1/2" transition:fly={{ y: -16, duration: 180 }}>
		<div class="panel pulse-warn border-warn/40 p-4">
			<div class="flex items-start gap-3">
				<div class="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-warn/15 text-warn"><Brain size={20} /></div>
				<div class="min-w-0 flex-1">
					<div class="font-semibold">Konzentrationswurf für {conc.name}</div>
					<p class="mt-0.5 text-sm text-ink-2">
						{check.damage} Schaden → <b class="text-ink">SG {check.dc}</b> · KO-Rettungswurf {bonus >= 0 ? '+' : ''}{bonus} ·
						<span class="whitespace-nowrap">Chance <b class="text-ink">{pct(chanceAtLeast(bonus, check.dc))}</b></span>
					</p>
					{#if result !== null}
						<p class="mt-2 text-sm">
							Ergebnis <b class="num text-lg">{result}</b> –
							{#if result >= check.dc}<span class="text-life">gehalten</span>{:else}<span class="text-blood">verloren</span>{/if}
						</p>
					{/if}
				</div>
			</div>
			<div class="mt-3 flex flex-wrap justify-end gap-2">
				{#if result === null}
					<button class="btn btn-sm btn-primary" onclick={roll}>Würfeln</button>
					<button class="btn btn-sm btn-life" onclick={held}>Gehalten</button>
					<button class="btn btn-sm btn-danger" onclick={() => endConcentration('verloren')}>Verloren</button>
				{:else if result >= check.dc}
					<button class="btn btn-sm btn-life" onclick={held}>Weiter</button>
				{:else}
					<button class="btn btn-sm btn-danger" onclick={() => endConcentration('verloren')}>Konzentration beenden</button>
				{/if}
			</div>
		</div>
	</div>
{/if}

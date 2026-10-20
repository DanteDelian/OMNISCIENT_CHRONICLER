<script lang="ts">
	import { Heart, HeartCrack, Brain, ShieldCheck, Skull, Dices } from '@lucide/svelte';
	import { campaign } from '$lib/stores/campaign.svelte';
	import { damage, heal, setTempHp, endConcentration, setDeathSave, rollDeathSave } from '$lib/game';
	import { timeHM } from '$lib/format';

	const c = $derived(campaign.data.character);
	const s = $derived(campaign.data.state);
	let amount = $state<number | null>(null);
	let tempInput = $state<number | null>(null);

	const pctHp = $derived(Math.max(0, Math.min(1, s.hp / c.hp.max)));
	const color = $derived(pctHp > 0.5 ? 'var(--color-life)' : pctHp > 0.25 ? 'var(--color-warn)' : 'var(--color-blood)');
	const R = 54;
	const CIRC = 2 * Math.PI * R;

	function apply(kind: 'dmg' | 'heal', n = amount ?? 0) {
		if (!n) return;
		if (kind === 'dmg') damage(n);
		else heal(n);
		amount = null;
	}
</script>

<section class="panel @container p-5">
	<div class="mb-3 flex items-center justify-between">
		<div class="eyebrow">Trefferpunkte</div>
		{#if s.tempHp > 0}<span class="badge" style="--c: var(--color-astral-2)">+{s.tempHp} temporär</span>{/if}
	</div>

	<!-- Schmale Karte: Ring über den Knöpfen statt daneben -->
	<div class="flex flex-col items-center gap-4 @[19rem]:flex-row">
		<div class="relative h-[120px] w-[120px] shrink-0">
			<svg viewBox="0 0 132 132" class="h-full w-full -rotate-90">
				<circle cx="66" cy="66" r={R} fill="none" stroke="rgb(255 255 255 / 0.06)" stroke-width="10" />
				<circle
					cx="66"
					cy="66"
					r={R}
					fill="none"
					stroke={color}
					stroke-width="10"
					stroke-linecap="round"
					stroke-dasharray={CIRC}
					stroke-dashoffset={CIRC * (1 - pctHp)}
					style="transition: stroke-dashoffset 0.5s ease, stroke 0.3s; filter: drop-shadow(0 0 8px {color})"
				/>
			</svg>
			<div class="absolute inset-0 flex flex-col items-center justify-center">
				<span class="num text-[2.6rem] leading-none font-semibold">{s.hp}</span>
				<span class="num text-sm text-ink-3">von {c.hp.max}</span>
			</div>
		</div>

		<div class="w-full min-w-0 flex-1 space-y-2">
			<div class="grid grid-cols-3 gap-1.5">
				{#each [1, 5, 10] as n (n)}<button class="btn btn-xs btn-danger" onclick={() => apply('dmg', n)}>−{n}</button>{/each}
				{#each [1, 5, 10] as n (n)}<button class="btn btn-xs btn-life" onclick={() => apply('heal', n)}>+{n}</button>{/each}
			</div>
			<form
				class="flex items-center gap-1.5"
				onsubmit={(e) => {
					e.preventDefault();
					setTempHp(tempInput ?? 0);
					tempInput = null;
				}}
			>
				<input class="input num !h-7 min-w-0 flex-1 text-center text-xs" type="number" min="0" placeholder="Temp. {s.tempHp}" bind:value={tempInput} aria-label="Temporäre Trefferpunkte" />
				<button class="btn btn-xs shrink-0">Temp. setzen</button>
			</form>
		</div>
	</div>

	<form
		class="mt-3 flex gap-2"
		onsubmit={(e) => {
			e.preventDefault();
			apply('dmg');
		}}
	>
		<input class="input num !h-10 w-[4.5rem] shrink-0 text-center text-lg" type="number" min="0" placeholder="0" bind:value={amount} aria-label="Betrag" />
		<button type="button" class="btn btn-danger !h-10 min-w-0 flex-1 !px-2" onclick={() => apply('dmg')}><HeartCrack size={15} />Schaden</button>
		<button type="button" class="btn btn-life !h-10 min-w-0 flex-1 !px-2" onclick={() => apply('heal')}><Heart size={15} />Heilen</button>
	</form>

	{#if s.hp === 0}
		<div class="mt-4 rounded-2xl border border-blood/40 bg-blood/[0.07] p-3.5">
			<div class="mb-2 flex items-center justify-between">
				<span class="flex items-center gap-2 text-sm font-semibold text-blood"><Skull size={15} />Todesrettungswürfe</span>
				<button class="btn btn-xs" onclick={rollDeathSave}><Dices size={12} />Würfeln</button>
			</div>
			<div class="flex justify-between gap-4 text-xs">
				{#each [['success', 'Erfolge', 'var(--color-life)'], ['fail', 'Fehlschläge', 'var(--color-blood)']] as [k, l, col] (k)}
					<div class="flex items-center gap-2">
						<span class="text-ink-3">{l}</span>
						{#each [1, 2, 3] as n (n)}
							<button
								class="pip {s.deathSaves[k as 'success' | 'fail'] >= n ? '' : 'pip-used'}"
								style="--c: {col}"
								aria-label="{l} {n}"
								onclick={() => setDeathSave(k as 'success' | 'fail', n)}
							></button>
						{/each}
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<div class="mt-4 space-y-2">
		<div class="flex items-center gap-3 rounded-xl border px-3 py-2 {s.concentration ? 'border-warn/40 bg-warn/[0.07]' : 'border-line bg-white/[0.02]'}">
			<Brain size={16} class={s.concentration ? 'text-warn' : 'text-ink-3'} />
			<div class="min-w-0 flex-1 text-sm">
				{#if s.concentration}
					<b class="text-ink">{s.concentration.name}</b> <span class="text-ink-3">· seit {timeHM(s.concentration.since)}</span>
				{:else}
					<span class="text-ink-3">Keine Konzentration</span>
				{/if}
			</div>
			{#if s.concentration}<button class="btn btn-xs" onclick={() => endConcentration('beendet')}>Beenden</button>{/if}
		</div>
		{#if s.shield}
			<div class="flex items-center gap-3 rounded-xl border border-astral-2/40 bg-astral-2/[0.07] px-3 py-2 text-sm">
				<ShieldCheck size={16} class="text-astral-2" />
				<span class="flex-1">Schild aktiv: RK {c.ac.base + 5} bis zu deinem Zug</span>
				<button class="btn btn-xs" onclick={() => campaign.change('state', (st) => (st.shield = false))}>Mein Zug</button>
			</div>
		{/if}
	</div>
</section>

<script lang="ts">
	import { page } from '$app/state';
	import { Search, Dices, Brain, CircleAlert } from '@lucide/svelte';
	import { NAV, isActive } from '$lib/nav';
	import { campaign } from '$lib/stores/campaign.svelte';
	import { live } from '$lib/stores/live.svelte';
	import { ui } from '$lib/stores/ui.svelte';
	import { slotTotals, slotsLeft } from '$lib/rules';

	let { onnavigate }: { onnavigate?: () => void } = $props();

	const c = $derived(campaign.data.character);
	const s = $derived(campaign.data.state);
	const hpPct = $derived(Math.max(0, Math.min(1, s.hp / c.hp.max)));
	const quests = $derived(campaign.data.quests.filter((q) => q.status === 'aktiv' && q.urgent).length);
	const isMac = typeof navigator !== 'undefined' && /Mac/.test(navigator.platform);
</script>

<nav class="flex h-full flex-col gap-4 px-3 py-4" aria-label="Hauptnavigation">
	<a href="/" class="flex items-center gap-3 px-2" onclick={onnavigate}>
		<img src="/favicon.svg" alt="" class="h-8 w-8" />
		<div class="leading-tight">
			<div class="title-display text-[1.35rem]">Valerius</div>
			<div class="eyebrow !text-[0.6rem]">Grimoire · Xantus</div>
		</div>
	</a>

	<button class="btn justify-between !px-3 text-ink-3" onclick={() => (ui.palette = true)}>
		<span class="flex items-center gap-2"><Search size={15} />Suchen …</span>
		<span class="kbd">{isMac ? '⌘' : 'Strg'} K</span>
	</button>

	<!-- Mini-Status -->
	<a href="/" class="panel panel-hover block p-3" onclick={onnavigate}>
		<div class="flex items-center gap-3">
			<img src="/api/assets/{c.avatar ?? c.portrait}" alt="Valerius" class="h-11 w-11 rounded-full ring-1 ring-gold/40" />
			<div class="min-w-0 flex-1">
				<div class="flex items-baseline justify-between">
					<span class="truncate text-sm font-medium">TP</span>
					<span class="num text-sm"><b class="text-ink">{s.hp}</b><span class="text-ink-3">/{c.hp.max}</span>{#if s.tempHp}<span class="text-astral-2"> +{s.tempHp}</span>{/if}</span>
				</div>
				<div class="mt-1 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
					<div
						class="h-full rounded-full transition-all duration-500"
						style="width: {hpPct * 100}%; background: {hpPct > 0.5 ? 'var(--color-life)' : hpPct > 0.25 ? 'var(--color-warn)' : 'var(--color-blood)'}"
					></div>
				</div>
			</div>
		</div>
		<div class="mt-2.5 flex items-center justify-between text-[0.7rem] text-ink-3">
			<span class="flex gap-2 num">
				{#each slotTotals(c) as sl (sl.level)}
					<span title="Grad {sl.level}"><span class="text-ink-3">{['', 'I', 'II', 'III', 'IV', 'V'][sl.level]}</span> <b class="text-ink-2">{slotsLeft(c, s, sl.level)}</b></span>
				{/each}
			</span>
			{#if s.concentration}
				<span class="flex items-center gap-1 text-warn" title="Konzentration"><Brain size={12} />{s.concentration.name}</span>
			{/if}
		</div>
	</a>

	<div class="flex-1 space-y-4 overflow-y-auto">
		{#each NAV as g (g.group)}
			<div>
				<div class="eyebrow mb-1.5 px-2.5">{g.group}</div>
				<ul class="space-y-0.5">
					{#each g.items as it (it.href)}
						{@const on = isActive(page.url.pathname, it.href)}
						<li>
							<a
								href={it.href}
								onclick={onnavigate}
								class="group flex items-center gap-3 rounded-[10px] px-2.5 py-2 text-sm transition {on
									? 'bg-white/[0.07] text-ink'
									: 'text-ink-2 hover:bg-white/[0.04] hover:text-ink'}"
							>
								<it.icon size={17} class={on ? 'text-astral' : 'text-ink-3 group-hover:text-ink-2'} />
								<span class="flex-1">{it.label}</span>
								{#if it.href === '/quests' && quests}<span class="badge" style="--c: var(--color-warn)">{quests}</span>{/if}
							</a>
						</li>
					{/each}
				</ul>
			</div>
		{/each}
	</div>

	<div class="space-y-2 border-t border-line pt-3">
		<button class="btn w-full justify-between !px-3" onclick={() => (ui.dice = !ui.dice)}>
			<span class="flex items-center gap-2"><Dices size={15} />Würfel</span><span class="kbd">D</span>
		</button>
		<div class="flex items-center justify-between px-1 text-[0.7rem] text-ink-3">
			<span class="flex items-center gap-1.5">
				<span class="h-1.5 w-1.5 rounded-full {live.connected ? 'bg-life' : 'bg-ink-3'}"></span>
				{live.connected ? 'Live verbunden' : 'Offline'}
			</span>
			{#if campaign.error}
				<span class="flex items-center gap-1 text-blood" title={campaign.error}><CircleAlert size={12} />Fehler</span>
			{:else if campaign.saving}
				<span>Speichert …</span>
			{:else}
				<span>Gespeichert</span>
			{/if}
		</div>
	</div>
</nav>

<script lang="ts">
	import { Bird, Ghost, Skull, Plus, Minus, X, CircleCheck, CircleAlert } from '@lucide/svelte';
	import { campaign } from '$lib/stores/campaign.svelte';
	import { addMinion, removeMinion } from '$lib/game';

	const s = $derived(campaign.data.state);
	const cr = $derived(campaign.data.creatures);
	const familiar = $derived(cr.familiars.find((f) => f.id === s.familiar.form) ?? cr.familiars[0]);
	const draka = $derived(cr.party[0]);

	function minionHp(id: string, delta: number) {
		campaign.change('state', (st) => {
			const m = st.minions.find((x) => x.id === id);
			if (m) m.hp = Math.max(0, Math.min(m.maxHp, m.hp + delta));
		});
	}
	function renew(id: string) {
		campaign.change('state', (st) => {
			const m = st.minions.find((x) => x.id === id);
			if (m) m.renewed = !m.renewed;
		});
	}
</script>

<section class="panel p-5">
	<div class="mb-3 flex items-center justify-between">
		<div class="eyebrow">Gefolge</div>
		<a class="text-xs text-ink-3 hover:text-ink" href="/gefolge">Wertblöcke →</a>
	</div>

	<!-- Vertrauter -->
	<div class="flex items-center gap-3 rounded-xl border border-line bg-white/[0.02] p-3">
		<div class="grid h-9 w-9 place-items-center rounded-lg bg-astral-2/10 text-astral-2"><Bird size={18} /></div>
		<div class="min-w-0 flex-1">
			<div class="text-sm font-medium">
				<a href="/gefolge#{familiar?.id}" data-ref="creature:{familiar?.id}" class="hover:text-astral">{familiar?.name}</a>
				<span class="text-xs text-ink-3">· Vertrauter</span>
			</div>
			<div class="text-xs text-ink-3">RK {familiar?.ac} · {s.familiar.hp}/{familiar?.hp} TP · {familiar?.speed}</div>
		</div>
		<button
			class="chip {s.familiar.present ? 'chip-on' : ''}"
			onclick={() => campaign.change('state', (st) => (st.familiar.present = !st.familiar.present))}
			title="Aktion: in die Taschendimension schicken oder zurückrufen">{s.familiar.present ? 'Anwesend' : 'Taschendimension'}</button
		>
	</div>

	<!-- Diener -->
	<div class="mt-2 flex items-center gap-3 rounded-xl border border-line bg-white/[0.02] p-3">
		<div class="grid h-9 w-9 place-items-center rounded-lg bg-s-besch/10 text-s-besch"><Ghost size={18} /></div>
		<div class="min-w-0 flex-1">
			<div class="text-sm font-medium">Unsichtbarer Diener</div>
			<div class="text-xs text-ink-3">RK 10 · 1 TP · Befehl = Bonusaktion · 1 Stunde</div>
		</div>
		<button class="chip {s.servant ? 'chip-on' : ''}" onclick={() => campaign.change('state', (st) => (st.servant = !st.servant))}>{s.servant ? 'Aktiv' : 'Inaktiv'}</button>
	</div>

	<!-- Untote -->
	<div class="mt-4 mb-2 flex items-center justify-between">
		<div class="flex items-center gap-2 text-sm font-medium"><Skull size={15} class="text-s-nekro" />Untote <span class="text-xs text-ink-3">({s.minions.length})</span></div>
		<div class="flex gap-1">
			<button class="btn btn-xs" onclick={() => addMinion('skelett')}><Plus size={11} />Skelett</button>
			<button class="btn btn-xs" onclick={() => addMinion('zombie')}><Plus size={11} />Zombie</button>
		</div>
	</div>
	{#if s.minions.length}
		<ul class="space-y-1.5">
			{#each s.minions as m (m.id)}
				<li class="flex items-center gap-2 rounded-lg bg-white/[0.02] px-2 py-1.5">
					<button onclick={() => renew(m.id)} title={m.renewed ? 'Kontrolle erneuert' : 'Kontrolle erneuern! (1 Minute, Grad-3-Platz für bis zu 4)'}>
						{#if m.renewed}<CircleCheck size={15} class="text-life" />{:else}<CircleAlert size={15} class="text-warn" />{/if}
					</button>
					<span class="min-w-0 flex-1 truncate text-sm">{m.name}</span>
					<div class="h-1.5 w-16 overflow-hidden rounded-full bg-white/[0.06]">
						<div class="h-full rounded-full bg-s-nekro" style="width: {(m.hp / m.maxHp) * 100}%"></div>
					</div>
					<span class="num w-11 text-right text-xs">{m.hp}/{m.maxHp}</span>
					<button class="icon-btn !h-6 !w-6" onclick={() => minionHp(m.id, -1)} aria-label="−1 TP"><Minus size={12} /></button>
					<button class="icon-btn !h-6 !w-6" onclick={() => minionHp(m.id, 1)} aria-label="+1 TP"><Plus size={12} /></button>
					<button class="icon-btn !h-6 !w-6" onclick={() => removeMinion(m.id)} aria-label="Entfernen"><X size={12} /></button>
				</li>
			{/each}
		</ul>
	{:else}
		<p class="rounded-lg border border-dashed border-line p-3 text-xs text-ink-3">
			Noch keine Untoten. Ziel: das Schlachtfeld im Südosten. Aus Knochen werden Skelette (Kurzbogen +4, 1W6 + 2).
		</p>
	{/if}

	{#if draka}
		<a href="/welt/draka-stormscale" data-ref="world:draka-stormscale" class="mt-4 flex items-center gap-3 rounded-xl border border-line bg-white/[0.02] p-3 transition hover:border-white/15">
			<div class="grid h-9 w-9 place-items-center rounded-lg bg-gold/10 text-sm font-semibold text-gold">D</div>
			<div class="min-w-0 flex-1">
				<div class="text-sm font-medium">Draka „Khoraa“</div>
				<div class="truncate text-xs text-ink-3">RK {draka.ac} · {draka.hp} TP · {draka.speed}</div>
			</div>
		</a>
	{/if}
</section>

<script lang="ts">
	import { onMount } from 'svelte';
	import { character } from '$lib/stores/character.svelte';
	import { live } from '$lib/stores/live.svelte';
	import { toasts } from '$lib/stores/toast.svelte';
	import { COMPANION_KIND_LABELS, type Companion, type CompanionKind } from '$lib/types';
	import { CREATURE_TEMPLATES } from '$lib/creatures';
	import AttacksCard from '$lib/components/character/AttacksCard.svelte';
	import SpellSlots from '$lib/components/character/SpellSlots.svelte';
	import ConditionChips from '$lib/components/character/ConditionChips.svelte';
	import DeathSaves from '$lib/components/character/DeathSaves.svelte';
	import Swords from '@lucide/svelte/icons/swords';
	import Shield from '@lucide/svelte/icons/shield';
	import Brain from '@lucide/svelte/icons/brain';
	import Plus from '@lucide/svelte/icons/plus';
	import Minus from '@lucide/svelte/icons/minus';
	import Copy from '@lucide/svelte/icons/copy';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import PawPrint from '@lucide/svelte/icons/paw-print';
	import RotateCcw from '@lucide/svelte/icons/rotate-ccw';

	const c = $derived(character.current);

	// ---- Aktions-Ökonomie (pro Runde, flüchtig) ----
	let round = $state(1);
	let used = $state({ action: false, bonus: false, reaction: false, movement: false });
	const ECON = [
		{ key: 'action', label: 'Aktion' },
		{ key: 'bonus', label: 'Bonus' },
		{ key: 'reaction', label: 'Reaktion' },
		{ key: 'movement', label: 'Bewegung' }
	] as const;
	function newRound() {
		round++;
		used = { action: false, bonus: false, reaction: false, movement: false };
	}

	// ---- Trefferpunkte ----
	let dmg = $state(0);
	function applyDamage(sign: 1 | -1) {
		if (!c || !dmg) return;
		const amt = dmg * sign;
		let temp = c.hp.temp;
		let cur = c.hp.current;
		if (amt < 0 && temp > 0) {
			const fromTemp = Math.min(temp, -amt);
			temp -= fromTemp;
			cur += amt + fromTemp;
		} else cur += amt;
		character.patch({ hp: { current: Math.max(0, Math.min(c.hp.max, cur)), temp } });
		dmg = 0;
	}
	const hpRatio = $derived(c ? Math.max(0, Math.min(1, c.hp.current / Math.max(1, c.hp.max))) : 0);
	const hpColor = $derived(hpRatio > 0.5 ? 'var(--color-success)' : hpRatio > 0.25 ? 'var(--color-accent)' : 'var(--color-danger)');

	// ---- Konzentration ----
	let conc = $state(false);
	let concSpell = $state('');
	let concDmg = $state(0);
	const concDC = $derived(Math.max(10, Math.floor((concDmg || 0) / 2)));

	// ---- Reaktionen-Referenz (aus Zauberbuch + Standard) ----
	const reactions = $derived([
		...(c?.spells.filter((s) => /reaktion/i.test(s.castTime)).map((s) => ({ name: s.name, trigger: s.range })) ?? []),
		{ name: 'Gelegenheitsangriff', trigger: 'Feind verlässt deine Reichweite' }
	]);

	// ---- Begleiter / Kreaturen ----
	let companions = $state<Companion[]>([]);
	async function loadComp() {
		const r = await fetch('/api/companions');
		if (r.ok) companions = await r.json();
	}
	onMount(loadComp);
	let lastRev = -1;
	$effect(() => {
		if (live.rev !== lastRev) { lastRev = live.rev; loadComp(); }
	});

	let addOpen = $state(false);
	async function addTemplate(t: (typeof CREATURE_TEMPLATES)[number]) {
		addOpen = false;
		await fetch('/api/companions', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ name: t.name, kind: t.kind, ac: t.ac, hp: { max: t.hpMax, current: t.hpMax }, speed: t.speed, attack: t.attack, note: t.note })
		});
		await loadComp();
	}
	async function addCustom() {
		addOpen = false;
		await fetch('/api/companions', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: 'Neue Kreatur', kind: 'other', ac: 12, hp: { max: 10, current: 10 } }) });
		await loadComp();
	}
	async function compHp(comp: Companion, delta: number) {
		const cur = Math.max(0, Math.min(comp.hp.max, comp.hp.current + delta));
		companions = companions.map((x) => (x.id === comp.id ? { ...x, hp: { ...x.hp, current: cur } } : x));
		await fetch(`/api/companions/${comp.id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ hp: { current: cur } }) });
	}
	async function dup(comp: Companion) {
		await fetch('/api/companions', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: comp.name, kind: comp.kind, ac: comp.ac, hp: { max: comp.hp.max, current: comp.hp.max }, speed: comp.speed, attack: comp.attack, note: comp.note }) });
		await loadComp();
	}
	async function remove(comp: Companion) {
		companions = companions.filter((x) => x.id !== comp.id);
		await fetch(`/api/companions/${comp.id}`, { method: 'DELETE' });
	}
	async function dismissAll() {
		if (!companions.length) return;
		companions = [];
		await fetch('/api/companions', { method: 'DELETE' });
		toasts.push('Alle Kreaturen entlassen', undefined, 'default');
	}

	const KIND_COLOR: Record<CompanionKind, string> = {
		familiar: 'var(--color-success)',
		summon: 'var(--color-primary)',
		undead: '#9aa2ad',
		ally: 'var(--color-accent)',
		other: 'var(--color-muted)'
	};
</script>

<svelte:head><title>Kampf · Omniscient Chronicler</title></svelte:head>

{#if c}
	<div class="mx-auto max-w-6xl">
		<div class="mb-4 flex items-center gap-3">
			<div class="grid h-11 w-11 place-items-center rounded-xl border border-border bg-surface2 text-primary"><Swords size={22} /></div>
			<div>
				<h1 class="font-display text-2xl font-semibold leading-tight">Kampf</h1>
				<p class="text-sm text-muted">Deine Kommandozentrale am Tisch — Werte, Aktionen, Beschwörungen.</p>
			</div>
		</div>

		<!-- ═══ Vitalwerte + Aktions-Ökonomie ═══ -->
		<div class="mb-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
			<!-- HP + Aktionen -->
			<div class="card card-pad">
				<!-- Trefferpunkte -->
				<div class="flex items-baseline justify-between">
					<span class="panel-title">Trefferpunkte</span>
					{#if c.hp.temp > 0}<span class="text-xs" style="color:var(--color-accent)">+{c.hp.temp} temporär</span>{/if}
				</div>
				<div class="mt-1 flex items-end gap-2">
					<span class="font-display text-4xl font-bold tabular-nums" style="color:{hpColor}">{c.hp.current}</span>
					<span class="mb-1 text-lg text-muted">/ {c.hp.max}</span>
				</div>
				<div class="mt-2 h-2.5 overflow-hidden rounded-full bg-surface2">
					<div class="h-full rounded-full transition-all duration-500" style="width:{hpRatio * 100}%;background:{hpColor}"></div>
				</div>
				<div class="mt-3 flex flex-wrap items-center gap-2">
					<button class="btn btn-danger" onclick={() => applyDamage(-1)}>−&nbsp;Schaden</button>
					<input class="input w-20 text-center" type="number" min="0" bind:value={dmg} />
					<button class="btn" style="border-color:color-mix(in oklab,var(--color-success) 45%,transparent);color:var(--color-success)" onclick={() => applyDamage(1)}>Heilen&nbsp;+</button>
					{#if c.hp.current === 0}<div class="ml-auto"><DeathSaves /></div>{/if}
				</div>

				<!-- Aktions-Ökonomie -->
				<div class="mt-5 flex items-center justify-between">
					<span class="panel-title">Runde {round}</span>
					<button class="btn btn-ghost !py-1 text-xs" onclick={newRound}><RotateCcw class="h-3.5 w-3.5" /> Neue Runde</button>
				</div>
				<div class="mt-2 grid grid-cols-4 gap-2">
					{#each ECON as e (e.key)}
						<button
							class="flex flex-col items-center gap-1 rounded-xl border py-2.5 text-xs font-medium transition"
							class:opacity-45={used[e.key]}
							style="border-color:{used[e.key] ? 'var(--color-border)' : 'color-mix(in oklab,var(--color-primary) 40%,transparent)'};background:{used[e.key] ? 'transparent' : 'color-mix(in oklab,var(--color-primary) 10%,transparent)'}"
							onclick={() => (used[e.key] = !used[e.key])}
						>
							<span class="text-base">{used[e.key] ? '○' : '●'}</span>
							{e.label}
						</button>
					{/each}
				</div>
			</div>

			<!-- AC / Konzentration -->
			<div class="grid gap-4">
				<div class="card card-pad flex items-center justify-around text-center">
					<div><Shield class="mx-auto mb-1 h-5 w-5 text-primary" /><div class="font-display text-2xl font-bold">{c.ac}</div><div class="text-[10px] uppercase text-muted">RK</div></div>
					<div class="h-10 w-px bg-border"></div>
					<div><div class="font-display text-2xl font-bold">{c.initiativeBonus >= 0 ? '+' : ''}{c.initiativeBonus}</div><div class="text-[10px] uppercase text-muted">Initiative</div></div>
					<div class="h-10 w-px bg-border"></div>
					<div><div class="font-display text-2xl font-bold">{c.speed}</div><div class="text-[10px] uppercase text-muted">Tempo</div></div>
				</div>
				<div class="card card-pad" style="border-color:{conc ? 'color-mix(in oklab,var(--color-primary) 45%,transparent)' : 'var(--color-border)'}">
					<label class="flex cursor-pointer items-center gap-2">
						<Brain class="h-4 w-4 {conc ? 'text-primary' : 'text-muted'}" />
						<span class="panel-title !m-0 flex-1">Konzentration</span>
						<input type="checkbox" bind:checked={conc} class="h-4 w-4 accent-[var(--color-primary)]" />
					</label>
					{#if conc}
						<input class="input mt-2" placeholder="Worauf? (z.B. Netz)" bind:value={concSpell} />
						<div class="mt-2 flex items-center gap-2 text-sm">
							<span class="text-muted">Schaden erlitten:</span>
							<input class="input w-20 text-center" type="number" min="0" bind:value={concDmg} />
							<span class="ml-auto">CON-Rettung <b style="color:var(--color-accent)">SG {concDC}</b></span>
						</div>
					{/if}
				</div>
			</div>
		</div>

		<!-- ═══ Angriffe/Zauber  +  Kreaturen ═══ -->
		<div class="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
			<!-- Aktionen -->
			<div class="grid gap-4">
				<div class="card card-pad"><span class="panel-title">Angriffe</span><div class="mt-2"><AttacksCard /></div></div>
				<div class="card card-pad"><span class="panel-title">Zauberplätze</span><div class="mt-2"><SpellSlots /></div></div>
				<div class="card card-pad"><span class="panel-title">Zustände</span><div class="mt-2"><ConditionChips /></div></div>
				{#if reactions.length}
					<div class="card card-pad">
						<span class="panel-title">Reaktionen parat</span>
						<ul class="mt-2 grid gap-1.5 text-sm">
							{#each reactions as r (r.name)}
								<li class="flex items-baseline gap-2"><span class="font-medium">{r.name}</span><span class="truncate text-xs text-muted">{r.trigger}</span></li>
							{/each}
						</ul>
					</div>
				{/if}
			</div>

			<!-- Meine Kreaturen -->
			<div class="card card-pad">
				<div class="mb-3 flex items-center gap-2">
					<PawPrint class="h-4 w-4 text-primary" />
					<span class="panel-title !m-0 flex-1">Meine Kreaturen ({companions.length})</span>
					{#if companions.length}<button class="btn btn-ghost !py-1 text-xs" onclick={dismissAll}>Alle entlassen</button>{/if}
					<div class="relative">
						<button class="btn btn-primary !py-1.5" onclick={() => (addOpen = !addOpen)}><Plus class="h-4 w-4" /> Beschwören</button>
						{#if addOpen}
							<div class="absolute right-0 z-20 mt-1 w-64 rounded-xl border border-border bg-surface p-1.5 shadow-xl">
								{#each CREATURE_TEMPLATES as t (t.name)}
									<button class="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm hover:bg-surface2" onclick={() => addTemplate(t)}>
										<span class="h-2 w-2 shrink-0 rounded-full" style="background:{KIND_COLOR[t.kind]}"></span>
										<span class="flex-1">{t.name}</span>
										<span class="text-xs text-muted">{t.hpMax} TP</span>
									</button>
								{/each}
								<button class="mt-1 w-full rounded-lg border-t border-border px-2.5 py-1.5 text-left text-sm text-muted hover:bg-surface2" onclick={addCustom}>+ Eigene Kreatur…</button>
							</div>
						{/if}
					</div>
				</div>

				{#if !companions.length}
					<p class="py-6 text-center text-sm text-muted">Keine aktiven Kreaturen. Beschwöre deinen Vertrauten, Skelette oder eigene Kreaturen — jede mit eigenem TP-Tracker.</p>
				{:else}
					<div class="grid gap-2.5">
						{#each companions as comp (comp.id)}
							{@const r = Math.max(0, Math.min(1, comp.hp.current / Math.max(1, comp.hp.max)))}
							<div class="rounded-xl border border-border p-3" style="border-left:3px solid {KIND_COLOR[comp.kind]}" class:opacity-50={comp.hp.current === 0}>
								<div class="flex items-center gap-2">
									<span class="min-w-0 flex-1 truncate font-medium">{comp.name}</span>
									<span class="chip text-[10px]">{COMPANION_KIND_LABELS[comp.kind]}</span>
									<span class="text-xs text-muted">RK {comp.ac}</span>
									<button class="btn btn-icon btn-ghost h-7 w-7" title="Duplizieren" onclick={() => dup(comp)}><Copy class="h-3.5 w-3.5" /></button>
									<button class="btn btn-icon btn-ghost h-7 w-7" title="Entlassen" onclick={() => remove(comp)}><Trash2 class="h-3.5 w-3.5" /></button>
								</div>
								<div class="mt-2 flex items-center gap-2">
									<button class="btn btn-icon h-8 w-8 !border-danger/40" onclick={() => compHp(comp, -1)}><Minus class="h-4 w-4" /></button>
									<div class="flex-1">
										<div class="flex justify-between text-xs tabular-nums"><span>{comp.hp.current} / {comp.hp.max} TP</span></div>
										<div class="mt-0.5 h-2 overflow-hidden rounded-full bg-surface2"><div class="h-full rounded-full" style="width:{r * 100}%;background:{KIND_COLOR[comp.kind]}"></div></div>
									</div>
									<button class="btn btn-icon h-8 w-8" style="border-color:color-mix(in oklab,var(--color-success) 40%,transparent)" onclick={() => compHp(comp, 1)}><Plus class="h-4 w-4" /></button>
								</div>
								{#if comp.attack || comp.speed || comp.note}
									<p class="mt-1.5 text-xs text-muted">
										{#if comp.speed}{comp.speed}{/if}{#if comp.attack} · {comp.attack}{/if}
										{#if comp.note}<br />{comp.note}{/if}
									</p>
								{/if}
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</div>
{:else}
	<div class="grid min-h-[60vh] place-items-center text-muted"><span class="animate-pulse font-display text-lg">Bereite den Kampf vor…</span></div>
{/if}

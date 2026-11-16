<script lang="ts">
	/**
	 * Kampfmodus für Valerius: Runde, was im eigenen Zug verbraucht ist, Bewegung in Feldern, laufende Effekte.
	 * Bewusst ohne Gegner und ohne Initiative-Liste: Die führt der DM.
	 */
	import { Swords, SkipForward, Flag, Zap, Sparkles, Shield, ShieldHalf, Footprints, X, Plus, ArrowUp, Skull, Info } from '@lucide/svelte';
	import CastButton from '../CastButton.svelte';
	import Markdown from '../Markdown.svelte';
	import { campaign } from '$lib/stores/campaign.svelte';
	import { rolls } from '$lib/stores/rolls.svelte';
	import { addEffect, endCombat, markUsed, moveBudget, nextTurn, removeEffect, setCover, setMove, standUp, startCombat, toggleDash, toggleEconomy } from '$lib/game';
	import { COVER, armorClass, castable, coverBonus, currentSpeed, fmtMod, initiative, saveBonus, slotsLeft } from '$lib/rules';
	import { ruleHref } from '$lib/rulebook';
	import type { CoverLevel } from '$lib/types';

	const COVER_LEVELS = Object.keys(COVER) as CoverLevel[];

	let { showIdle = true }: { showIdle?: boolean } = $props();

	const c = $derived(campaign.data.character);
	const s = $derived(campaign.data.state);
	const combat = $derived(s.combat);
	const speed = $derived(currentSpeed(c, s));
	const budget = $derived(combat ? moveBudget() : c.speed);
	const squares = $derived(Math.round(budget / 1.5));
	const usedSquares = $derived(combat ? Math.round(combat.used.move / 1.5) : 0);
	const reactions = $derived(campaign.data.spells.filter((sp) => castable(sp) && sp.economy === 'reaktion' && sp.prepared));
	const bonusSpells = $derived(campaign.data.spells.filter((sp) => castable(sp) && sp.economy === 'bonus' && (sp.level === 0 || sp.prepared)));
	const m = (n: number) => String(n).replace('.', ',');

	const ECON = [
		{ key: 'action', label: 'Aktion', icon: Zap },
		{ key: 'bonus', label: 'Bonusaktion', icon: Sparkles },
		{ key: 'reaction', label: 'Reaktion', icon: Shield }
	] as const;

	function begin() {
		startCombat();
		rolls.check('Initiative', initiative(c));
	}

	function clickSquare(i: number) {
		if (!combat) return;
		// Klick auf das letzte verbrauchte Feld nimmt es zurück
		setMove(i + 1 === usedSquares ? i * 1.5 : (i + 1) * 1.5);
	}

	function rounds(n: number): string {
		if (n < 10) return `${n} ${n === 1 ? 'Runde' : 'Runden'}`;
		if (n < 600) return `${Math.ceil(n / 10)} Min.`;
		return `${Math.round((n / 600) * 10) / 10} Std.`.replace('.', ',');
	}

	let fxName = $state('');
	let fxRounds = $state('10');
	function submitEffect(e: SubmitEvent) {
		e.preventDefault();
		addEffect(fxName, fxRounds === 'offen' ? null : Number(fxRounds));
		fxName = '';
	}

	function commandUndead() {
		markUsed('bonus');
		rolls.event('Untote befehligt', `${s.minions.length} in 18 m · Bonusaktion verbraucht`, 'info');
	}

	// Hinweise, die sich aus Regeln und Spielstand ergeben
	const hints = $derived.by(() => {
		const out: { text: string; tone: 'warn' | 'info' | 'bad'; action?: { label: string; run: () => void } }[] = [];
		if (!combat) return out;
		if (s.hp === 0) out.push({ text: 'Du bist auf 0 TP: Zu Beginn deines Zuges ein Todesrettungswurf.', tone: 'bad' });
		if (speed.why) out.push({ text: speed.why, tone: 'bad' });
		if (s.conditions.includes('liegend') && speed.speed > 0)
			out.push({ text: `Liegend: Aufstehen kostet ${m(c.speed / 2)} m, Kriechen kostet doppelt. Nahkampfangriffe gegen dich haben Vorteil.`, tone: 'warn', action: { label: 'Aufstehen', run: standUp } });
		if (combat.used.bonusSpell) out.push({ text: 'Zauber als Bonusaktion gewirkt: In diesem Zug geht nur noch ein Zaubertrick mit Zeitaufwand 1 Aktion.', tone: 'warn' });
		else if (combat.used.leveledSpell && bonusSpells.length) out.push({ text: 'Zauber mit Grad als Aktion gewirkt: In diesem Zug geht kein Zauber als Bonusaktion mehr.', tone: 'warn' });
		if (s.minions.length && !combat.used.bonus)
			out.push({ text: `${s.minions.length} Untote warten auf einen Befehl (Bonusaktion, alle in 18 m). Ohne Befehl verteidigen sie sich nur.`, tone: 'info', action: { label: 'Befehl geben', run: commandUndead } });
		return out;
	});
</script>

{#if combat}
	<section class="panel panel-glow @container relative overflow-hidden p-5" aria-label="Kampf">
		<div class="pointer-events-none absolute -top-20 -right-16 h-56 w-56 rounded-full bg-blood/15 blur-3xl"></div>

		<div class="relative flex flex-wrap items-center gap-4">
			{#key combat.round}
				<div class="round-seal grid h-[68px] w-[68px] shrink-0 place-items-center rounded-full" title="Runde {combat.round}">
					<div class="text-center leading-none">
						<div class="num text-[1.9rem] font-semibold text-gold">{combat.round}</div>
						<div class="font-caps text-[0.55rem] tracking-[0.2em] text-ink-3 uppercase">Runde</div>
					</div>
				</div>
			{/key}
			<div class="min-w-0 flex-1">
				<div class="eyebrow flex items-center gap-1.5"><Swords size={12} />Kampf läuft</div>
				<div class="mt-1 text-sm text-ink-2">
					{(combat.round - 1) * 6} Sekunden vergangen · Initiative <button class="num text-ink hover:text-astral" onclick={() => rolls.check('Initiative', initiative(c))} title="Initiative würfeln">{fmtMod(initiative(c))}</button>
				</div>
			</div>
			<div class="flex flex-wrap gap-2">
				<button class="btn btn-gold" onclick={nextTurn} title="Dein nächster Zug: Aktionen zurück, Effekte zählen herunter"><SkipForward size={15} />Nächster Zug</button>
				<button class="btn btn-ghost" onclick={endCombat}><Flag size={15} />Beenden</button>
			</div>
		</div>

		<div class="relative mt-4 grid gap-4 @4xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
			<!-- Aktionsarten -->
			<div class="grid grid-cols-3 gap-2">
				{#each ECON as e (e.key)}
					{@const used = combat.used[e.key]}
					<button
						class="econ group flex flex-col items-center gap-1 rounded-2xl border px-2 py-3 transition {used
							? 'border-line bg-black/20 text-ink-3'
							: 'border-life/35 bg-life/[0.07] text-ink hover:border-life/60'}"
						aria-pressed={used}
						onclick={() => toggleEconomy(e.key)}
						title={used ? 'Verbraucht · Klicken gibt sie zurück' : 'Frei · Klicken markiert sie als verbraucht'}
					>
						<e.icon size={18} class={used ? 'text-ink-3' : 'text-life'} />
						<span class="text-sm font-medium {used ? 'line-through decoration-ink-3/60' : ''}">{e.label}</span>
						<span class="text-[0.65rem] tracking-wide uppercase {used ? 'text-ink-3' : 'text-life'}">{used ? 'verbraucht' : 'frei'}</span>
					</button>
				{/each}
			</div>

			<!-- Bewegung -->
			<div class="rounded-2xl border border-line bg-white/[0.02] p-3">
				<div class="flex items-center justify-between gap-2 text-xs">
					<span class="flex items-center gap-1.5 text-ink-2"><Footprints size={14} />Bewegung</span>
					<span class="num text-ink-2"><b class="text-ink">{m(Math.max(0, budget - combat.used.move))} m</b> übrig von {m(budget)} m</span>
				</div>
				{#if squares > 0}
					<div class="mt-2 grid gap-1" style="grid-template-columns: repeat({squares}, minmax(0, 1fr))" role="group" aria-label="Bewegung in Feldern zu 1,5 m">
						{#each Array.from({ length: squares }, (_, i) => i) as i (i)}
							<button
								class="h-7 rounded-md border transition {i < usedSquares
									? 'border-astral/50 bg-astral/25'
									: i >= squares / (combat.used.dash ? 2 : 1)
										? 'border-dashed border-warn/40 bg-warn/[0.05] hover:bg-warn/15'
										: 'border-line-2 bg-white/[0.03] hover:bg-white/[0.08]'}"
								onclick={() => clickSquare(i)}
								aria-label="{m((i + 1) * 1.5)} m"
								title="{m((i + 1) * 1.5)} m"
							></button>
						{/each}
					</div>
				{:else}
					<p class="mt-2 text-xs text-blood">Du kannst dich gerade nicht bewegen.</p>
				{/if}
				<div class="mt-2 flex flex-wrap items-center gap-1.5">
					<button class="btn btn-xs" onclick={() => setMove(combat.used.move - 1.5)} disabled={combat.used.move <= 0}>−1,5 m</button>
					<button class="btn btn-xs" onclick={() => setMove(combat.used.move + 1.5)} disabled={combat.used.move >= budget}>+1,5 m</button>
					<button class="btn btn-xs" onclick={() => setMove(combat.used.move + 3)} disabled={combat.used.move >= budget}>+3 m</button>
					<button class="chip !h-7 {combat.used.dash ? 'chip-on' : ''}" onclick={toggleDash} title="Spurt (Aktion): deine Bewegungsrate ein zweites Mal" disabled={speed.speed === 0}>Spurt</button>
					<a class="ml-auto text-[0.68rem] text-ink-3 hover:text-ink" href={ruleHref('kampf', 'bewegung-und-position')} data-ref="rule:kampf/bewegung-und-position">Regeln zur Bewegung →</a>
				</div>
			</div>
		</div>

		<!-- Deckung: wechselt mit der Position, darum von Hand -->
		<div class="relative mt-3 rounded-2xl border p-3 transition {combat.cover ? 'border-astral-2/45 bg-astral-2/[0.06]' : 'border-line bg-white/[0.02]'}">
			<div class="flex flex-wrap items-center gap-2">
				<span class="flex items-center gap-1.5 text-xs text-ink-2"><ShieldHalf size={14} class={combat.cover ? 'text-astral-2' : ''} />Deckung</span>
				<div class="flex flex-wrap gap-1.5" role="group" aria-label="Deckung wählen">
					<button class="chip !h-8 {!combat.cover ? 'chip-on' : ''}" aria-pressed={!combat.cover} onclick={() => setCover(null)}>Keine</button>
					{#each COVER_LEVELS as lv (lv)}
						<button class="chip !h-8 {combat.cover === lv ? 'chip-on' : ''}" aria-pressed={combat.cover === lv} onclick={() => setCover(lv)} title={COVER[lv].text}>{COVER[lv].short}</button>
					{/each}
				</div>
				<span class="num ml-auto text-xs text-ink-2">RK <b class="text-ink">{armorClass(c, s)}</b> · GE-Rettung <b class="text-ink">{fmtMod(saveBonus(c, 'dex') + coverBonus(s))}</b></span>
			</div>
			<p class="mt-1.5 text-[0.7rem] leading-snug text-ink-3">
				{combat.cover ? COVER[combat.cover].text : 'Steht ein Skelett oder Gefährte zwischen dir und dem Angreifer, hast du halbe Deckung (+2). Die beste Deckung zählt, sie addiert sich nicht.'}
				<a class="ml-1 whitespace-nowrap hover:text-ink" href={ruleHref('angriffe', 'deckung')} data-ref="rule:angriffe/deckung">Regel →</a>
			</p>
		</div>

		<!-- Reaktion bereit -->
		{#if reactions.length}
			<div class="relative mt-3 flex flex-wrap items-center gap-2 text-xs">
				<span class="text-ink-3">{combat.used.reaction ? 'Reaktion verbraucht, zurück zu Beginn deines Zuges.' : 'Reaktion bereit:'}</span>
				{#if !combat.used.reaction}
					{#each reactions as sp (sp.id)}
						<span class="inline-flex items-center gap-1.5 rounded-xl border border-line bg-white/[0.02] py-1 pr-1 pl-2.5">
							<span class="font-medium text-ink-2">{sp.name}</span>
							{#if sp.trigger}<span class="hidden text-ink-3 @3xl:inline">· <Markdown src={sp.trigger} inline /></span>{/if}
							<CastButton spell={sp} size="xs" />
						</span>
					{/each}
					{#if slotsLeft(c, s, 1) === 0 && reactions.some((r) => r.id === 'schild')}<span class="text-warn">Kein Grad-1-Platz mehr für Schild.</span>{/if}
				{/if}
			</div>
		{/if}

		{#if hints.length}
			<ul class="relative mt-3 space-y-1.5">
				{#each hints as h (h.text)}
					<li class="flex flex-wrap items-center gap-2 rounded-xl border px-3 py-2 text-xs {h.tone === 'bad' ? 'border-blood/35 bg-blood/[0.07] text-ink' : h.tone === 'warn' ? 'border-warn/35 bg-warn/[0.06] text-ink' : 'border-line bg-white/[0.02] text-ink-2'}">
						{#if h.tone === 'bad'}<Skull size={13} class="shrink-0 text-blood" />{:else}<Info size={13} class="shrink-0 {h.tone === 'warn' ? 'text-warn' : 'text-astral'}" />{/if}
						<span class="min-w-0 flex-1">{h.text}</span>
						{#if h.action}<button class="btn btn-xs" onclick={h.action.run}>{#if h.action.label === 'Aufstehen'}<ArrowUp size={11} />{/if}{h.action.label}</button>{/if}
					</li>
				{/each}
			</ul>
		{/if}

		<!-- Laufende Effekte -->
		<div class="relative mt-4">
			<div class="eyebrow mb-2">Laufende Effekte</div>
			{#if combat.effects.length}
				<ul class="grid gap-1.5 @2xl:grid-cols-2">
					{#each combat.effects as e (e.id)}
						{@const left = e.until === null ? null : e.until - combat.round}
						<li class="flex items-center gap-3 rounded-xl border border-line bg-white/[0.02] py-2 pr-1.5 pl-3">
							<div class="min-w-0 flex-1">
								<div class="flex items-center gap-2">
									<span class="truncate text-sm font-medium">{e.name}</span>
									{#if e.note}<span class="badge !h-[1.1rem] !text-[0.6rem]" style="--c: {e.note === 'Konzentration' ? 'var(--color-warn)' : 'var(--color-astral)'}">{e.note}</span>{/if}
								</div>
								<div class="mt-1 flex items-center gap-2 text-[0.7rem] text-ink-3">
									{#if left === null}
										<span>läuft, bis du ihn beendest</span>
									{:else}
										<span class="num">noch {rounds(left)}</span>
										{#if left <= 10}
											<span class="flex gap-0.5" aria-hidden="true">
												{#each Array.from({ length: left }, (_, i) => i) as i (i)}<span class="h-1.5 w-1.5 rounded-full {left <= 1 ? 'bg-warn' : 'bg-astral/70'}"></span>{/each}
											</span>
										{/if}
										<span class="text-ink-3/70">· endet zu Beginn von Runde {e.until}</span>
									{/if}
								</div>
							</div>
							<button class="icon-btn" onclick={() => removeEffect(e.id)} aria-label="{e.name} beenden" title="Beenden"><X size={14} /></button>
						</li>
					{/each}
				</ul>
			{:else}
				<p class="text-xs text-ink-3">Keine. Zauber mit Wirkungsdauer erscheinen hier, sobald du sie wirkst.</p>
			{/if}
			<form class="mt-2 flex flex-wrap gap-2" onsubmit={submitEffect}>
				<input class="input !h-8 min-w-0 flex-1 text-xs" bind:value={fxName} placeholder="Eigener Effekt, z. B. Vergiftet oder Segen" aria-label="Name des Effekts" />
				<select class="input !h-8 !w-auto text-xs" bind:value={fxRounds} aria-label="Dauer">
					<option value="1">1 Runde</option>
					<option value="10">1 Minute</option>
					<option value="100">10 Minuten</option>
					<option value="600">1 Stunde</option>
					<option value="offen">bis beendet</option>
				</select>
				<button class="btn btn-sm" disabled={!fxName.trim()}><Plus size={13} />Effekt</button>
			</form>
		</div>
	</section>
{:else if showIdle}
	<section class="panel panel-ornate relative overflow-hidden p-6">
		<div class="pointer-events-none absolute -top-24 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-blood/10 blur-3xl"></div>
		<div class="relative flex flex-col items-center gap-3 text-center">
			<Swords size={28} class="text-gold" />
			<h2 class="title-display title-astral text-[2rem] leading-none">Bereit für den Kampf?</h2>
			<p class="max-w-md text-sm text-ink-2">
				Zählt Runden, Aktion, Bonusaktion, Reaktion und Bewegung mit und lässt Zauber nach ihrer Wirkungsdauer auslaufen. Die Initiative wird beim Start gewürfelt.
			</p>
			<button class="btn btn-gold mt-1" onclick={begin}><Swords size={15} />Kampf beginnen · Initiative {fmtMod(initiative(c))}</button>
			<ul class="mt-2 flex flex-wrap justify-center gap-2 text-xs">
				<li class="badge" style="--c: {slotsLeft(c, s, 1) > 0 ? 'var(--color-life)' : 'var(--color-blood)'}">Grad 1 frei: {slotsLeft(c, s, 1)} (Schild)</li>
				<li class="badge" style="--c: {s.concentration ? 'var(--color-warn)' : 'var(--color-ink-3)'}">Konzentration: {s.concentration?.name ?? 'frei'}</li>
				<li class="badge" style="--c: var(--color-s-nekro)">Untote: {s.minions.length}</li>
				<li class="badge" style="--c: var(--color-astral)">Vertrauter: {s.familiar.present ? s.familiar.form : 'nicht da'}</li>
			</ul>
		</div>
	</section>
{/if}

<style>
	.round-seal {
		border: 1px solid color-mix(in oklab, var(--color-gold) 55%, transparent);
		background: radial-gradient(circle at 50% 35%, color-mix(in oklab, var(--color-gold) 18%, transparent), transparent 70%);
		box-shadow:
			0 0 0 4px color-mix(in oklab, var(--color-gold) 8%, transparent),
			0 0 28px color-mix(in oklab, var(--color-gold) 22%, transparent);
		animation: seal-pop 0.5s cubic-bezier(0.2, 0.9, 0.3, 1.3);
	}
	@keyframes seal-pop {
		from {
			transform: scale(0.7) rotate(-20deg);
			opacity: 0.4;
		}
	}
	.econ:active {
		transform: scale(0.97);
	}
	@media (prefers-reduced-motion: reduce) {
		.round-seal {
			animation: none;
		}
	}
</style>

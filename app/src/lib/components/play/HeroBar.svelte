<script lang="ts">
	import { Coffee, Moon, Star, Shield, Eye, Footprints, Swords, Target, Sparkles, Zap } from '@lucide/svelte';
	import { campaign } from '$lib/stores/campaign.svelte';
	import { rolls } from '$lib/stores/rolls.svelte';
	import { ui } from '$lib/stores/ui.svelte';
	import { armorClass, fmtMod, initiative, passivePerception, spellAttack, spellDc } from '$lib/rules';

	const c = $derived(campaign.data.character);
	const s = $derived(campaign.data.state);

	function toggleShield() {
		campaign.change('state', (st) => (st.shield = !st.shield));
	}
	function toggleInspiration() {
		campaign.change('state', (st) => (st.inspiration = !st.inspiration));
	}

	const stats = $derived([
		{ label: 'Initiative', value: fmtMod(initiative(c)), icon: Zap, onclick: () => rolls.check('Initiative', initiative(c)), hint: 'Klicken = würfeln' },
		{ label: 'Bewegung', value: `${c.speed} m`, icon: Footprints, hint: '30 Fuß' },
		{ label: 'Übungsbonus', value: fmtMod(c.proficiencyBonus), icon: Star, hint: 'Übungsbonus' },
		{ label: 'Zauber-SG', value: String(spellDc(c)), icon: Target, hint: '8 + ÜB + IN' },
		{ label: 'Zauberangriff', value: fmtMod(spellAttack(c)), icon: Sparkles, onclick: () => rolls.check('Zauberangriff', spellAttack(c)), hint: 'Klicken = würfeln' },
		{ label: 'Pass. Wahrnehmung', value: String(passivePerception(c, s)), icon: Eye, hint: '10 + Wahrnehmung' },
		{ label: 'Dunkelsicht', value: `${c.darkvision} m`, icon: Moon, hint: '60 Fuß' }
	]);
</script>

<section class="panel panel-glow overflow-hidden p-5">
	<div class="pointer-events-none absolute -top-24 -left-16 h-64 w-64 rounded-full bg-astral/20 blur-3xl"></div>

	<div class="relative flex flex-wrap items-center gap-x-6 gap-y-4">
		<div class="flex min-w-0 flex-1 items-center gap-4">
			<div class="relative shrink-0">
				<div class="absolute inset-0 rounded-full bg-gold/30 blur-xl"></div>
				<img src="/api/assets/{c.portrait}" alt="Valerius als Floshem" class="relative h-[88px] w-[88px] rounded-full" />
			</div>
			<div class="min-w-0">
				<h1 class="title-display truncate text-[2.5rem] leading-none">{c.name}</h1>
				<div class="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-ink-2">
					<span class="italic">„{c.alias}“, {c.aliasTitle}</span>
					<span class="badge" style="--c: var(--color-blood)">Tarnung aufgeflogen</span>
				</div>
				<div class="mt-1 text-sm text-ink-3">{c.race} · {c.className} {c.level} · {c.subclass} · {c.alignment}</div>
			</div>
		</div>

		<div class="flex flex-wrap items-center gap-2">
			<button class="chip {s.inspiration ? 'chip-on' : ''}" onclick={toggleInspiration}><Star size={13} />Inspiration{s.inspiration ? ' ✓' : ''}</button>
			{#if s.trance.tool}
				<button class="chip" onclick={() => (ui.rest = 'lang')} title="Astrale Trance (bis zur nächsten langen Rast)">✦ {s.trance.tool}</button>
			{:else}
				<button class="chip !border-warn/40 !text-warn" onclick={() => (ui.rest = 'lang')} title="Nach der Trance eine Waffe oder ein Werkzeug wählen">✦ Trance-Übung wählen</button>
			{/if}
			<button class="btn btn-sm" onclick={() => (ui.rest = 'kurz')}><Coffee size={14} />Kurze Rast</button>
			<button class="btn btn-sm" onclick={() => (ui.rest = 'lang')}><Moon size={14} />Lange Rast</button>
			<a class="btn btn-sm btn-ghost" href="/bogen"><Swords size={14} />Bogen</a>
		</div>
	</div>

	<div class="relative mt-5 grid grid-cols-4 gap-2 md:grid-cols-8">
		<button
			class="flex flex-col items-center justify-center rounded-2xl border px-2 py-2.5 transition {s.shield
				? 'border-astral-2/60 bg-astral-2/10'
				: 'border-line-2 bg-white/[0.03] hover:border-white/20'}"
			onclick={toggleShield}
			title="Klicken: Schild an/aus (+5 RK bis zu deinem nächsten Zug)"
		>
			<Shield size={15} class={s.shield ? 'text-astral-2' : 'text-ink-3'} />
			<span class="num mt-0.5 text-[1.7rem] leading-tight font-semibold">{armorClass(c, s)}</span>
			<span class="text-center text-[0.65rem] leading-tight text-ink-3">{s.shield ? 'RK mit Schild' : 'Rüstungsklasse'}</span>
		</button>
		{#each stats as st (st.label)}
			<svelte:element
				this={st.onclick ? 'button' : 'div'}
				role={st.onclick ? undefined : 'group'}
				class="flex flex-col items-center justify-center rounded-2xl border px-2 py-2.5 transition {st.onclick
					? 'border-line-2 bg-white/[0.03] hover:border-astral/40'
					: 'border-line bg-white/[0.015]'}"
				onclick={st.onclick}
				title={st.hint}
			>
				<st.icon size={15} class="text-ink-3" />
				<span class="num mt-0.5 text-[1.7rem] leading-tight font-semibold">{st.value}</span>
				<span class="text-center text-[0.65rem] leading-tight text-ink-3">{st.label}</span>
			</svelte:element>
		{/each}
	</div>
</section>

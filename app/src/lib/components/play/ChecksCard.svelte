<script lang="ts">
	/** Rettungswürfe und Fertigkeiten – Klick würfelt (Vorteil/Nachteil über die Würfelschale). */
	import { campaign } from '$lib/stores/campaign.svelte';
	import { rolls } from '$lib/stores/rolls.svelte';
	import { ABILITIES, ABILITY_SHORT, SKILLS, abilityMod, fmtMod, saveBonus, skillBonus, skillProficient } from '$lib/rules';

	const c = $derived(campaign.data.character);
	const s = $derived(campaign.data.state);
	const passives = $derived([
		{ name: 'Wahrnehmung', en: 'Perception', v: 10 + skillBonus(c, s, 'perception') },
		{ name: 'Menschenkenntnis', en: 'Insight', v: 10 + skillBonus(c, s, 'insight') },
		{ name: 'Nachforschung', en: 'Investigation', v: 10 + skillBonus(c, s, 'investigation') }
	]);
</script>

<section class="panel p-5">
	<div class="mb-3 flex items-center justify-between">
		<div class="eyebrow">Rettungswürfe · Saving Throws</div>
		<span class="text-[0.7rem] text-ink-3">Klick = würfeln</span>
	</div>
	<div class="grid grid-cols-3 gap-1.5">
		{#each ABILITIES as a (a.key)}
			{@const prof = c.saves.includes(a.key)}
			<button
				class="rounded-xl border px-2 py-1.5 text-left transition {prof ? 'border-astral/35 bg-astral/[0.08]' : 'border-line bg-white/[0.02]'} hover:border-white/20"
				onclick={() => rolls.check(`Rettungswurf ${a.name} (${a.enShort} Save)`, saveBonus(c, a.key))}
				title="{a.name} ({a.en}): Wert {c.abilities[a.key]} ({fmtMod(abilityMod(c, a.key))}){prof ? ', geübt' : ''}"
			>
				<div class="flex items-center justify-between">
					<span class="text-[0.7rem] font-semibold text-ink-3">{a.short} <span class="font-normal opacity-70">{a.enShort}</span></span>
					{#if prof}<span class="h-1.5 w-1.5 rounded-full bg-astral"></span>{/if}
				</div>
				<div class="num text-lg font-semibold">{fmtMod(saveBonus(c, a.key))}</div>
			</button>
		{/each}
	</div>

	<div class="mt-4 mb-2 flex items-center justify-between">
		<div class="eyebrow">Fertigkeiten · Skills</div>
		<span class="flex items-center gap-3 text-[0.65rem] text-ink-3">
			<span class="flex items-center gap-1"><span class="h-1.5 w-1.5 rounded-full bg-astral"></span>geübt</span>
		</span>
	</div>
	<ul class="grid grid-cols-1 gap-x-4 sm:grid-cols-2 lg:grid-cols-1">
		{#each SKILLS as k (k.key)}
			{@const prof = skillProficient(c, s, k.key)}
			{@const b = skillBonus(c, s, k.key)}
			<li>
				<button
					class="flex w-full items-center gap-2 rounded-lg px-1.5 py-[3px] text-left text-[0.83rem] transition hover:bg-white/[0.05]"
					onclick={() => rolls.check(`${k.name} (${k.en})`, b)}
					title={prof === 'fest' ? `Geübt: ${c.skills[k.key]}` : 'Ungeübt'}
				>
					<span class="w-2.5 text-center">
						{#if prof === 'fest'}<span class="inline-block h-1.5 w-1.5 rounded-full bg-astral"></span>{:else}<span class="inline-block h-1.5 w-1.5 rounded-full border border-white/20"></span>{/if}
					</span>
					<span class="flex-1 truncate {prof ? 'text-ink' : 'text-ink-2'}">{k.name} <span class="text-[0.7rem] text-ink-3">{k.en}</span></span>
					<span class="text-[0.65rem] text-ink-3">{ABILITY_SHORT[k.ability]}</span>
					<span class="num w-8 text-right font-medium {prof ? 'text-ink' : 'text-ink-2'}">{fmtMod(b)}</span>
				</button>
			</li>
		{/each}
	</ul>

	<div class="mt-3 grid grid-cols-3 gap-1.5 border-t border-line pt-3 text-center">
		{#each passives as p (p.name)}
			<div title="Passive {p.en}">
				<div class="num text-lg font-semibold">{p.v}</div>
				<div class="text-[0.62rem] text-ink-3">passiv · {p.name}</div>
				<div class="text-[0.58rem] text-ink-3 opacity-70">Passive {p.en}</div>
			</div>
		{/each}
	</div>
</section>

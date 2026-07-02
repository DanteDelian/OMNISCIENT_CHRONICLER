<script lang="ts">
	import { character } from '$lib/stores/character.svelte';
	import {
		ABILITY_KEYS,
		ABILITY_LABELS,
		SKILLS,
		abilityMod,
		fmtMod,
		type AbilityKey,
		type ProfLevel
	} from '$lib/types';
	import { performCheck } from '$lib/rolls';
	import Eye from '@lucide/svelte/icons/eye';
	import Star from '@lucide/svelte/icons/star';

	const c = $derived(character.current);

	function saveBonus(k: AbilityKey): number {
		if (!c) return 0;
		return abilityMod(c.abilities[k]) + (c.saveProficiencies.includes(k) ? c.proficiencyBonus : 0);
	}

	function toggleSave(k: AbilityKey) {
		if (!c) return;
		const cur = c.saveProficiencies;
		character.patch({
			saveProficiencies: cur.includes(k) ? cur.filter((x) => x !== k) : [...cur, k]
		});
	}

	function skillLevel(key: string): ProfLevel {
		return (c?.skills[key] ?? 0) as ProfLevel;
	}

	function skillBonus(key: string, ability: AbilityKey): number {
		if (!c) return 0;
		return abilityMod(c.abilities[ability]) + skillLevel(key) * c.proficiencyBonus;
	}

	function cycleSkill(key: string) {
		if (!c) return;
		const next = ((skillLevel(key) + 1) % 3) as ProfLevel;
		character.patch({ skills: { ...c.skills, [key]: next } });
	}

	function roll(label: string, bonus: number) {
		performCheck(label, bonus);
	}

	const passivePerception = $derived(c ? 10 + skillBonus('perception', 'wis') : 10);
</script>

{#if c}
	<!-- Rettungswürfe -->
	<div class="mb-1 flex items-center justify-between">
		<span class="text-xs font-semibold uppercase tracking-wide text-muted">Rettungswürfe</span>
		<span class="text-[10px] text-muted">Punkt = geübt · Wert antippen würfelt</span>
	</div>
	<div class="grid grid-cols-3 gap-1.5 sm:grid-cols-6">
		{#each ABILITY_KEYS as k (k)}
			{@const prof = c.saveProficiencies.includes(k)}
			<div class="stat-tile gap-0.5 !p-2">
				<button
					class="flex items-center gap-1 text-[10px] uppercase tracking-wide {prof
						? 'text-primary'
						: 'text-muted'}"
					onclick={() => toggleSave(k)}
					title="Übung umschalten"
				>
					<span
						class="h-2 w-2 rounded-full border {prof
							? 'border-primary bg-primary'
							: 'border-muted'}"
					></span>
					{ABILITY_LABELS[k].slice(0, 3)}
				</button>
				<button
					class="font-display text-lg font-bold leading-none transition hover:text-primary"
					onclick={() => roll(`${ABILITY_LABELS[k]}-Rettungswurf`, saveBonus(k))}
				>
					{fmtMod(saveBonus(k))}
				</button>
			</div>
		{/each}
	</div>

	<!-- Fertigkeiten -->
	<div class="mt-4 mb-1 flex items-center justify-between">
		<span class="text-xs font-semibold uppercase tracking-wide text-muted">Fertigkeiten</span>
		<span
			class="chip gap-1 !py-0.5"
			title="Passive Wahrnehmung = 10 + Wahrnehmungs-Bonus"
		>
			<Eye class="h-3.5 w-3.5 text-primary" /> Passiv {passivePerception}
		</span>
	</div>
	<div class="grid gap-x-4 sm:grid-cols-2">
		{#each SKILLS as s (s.key)}
			{@const lvl = skillLevel(s.key)}
			<div class="flex min-h-11 items-center justify-between gap-2 border-b border-border/50 py-1.5">
				<button
					class="flex min-w-0 items-center gap-2 text-left text-sm"
					onclick={() => cycleSkill(s.key)}
					title="Übungsgrad ändern (keine → geübt → Expertise)"
				>
					{#if lvl === 2}
						<Star class="h-3.5 w-3.5 shrink-0 fill-current text-accent" />
					{:else}
						<span
							class="h-3 w-3 shrink-0 rounded-full border-2 {lvl === 1
								? 'border-primary bg-primary'
								: 'border-muted'}"
						></span>
					{/if}
					<span class="truncate {lvl ? 'font-medium' : 'text-muted'}">{s.label}</span>
					<span class="shrink-0 text-[10px] uppercase text-muted">{s.ability}</span>
				</button>
				<button
					class="shrink-0 font-display text-sm font-bold tabular-nums transition hover:text-primary"
					onclick={() => roll(s.label, skillBonus(s.key, s.ability))}
				>
					{fmtMod(skillBonus(s.key, s.ability))}
				</button>
			</div>
		{/each}
	</div>
{/if}

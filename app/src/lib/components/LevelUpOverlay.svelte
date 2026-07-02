<script lang="ts">
	import { fade, scale } from 'svelte/transition';
	import { fx } from '$lib/stores/fx.svelte';
	import { character } from '$lib/stores/character.svelte';
	import { toasts } from '$lib/stores/toast.svelte';
	import { profBonusForLevel } from '$lib/types';
	import { sound } from '$lib/sound';
	import Sparkles from '@lucide/svelte/icons/sparkles';

	function levelUp() {
		const lvl = fx.levelUpTo;
		const c = character.current;
		if (!lvl || !c) return;
		character.patch({ level: lvl, proficiencyBonus: profBonusForLevel(lvl) });
		sound.levelUp();
		fx.pulse('levelup');
		toasts.push(`Stufe ${lvl}!`, `Übungsbonus jetzt +${profBonusForLevel(lvl)}`, 'good');
		fx.clearLevelUp();
	}
</script>

{#if fx.levelUpTo && character.current}
	<div
		class="fixed inset-0 z-[76] grid place-items-center bg-black/60 p-4 backdrop-blur-sm"
		transition:fade={{ duration: 160 }}
	>
		<div
			class="card card-ornate relative grid max-w-sm place-items-center overflow-visible p-8 text-center"
			transition:scale={{ duration: 220, start: 0.85 }}
		>
			<span class="pointer-events-none absolute inset-0 overflow-visible">
				{#each Array(24) as _, i (i)}
					<span
						class="crit-particle"
						style="--a:{i * 15}deg; --d:{70 + (i % 5) * 22}px; background:{i % 2
							? 'var(--color-accent)'
							: 'var(--color-primary)'}; animation-delay:{(i % 6) * 40}ms; animation-duration:1s"
					></span>
				{/each}
			</span>
			<Sparkles class="mb-2 h-10 w-10 text-accent" />
			<h2 class="grad-text font-display text-3xl font-bold">Stufenaufstieg!</h2>
			<p class="mt-1 text-sm text-muted">
				Genug Erfahrung gesammelt — {character.current.name.split(' ')[0]} kann
				<strong class="text-ink">Stufe {fx.levelUpTo}</strong> erreichen.
			</p>
			<div class="mt-5 flex gap-2">
				<button class="btn" onclick={() => fx.clearLevelUp()}>Später</button>
				<button class="btn btn-primary" onclick={levelUp}>
					<Sparkles class="h-4 w-4" /> Aufsteigen!
				</button>
			</div>
			<p class="mt-3 text-[11px] text-muted">TP-Maximum & neue Zauber danach von Hand (oder mit Claude) eintragen.</p>
		</div>
	</div>
{/if}

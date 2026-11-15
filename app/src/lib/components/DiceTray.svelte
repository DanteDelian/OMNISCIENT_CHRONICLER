<script lang="ts">
	/** Würfelschale (rechts unten): letzter Wurf als rollender Würfel, freie Würfe, Vorteil/Nachteil, Protokoll. */
	import { fly } from 'svelte/transition';
	import { X, Dices } from '@lucide/svelte';
	import RollNumber from './RollNumber.svelte';
	import { rolls } from '$lib/stores/rolls.svelte';
	import { ui } from '$lib/stores/ui.svelte';
	import { timeHM } from '$lib/format';

	let custom = $state('');
	const DICE = [4, 6, 8, 10, 12, 20, 100];
	const last = $derived(rolls.log.find((r) => r.kind !== 'event'));
	const shape = $derived(shapeOf(last?.die));

	function rollCustom() {
		const e = custom.trim();
		if (!e) return;
		if (/^[+-]?\d+$/.test(e)) rolls.check(`W20 ${e}`, Number(e));
		else rolls.damage(e.replace(/w/gi, 'd'), e.replace(/w/gi, 'd'));
	}

	/** Umriss des Würfels nach Seitenzahl (Draufsicht wie auf einer Würfelzeichnung) */
	const SHAPES: Record<string, { outline: string; facets: string; y: number }> = {
		d4: { outline: 'M50 8 L92 86 L8 86 Z', facets: 'M50 8 L50 60 M8 86 L50 60 L92 86', y: 70 },
		d6: { outline: 'M18 12 H82 Q88 12 88 18 V82 Q88 88 82 88 H18 Q12 88 12 82 V18 Q12 12 18 12 Z', facets: 'M24 24 H76 V76 H24 Z', y: 55 },
		d8: { outline: 'M50 4 L94 50 L50 96 L6 50 Z', facets: 'M6 50 H94 M50 4 L28 50 L50 96 M50 4 L72 50 L50 96', y: 55 },
		d10: { outline: 'M50 4 L92 44 L50 96 L8 44 Z', facets: 'M8 44 L50 60 L92 44 M50 60 L50 96 M50 4 L30 50 M50 4 L70 50', y: 47 },
		d12: { outline: 'M50 5 L93 36 L77 90 L23 90 L7 36 Z', facets: 'M50 22 L74 40 L65 72 L35 72 L26 40 Z M50 5 L50 22 M93 36 L74 40 M77 90 L65 72 M23 90 L35 72 M7 36 L26 40', y: 54 },
		d20: {
			outline: 'M50 4 L90 27 L90 73 L50 96 L10 73 L10 27 Z',
			facets: 'M50 24 L80 70 L20 70 Z M50 4 L50 24 M90 27 L50 24 M90 27 L80 70 M90 73 L80 70 M50 96 L80 70 M50 96 L20 70 M10 73 L20 70 M10 27 L20 70 M10 27 L50 24',
			y: 58
		}
	};
	function shapeOf(sides?: number) {
		if (sides === 4) return SHAPES.d4;
		if (sides === 6) return SHAPES.d6;
		if (sides === 8) return SHAPES.d8;
		if (sides === 10 || sides === 100) return SHAPES.d10;
		if (sides === 12) return SHAPES.d12;
		return SHAPES.d20;
	}
</script>

{#if ui.dice}
	<aside class="panel panel-glow fixed right-4 bottom-4 z-50 flex max-h-[calc(100dvh-2rem)] w-[min(360px,calc(100vw-2rem))] flex-col p-4" transition:fly={{ y: 12, duration: 160 }}>
		<div class="mb-3 flex items-center justify-between">
			<div class="flex items-center gap-2">
				<Dices size={18} class="text-astral" />
				<h3 class="font-semibold">Würfelschale</h3>
			</div>
			<button class="icon-btn" onclick={() => (ui.dice = false)} aria-label="Schließen"><X size={16} /></button>
		</div>

		{#if last}
			{#key last.id}
				<div class="mb-3 flex items-center gap-4 rounded-2xl border border-line bg-black/25 p-3" aria-live="polite">
					<div class="die relative h-[84px] w-[84px] shrink-0 {last.crit === 'hit' ? 'die-hit' : last.crit === 'miss' ? 'die-miss' : ''}">
						<svg viewBox="0 0 100 100" class="h-full w-full" aria-hidden="true">
							<defs>
								<linearGradient id="die-fill" x1="0" y1="0" x2="1" y2="1">
									<stop offset="0" stop-color="var(--color-astral)" stop-opacity="0.55" />
									<stop offset="1" stop-color="var(--color-astral-2)" stop-opacity="0.18" />
								</linearGradient>
							</defs>
							<path d={shape.outline} fill="url(#die-fill)" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" />
							<path d={shape.facets} fill="none" stroke="currentColor" stroke-opacity="0.35" stroke-width="1.2" stroke-linejoin="round" />
						</svg>
						<span class="absolute inset-x-0 text-center" style="top: {shape.y - 20}%">
							<RollNumber class="num text-[1.7rem] leading-none font-semibold text-ink" value={last.total ?? 0} range={last.range} />
						</span>
					</div>
					<div class="min-w-0 flex-1">
						<div class="truncate text-sm font-medium">{last.label}</div>
						<div class="truncate text-xs text-ink-3">{last.detail}</div>
						{#if last.crit === 'hit'}<div class="crit-label mt-1 text-xs font-semibold text-gold">Natürliche 20!</div>{/if}
						{#if last.crit === 'miss'}<div class="crit-label mt-1 text-xs font-semibold text-blood">Natürliche 1</div>{/if}
					</div>
				</div>
			{/key}
		{/if}

		<div class="mb-3 grid grid-cols-3 gap-1 rounded-xl bg-black/30 p-1 text-xs">
			{#each [['normal', 'Normal'], ['vorteil', 'Vorteil'], ['nachteil', 'Nachteil']] as [m, l] (m)}
				<button
					class="rounded-lg py-1.5 font-medium {rolls.mode === m ? 'bg-white/10 text-ink' : 'text-ink-3 hover:text-ink'}"
					onclick={() => (rolls.mode = m as typeof rolls.mode)}>{l}</button
				>
			{/each}
		</div>

		<div class="grid grid-cols-7 gap-1.5">
			{#each DICE as d (d)}
				<button class="btn btn-sm !px-0 num" onclick={() => (d === 20 ? rolls.check('W20', 0) : rolls.damage(`W${d}`, `1d${d}`))}>W{d}</button>
			{/each}
		</div>

		<form
			class="mt-2 flex gap-2"
			onsubmit={(e) => {
				e.preventDefault();
				rollCustom();
			}}
		>
			<input class="input !h-8 num text-xs" bind:value={custom} placeholder="z. B. 2W6+3 oder +7" aria-label="Eigener Wurf" />
			<button class="btn btn-sm btn-primary">Würfeln</button>
		</form>
		<p class="mt-1.5 text-[0.7rem] text-ink-3">Vorteil/Nachteil gilt für den nächsten W20-Wurf, auch beim Klick auf einen Wert.</p>

		<div class="mt-3 max-h-64 min-h-16 space-y-1 overflow-y-auto">
			{#each rolls.log as r (r.id)}
				<div class="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-white/[0.03]">
					<span
						class="num w-10 text-right text-lg font-semibold {r.crit === 'hit' ? 'text-gold' : r.crit === 'miss' ? 'text-blood' : r.kind === 'event' ? 'text-ink-3' : 'text-ink'}"
						>{r.total ?? '•'}</span
					>
					<span class="min-w-0 flex-1">
						<span class="block truncate text-xs font-medium">{r.label}</span>
						<span class="block truncate text-[0.7rem] text-ink-3">{r.detail}</span>
					</span>
					<span class="num text-[0.65rem] text-ink-3">{timeHM(r.at)}</span>
				</div>
			{:else}
				<p class="py-4 text-center text-xs text-ink-3">Noch nichts gewürfelt.</p>
			{/each}
		</div>
	</aside>
{/if}

<style>
	.die {
		color: color-mix(in oklab, var(--color-astral) 70%, white);
		animation: die-tumble 0.62s cubic-bezier(0.2, 0.9, 0.3, 1.25);
	}
	.die-hit {
		color: var(--color-gold);
		filter: drop-shadow(0 0 0 transparent);
		animation:
			die-tumble 0.62s cubic-bezier(0.2, 0.9, 0.3, 1.25),
			die-glow 1.6s ease-out 0.55s forwards;
	}
	.die-miss {
		color: var(--color-blood);
		animation:
			die-tumble 0.62s cubic-bezier(0.2, 0.9, 0.3, 1.25),
			die-shake 0.45s ease 0.6s;
	}
	.crit-label {
		animation: crit-in 0.4s ease 0.55s backwards;
	}
	@keyframes die-tumble {
		0% {
			transform: translate(-40px, -18px) rotate(-260deg) scale(0.55);
			opacity: 0;
		}
		55% {
			transform: translate(4px, 2px) rotate(14deg) scale(1.06);
			opacity: 1;
		}
		78% {
			transform: rotate(-5deg) scale(0.98);
		}
		100% {
			transform: none;
		}
	}
	@keyframes die-glow {
		0% {
			filter: drop-shadow(0 0 0 transparent);
		}
		30% {
			filter: drop-shadow(0 0 18px var(--color-gold));
		}
		100% {
			filter: drop-shadow(0 0 5px color-mix(in oklab, var(--color-gold) 50%, transparent));
		}
	}
	@keyframes die-shake {
		25% {
			transform: translateX(-4px) rotate(-4deg);
		}
		50% {
			transform: translateX(4px) rotate(3deg);
		}
		75% {
			transform: translateX(-2px);
		}
	}
	@keyframes crit-in {
		from {
			opacity: 0;
			transform: translateY(4px);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.die,
		.die-hit,
		.die-miss,
		.crit-label {
			animation: none;
		}
	}
</style>

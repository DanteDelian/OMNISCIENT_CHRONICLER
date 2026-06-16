<script lang="ts">
	import { onMount } from 'svelte';
	import { character } from '$lib/stores/character.svelte';
	import { live } from '$lib/stores/live.svelte';
	import type { CharacterEvent } from '$lib/types';
	import TrendingUp from '@lucide/svelte/icons/trending-up';

	let points = $state<number[]>([]);

	async function load() {
		const r = await fetch('/api/character/history?limit=120');
		if (!r.ok) return;
		const { events } = (await r.json()) as { events: CharacterEvent[] };
		// hp.current-Events chronologisch (events kommen DESC zurück)
		const hp = events
			.filter((e) => e.field === 'hp.current' && typeof e.to === 'number')
			.reverse()
			.map((e) => e.to as number);
		if (character.current) hp.push(character.current.hp.current);
		points = hp.slice(-30);
	}
	onMount(load);
	$effect(() => {
		if (live.rev) load();
	});

	const W = 280;
	const H = 64;
	const max = $derived(Math.max(1, character.current?.hp.max ?? Math.max(...points, 1)));
	const path = $derived.by(() => {
		if (points.length < 2) return '';
		const step = W / (points.length - 1);
		return points
			.map((p, i) => `${i === 0 ? 'M' : 'L'} ${(i * step).toFixed(1)} ${(H - (p / max) * H).toFixed(1)}`)
			.join(' ');
	});
	const areaPath = $derived(path ? `${path} L ${W} ${H} L 0 ${H} Z` : '');
</script>

<div class="flex flex-col gap-2">
	{#if points.length < 2}
		<p class="flex items-center gap-2 py-4 text-sm text-muted">
			<TrendingUp class="h-4 w-4" /> Noch zu wenig Verlauf — ändere ein paar Mal die TP.
		</p>
	{:else}
		<svg viewBox="0 0 {W} {H}" class="h-16 w-full" preserveAspectRatio="none">
			<defs>
				<linearGradient id="hpgrad" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0" stop-color="var(--color-primary)" stop-opacity="0.4" />
					<stop offset="1" stop-color="var(--color-primary)" stop-opacity="0" />
				</linearGradient>
			</defs>
			<path d={areaPath} fill="url(#hpgrad)" />
			<path
				d={path}
				fill="none"
				stroke="var(--color-primary)"
				stroke-width="2"
				stroke-linejoin="round"
				stroke-linecap="round"
			/>
		</svg>
		<div class="flex justify-between text-xs text-muted">
			<span>Min {Math.min(...points)}</span>
			<span>{points.length} Messpunkte</span>
			<span>Max {Math.max(...points)}</span>
		</div>
	{/if}
</div>

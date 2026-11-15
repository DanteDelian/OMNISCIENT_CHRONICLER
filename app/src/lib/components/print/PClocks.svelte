<script lang="ts">
	/** Uhren zum Weiterführen mit dem Bleistift: gefüllte Felder sind der Stand beim Drucken. */
	import PDoc from './PDoc.svelte';
	import PMd from './PMd.svelte';
	import { campaign } from '$lib/stores/campaign.svelte';
	import { printAnchor } from '$lib/markdown';
	import type { Clock } from '$lib/types';

	const KIND: Record<Clock['kind'], { label: string; color: string }> = {
		frist: { label: 'Frist', color: '#b45309' },
		gefahr: { label: 'Gefahr', color: '#b4233a' },
		ziel: { label: 'Ziel', color: '#17805a' }
	};

	const clocks = $derived(campaign.data.uhren.clocks);

	function sector(i: number, n: number, R = 29, r = 15) {
		const gap = n > 1 ? Math.min(5, 36 / n) : 0;
		const a0 = (i / n) * 360 + gap / 2 - 90;
		const a1 = ((i + 1) / n) * 360 - gap / 2 - 90;
		const rad = (d: number) => (d * Math.PI) / 180;
		const p = (rr: number, d: number) => `${(32 + rr * Math.cos(rad(d))).toFixed(2)} ${(32 + rr * Math.sin(rad(d))).toFixed(2)}`;
		const large = a1 - a0 > 180 ? 1 : 0;
		return `M ${p(R, a0)} A ${R} ${R} 0 ${large} 1 ${p(R, a1)} L ${p(r, a1)} A ${r} ${r} 0 ${large} 0 ${p(r, a0)} Z`;
	}
</script>

<PDoc id="uhren" eyebrow="Kampagne" title="Uhren" subtitle="Fristen, die ablaufen, Gefahren, die wachsen, Ziele, die näher rücken. Gefüllte Felder zeigen den Stand beim Drucken, weitere mit dem Bleistift ausmalen.">
	<div class="clock-grid">
		{#each clocks as clock (clock.id)}
			{@const k = KIND[clock.kind]}
			<div class="clock avoid" id={printAnchor(`uhr:${clock.id}`)}>
				<svg viewBox="0 0 64 64" width="22mm" height="22mm" aria-label="{clock.filled} von {clock.segments}">
					{#each Array.from({ length: clock.segments }, (_, i) => i) as i (i)}
						<path d={sector(i, clock.segments)} fill={i < clock.filled ? k.color : '#fff'} fill-opacity={i < clock.filled ? 0.85 : 1} stroke={k.color} stroke-width="0.8" />
					{/each}
				</svg>
				<div style="min-width: 0">
					<div><b>{clock.title}</b> <span class="tag clock-kind" style="color: {k.color}; border-color: {k.color}">{k.label}</span></div>
					<div class="tiny muted" style="margin-top: 0.4mm">{clock.filled} von {clock.segments}{clock.unit ? ` · ${clock.unit}` : ''}{clock.when ? ` · ${clock.when}` : ''}</div>
					{#if clock.then}<div class="small" style="margin-top: 0.8mm"><span class="muted">Dann:</span> <PMd src={clock.then} inline /></div>{/if}
					{#if clock.link}<div class="tiny muted" style="margin-top: 0.6mm">Gehört zu: <PMd src="[[{clock.link}]]" inline /></div>{/if}
					{#if clock.note}<div class="tiny soft" style="margin-top: 0.6mm"><PMd src={clock.note} inline /></div>{/if}
				</div>
			</div>
		{:else}
			<p class="muted">Keine Uhren angelegt.</p>
		{/each}
		{#each [1, 2] as n (n)}
			<div class="clock avoid">
				<svg viewBox="0 0 64 64" width="22mm" height="22mm" aria-hidden="true">
					{#each Array.from({ length: 6 }, (_, i) => i) as i (i)}
						<path d={sector(i, 6)} fill="#fff" stroke="#6b6780" stroke-width="0.8" />
					{/each}
				</svg>
				<div class="lines" style="flex: 1; height: 21mm"></div>
			</div>
		{/each}
	</div>
</PDoc>


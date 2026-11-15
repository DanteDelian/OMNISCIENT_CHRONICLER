<script lang="ts">
	/** Würfelergebnis, das kurz durch mögliche Werte rollt und dann einrastet. */
	import { onMount, untrack } from 'svelte';

	let { value, range, class: cls = '' }: { value: number; range?: [number, number]; class?: string } = $props();

	const r = untrack(() => range);
	const animate = !!r && r[1] > r[0] && typeof window !== 'undefined' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	let shown = $state(untrack(() => value));
	let rolling = $state(animate);

	onMount(() => {
		if (!animate || !r) return;
		const [lo, hi] = r;
		const start = performance.now();
		let last = 0;
		let raf = requestAnimationFrame(function tick(t) {
			if (t - start > 560) {
				shown = untrack(() => value);
				rolling = false;
				return;
			}
			// Erst schnell, dann langsamer: wie ein Würfel, der ausrollt
			if (t - last > 35 + (t - start) / 6) {
				shown = lo + Math.floor(Math.random() * (hi - lo + 1));
				last = t;
			}
			raf = requestAnimationFrame(tick);
		});
		return () => cancelAnimationFrame(raf);
	});
</script>

<span class="{cls} {rolling ? 'roll-spin' : 'roll-land'}">{shown}</span>

<style>
	.roll-spin {
		opacity: 0.75;
		filter: blur(0.4px);
	}
	.roll-land {
		display: inline-block;
		animation: roll-pop 0.32s cubic-bezier(0.2, 0.9, 0.3, 1.5);
	}
	@keyframes roll-pop {
		from {
			transform: scale(1.35);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.roll-land {
			animation: none;
		}
	}
</style>

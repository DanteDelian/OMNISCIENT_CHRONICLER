<script lang="ts">
	/** Lichtschein beim Wirken: ein Ring in der Farbe der Zauberschule und der Name des Zaubers. Kurz, nie im Weg. */
	import { ui } from '$lib/stores/ui.svelte';

	let shown = $state<{ color: string; name: string; key: number } | null>(null);
	let timer: ReturnType<typeof setTimeout> | undefined;

	$effect(() => {
		const fx = ui.castFx;
		if (!fx) return;
		ui.castFx = null;
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		shown = fx;
		clearTimeout(timer);
		timer = setTimeout(() => (shown = null), 1150);
	});
</script>

{#if shown}
	{#key shown.key}
		<div class="cast-fx" style="--fx: {shown.color}" aria-hidden="true">
			<div class="cast-glow"></div>
			<div class="cast-ring"></div>
			<div class="cast-ring cast-ring-2"></div>
			<div class="cast-name title-display">{shown.name}</div>
		</div>
	{/key}
{/if}

<style>
	.cast-fx {
		position: fixed;
		inset: 0;
		z-index: 65;
		pointer-events: none;
		display: grid;
		place-items: center;
	}
	.cast-glow {
		position: absolute;
		inset: 0;
		background: radial-gradient(38% 38% at 50% 52%, color-mix(in oklab, var(--fx) 26%, transparent), transparent 72%);
		animation: fx-glow 1.05s ease-out both;
	}
	.cast-ring {
		position: absolute;
		width: 110px;
		height: 110px;
		border-radius: 50%;
		border: 2px solid var(--fx);
		box-shadow:
			0 0 30px var(--fx),
			inset 0 0 18px var(--fx);
		animation: fx-ring 0.95s cubic-bezier(0.2, 0.8, 0.2, 1) both;
	}
	.cast-ring-2 {
		border-width: 1px;
		animation-delay: 0.12s;
	}
	.cast-name {
		position: relative;
		font-size: clamp(2rem, 5vw, 3.6rem);
		font-style: italic;
		color: #fff;
		text-shadow:
			0 0 22px var(--fx),
			0 0 60px var(--fx);
		animation: fx-name 1.1s ease-out both;
	}
	@keyframes fx-glow {
		0% {
			opacity: 0;
		}
		22% {
			opacity: 1;
		}
		100% {
			opacity: 0;
		}
	}
	@keyframes fx-ring {
		0% {
			transform: scale(0.2);
			opacity: 0;
		}
		25% {
			opacity: 0.9;
		}
		100% {
			transform: scale(6.5);
			opacity: 0;
		}
	}
	@keyframes fx-name {
		0% {
			opacity: 0;
			transform: translateY(10px) scale(0.96);
			letter-spacing: 0.18em;
		}
		25% {
			opacity: 1;
			transform: none;
			letter-spacing: 0.02em;
		}
		72% {
			opacity: 1;
		}
		100% {
			opacity: 0;
			transform: translateY(-6px);
		}
	}
</style>

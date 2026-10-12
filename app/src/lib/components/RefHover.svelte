<script lang="ts">
	/** Vorschaukarte: Fährt man über einen Verweis (data-ref), erscheint eine Kurzinfo. */
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { campaign } from '$lib/stores/campaign.svelte';
	import type { RefEntry } from '$lib/types';

	let entry = $state<RefEntry | null>(null);
	let pos = $state({ x: 0, y: 0, above: false });
	let showTimer: ReturnType<typeof setTimeout> | undefined;
	let hideTimer: ReturnType<typeof setTimeout> | undefined;
	let overCard = false;

	const KIND_COLOR: Record<string, string> = {
		Person: 'var(--color-astral)',
		Fraktion: 'var(--color-gold)',
		Ort: 'var(--color-life)',
		Zauber: 'var(--color-astral-2)',
		Merkmal: 'var(--color-s-besch)',
		Kreatur: 'var(--color-s-nekro)',
		Quest: 'var(--color-warn)',
		Gegenstand: 'var(--color-s-verw)',
		Dokument: 'var(--color-ink-2)',
		Journal: 'var(--color-s-herv)'
	};

	function hide() {
		clearTimeout(showTimer);
		hideTimer = setTimeout(() => {
			if (!overCard) entry = null;
		}, 140);
	}

	onMount(() => {
		if (window.matchMedia('(hover: none)').matches) return;
		const over = (e: PointerEvent) => {
			const a = (e.target as HTMLElement | null)?.closest?.('[data-ref]') as HTMLElement | null;
			if (!a) return;
			clearTimeout(hideTimer);
			clearTimeout(showTimer);
			showTimer = setTimeout(() => {
				const key = a.dataset.ref;
				const hit = campaign.data.index.find((x) => x.key === key);
				if (!hit) return;
				const r = a.getBoundingClientRect();
				const above = r.bottom + 220 > window.innerHeight;
				pos = { x: Math.min(Math.max(12, r.left), window.innerWidth - 352), y: above ? r.top - 8 : r.bottom + 8, above };
				entry = hit;
			}, 260);
		};
		const out = (e: PointerEvent) => {
			const a = (e.target as HTMLElement | null)?.closest?.('[data-ref]');
			if (a) hide();
		};
		document.addEventListener('pointerover', over);
		document.addEventListener('pointerout', out);
		const clear = () => (entry = null);
		window.addEventListener('scroll', clear, true);
		return () => {
			document.removeEventListener('pointerover', over);
			document.removeEventListener('pointerout', out);
			window.removeEventListener('scroll', clear, true);
		};
	});
</script>

{#if entry}
	<a
		href={entry.href}
		class="panel panel-glow fixed z-[60] block w-[340px] p-4 no-underline"
		style="left: {pos.x}px; top: {pos.y}px; transform: translateY({pos.above ? '-100%' : '0'})"
		transition:fade={{ duration: 100 }}
		onpointerenter={() => {
			overCard = true;
			clearTimeout(hideTimer);
		}}
		onpointerleave={() => {
			overCard = false;
			hide();
		}}
	>
		<div class="mb-1.5 flex items-center gap-2">
			<span class="badge" style="--c: {KIND_COLOR[entry.kind] ?? 'var(--color-ink-2)'}">{entry.kind}</span>
			{#if entry.meta}<span class="truncate text-xs text-ink-3">{entry.meta}</span>{/if}
		</div>
		<div class="text-[0.95rem] font-semibold text-ink">{entry.title}</div>
		{#if entry.summary}<p class="mt-1 line-clamp-4 text-[0.82rem] leading-relaxed text-ink-2">{entry.summary}</p>{/if}
		<div class="mt-2 text-[0.7rem] text-ink-3">Klicken zum Öffnen</div>
	</a>
{/if}

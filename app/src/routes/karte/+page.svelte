<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { live } from '$lib/stores/live.svelte';
	import MapIcon from '@lucide/svelte/icons/map';
	import Users from '@lucide/svelte/icons/users';
	import MapPin from '@lucide/svelte/icons/map-pin';

	type Kind = 'place' | 'person';
	type Conf = 'confirmed' | 'approximate' | 'rumored' | 'mentioned';
	interface RawNode { id: string; title: string; kind: Kind; type: string; degree: number }
	interface RawEdge { source: string; target: string; type: string; confidence: Conf; spatial: boolean; distance?: string }
	interface SimNode extends RawNode { x: number; y: number; vx: number; vy: number }

	const W = 920, H = 600;
	let nodes = $state<SimNode[]>([]);
	let edges = $state<RawEdge[]>([]);
	let loaded = $state(false);
	let hoverId = $state<string | null>(null);

	// Pan/Zoom
	let k = $state(1), tx = $state(0), ty = $state(0);
	let panning = $state(false);
	let panStart = { x: 0, y: 0, tx: 0, ty: 0 };

	let raf = 0, alpha = 1;

	async function load() {
		const r = await fetch('/api/map');
		if (!r.ok) return;
		const g = (await r.json()) as { nodes: RawNode[]; edges: RawEdge[] };
		// deterministische Startpositionen auf einem Kreis (stabil, kein Zufall)
		const cx = W / 2, cy = H / 2, R = Math.min(W, H) * 0.36;
		nodes = g.nodes.map((n, i) => {
			const a = (i / g.nodes.length) * Math.PI * 2;
			return { ...n, x: cx + Math.cos(a) * R, y: cy + Math.sin(a) * R, vx: 0, vy: 0 };
		});
		edges = g.edges;
		loaded = true;
		alpha = 1;
		cancelAnimationFrame(raf);
		tick();
	}

	function tick() {
		const N = nodes;
		const byId = new Map(N.map((n) => [n.id, n]));
		// Abstoßung (O(n²), N≈27 → günstig)
		for (let i = 0; i < N.length; i++) {
			for (let j = i + 1; j < N.length; j++) {
				const a = N[i], b = N[j];
				let dx = a.x - b.x, dy = a.y - b.y;
				let d2 = dx * dx + dy * dy || 0.01;
				const f = (7200 / d2) * alpha;
				const d = Math.sqrt(d2);
				const ux = dx / d, uy = dy / d;
				a.vx += ux * f; a.vy += uy * f;
				b.vx -= ux * f; b.vy -= uy * f;
			}
		}
		// Federn entlang Kanten
		for (const e of edges) {
			const a = byId.get(e.source), b = byId.get(e.target);
			if (!a || !b) continue;
			let dx = b.x - a.x, dy = b.y - a.y;
			const d = Math.hypot(dx, dy) || 0.01;
			const f = 0.02 * (d - 118) * alpha;
			const ux = dx / d, uy = dy / d;
			a.vx += ux * f; a.vy += uy * f;
			b.vx -= ux * f; b.vy -= uy * f;
		}
		// Zentrierung + Integration + Dämpfung + Ränder
		for (const n of N) {
			n.vx += (W / 2 - n.x) * 0.006 * alpha;
			n.vy += (H / 2 - n.y) * 0.006 * alpha;
			n.vx *= 0.86; n.vy *= 0.86;
			n.x += n.vx; n.y += n.vy;
			n.x = Math.max(40, Math.min(W - 40, n.x));
			n.y = Math.max(36, Math.min(H - 36, n.y));
		}
		alpha *= 0.985;
		if (alpha > 0.02) raf = requestAnimationFrame(tick);
	}

	onMount(load);
	let lastRev = -1;
	$effect(() => {
		if (live.rev !== lastRev) { lastRev = live.rev; load(); }
	});
	onDestroy(() => {
		if (raf) cancelAnimationFrame(raf);
	});

	const pos = $derived(new Map(nodes.map((n) => [n.id, n])));
	const neighbors = $derived.by(() => {
		const m = new Map<string, Set<string>>();
		for (const e of edges) {
			(m.get(e.source) ?? m.set(e.source, new Set()).get(e.source)!).add(e.target);
			(m.get(e.target) ?? m.set(e.target, new Set()).get(e.target)!).add(e.source);
		}
		return m;
	});
	function active(id: string): boolean {
		return !hoverId || hoverId === id || (neighbors.get(hoverId)?.has(id) ?? false);
	}
	function edgeActive(e: RawEdge): boolean {
		return !hoverId || e.source === hoverId || e.target === hoverId;
	}
	const nodeColor = (kind: Kind) => (kind === 'place' ? 'var(--color-accent)' : 'var(--color-primary)');
	const nodeR = (deg: number) => 5 + Math.min(16, deg * 1.5);
	function dash(e: RawEdge): string {
		if (!e.spatial) return '2 4'; // Wikilink = fein gepunktet
		if (e.confidence === 'approximate') return '7 5';
		if (e.confidence === 'rumored') return '2 6';
		return '0'; // confirmed = durchgezogen
	}

	// Zoom/Pan
	function onWheel(ev: WheelEvent) {
		ev.preventDefault();
		const factor = ev.deltaY < 0 ? 1.12 : 1 / 1.12;
		const nk = Math.max(0.5, Math.min(3, k * factor));
		k = nk;
	}
	function onPointerDown(ev: PointerEvent) {
		if ((ev.target as Element).closest('.map-node')) return;
		panning = true; panStart = { x: ev.clientX, y: ev.clientY, tx, ty };
		(ev.currentTarget as Element).setPointerCapture(ev.pointerId);
	}
	function onPointerMove(ev: PointerEvent) {
		if (!panning) return;
		tx = panStart.tx + (ev.clientX - panStart.x);
		ty = panStart.ty + (ev.clientY - panStart.y);
	}
	function onPointerUp() { panning = false; }
	function resetView() { k = 1; tx = 0; ty = 0; }
</script>

<svelte:head><title>Karte · Omniscient Chronicler</title></svelte:head>

<div class="mx-auto max-w-5xl">
	<div class="mb-3 flex flex-wrap items-center justify-between gap-3">
		<div class="flex items-center gap-3">
			<div class="grid h-11 w-11 place-items-center rounded-xl border border-border bg-surface2 text-primary">
				<MapIcon size={22} />
			</div>
			<div>
				<h1 class="text-xl font-semibold leading-tight">Karte</h1>
				<p class="text-sm text-muted">Das Geflecht deiner Kampagne — nur, was beschrieben wurde.</p>
			</div>
		</div>
		<div class="flex items-center gap-2 text-xs">
			<span class="chip"><span class="mr-1 inline-block h-2.5 w-2.5 rounded-full" style="background:var(--color-accent)"></span>Ort</span>
			<span class="chip"><span class="mr-1 inline-block h-2.5 w-2.5 rounded-full" style="background:var(--color-primary)"></span>Person</span>
			<button class="btn btn-ghost !py-1.5" onclick={resetView}>Ansicht zurücksetzen</button>
		</div>
	</div>

	<div class="card overflow-hidden p-0">
		{#if loaded && nodes.length}
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<svg
				viewBox="0 0 {W} {H}"
				class="block h-[62vh] max-h-[640px] w-full touch-none select-none"
				style="cursor:{panning ? 'grabbing' : 'grab'}"
				onwheel={onWheel}
				onpointerdown={onPointerDown}
				onpointermove={onPointerMove}
				onpointerup={onPointerUp}
				role="application"
				aria-label="Kampagnen-Beziehungskarte"
			>
				<g transform="translate({tx} {ty}) scale({k})">
					<!-- Kanten -->
					{#each edges as e (e.source + e.target)}
						{@const a = pos.get(e.source)}
						{@const b = pos.get(e.target)}
						{#if a && b}
							<line
								x1={a.x} y1={a.y} x2={b.x} y2={b.y}
								stroke={e.spatial ? 'var(--color-accent)' : 'var(--color-primary)'}
								stroke-width={e.spatial ? 1.6 : 1}
								stroke-dasharray={dash(e)}
								opacity={edgeActive(e) ? (e.spatial ? 0.75 : 0.32) : 0.06}
							/>
						{/if}
					{/each}
					<!-- Knoten -->
					{#each nodes as n (n.id)}
						<g
							class="map-node"
							transform="translate({n.x} {n.y})"
							style="cursor:pointer"
							opacity={active(n.id) ? 1 : 0.28}
							onpointerenter={() => (hoverId = n.id)}
							onpointerleave={() => (hoverId = null)}
							onclick={() => goto('/glossar/' + encodeURIComponent(n.title))}
							role="button"
							tabindex="0"
							onkeydown={(ev) => ev.key === 'Enter' && goto('/glossar/' + encodeURIComponent(n.title))}
						>
							<circle
								r={nodeR(n.degree)}
								fill={nodeColor(n.kind)}
								stroke="var(--color-bg)"
								stroke-width="2"
								style="filter:{hoverId === n.id ? 'drop-shadow(0 0 6px ' + nodeColor(n.kind) + ')' : 'none'}"
							/>
							<text
								x="0" y={nodeR(n.degree) + 11}
								text-anchor="middle"
								font-size={hoverId === n.id ? 12 : 9.5}
								font-weight={n.degree >= 5 ? 700 : 500}
								fill="var(--color-ink)"
								style="paint-order:stroke;stroke:var(--color-bg);stroke-width:3px"
							>{n.title}</text>
						</g>
					{/each}
				</g>
			</svg>
		{:else if loaded}
			<div class="p-10 text-center text-muted">
				<MapPin size={30} class="mx-auto mb-2 opacity-50" />
				<p>Noch keine Orte oder Personen im Glossar.</p>
			</div>
		{:else}
			<div class="p-10 text-center text-muted">Karte wird gewoben…</div>
		{/if}
	</div>

	<p class="mt-2 text-xs text-muted">
		Kanten entstehen aus <a href="/glossar" class="text-primary">[[Wikilinks]]</a> (fein) und beschriebenen
		räumlichen Relationen (gold). Ziehen = verschieben · Mausrad = zoomen · Klick = zum Eintrag.
	</p>
</div>

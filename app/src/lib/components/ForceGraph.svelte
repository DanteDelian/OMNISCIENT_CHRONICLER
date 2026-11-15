<script lang="ts">
	/**
	 * Kraft-Graph (d3-force, gezeichnet als SVG): Knoten ziehen, Fläche verschieben, mit Rad oder zwei Fingern
	 * zoomen, Knoten antippen. Fährt man über einen Knoten, treten seine Nachbarn hervor, der Rest tritt zurück.
	 */
	import { onMount, untrack, type Snippet } from 'svelte';
	import { forceCollide, forceLink, forceManyBody, forceSimulation, forceX, forceY, type Simulation, type SimulationLinkDatum, type SimulationNodeDatum } from 'd3-force';
	import { Maximize2, Minus, Plus, Shuffle } from '@lucide/svelte';
	import type { GraphLink, GraphNode, NodeShape } from '$lib/graphs';

	type SimNode = GraphNode & SimulationNodeDatum;
	type SimLink = SimulationLinkDatum<SimNode> & { key: string; data: GraphLink };

	let {
		nodes,
		links,
		selected = $bindable(null),
		focus = null,
		curved = false,
		height = '72vh',
		label = 'Graph',
		legend
	}: {
		nodes: GraphNode[];
		links: GraphLink[];
		selected?: string | null;
		/** Auf diesen Knoten zoomen (Suche) */
		focus?: string | null;
		/** Kanten als geschwungene Fäden */
		curved?: boolean;
		height?: string;
		label?: string;
		legend?: Snippet;
	} = $props();

	let W = $state(900);
	let H = $state(600);
	let svg: SVGSVGElement;
	let view = $state({ x: 0, y: 0, k: 1 });
	let animating = $state(false);
	let tick = $state(0);
	let hovered = $state<string | null>(null);
	let simNodes = $state.raw<SimNode[]>([]);
	let simLinks = $state.raw<SimLink[]>([]);
	let sim: Simulation<SimNode, SimLink> | null = null;
	/** Hat jemand selbst verschoben oder gezoomt? Dann passt der Graph die Ansicht nicht mehr von sich aus an. */
	let userMoved = false;
	let pull: (n: SimNode) => number = () => 1;
	const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	const byId = $derived(new Map(simNodes.map((n) => [n.id, n])));
	const neighbors = $derived.by(() => {
		const m = new Map<string, Set<string>>();
		for (const l of links) {
			if (!m.has(l.source)) m.set(l.source, new Set());
			if (!m.has(l.target)) m.set(l.target, new Set());
			m.get(l.source)!.add(l.target);
			m.get(l.target)!.add(l.source);
		}
		return m;
	});
	const lit = $derived(hovered ?? selected);
	const litSet = $derived(lit ? new Set([lit, ...(neighbors.get(lit) ?? [])]) : null);

	function linkKind(l: SimLink): string {
		return l.data.kind;
	}

	function rebuild(ns: GraphNode[], ls: GraphLink[]) {
		const old = new Map(simNodes.map((n) => [n.id, n]));
		const cx = W / 2;
		const cy = H / 2;
		const next: SimNode[] = ns.map((n) => {
			const o = old.get(n.id);
			if (o) return { ...n, x: o.x, y: o.y, vx: o.vx, vy: o.vy, fx: o.fx, fy: o.fy };
			// Neue Knoten erscheinen neben einem Nachbarn, der schon steht, sonst nahe der Mitte
			const anchor = ls.find((l) => l.source === n.id || l.target === n.id);
			const near = anchor ? old.get(anchor.source === n.id ? anchor.target : anchor.source) : undefined;
			const bx = near?.x ?? cx;
			const by = near?.y ?? cy;
			return { ...n, x: bx + (Math.random() - 0.5) * 120, y: by + (Math.random() - 0.5) * 120 };
		});
		const ids = new Set(next.map((n) => n.id));
		const nextLinks: SimLink[] = ls
			.filter((l) => ids.has(l.source) && ids.has(l.target))
			.map((l, i) => ({ key: `${l.source}|${l.target}|${l.kind}|${i}`, source: l.source, target: l.target, data: l }));

		// Unverbundene Punkte zieht es stärker zur Mitte, sonst treiben sie an den Rand und das Bild wird winzig
		const deg = new Map<string, number>();
		for (const l of nextLinks) {
			deg.set(l.source as string, (deg.get(l.source as string) ?? 0) + 1);
			deg.set(l.target as string, (deg.get(l.target as string) ?? 0) + 1);
		}
		pull = (n: SimNode) => (deg.get(n.id) ? 1 : 3.2);
		sim?.stop();
		sim = forceSimulation<SimNode, SimLink>(next)
			.force(
				'link',
				forceLink<SimNode, SimLink>(nextLinks)
					.id((d) => d.id)
					.distance((l) => (linkKind(l) === 'verweis' ? 130 : linkKind(l) === 'faden' ? 85 : linkKind(l) === 'quelle' ? 70 : 100))
					.strength((l) => (linkKind(l) === 'verweis' ? 0.25 : 0.45))
			)
			.force('charge', forceManyBody<SimNode>().strength((n) => -110 - n.r * 16).distanceMax(800))
			.force('collide', forceCollide<SimNode>().radius((n) => n.r + 12).strength(0.9))
			.force('x', forceX<SimNode>(cx).strength((n) => 0.035 * pull(n)))
			.force('y', forceY<SimNode>(cy).strength((n) => 0.05 * pull(n)))
			.on('tick', () => tick++)
			// Hat sich das Bild beruhigt und niemand selbst gezoomt, einmal alles einpassen
			.on('end', () => {
				if (!userMoved) fit(true);
			});
		simNodes = next;
		simLinks = nextLinks;
		if (!old.size || reduce) {
			// Warmstart: das Grobe vorab rechnen, dann sieht man gleich ein ruhiges Bild
			sim.stop();
			for (let i = 0; i < (reduce ? 320 : 140); i++) sim.tick();
			tick++;
			fit(false);
			if (!reduce) sim.alpha(0.25).restart();
		} else {
			sim.alpha(0.6).restart();
		}
	}

	$effect(() => {
		const ns = nodes;
		const ls = links;
		untrack(() => rebuild(ns, ls));
	});

	// Größe der Fläche geändert: Mitte nachziehen
	$effect(() => {
		const cx = W / 2;
		const cy = H / 2;
		untrack(() => {
			if (!sim) return;
			sim.force('x', forceX<SimNode>(cx).strength((n) => 0.035 * pull(n)));
			sim.force('y', forceY<SimNode>(cy).strength((n) => 0.05 * pull(n)));
			if (!reduce) sim.alpha(0.15).restart();
		});
	});

	// Suche: auf den Knoten zoomen und ihn wählen
	$effect(() => {
		const id = focus;
		if (!id) return;
		untrack(() => {
			const n = byId.get(id);
			if (!n || n.x === undefined || n.y === undefined) return;
			const k = Math.max(view.k, 1.4);
			userMoved = true;
			setView({ k, x: W / 2 - n.x * k, y: H / 2 - n.y * k }, true);
			selected = id;
		});
	});

	function setView(v: { x: number; y: number; k: number }, animate: boolean) {
		animating = animate && !reduce;
		view = v;
		if (animating) setTimeout(() => (animating = false), 520);
	}

	export function fit(animate = true) {
		if (!simNodes.length) return;
		let x0 = Infinity;
		let y0 = Infinity;
		let x1 = -Infinity;
		let y1 = -Infinity;
		for (const n of simNodes) {
			const x = n.x ?? 0;
			const y = n.y ?? 0;
			x0 = Math.min(x0, x - n.r - 30);
			y0 = Math.min(y0, y - n.r - 20);
			x1 = Math.max(x1, x + n.r + 30);
			y1 = Math.max(y1, y + n.r + 34);
		}
		const k = Math.max(0.25, Math.min(1.6, 0.94 * Math.min(W / (x1 - x0), H / (y1 - y0))));
		setView({ k, x: W / 2 - ((x0 + x1) / 2) * k, y: H / 2 - ((y0 + y1) / 2) * k }, animate);
	}

	function zoomAt(mx: number, my: number, k: number, animate = false) {
		userMoved = true;
		k = Math.max(0.25, Math.min(3.5, k));
		const wx = (mx - view.x) / view.k;
		const wy = (my - view.y) / view.k;
		setView({ k, x: mx - wx * k, y: my - wy * k }, animate);
	}

	function shuffle() {
		userMoved = false;
		for (const n of simNodes) {
			n.fx = null;
			n.fy = null;
			n.x = W / 2 + (Math.random() - 0.5) * W * 0.6;
			n.y = H / 2 + (Math.random() - 0.5) * H * 0.6;
		}
		sim?.alpha(1).restart();
		setTimeout(() => fit(true), 1400);
	}

	// ---------- Zeiger: ziehen, verschieben, zwei Finger zoomen ----------
	let drag: { id: string; pointerId: number; sx: number; sy: number; moved: boolean } | null = null;
	let pan: { pointerId: number; sx: number; sy: number; vx: number; vy: number; moved: boolean } | null = null;
	const pointers = new Map<number, { x: number; y: number }>();
	let pinch: { d: number; k: number; mx: number; my: number } | null = null;

	function local(e: { clientX: number; clientY: number }) {
		const r = svg.getBoundingClientRect();
		return { x: e.clientX - r.left, y: e.clientY - r.top };
	}

	function onNodeDown(e: PointerEvent, n: SimNode) {
		if (e.button !== 0) return;
		e.stopPropagation();
		svg.setPointerCapture(e.pointerId);
		drag = { id: n.id, pointerId: e.pointerId, sx: e.clientX, sy: e.clientY, moved: false };
		userMoved = true;
		n.fx = n.x;
		n.fy = n.y;
		if (!reduce) sim?.alphaTarget(0.22).restart();
	}

	function onDown(e: PointerEvent) {
		if (e.button !== 0 && e.pointerType === 'mouse') return;
		svg.setPointerCapture(e.pointerId);
		pointers.set(e.pointerId, local(e));
		if (pointers.size === 2) {
			const [a, b] = [...pointers.values()];
			pinch = { d: Math.hypot(a.x - b.x, a.y - b.y) || 1, k: view.k, mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 };
			pan = null;
			return;
		}
		pan = { pointerId: e.pointerId, sx: e.clientX, sy: e.clientY, vx: view.x, vy: view.y, moved: false };
	}

	function onMove(e: PointerEvent) {
		if (drag && e.pointerId === drag.pointerId) {
			const n = byId.get(drag.id);
			if (!n) return;
			const p = local(e);
			n.fx = (p.x - view.x) / view.k;
			n.fy = (p.y - view.y) / view.k;
			if (Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 4) drag.moved = true;
			if (reduce) {
				n.x = n.fx;
				n.y = n.fy;
				tick++;
			}
			return;
		}
		if (pointers.has(e.pointerId)) pointers.set(e.pointerId, local(e));
		if (pinch && pointers.size === 2) {
			const [a, b] = [...pointers.values()];
			const d = Math.hypot(a.x - b.x, a.y - b.y) || 1;
			zoomAt(pinch.mx, pinch.my, (pinch.k * d) / pinch.d);
			return;
		}
		if (pan && e.pointerId === pan.pointerId) {
			const dx = e.clientX - pan.sx;
			const dy = e.clientY - pan.sy;
			if (Math.hypot(dx, dy) > 4) {
				pan.moved = true;
				userMoved = true;
			}
			view = { ...view, x: pan.vx + dx, y: pan.vy + dy };
		}
	}

	function onUp(e: PointerEvent) {
		if (drag && e.pointerId === drag.pointerId) {
			const n = byId.get(drag.id);
			if (n && !drag.moved) selected = selected === n.id ? null : n.id;
			// Mit gedrückter Umschalttaste bleibt der Knoten angeheftet
			if (n && !e.shiftKey) {
				n.fx = null;
				n.fy = null;
			}
			sim?.alphaTarget(0);
			drag = null;
			return;
		}
		pointers.delete(e.pointerId);
		if (pointers.size < 2) pinch = null;
		if (pan && e.pointerId === pan.pointerId) {
			if (!pan.moved) selected = null;
			pan = null;
		}
	}

	onMount(() => {
		const onWheel = (e: WheelEvent) => {
			e.preventDefault();
			const p = local(e);
			zoomAt(p.x, p.y, view.k * Math.exp(-e.deltaY * 0.0016));
		};
		svg.addEventListener('wheel', onWheel, { passive: false });
		return () => {
			svg.removeEventListener('wheel', onWheel);
			sim?.stop();
		};
	});

	// ---------- Zeichnen ----------
	function shape(s: NodeShape, r: number): string {
		switch (s) {
			case 'diamond':
				return `M0 ${-r * 1.3}L${r * 1.3} 0L0 ${r * 1.3}L${-r * 1.3} 0Z`;
			case 'square': {
				const a = r * 1.05;
				return `M${-a} ${-a}H${a}V${a}H${-a}Z`;
			}
			case 'triangle':
				return `M0 ${-r * 1.35}L${r * 1.2} ${r * 0.85}L${-r * 1.2} ${r * 0.85}Z`;
			case 'hex': {
				const pts = Array.from({ length: 6 }, (_, i) => {
					const a = (Math.PI / 3) * i - Math.PI / 2;
					return `${(Math.cos(a) * r * 1.18).toFixed(2)} ${(Math.sin(a) * r * 1.18).toFixed(2)}`;
				});
				return `M${pts.join('L')}Z`;
			}
			case 'star': {
				const pts = Array.from({ length: 10 }, (_, i) => {
					const a = (Math.PI / 5) * i - Math.PI / 2;
					const rr = i % 2 ? r * 0.55 : r * 1.45;
					return `${(Math.cos(a) * rr).toFixed(2)} ${(Math.sin(a) * rr).toFixed(2)}`;
				});
				return `M${pts.join('L')}Z`;
			}
			default:
				return `M${-r} 0a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0`;
		}
	}

	function linkPath(l: SimLink, _t: number): string {
		const s = l.source as SimNode;
		const t = l.target as SimNode;
		const x1 = s.x ?? 0;
		const y1 = s.y ?? 0;
		const x2 = t.x ?? 0;
		const y2 = t.y ?? 0;
		if (!curved) return `M${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}`;
		// Ein Faden hängt leicht durch
		const mx = (x1 + x2) / 2;
		const my = (y1 + y2) / 2 + Math.hypot(x2 - x1, y2 - y1) * 0.12;
		return `M${x1.toFixed(1)} ${y1.toFixed(1)}Q${mx.toFixed(1)} ${my.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`;
	}

	function pos(n: SimNode, _t: number): string {
		return `translate(${(n.x ?? 0).toFixed(1)} ${(n.y ?? 0).toFixed(1)})`;
	}

	function linkOn(l: SimLink): boolean {
		if (!litSet || !lit) return true;
		const s = (l.source as SimNode).id;
		const t = (l.target as SimNode).id;
		return s === lit || t === lit;
	}

	const showLabel = (n: SimNode) => n.labelAlways || view.k >= 1.2 || (litSet?.has(n.id) ?? false) || n.r >= 11;
</script>

<div class="graph-wrap relative w-full overflow-hidden" style="height: {height}" bind:clientWidth={W} bind:clientHeight={H}>
	<svg
		bind:this={svg}
		class="block h-full w-full touch-none select-none"
		width={W}
		height={H}
		role="application"
		aria-label={label}
		onpointerdown={onDown}
		onpointermove={onMove}
		onpointerup={onUp}
		onpointercancel={onUp}
	>
		<defs>
			<filter id="graph-glow" x="-100%" y="-100%" width="300%" height="300%">
				<feGaussianBlur stdDeviation="4" result="b" />
				<feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
			</filter>
		</defs>
		<g class={animating ? 'graph-animate' : ''} style="transform: translate({view.x}px, {view.y}px) scale({view.k})">
			<g>
				{#each simLinks as l (l.key)}
					{@const on = linkOn(l)}
					<path
						d={linkPath(l, tick)}
						fill="none"
						stroke={on && lit ? (l.data.color ?? 'rgb(255 255 255 / 0.3)').replace(/\/ 0?\.\d+\)/, '/ 0.85)') : (l.data.color ?? 'rgb(255 255 255 / 0.15)')}
						stroke-width={(l.data.width ?? 1) * (on && lit ? 1.6 : 1)}
						stroke-dasharray={l.data.dashed ? '4 3' : undefined}
						opacity={on ? 1 : 0.12}
						vector-effect="non-scaling-stroke"
					/>
				{/each}
			</g>
			{#each simNodes as n (n.id)}
				{@const dim = litSet ? !litSet.has(n.id) : false}
				{@const isSel = selected === n.id}
				<g
					transform={pos(n, tick)}
					class="graph-node"
					opacity={dim ? 0.18 : 1}
					role="button"
					tabindex="0"
					aria-label="{n.label} ({n.kind})"
					aria-pressed={isSel}
					onpointerdown={(e) => onNodeDown(e, n)}
					onpointerenter={() => (hovered = n.id)}
					onpointerleave={() => (hovered = hovered === n.id ? null : hovered)}
					onfocus={() => (hovered = n.id)}
					onblur={() => (hovered = null)}
					onkeydown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							e.preventDefault();
							selected = selected === n.id ? null : n.id;
						}
					}}
				>
					{#if isSel}<circle r={n.r * 1.9 + 6} fill="none" stroke={n.color} stroke-opacity="0.5" stroke-width="1.2" class="graph-pulse" />{/if}
					<path
						d={shape(n.shape, n.r)}
						fill="color-mix(in oklab, {n.color} {n.kind === 'Valerius' ? 70 : 30}%, #0b0d17)"
						stroke={n.color}
						stroke-width={isSel ? 2.4 : 1.4}
						stroke-dasharray={n.dashed ? '3 2.5' : undefined}
						filter={isSel || hovered === n.id || n.kind === 'Valerius' ? 'url(#graph-glow)' : undefined}
					/>
					{#if showLabel(n)}
						<text y={n.r * 1.35 + 12} text-anchor="middle" class="graph-label {n.labelAlways || isSel ? 'strong' : ''}">{n.label}</text>
					{/if}
				</g>
			{/each}
		</g>
	</svg>

	<div class="absolute top-3 right-3 flex flex-col gap-1.5">
		<button class="icon-btn border border-line-2 bg-bg/70 backdrop-blur" onclick={() => zoomAt(W / 2, H / 2, view.k * 1.3, true)} aria-label="Hineinzoomen" title="Hineinzoomen"><Plus size={16} /></button>
		<button class="icon-btn border border-line-2 bg-bg/70 backdrop-blur" onclick={() => zoomAt(W / 2, H / 2, view.k / 1.3, true)} aria-label="Herauszoomen" title="Herauszoomen"><Minus size={16} /></button>
		<button class="icon-btn border border-line-2 bg-bg/70 backdrop-blur" onclick={() => fit(true)} aria-label="Alles zeigen" title="Alles zeigen"><Maximize2 size={15} /></button>
		<button class="icon-btn border border-line-2 bg-bg/70 backdrop-blur" onclick={shuffle} aria-label="Neu anordnen" title="Neu anordnen"><Shuffle size={15} /></button>
	</div>
	{#if legend}<div class="pointer-events-none absolute bottom-3 left-3 max-w-[calc(100%-1.5rem)]">{@render legend()}</div>{/if}
	{#if !simNodes.length}<div class="absolute inset-0 grid place-items-center text-sm text-ink-3">Nichts zu zeigen. Ebenen oder Gruppen einschalten.</div>{/if}
</div>

<style>
	.graph-wrap {
		background:
			radial-gradient(circle at 50% 45%, rgb(160 148 255 / 0.06), transparent 65%),
			radial-gradient(rgb(255 255 255 / 0.05) 1px, transparent 1px) 0 0 / 26px 26px;
		cursor: grab;
	}
	.graph-wrap:active {
		cursor: grabbing;
	}
	.graph-animate {
		transition: transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
	}
	.graph-node {
		cursor: pointer;
		outline: none;
		transition: opacity 0.2s;
	}
	.graph-label {
		font-family: var(--font-sans);
		font-size: 10.5px;
		fill: var(--color-ink-2);
		paint-order: stroke;
		stroke: #06070d;
		stroke-width: 3.5px;
		stroke-linejoin: round;
		pointer-events: none;
	}
	.graph-label.strong {
		font-size: 11.5px;
		font-weight: 600;
		fill: var(--color-ink);
	}
	.graph-pulse {
		animation: graph-pulse 1.8s ease-out infinite;
		transform-box: fill-box;
		transform-origin: center;
	}
	@keyframes graph-pulse {
		0% {
			transform: scale(0.85);
			opacity: 0.9;
		}
		100% {
			transform: scale(1.25);
			opacity: 0;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.graph-pulse {
			animation: none;
		}
	}
</style>

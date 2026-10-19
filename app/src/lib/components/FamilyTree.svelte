<script lang="ts">
	/** Stammbaum als SVG: Personen im Raster (x = Spalte, y = Generation), Beziehungen als Linien. */
	import { campaign } from '$lib/stores/campaign.svelte';
	import { printAnchor } from '$lib/markdown';
	import { TONE_PRINT } from '$lib/print';
	import { TONE } from '$lib/tone';
	import type { FamilyTree, TreeEdge, TreeNode } from '$lib/types';

	let { tree, print = false, highlight }: { tree: FamilyTree; print?: boolean; highlight?: string } = $props();

	const NODE_W = 160;
	const NODE_H = 58;
	const COL = 188;
	const ROW = 128;
	const PAD = 14;
	/** Höhe des Kontrollpunkts beim Feindschaftsbogen */
	const ARC = 64;

	const byId = $derived(new Map(tree.nodes.map((n) => [n.id, n])));
	const top = $derived(PAD + (tree.edges.some((e) => e.kind === 'feindschaft') ? ARC / 2 + 18 : 18));
	const width = $derived(PAD * 2 + Math.max(0, ...tree.nodes.map((n) => n.x)) * COL + NODE_W);
	const height = $derived(top + Math.max(0, ...tree.nodes.map((n) => n.y)) * ROW + NODE_H + PAD);
	const palette = $derived(print ? TONE_PRINT : TONE);
	const arrow = $derived(`tree-arrow-${tree.id}${print ? '-druck' : ''}`);

	const left = (n: TreeNode) => PAD + n.x * COL;
	const center = (n: TreeNode) => left(n) + NODE_W / 2;
	const rowTop = (n: TreeNode) => top + n.y * ROW;

	interface Line {
		kind: TreeEdge['kind'];
		d: string;
		dashed: boolean;
		label?: string;
		lx: number;
		ly: number;
	}

	function draw(e: TreeEdge): Line | null {
		const from = e.from.map((id) => byId.get(id)).filter((n) => !!n);
		const to = e.to.map((id) => byId.get(id)).filter((n) => !!n);
		if (!from.length || !to.length) return null;
		if (e.kind === 'eltern') {
			// Stamm vom Elternteil (bei zwei Eltern von der Ehelinie) zur Querlinie, von dort zu jedem Kind.
			const x = from.reduce((s, n) => s + center(n), 0) / from.length;
			const start = rowTop(from[0]) + (from.length > 1 ? NODE_H / 2 : NODE_H);
			const bus = rowTop(from[0]) + NODE_H + (ROW - NODE_H) / 2;
			const xs = [x, ...to.map(center)];
			const drops = to.map((c) => `M${center(c)} ${bus}V${rowTop(c)}`).join('');
			const d = `M${x} ${start}V${bus}M${Math.min(...xs)} ${bus}H${Math.max(...xs)}${drops}`;
			return { kind: e.kind, d, dashed: !!e.uncertain, lx: 0, ly: 0 };
		}
		const [a, b] = [from[0], to[0]];
		const dashed = e.kind === 'theorie' || !!e.uncertain;
		if (e.kind === 'feindschaft') {
			// Bogen über den Kästen. Leicht versetzte Enden, damit Pfeile von beiden Seiten nicht aufeinanderliegen.
			const dir = Math.sign(center(b) - center(a)) || 1;
			const x1 = center(a) + 12 * dir;
			const x2 = center(b) - 12 * dir;
			const y = rowTop(a);
			const mx = (x1 + x2) / 2;
			return { kind: e.kind, d: `M${x1} ${y}Q${mx} ${y - ARC} ${x2} ${y - 3}`, dashed, label: e.label, lx: mx, ly: y - ARC / 2 - 8 };
		}
		const [l, r] = a.x < b.x ? [a, b] : [b, a];
		const x1 = left(l) + NODE_W;
		const x2 = left(r);
		const y = rowTop(l) + NODE_H / 2;
		const d = e.kind === 'ehe' ? `M${x1} ${y - 2.5}H${x2}M${x1} ${y + 2.5}H${x2}` : `M${x1} ${y}H${x2}`;
		return { kind: e.kind, d, dashed, label: e.label, lx: (x1 + x2) / 2, ly: rowTop(l) - 7 };
	}

	const lines = $derived(tree.edges.map(draw).filter((l) => !!l));

	let svg = $state<SVGSVGElement>();
	// Zu lange Zeilen schmaler setzen, statt über den Kasten hinauszulaufen.
	$effect(() => {
		const el = svg;
		if (!el || !tree.nodes.length) return;
		document.fonts.ready.then(() => {
			for (const t of el.querySelectorAll<SVGTextElement>('text[data-fit]')) {
				t.removeAttribute('textLength');
				t.removeAttribute('lengthAdjust');
				const max = Number(t.dataset.fit);
				if (t.getComputedTextLength() > max) {
					t.setAttribute('textLength', String(max));
					t.setAttribute('lengthAdjust', 'spacingAndGlyphs');
				}
			}
		});
	});
</script>

<svg bind:this={svg} class="tree" viewBox="0 0 {width} {height}" role="img" aria-label={tree.title}>
	<defs>
		<marker id={arrow} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
			<path d="M0 0L10 5L0 10z" class="t-arrow" />
		</marker>
	</defs>

	{#each lines as l, i (i)}
		<path
			d={l.d}
			class="t-line"
			class:t-theory={l.dashed}
			class:t-hostile={l.kind === 'feindschaft'}
			marker-end={l.kind === 'feindschaft' ? `url(#${arrow})` : undefined}
		/>
	{/each}

	{#each tree.nodes as n (n.id)}
		{@const hit = n.ref ? campaign.resolve(n.ref) : undefined}
		{@const href = hit ? (print ? `#${printAnchor(hit.key)}` : hit.href) : undefined}
		{@const sub = n.sub ? n.sub.split(' · ') : []}
		{@const y0 = rowTop(n) + (NODE_H - 15 - sub.length * 14) / 2}
		<a
			{href}
			data-ref={!print && hit ? hit.key : undefined}
			class="t-node"
			class:t-link={!!href}
			class:t-current={!!highlight && hit?.key === `world:${highlight}`}
			class:t-uncertain={n.uncertain}
			style="--tone: {palette[n.tone ?? 'unknown'].color}"
		>
			<rect x={left(n)} y={rowTop(n)} width={NODE_W} height={NODE_H} rx="10" class="t-box" />
			<rect x={left(n) + 7} y={rowTop(n) + 11} width="3.5" height={NODE_H - 22} rx="1.75" class="t-tone" />
			<text x={left(n) + 19} y={y0 + 11.5} class="t-label" data-fit={NODE_W - 27}>{n.label}</text>
			{#each sub as s, i (i)}
				<text x={left(n) + 19} y={y0 + 26 + i * 14} class="t-sub" data-fit={NODE_W - 27}>{s}</text>
			{/each}
		</a>
	{/each}

	{#each lines as l, i (i)}
		{#if l.label}
			<text x={l.lx} y={l.ly} class="t-edge-label" class:t-hostile-label={l.kind === 'feindschaft'}>{l.label}</text>
		{/if}
	{/each}
</svg>

<style>
	.tree {
		display: block;
		width: 100%;
		height: auto;
		font-family: var(--font-sans);
	}
	.t-box {
		fill: var(--tree-node, var(--color-panel-2));
		stroke: var(--tree-border, var(--color-line-2));
		stroke-width: 1;
	}
	.t-uncertain .t-box {
		stroke-dasharray: 5 4;
	}
	.t-tone {
		fill: var(--tone);
	}
	.t-label {
		fill: var(--tree-ink, var(--color-ink));
		font-size: 14.5px;
		font-weight: 600;
	}
	.t-sub {
		fill: var(--tree-muted, var(--color-ink-3));
		font-size: 11.5px;
	}
	.t-line {
		fill: none;
		stroke: var(--tree-line, rgb(255 255 255 / 0.3));
		stroke-width: 1.5;
	}
	.t-theory {
		stroke-dasharray: 5 4;
	}
	.t-hostile {
		stroke: var(--tree-hostile, var(--color-blood));
	}
	.t-arrow {
		fill: var(--tree-hostile, var(--color-blood));
	}
	.t-edge-label {
		fill: var(--tree-muted, var(--color-ink-3));
		font-size: 11px;
		font-style: italic;
		text-anchor: middle;
		paint-order: stroke;
		stroke: var(--tree-bg, var(--color-panel));
		stroke-width: 4px;
		stroke-linejoin: round;
	}
	.t-hostile-label {
		fill: var(--tree-hostile, var(--color-blood));
	}
	.t-link {
		cursor: pointer;
	}
	.t-link:hover .t-box {
		stroke: var(--tree-hover, var(--color-astral));
	}
	.t-current .t-box {
		stroke: var(--tone);
		stroke-width: 2;
		filter: drop-shadow(0 0 7px color-mix(in srgb, var(--tone) 45%, transparent));
	}
</style>

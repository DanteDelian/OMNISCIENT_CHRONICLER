<script lang="ts">
	/** Seitenleiste zu einem Graphen: der gewählte Knoten mit Text, Bild und allen Verbindungen. */
	import type { Snippet } from 'svelte';
	import { ArrowRight, X } from '@lucide/svelte';
	import Markdown from './Markdown.svelte';
	import { LINK_KINDS, type GraphLink, type GraphNode } from '$lib/graphs';

	let {
		node,
		nodes,
		links,
		onpick,
		onclose,
		intro,
		actions
	}: {
		node: GraphNode | undefined;
		nodes: GraphNode[];
		links: GraphLink[];
		onpick: (id: string) => void;
		onclose: () => void;
		intro: Snippet;
		actions?: Snippet<[GraphNode]>;
	} = $props();

	const byId = $derived(new Map(nodes.map((n) => [n.id, n])));
	let imageFailed = $state<string | null>(null);

	/** Nachbarn nach Art der Verbindung, die größten Knoten zuerst */
	const groups = $derived.by(() => {
		if (!node) return [];
		const m = new Map<string, { label: string; color: string; items: { n: GraphNode; note?: string }[] }>();
		for (const l of links) {
			const other = l.source === node.id ? l.target : l.target === node.id ? l.source : null;
			if (!other) continue;
			const n = byId.get(other);
			if (!n) continue;
			const kind = LINK_KINDS[l.kind] ?? { label: l.kind, color: 'rgb(255 255 255 / 0.3)' };
			const g = m.get(l.kind) ?? { label: kind.label, color: kind.color, items: [] };
			g.items.push({ n, note: l.label });
			m.set(l.kind, g);
		}
		for (const g of m.values()) g.items.sort((a, b) => b.n.r - a.n.r || a.n.label.localeCompare(b.n.label, 'de'));
		return [...m.values()].sort((a, b) => b.items.length - a.items.length);
	});
</script>

<aside class="panel flex max-h-[72vh] flex-col overflow-hidden" aria-live="polite">
	{#if node}
		{#if node.image && imageFailed !== node.image}
			<div class="relative h-40 shrink-0 overflow-hidden">
				<img src="/api/assets/{node.image}" alt="" class="h-full w-full object-cover" style="object-position: {node.imageFocus ?? '50% 30%'}" onerror={() => (imageFailed = node?.image ?? null)} />
				<div class="absolute inset-0 bg-gradient-to-t from-panel via-panel/30 to-transparent"></div>
			</div>
		{/if}
		<div class="min-h-0 flex-1 overflow-y-auto p-5">
			<div class="flex items-start justify-between gap-2">
				<span class="badge" style="--c: {node.color}">{node.kind}</span>
				<button class="icon-btn -mt-1 -mr-2 !h-7 !w-7" onclick={onclose} aria-label="Auswahl aufheben"><X size={15} /></button>
			</div>
			<h3 class="title-display mt-2 text-[1.7rem] leading-tight">{node.label}</h3>
			{#if node.sub}<p class="mt-0.5 text-xs text-ink-3">{node.sub}</p>{/if}
			{#if node.text}<Markdown src={node.text} class="prose-sm mt-3" />{/if}
			<div class="mt-4 flex flex-wrap gap-2">
				{#if node.href}<a class="btn btn-sm" href={node.href}>Öffnen<ArrowRight size={13} /></a>{/if}
				{@render actions?.(node)}
			</div>
			{#each groups as g (g.label)}
				<div class="mt-5">
					<div class="eyebrow mb-2 flex items-center gap-2"><span class="h-0.5 w-4 rounded-full" style="background: {g.color}"></span>{g.label} · {g.items.length}</div>
					<ul class="space-y-1">
						{#each g.items as it (it.n.id)}
							<li>
								<button class="flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition hover:bg-white/[0.05]" onclick={() => onpick(it.n.id)}>
									<span class="mt-1.5 h-2 w-2 shrink-0 rounded-full" style="background: {it.n.color}"></span>
									<span class="min-w-0">
										<span class="block truncate text-ink">{it.n.label}</span>
										{#if it.note}<span class="block text-xs leading-snug text-ink-3"><Markdown src={it.note} inline /></span>{/if}
									</span>
								</button>
							</li>
						{/each}
					</ul>
				</div>
			{/each}
		</div>
	{:else}
		<div class="overflow-y-auto p-5">{@render intro()}</div>
	{/if}
</aside>

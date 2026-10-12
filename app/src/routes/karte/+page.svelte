<script lang="ts">
	import { ZoomIn, ZoomOut, Maximize, MapPinPlus, Trash2, X, ExternalLink } from '@lucide/svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import RefChip from '$lib/components/RefChip.svelte';
	import Markdown from '$lib/components/Markdown.svelte';
	import { campaign } from '$lib/stores/campaign.svelte';
	import { uid } from '$lib/format';
	import type { MapPin } from '$lib/types';

	const map = $derived(campaign.data.map);
	const src = $derived(campaign.data.sources.find((s) => s.id === 'karte'));

	const KINDS: Record<MapPin['kind'], { label: string; color: string }> = {
		ziel: { label: 'Ziel', color: 'var(--color-blood)' },
		gefahr: { label: 'Gefahr', color: 'var(--color-warn)' },
		bestie: { label: 'Bestien', color: 'var(--color-s-herv)' },
		ort: { label: 'Ort', color: 'var(--color-life)' },
		unklar: { label: 'Ungedeutet', color: '#9aa0b8' },
		eigen: { label: 'Eigene', color: 'var(--color-astral)' }
	};

	let hidden = $state<Set<string>>(new Set());
	let selected = $state<MapPin | null>(null);
	let zoom = $state(1);
	let pan = $state({ x: 0, y: 0 });
	let placing = $state(false);
	let draft = $state<MapPin | null>(null);
	let stage: HTMLDivElement | undefined = $state();
	let inner: HTMLDivElement | undefined = $state();

	let dragging = false;
	let moved = false;
	let start = { x: 0, y: 0, px: 0, py: 0 };

	function clampZoom(z: number) {
		return Math.min(5, Math.max(1, z));
	}

	function onwheel(e: WheelEvent) {
		e.preventDefault();
		if (!stage) return;
		const r = stage.getBoundingClientRect();
		const cx = e.clientX - r.left;
		const cy = e.clientY - r.top;
		const next = clampZoom(zoom * (e.deltaY < 0 ? 1.15 : 1 / 1.15));
		// Um den Mauszeiger zoomen
		pan = { x: cx - ((cx - pan.x) * next) / zoom, y: cy - ((cy - pan.y) * next) / zoom };
		zoom = next;
		if (zoom === 1) pan = { x: 0, y: 0 };
	}

	function down(e: PointerEvent) {
		dragging = true;
		moved = false;
		start = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
	}
	function move(e: PointerEvent) {
		if (!dragging) return;
		const dx = e.clientX - start.x;
		const dy = e.clientY - start.y;
		if (Math.abs(dx) + Math.abs(dy) > 4) moved = true;
		if (zoom > 1) pan = { x: start.px + dx, y: start.py + dy };
	}
	function up(e: PointerEvent) {
		dragging = false;
		if (!moved && placing && inner) {
			const r = inner.getBoundingClientRect();
			const x = ((e.clientX - r.left) / r.width) * 100;
			const y = ((e.clientY - r.top) / r.height) * 100;
			draft = { id: uid('pin'), x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10, kind: 'eigen', label: '', text: '' };
			placing = false;
		}
	}

	function setZoom(z: number) {
		if (!stage) return;
		const r = stage.getBoundingClientRect();
		const cx = r.width / 2;
		const cy = r.height / 2;
		const next = clampZoom(z);
		pan = next === 1 ? { x: 0, y: 0 } : { x: cx - ((cx - pan.x) * next) / zoom, y: cy - ((cy - pan.y) * next) / zoom };
		zoom = next;
	}

	function toggleKind(k: string) {
		const n = new Set(hidden);
		if (n.has(k)) n.delete(k);
		else n.add(k);
		hidden = n;
	}

	function saveDraft() {
		if (!draft?.label.trim()) return;
		const p = $state.snapshot(draft);
		campaign.change('map', (m) => m.pins.push(p));
		draft = null;
	}

	function removePin(p: MapPin) {
		campaign.change('map', (m) => (m.pins = m.pins.filter((x) => x.id !== p.id)));
		selected = null;
	}
</script>

<svelte:head><title>Karte · Valerius</title></svelte:head>

<PageHeader eyebrow="Karte" title={map.title} subtitle="Mausrad zoomt, Ziehen verschiebt. Markierungen anklicken für Details. Eigene Markierungen werden in campaign/map.json gespeichert.">
	{#snippet actions()}
		{#if src}<a class="btn" href={src.url} target="_blank" rel="noreferrer"><ExternalLink size={15} />Original in Drive</a>{/if}
		<button class="btn {placing ? 'btn-primary' : ''}" onclick={() => (placing = !placing)}><MapPinPlus size={15} />{placing ? 'Klick auf die Karte …' : 'Markierung setzen'}</button>
	{/snippet}
</PageHeader>

<div class="grid gap-4 xl:grid-cols-[1fr_340px]">
	<div class="panel relative overflow-hidden p-0">
		<div
			bind:this={stage}
			class="relative aspect-square max-h-[calc(100dvh-210px)] w-full touch-none overflow-hidden bg-black/40 select-none {placing ? 'cursor-crosshair' : zoom > 1 ? 'cursor-grab' : ''}"
			role="application"
			aria-label="Karte"
			onwheel={onwheel}
			onpointerdown={down}
			onpointermove={move}
			onpointerup={up}
			onpointerleave={() => (dragging = false)}
		>
			<div class="absolute inset-0 m-auto aspect-square max-h-full max-w-full">
				<div bind:this={inner} class="absolute inset-0 origin-top-left" style="transform: translate({pan.x}px, {pan.y}px) scale({zoom})">
					<img src="/api/assets/{map.image}" alt={map.title} class="h-full w-full object-contain" draggable="false" />
					{#each map.pins.filter((p) => !hidden.has(p.kind)) as p (p.id)}
						{@const k = KINDS[p.kind]}
						<button
							class="group absolute"
							style="left: {p.x}%; top: {p.y}%; transform: translate(-50%, -50%) scale({1 / zoom})"
							onpointerdown={(e) => e.stopPropagation()}
							onclick={() => (selected = p)}
							aria-label={p.label}
						>
							<span
								class="block h-4 w-4 rounded-full border-2 border-white/90 shadow-[0_0_0_3px_rgba(0,0,0,0.45)] transition group-hover:scale-125 {selected?.id === p.id ? 'scale-150' : ''}"
								style="background: {k.color}"
							></span>
							<span class="pointer-events-none absolute top-5 left-1/2 hidden -translate-x-1/2 rounded-md bg-black/80 px-2 py-0.5 text-[11px] whitespace-nowrap text-white group-hover:block">{p.label}</span>
						</button>
					{/each}
				</div>
			</div>
		</div>
		<div class="absolute right-3 bottom-3 flex gap-1 rounded-xl border border-line bg-bg/80 p-1 backdrop-blur">
			<button class="icon-btn" onclick={() => setZoom(zoom * 1.4)} aria-label="Hineinzoomen"><ZoomIn size={16} /></button>
			<button class="icon-btn" onclick={() => setZoom(zoom / 1.4)} aria-label="Herauszoomen"><ZoomOut size={16} /></button>
			<button class="icon-btn" onclick={() => setZoom(1)} aria-label="Zurücksetzen"><Maximize size={16} /></button>
		</div>
	</div>

	<aside class="space-y-4">
		{#if selected}
			{@const k = KINDS[selected.kind]}
			<div class="panel panel-glow p-4">
				<div class="flex items-start justify-between gap-2">
					<span class="badge" style="--c: {k.color}">{k.label}</span>
					<button class="icon-btn !h-7 !w-7" onclick={() => (selected = null)} aria-label="Schließen"><X size={14} /></button>
				</div>
				<h3 class="mt-2 text-lg font-semibold">{selected.label}</h3>
				<Markdown src={selected.text} class="prose-sm mt-1" />
				<div class="mt-3 flex flex-wrap items-center gap-2">
					{#if selected.link}<RefChip name={selected.link} />{/if}
					{#if selected.kind === 'eigen'}<button class="btn btn-xs btn-danger" onclick={() => selected && removePin(selected)}><Trash2 size={11} />Entfernen</button>{/if}
				</div>
			</div>
		{/if}

		<div class="panel p-4">
			<div class="eyebrow mb-2">Legende · klicken zum Ein- und Ausblenden</div>
			<div class="flex flex-wrap gap-1.5">
				{#each Object.entries(KINDS) as [id, k] (id)}
					{@const n = map.pins.filter((p) => p.kind === id).length}
					{#if n}
						<button class="chip {hidden.has(id) ? 'opacity-40' : ''}" onclick={() => toggleKind(id)}>
							<span class="h-2.5 w-2.5 rounded-full" style="background: {k.color}"></span>{k.label} · {n}
						</button>
					{/if}
				{/each}
			</div>
		</div>

		<div class="panel p-4">
			<div class="eyebrow mb-2">Alle Markierungen</div>
			<ul class="max-h-[46vh] space-y-1 overflow-y-auto">
				{#each map.pins as p (p.id)}
					<li>
						<button class="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-white/[0.04] {selected?.id === p.id ? 'bg-white/[0.06]' : ''}" onclick={() => (selected = p)}>
							<span class="h-2.5 w-2.5 shrink-0 rounded-full" style="background: {KINDS[p.kind].color}"></span>
							<span class="truncate">{p.label}</span>
							{#if p.uncertain}<span class="ml-auto text-[0.65rem] text-ink-3">unsicher</span>{/if}
						</button>
					</li>
				{/each}
			</ul>
		</div>

		<p class="px-1 text-xs leading-relaxed text-ink-3">{map.note}</p>
	</aside>
</div>

<Modal open={!!draft} title="Neue Markierung" subtitle={draft ? `Position ${draft.x} % / ${draft.y} %` : ''} onclose={() => (draft = null)}>
	{#if draft}
		<form
			class="space-y-3"
			onsubmit={(e) => {
				e.preventDefault();
				saveDraft();
			}}
		>
			<label class="block"><span class="mb-1 block text-xs text-ink-3">Bezeichnung</span><input class="input" bind:value={draft.label} required /></label>
			<label class="block"><span class="mb-1 block text-xs text-ink-3">Notiz</span><textarea class="input" rows="3" bind:value={draft.text}></textarea></label>
			<label class="block">
				<span class="mb-1 block text-xs text-ink-3">Art</span>
				<select class="input" bind:value={draft.kind}>{#each Object.entries(KINDS) as [id, k] (id)}<option value={id}>{k.label}</option>{/each}</select>
			</label>
			<label class="block"><span class="mb-1 block text-xs text-ink-3">Verweis (optional, z. B. Die Siedlung)</span><input class="input" bind:value={draft.link} /></label>
			<div class="flex justify-end gap-2 pt-2">
				<button type="button" class="btn" onclick={() => (draft = null)}>Abbrechen</button>
				<button class="btn btn-primary">Speichern</button>
			</div>
		</form>
	{/if}
</Modal>

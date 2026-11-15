<script lang="ts">
	/**
	 * Uhren (campaign/uhren.json): Fristen, die ablaufen, Gefahren, die wachsen, Ziele, die näher rücken.
	 * Ein Feld füllen = ein Schritt Zeit oder Eskalation. Bearbeiten im Dialog.
	 */
	import { Plus, Minus, Pencil, Trash2, Hourglass } from '@lucide/svelte';
	import Modal from '../Modal.svelte';
	import Markdown from '../Markdown.svelte';
	import RefChip from '../RefChip.svelte';
	import { campaign } from '$lib/stores/campaign.svelte';
	import { uid } from '$lib/format';
	import type { Clock } from '$lib/types';

	let { limit = 0 }: { limit?: number } = $props();

	const KIND: Record<Clock['kind'], { label: string; color: string; full: string }> = {
		frist: { label: 'Frist', color: 'var(--color-warn)', full: 'abgelaufen' },
		gefahr: { label: 'Gefahr', color: 'var(--color-blood)', full: 'eingetreten' },
		ziel: { label: 'Ziel', color: 'var(--color-life)', full: 'erreicht' }
	};

	const clocks = $derived(campaign.data.uhren.clocks);
	let showAll = $state(false);
	const shown = $derived(limit && !showAll ? clocks.slice(0, limit) : clocks);

	function sector(i: number, n: number, R = 29, r = 17) {
		const gap = n > 1 ? Math.min(6, 40 / n) : 0;
		const a0 = (i / n) * 360 + gap / 2 - 90;
		const a1 = ((i + 1) / n) * 360 - gap / 2 - 90;
		const rad = (d: number) => (d * Math.PI) / 180;
		const p = (rr: number, d: number) => `${(32 + rr * Math.cos(rad(d))).toFixed(2)} ${(32 + rr * Math.sin(rad(d))).toFixed(2)}`;
		const large = a1 - a0 > 180 ? 1 : 0;
		return `M ${p(R, a0)} A ${R} ${R} 0 ${large} 1 ${p(R, a1)} L ${p(r, a1)} A ${r} ${r} 0 ${large} 0 ${p(r, a0)} Z`;
	}

	function setFilled(id: string, n: number) {
		const clock = clocks.find((x) => x.id === id);
		if (!clock) return;
		const next = Math.max(0, Math.min(clock.segments, n));
		if (next === clock.filled) return;
		campaign.change(
			'uhren',
			(d) => {
				const x = d.clocks.find((y) => y.id === id);
				if (x) x.filled = next;
			},
			`${clock.title} ${next}/${clock.segments}`
		);
	}

	function clickSegment(clock: Clock, i: number) {
		// Klick auf das letzte volle Feld leert es wieder, sonst bis hierher füllen
		setFilled(clock.id, i + 1 === clock.filled ? i : i + 1);
	}

	// ---------- Bearbeiten ----------
	let editing = $state<Clock | null>(null);
	let isNew = $state(false);

	function openNew() {
		isNew = true;
		editing = { id: '', title: '', kind: 'frist', segments: 4, filled: 0, unit: '', when: '', then: '', link: '', note: '' };
	}
	function openEdit(clock: Clock) {
		isNew = false;
		editing = { unit: '', when: '', then: '', link: '', note: '', ...$state.snapshot(clock) };
	}
	function clean(c: Clock): Clock {
		const out: Clock = { id: c.id, title: c.title.trim(), kind: c.kind, segments: Math.max(2, Math.min(12, Math.round(c.segments))), filled: 0 };
		out.filled = Math.max(0, Math.min(out.segments, Math.round(c.filled)));
		for (const k of ['unit', 'when', 'then', 'link', 'note'] as const) {
			const v = c[k]?.trim();
			if (v) out[k] = v;
		}
		return out;
	}
	function save() {
		if (!editing || !editing.title.trim()) return;
		const c = clean(editing);
		if (isNew) {
			const base = c.title.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 'ss').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
			c.id = clocks.some((x) => x.id === base) || !base ? uid('uhr') : base;
			campaign.change('uhren', (d) => d.clocks.push(c), `Uhr „${c.title}“ angelegt`);
		} else {
			campaign.change(
				'uhren',
				(d) => {
					const i = d.clocks.findIndex((x) => x.id === c.id);
					if (i >= 0) d.clocks[i] = c;
				},
				`Uhr „${c.title}“ geändert`
			);
		}
		editing = null;
	}
	function remove() {
		if (!editing || isNew) return;
		const { id, title } = editing;
		campaign.change('uhren', (d) => (d.clocks = d.clocks.filter((x) => x.id !== id)), `Uhr „${title}“ gelöscht`);
		editing = null;
	}
</script>

<section class="panel @container p-5">
	<div class="mb-3 flex items-center justify-between gap-2">
		<div class="eyebrow flex items-center gap-1.5"><Hourglass size={12} />Uhren</div>
		<button class="btn btn-xs btn-ghost text-ink-3" onclick={openNew}><Plus size={12} />Neue Uhr</button>
	</div>

	{#if clocks.length}
		<ul class="grid gap-2.5 @xl:grid-cols-2">
			{#each shown as clock (clock.id)}
				{@const k = KIND[clock.kind]}
				{@const full = clock.filled >= clock.segments}
				<li class="flex gap-3 rounded-2xl border bg-white/[0.02] p-3 transition {full ? 'border-[color:var(--k)]/50' : 'border-line'}" style="--k: {k.color}">
					<div class="relative h-[64px] w-[64px] shrink-0 {full ? 'clock-full' : ''}">
						<svg viewBox="0 0 64 64" class="h-full w-full" role="group" aria-label="{clock.title}: {clock.filled} von {clock.segments}">
							{#each Array.from({ length: clock.segments }, (_, i) => i) as i (i)}
								<path
									d={sector(i, clock.segments)}
									class="seg cursor-pointer outline-none"
									fill={i < clock.filled ? k.color : 'rgb(255 255 255 / 0.06)'}
									stroke={i < clock.filled ? 'transparent' : 'rgb(255 255 255 / 0.12)'}
									stroke-width="0.6"
									role="button"
									tabindex="0"
									aria-label="Feld {i + 1}"
									onclick={() => clickSegment(clock, i)}
									onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), clickSegment(clock, i))}
								/>
							{/each}
						</svg>
						<span class="num pointer-events-none absolute inset-0 grid place-items-center text-[0.8rem] font-semibold">{clock.filled}/{clock.segments}</span>
					</div>
					<div class="min-w-0 flex-1">
						<div class="flex items-start gap-2">
							<div class="min-w-0 flex-1">
								<div class="flex flex-wrap items-center gap-1.5">
									<span class="text-sm leading-tight font-medium">{clock.title}</span>
									<span class="badge !h-[1.1rem] !text-[0.6rem]" style="--c: {k.color}">{full ? k.full : k.label}</span>
								</div>
								{#if clock.unit || clock.when}
									<div class="mt-0.5 text-[0.7rem] text-ink-3">{[clock.unit, clock.when].filter(Boolean).join(' · ')}</div>
								{/if}
							</div>
							<div class="flex shrink-0 gap-0.5">
								<button class="icon-btn !h-7 !w-7" onclick={() => setFilled(clock.id, clock.filled - 1)} disabled={clock.filled <= 0} aria-label="Ein Feld leeren"><Minus size={13} /></button>
								<button class="icon-btn !h-7 !w-7" onclick={() => setFilled(clock.id, clock.filled + 1)} disabled={full} aria-label="Ein Feld füllen"><Plus size={13} /></button>
								<button class="icon-btn !h-7 !w-7" onclick={() => openEdit(clock)} aria-label="{clock.title} bearbeiten"><Pencil size={12} /></button>
							</div>
						</div>
						{#if clock.then}
							<p class="mt-1 text-xs leading-snug {full ? 'text-ink' : 'text-ink-2'}"><span class="text-ink-3">Dann:</span> <Markdown src={clock.then} inline /></p>
						{/if}
						{#if clock.link}<div class="mt-1.5"><RefChip name={clock.link} /></div>{/if}
					</div>
				</li>
			{/each}
		</ul>
		{#if limit && clocks.length > limit}
			<button class="mt-2 text-xs text-ink-3 hover:text-ink" onclick={() => (showAll = !showAll)}>{showAll ? 'Weniger zeigen' : `Alle ${clocks.length} Uhren zeigen`}</button>
		{/if}
	{:else}
		<p class="text-sm text-ink-3">Noch keine Uhren. Eine Uhr zählt eine Frist, eine wachsende Gefahr oder den Weg zu einem Ziel in Feldern.</p>
	{/if}
</section>

<Modal open={!!editing} title={isNew ? 'Neue Uhr' : 'Uhr bearbeiten'} subtitle="Ein Feld ist ein Schritt: eine Stunde, ein Alarm, ein Fortschritt." onclose={() => (editing = null)}>
	{#if editing}
		<form
			class="grid gap-3"
			onsubmit={(e) => {
				e.preventDefault();
				save();
			}}
		>
			<label class="grid gap-1 text-xs text-ink-3">Titel<input class="input" bind:value={editing.title} required placeholder="z. B. Twees Hütte" /></label>
			<div class="grid grid-cols-3 gap-2">
				<label class="grid gap-1 text-xs text-ink-3"
					>Art
					<select class="input" bind:value={editing.kind}>
						<option value="frist">Frist</option>
						<option value="gefahr">Gefahr</option>
						<option value="ziel">Ziel</option>
					</select>
				</label>
				<label class="grid gap-1 text-xs text-ink-3">Felder<input class="input num" type="number" min="2" max="12" bind:value={editing.segments} /></label>
				<label class="grid gap-1 text-xs text-ink-3">Gefüllt<input class="input num" type="number" min="0" max={editing.segments} bind:value={editing.filled} /></label>
			</div>
			<label class="grid gap-1 text-xs text-ink-3">Ein Feld steht für<input class="input" bind:value={editing.unit} placeholder="z. B. Stunden" /></label>
			<label class="grid gap-1 text-xs text-ink-3">Wann sie abläuft<input class="input" bind:value={editing.when} placeholder="z. B. 8 Stunden nach dem Wirken" /></label>
			<label class="grid gap-1 text-xs text-ink-3">Was dann passiert<textarea class="input min-h-16 py-2" bind:value={editing.then}></textarea></label>
			<label class="grid gap-1 text-xs text-ink-3">Gehört zu (Name eines Eintrags)<input class="input" bind:value={editing.link} placeholder="z. B. Twee" /></label>
			<label class="grid gap-1 text-xs text-ink-3">Notiz<textarea class="input min-h-16 py-2" bind:value={editing.note}></textarea></label>
			<div class="mt-1 flex items-center gap-2">
				{#if !isNew}<button type="button" class="btn btn-sm btn-danger" onclick={remove}><Trash2 size={13} />Löschen</button>{/if}
				<span class="flex-1"></span>
				<button type="button" class="btn btn-sm btn-ghost" onclick={() => (editing = null)}>Abbrechen</button>
				<button class="btn btn-sm btn-primary" disabled={!editing.title.trim()}>Speichern</button>
			</div>
		</form>
	{/if}
</Modal>

<style>
	.seg {
		transition:
			fill 0.25s ease,
			opacity 0.2s;
	}
	.seg:hover,
	.seg:focus-visible {
		opacity: 0.75;
	}
	.clock-full {
		filter: drop-shadow(0 0 10px var(--k));
		animation: clock-pulse 2.4s ease-in-out infinite;
	}
	@keyframes clock-pulse {
		50% {
			filter: drop-shadow(0 0 3px var(--k));
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.clock-full {
			animation: none;
		}
	}
</style>

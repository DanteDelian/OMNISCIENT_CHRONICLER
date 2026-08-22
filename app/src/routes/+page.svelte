<script lang="ts">
	import { onMount } from 'svelte';
	import { fly, fade } from 'svelte/transition';
	import { character } from '$lib/stores/character.svelte';
	import { live } from '$lib/stores/live.svelte';
	import { toasts } from '$lib/stores/toast.svelte';
	import {
		fmtMod,
		KNOWLEDGE_TIER_LABELS,
		QUEST_STATUS_LABELS,
		type Session,
		type Quest,
		type KnowledgeEntry,
		type SessionPlan,
		type KnowledgeTier
	} from '$lib/types';
	import AnimatedNumber from '$lib/components/AnimatedNumber.svelte';
	import WandSparkles from '@lucide/svelte/icons/wand-sparkles';
	import Shield from '@lucide/svelte/icons/shield';
	import Zap from '@lucide/svelte/icons/zap';
	import Wind from '@lucide/svelte/icons/wind';
	import Star from '@lucide/svelte/icons/star';
	import MapPin from '@lucide/svelte/icons/map-pin';
	import BookOpen from '@lucide/svelte/icons/book-open';
	import ClipboardList from '@lucide/svelte/icons/clipboard-list';
	import ScrollText from '@lucide/svelte/icons/scroll-text';
	import Lightbulb from '@lucide/svelte/icons/lightbulb';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Check from '@lucide/svelte/icons/check';

	const c = $derived(character.current);

	interface Meta { name?: string; location?: string; situation?: string; story?: string }
	let meta = $state<Meta>({});
	let sessions = $state<Session[]>([]);
	let quests = $state<Quest[]>([]);
	let knowledge = $state<KnowledgeEntry[]>([]);
	let plans = $state<SessionPlan[]>([]);

	async function jget<T>(url: string, fb: T): Promise<T> {
		try {
			const r = await fetch(url);
			return r.ok ? await r.json() : fb;
		} catch {
			return fb;
		}
	}
	async function load() {
		[meta, sessions, quests, knowledge, plans] = await Promise.all([
			jget<Meta>('/api/meta', {}),
			jget<Session[]>('/api/sessions', []),
			jget<Quest[]>('/api/quests', []),
			jget<KnowledgeEntry[]>('/api/knowledge', []),
			jget<SessionPlan[]>('/api/prep', [])
		]);
	}
	onMount(() => {
		if (!character.current) character.refresh();
		load();
	});
	let lastRev = -1;
	$effect(() => {
		if (live.rev !== lastRev) {
			lastRev = live.rev;
			load();
		}
	});

	const lastSession = $derived(sessions[0] ?? null);
	const nextPlan = $derived(plans.find((p) => p.status !== 'played') ?? null);
	const openThreads = $derived(
		quests
			.filter((q) => q.status !== 'done')
			.sort((a, b) => (a.status === b.status ? 0 : a.status === 'active' ? -1 : 1))
			.slice(0, 6)
	);
	const recentKnowledge = $derived([...knowledge].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 5));

	const TIER_COLOR: Record<KnowledgeTier, string> = {
		fact: 'var(--color-success)',
		rumor: 'var(--color-accent)',
		theory: 'var(--color-primary)'
	};
	const questColor = (s: Quest['status']) =>
		s === 'active' ? 'var(--color-primary)' : s === 'rumor' ? 'var(--color-accent)' : 'var(--color-success)';

	// HP-Ring
	const ratio = $derived(c ? Math.max(0, Math.min(1, c.hp.current / Math.max(1, c.hp.max))) : 0);
	const ringColor = $derived(ratio > 0.5 ? 'var(--color-success)' : ratio > 0.25 ? 'var(--color-accent)' : 'var(--color-danger)');
	const R = 30;
	const CIRC = 2 * Math.PI * R;

	// Campaign-State bearbeiten
	let editing = $state(false);
	let draft = $state({ location: '', situation: '' });
	function startEdit() {
		draft = { location: meta.location ?? '', situation: meta.situation ?? '' };
		editing = true;
	}
	async function saveState() {
		editing = false;
		meta = { ...meta, ...draft };
		await fetch('/api/meta', {
			method: 'PATCH',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(draft)
		});
		toasts.push('Lage aktualisiert', undefined, 'good');
	}

	function fmtDate(d: string) {
		return d;
	}
</script>

<svelte:head><title>Die Chronik · Omniscient Chronicler</title></svelte:head>

{#if c}
	<div class="mx-auto max-w-5xl" in:fade={{ duration: 200 }}>
		<!-- ═══ Aktuelle Lage (Hero) ═══ -->
		<section class="card card-ornate card-pad mb-4 overflow-hidden">
			<div class="flex flex-wrap items-start justify-between gap-4">
				<div class="min-w-0 flex-1">
					<p class="panel-title mb-2">{meta.name || 'Die Chronik'}</p>
					{#if !editing}
						<div class="flex items-start gap-2">
							<MapPin class="mt-1 h-6 w-6 shrink-0 text-accent" />
							<div class="min-w-0">
								<h1 class="grad-text font-display text-2xl font-bold leading-tight sm:text-3xl">
									{meta.location || 'Wo steht ihr gerade?'}
								</h1>
								<p class="mt-1 max-w-prose text-muted">
									{meta.situation || 'Trage die aktuelle Lage ein — sie ist das Erste, was du bei jedem Öffnen siehst.'}
								</p>
							</div>
							<button class="btn btn-icon btn-ghost ml-auto h-9 w-9 shrink-0" title="Lage bearbeiten" onclick={startEdit}>
								<Pencil class="h-4 w-4" />
							</button>
						</div>
					{:else}
						<div class="grid gap-2" transition:fade={{ duration: 120 }}>
							<input class="input font-display text-lg" placeholder="Aktueller Ort (z.B. Xantus – Die Festung)" bind:value={draft.location} />
							<textarea class="input" rows="2" placeholder="Die aktuelle Lage in einem Satz…" bind:value={draft.situation}></textarea>
							<div class="flex justify-end gap-2">
								<button class="btn btn-ghost" onclick={() => (editing = false)}>Abbrechen</button>
								<button class="btn btn-primary" onclick={saveState}><Check class="h-4 w-4" /> Speichern</button>
							</div>
						</div>
					{/if}
				</div>
				<a href="/werkstatt" class="btn btn-primary shrink-0 !py-2.5" title="Session-Notizen verarbeiten">
					<WandSparkles class="h-4 w-4" /> Session verarbeiten
				</a>
			</div>
		</section>

		<!-- ═══ Held · Letzte · Nächste Session ═══ -->
		<div class="mb-4 grid gap-4 md:grid-cols-3">
			<!-- Held -->
			<a href="/character" class="card card-hover card-pad block">
				<div class="mb-3 flex items-center gap-3">
					<div class="relative grid h-16 w-16 shrink-0 place-items-center">
						{#if c.portrait.includes('/') || c.portrait.includes('.')}
							<img src={c.portrait} alt={c.name} class="absolute inset-1.5 h-13 w-13 rounded-full object-cover" style="height:3.25rem;width:3.25rem" />
						{:else}
							<span class="absolute inset-1.5 grid place-items-center rounded-full bg-surface2 text-2xl" style="height:3.25rem;width:3.25rem">{c.portrait || '🧙'}</span>
						{/if}
						<svg viewBox="0 0 68 68" class="relative h-16 w-16 -rotate-90">
							<circle cx="34" cy="34" r={R} fill="none" stroke="var(--color-surface2)" stroke-width="5" opacity="0.6" />
							<circle cx="34" cy="34" r={R} fill="none" stroke={ringColor} stroke-width="5" stroke-linecap="round" stroke-dasharray={CIRC} stroke-dashoffset={CIRC * (1 - ratio)} style="transition:stroke-dashoffset .6s cubic-bezier(.2,.8,.2,1)" />
						</svg>
					</div>
					<div class="min-w-0">
						<div class="flex items-center gap-1.5">
							<h2 class="truncate font-display text-lg font-bold">{c.name}</h2>
							{#if c.inspiration}<Star class="h-4 w-4 shrink-0 fill-current text-accent" />{/if}
						</div>
						<p class="text-xs text-muted">Stufe {c.level} · {c.race} · {c.className}</p>
						<p class="mt-0.5 text-sm"><AnimatedNumber value={c.hp.current} />/{c.hp.max} TP</p>
					</div>
				</div>
				<div class="grid grid-cols-3 gap-2">
					<div class="stat-tile !p-2"><Shield class="mb-0.5 h-3.5 w-3.5 text-primary" /><span class="font-display font-bold">{c.ac}</span><span class="text-[10px] text-muted">RK</span></div>
					<div class="stat-tile !p-2"><Zap class="mb-0.5 h-3.5 w-3.5 text-accent" /><span class="font-display font-bold">{fmtMod(c.initiativeBonus)}</span><span class="text-[10px] text-muted">Init</span></div>
					<div class="stat-tile !p-2"><Wind class="mb-0.5 h-3.5 w-3.5 text-muted" /><span class="font-display font-bold">{c.speed}</span><span class="text-[10px] text-muted">Tempo</span></div>
				</div>
			</a>

			<!-- Letzte Session -->
			<a href="/chronik" class="card card-hover card-pad block">
				<div class="mb-2 flex items-center justify-between">
					<h2 class="panel-title">Letzte Session</h2>
					<BookOpen class="h-4 w-4 text-muted" />
				</div>
				{#if lastSession}
					<p class="font-display text-lg font-bold leading-tight">#{lastSession.number} · {lastSession.title}</p>
					<p class="text-xs text-muted">{fmtDate(lastSession.date)}</p>
					<p class="mt-2 line-clamp-3 text-sm text-muted">{lastSession.summary}</p>
				{:else}
					<p class="text-sm text-muted">Noch keine Session festgehalten.</p>
					<p class="mt-1 text-sm">Erzähl die erste in der <span class="text-primary">Werkstatt</span>.</p>
				{/if}
			</a>

			<!-- Nächste Session -->
			<a href="/prep" class="card card-hover card-pad block">
				<div class="mb-2 flex items-center justify-between">
					<h2 class="panel-title">Nächste Session</h2>
					<ClipboardList class="h-4 w-4 text-muted" />
				</div>
				{#if nextPlan}
					<p class="font-display text-lg font-bold leading-tight">{nextPlan.title || 'Ungeplant'}</p>
					{#if nextPlan.sessionDate}<p class="text-xs text-muted">{nextPlan.sessionDate}</p>{/if}
					{#if nextPlan.strongStart}<p class="mt-2 line-clamp-3 text-sm text-muted">{nextPlan.strongStart}</p>{/if}
				{:else}
					<p class="text-sm text-muted">Kein Plan in Vorbereitung.</p>
					<p class="mt-1 text-sm"><span class="text-primary">Session vorbereiten →</span></p>
				{/if}
			</a>
		</div>

		<!-- ═══ Offene Fäden · Zuletzt erfahren ═══ -->
		<div class="grid gap-4 md:grid-cols-2">
			<!-- Offene Fäden -->
			<section class="card card-pad">
				<div class="mb-3 flex items-center justify-between">
					<h2 class="panel-title">Offene Fäden</h2>
					<a href="/quests" class="text-xs text-muted hover:text-ink">alle <ArrowRight class="inline h-3 w-3" /></a>
				</div>
				{#if openThreads.length}
					<ul class="grid gap-2">
						{#each openThreads as q (q.id)}
							<li class="flex items-start gap-2.5">
								<span class="mt-1.5 h-2 w-2 shrink-0 rounded-full" style="background:{questColor(q.status)}"></span>
								<div class="min-w-0">
									<p class="truncate font-medium leading-tight">{q.title}</p>
									<p class="truncate text-xs text-muted">{QUEST_STATUS_LABELS[q.status]}{q.nextStep ? ' · ' + q.nextStep : ''}</p>
								</div>
							</li>
						{/each}
					</ul>
				{:else}
					<p class="py-4 text-center text-sm text-muted">Keine offenen Fäden — Zeit, neue zu knüpfen.</p>
				{/if}
			</section>

			<!-- Zuletzt erfahren -->
			<section class="card card-pad">
				<div class="mb-3 flex items-center justify-between">
					<h2 class="panel-title">Zuletzt erfahren</h2>
					<a href="/wissen" class="text-xs text-muted hover:text-ink">Wissen <ArrowRight class="inline h-3 w-3" /></a>
				</div>
				{#if recentKnowledge.length}
					<ul class="grid gap-2.5">
						{#each recentKnowledge as k (k.id)}
							<li class="flex items-start gap-2.5">
								<span class="mt-1.5 h-2.5 w-2.5 shrink-0" style="background:{k.tier === 'theory' ? 'transparent' : TIER_COLOR[k.tier]};border:{k.tier === 'theory' ? '2px solid ' + TIER_COLOR.theory : 'none'};border-radius:{k.tier === 'fact' ? '2px' : '50%'}"></span>
								<div class="min-w-0">
									<p class="line-clamp-2 text-sm leading-snug">{k.statement}</p>
									<p class="text-xs text-muted"><span style="color:{TIER_COLOR[k.tier]}">{KNOWLEDGE_TIER_LABELS[k.tier]}</span>{k.sourceSession ? ' · Session ' + k.sourceSession : ''}</p>
								</div>
							</li>
						{/each}
					</ul>
				{:else}
					<p class="py-4 text-center text-sm text-muted">Dein Wissen wächst mit jeder Session.</p>
				{/if}
			</section>
		</div>
	</div>
{:else if character.none}
	<!-- Onboarding -->
	<div class="grid min-h-[70vh] place-items-center">
		<div class="card card-ornate card-pad max-w-md text-center">
			<span class="mx-auto mb-3 block text-6xl">🧙</span>
			<h1 class="grad-text font-display text-3xl font-bold">Willkommen, Chronist!</h1>
			<p class="mt-2 text-sm text-muted">
				Diese Kampagne hat noch keinen Helden. Erschaffe deinen Charakter — danach warten
				Charakterbogen, Würfel, Zauberbuch, Kampf-Tracker und Session-Werkstatt auf dich.
			</p>
			<a class="btn btn-primary mt-5 w-full !py-3 text-base" href="/characters?neu=1">✨ Ersten Charakter erschaffen</a>
			<p class="mt-3 text-[11px] text-muted">
				Tipp: Zuhause kannst du die Kampagne gemeinsam mit Claude Code füllen — alle Daten liegen als
				Dateien in <code>campaign/</code>.
			</p>
		</div>
	</div>
{:else if character.error}
	<div class="grid min-h-[60vh] place-items-center">
		<div class="card card-pad max-w-sm text-center">
			<p class="font-display text-lg font-bold">Die Chronik schweigt…</p>
			<p class="mt-1 text-sm text-muted">Der Charakter konnte nicht geladen werden.</p>
			<button class="btn btn-primary mt-4" onclick={() => character.refresh()}>Erneut versuchen</button>
		</div>
	</div>
{:else}
	<div class="grid min-h-[60vh] place-items-center text-muted">
		<div class="animate-pulse font-display text-lg">Die Chronik erwacht…</div>
	</div>
{/if}

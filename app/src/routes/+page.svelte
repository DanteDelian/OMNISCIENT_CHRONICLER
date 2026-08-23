<script lang="ts">
	import { onMount } from 'svelte';
	import { fly, fade } from 'svelte/transition';
	import { character } from '$lib/stores/character.svelte';
	import { live } from '$lib/stores/live.svelte';
	import { toasts } from '$lib/stores/toast.svelte';
	import {
		KNOWLEDGE_TIER_LABELS,
		QUEST_STATUS_LABELS,
		type Session,
		type Quest,
		type KnowledgeEntry,
		type SessionPlan,
		type KnowledgeTier
	} from '$lib/types';
	import SinceLastSession from '$lib/components/SinceLastSession.svelte';
	import WandSparkles from '@lucide/svelte/icons/wand-sparkles';
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
		<section class="relative mb-4 overflow-hidden rounded-2xl border border-border">
			<div class="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/12 via-transparent to-accent/5"></div>
			<div class="relative flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-7">
				<div class="min-w-0 flex-1">
					<p class="panel-title" style="color:var(--color-accent)">{meta.name || 'Die Chronik'}</p>
					{#if !editing}
						<div class="mt-2 flex items-start gap-2.5">
							<MapPin class="mt-2 h-6 w-6 shrink-0 text-accent" />
							<h1 class="font-display text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
								{meta.location || 'Wo steht ihr gerade?'}
							</h1>
							<button class="btn btn-icon btn-ghost ml-auto h-9 w-9 shrink-0" title="Lage bearbeiten" onclick={startEdit}>
								<Pencil class="h-4 w-4" />
							</button>
						</div>
						<p class="mt-2.5 max-w-prose text-[1.05rem] leading-relaxed text-ink/85">
							{meta.situation || 'Trage die aktuelle Lage ein — sie ist das Erste, was du bei jedem Öffnen siehst.'}
						</p>
						<a href="/werkstatt" class="btn btn-primary mt-4" title="Session-Notizen verarbeiten">
							<WandSparkles class="h-4 w-4" /> Session verarbeiten
						</a>
					{:else}
						<div class="mt-2 grid gap-2" transition:fade={{ duration: 120 }}>
							<input class="input font-display text-lg" placeholder="Aktueller Ort (z.B. Xantus – Die Festung)" bind:value={draft.location} />
							<textarea class="input" rows="2" placeholder="Die aktuelle Lage in einem Satz…" bind:value={draft.situation}></textarea>
							<div class="flex justify-end gap-2">
								<button class="btn btn-ghost" onclick={() => (editing = false)}>Abbrechen</button>
								<button class="btn btn-primary" onclick={saveState}><Check class="h-4 w-4" /> Speichern</button>
							</div>
						</div>
					{/if}
				</div>

				<!-- Charakter-Medaillon -->
				<a href="/character" class="group flex shrink-0 items-center gap-4 rounded-2xl border border-border bg-surface/60 p-3 backdrop-blur transition hover:border-primary/40 sm:w-52 sm:flex-col sm:gap-2.5 sm:text-center">
					<div class="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-border sm:h-24 sm:w-24">
						{#if c.portrait.includes('/') || c.portrait.includes('.')}
							<img src={c.portrait} alt={c.name} class="h-full w-full object-cover" />
						{:else}
							<span class="grid h-full w-full place-items-center bg-surface2 text-4xl">{c.portrait || '🧙'}</span>
						{/if}
					</div>
					<div class="min-w-0">
						<div class="truncate font-display text-base font-semibold">{c.name}</div>
						<div class="text-xs text-muted">Stufe {c.level} · {c.className}</div>
						<div class="mt-1.5 flex items-center gap-2 sm:justify-center">
							<div class="h-1.5 w-20 overflow-hidden rounded-full bg-surface2">
								<div class="h-full rounded-full" style="width:{ratio * 100}%;background:{ringColor}"></div>
							</div>
							<span class="text-[11px] tabular-nums text-muted">{c.hp.current}/{c.hp.max}</span>
						</div>
					</div>
				</a>
			</div>
		</section>

		<!-- ═══ Seit der letzten Session ═══ -->
		{#if lastSession}
			<SinceLastSession number={lastSession.number} title={lastSession.title} />
		{/if}

		<!-- ═══ Letzte · Nächste Session ═══ -->
		<div class="mb-4 grid gap-4 md:grid-cols-2">
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

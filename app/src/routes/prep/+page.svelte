<script lang="ts">
	import { onMount } from 'svelte';
	import { character } from '$lib/stores/character.svelte';
	import { live } from '$lib/stores/live.svelte';
	import { toasts } from '$lib/stores/toast.svelte';
	import { SPELL_SCHOOLS, type Session, type Quest, type KnowledgeEntry } from '$lib/types';
	import MapPin from '@lucide/svelte/icons/map-pin';
	import History from '@lucide/svelte/icons/history';
	import ScrollText from '@lucide/svelte/icons/scroll-text';
	import Lightbulb from '@lucide/svelte/icons/lightbulb';
	import Target from '@lucide/svelte/icons/target';
	import Pin from '@lucide/svelte/icons/pin';
	import Sparkles from '@lucide/svelte/icons/sparkles';
	import Compass from '@lucide/svelte/icons/compass';

	const c = $derived(character.current);
	interface Meta { location?: string; situation?: string; briefingGoals?: string; briefingRemember?: string }
	let meta = $state<Meta>({});
	let sessions = $state<Session[]>([]);
	let quests = $state<Quest[]>([]);
	let knowledge = $state<KnowledgeEntry[]>([]);

	async function jget<T>(u: string, fb: T): Promise<T> {
		try { const r = await fetch(u); return r.ok ? await r.json() : fb; } catch { return fb; }
	}
	async function load() {
		[meta, sessions, quests, knowledge] = await Promise.all([
			jget<Meta>('/api/meta', {}),
			jget<Session[]>('/api/sessions', []),
			jget<Quest[]>('/api/quests', []),
			jget<KnowledgeEntry[]>('/api/knowledge', [])
		]);
		goals = meta.briefingGoals ?? '';
		remember = meta.briefingRemember ?? '';
	}
	onMount(() => { if (!character.current) character.refresh(); load(); });
	let lastRev = -1;
	$effect(() => { if (live.rev !== lastRev) { lastRev = live.rev; load(); } });

	const lastSession = $derived(sessions.slice().sort((a, b) => b.number - a.number)[0] ?? null);
	const openThreads = $derived(quests.filter((q) => q.status !== 'done').slice(0, 8));
	const facts = $derived(knowledge.filter((k) => k.tier === 'fact').slice(0, 6));
	const theories = $derived(knowledge.filter((k) => k.tier === 'theory').slice(0, 6));
	const preparedSpells = $derived(
		(c?.spells ?? [])
			.filter((s) => s.level > 0 && (s.prepared || s.alwaysPrepared))
			.sort((a, b) => a.level - b.level)
	);
	const slotsLeft = $derived((c?.spellSlots ?? []).map((s) => ({ level: s.level, left: s.total - s.used, total: s.total })));

	// editierbare Felder
	let goals = $state('');
	let remember = $state('');
	async function save(field: 'briefingGoals' | 'briefingRemember', value: string) {
		meta = { ...meta, [field]: value };
		await fetch('/api/meta', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ [field]: value }) });
		toasts.push('Briefing gespeichert', undefined, 'good');
	}
</script>

<svelte:head><title>Nächste Session · Omniscient Chronicler</title></svelte:head>

<div class="mx-auto max-w-4xl">
	<div class="mb-5">
		<p class="panel-title" style="color:var(--color-accent)">Vorbereitung</p>
		<h1 class="mt-1 font-display text-3xl font-semibold tracking-tight">Nächste Session</h1>
		<p class="text-sm text-muted">Dein Briefing — damit du am Tisch sofort im Bild bist.</p>
	</div>

	<div class="grid gap-4 md:grid-cols-2">
		<!-- Wo wir stehen -->
		<section class="card card-pad md:col-span-2">
			<div class="mb-1.5 flex items-center gap-2"><MapPin class="h-4 w-4 text-accent" /><span class="panel-title !m-0">Wo wir stehen</span></div>
			<p class="font-display text-xl font-semibold">{meta.location || 'Ort noch nicht gesetzt'}</p>
			{#if meta.situation}<p class="mt-1 leading-relaxed text-ink/85">{meta.situation}</p>{/if}
			<a href="/" class="mt-1 inline-block text-xs text-primary">Lage auf der Startseite bearbeiten →</a>
		</section>

		<!-- Was zuletzt geschah -->
		<section class="card card-pad">
			<div class="mb-2 flex items-center gap-2"><History class="h-4 w-4 text-primary" /><span class="panel-title !m-0">Was zuletzt geschah</span></div>
			{#if lastSession}
				<p class="font-medium">#{lastSession.number} · {lastSession.title}</p>
				{#if lastSession.summary}<p class="mt-1 text-sm leading-relaxed text-muted">{lastSession.summary}</p>{/if}
				{#if lastSession.highlights?.length}
					<ul class="mt-2 grid gap-1 text-sm">
						{#each lastSession.highlights as h, i (i)}<li class="flex gap-2"><span class="text-accent">·</span>{h}</li>{/each}
					</ul>
				{/if}
			{:else}
				<p class="text-sm text-muted">Noch keine Session verarbeitet.</p>
			{/if}
		</section>

		<!-- Offene Fäden -->
		<section class="card card-pad">
			<div class="mb-2 flex items-center gap-2"><ScrollText class="h-4 w-4 text-primary" /><span class="panel-title !m-0">Offene Fäden</span></div>
			{#if openThreads.length}
				<ul class="grid gap-1.5 text-sm">
					{#each openThreads as q (q.id)}
						<li><span class="font-medium">{q.title}</span>{#if q.nextStep}<span class="text-muted"> — {q.nextStep}</span>{/if}</li>
					{/each}
				</ul>
			{:else}<p class="text-sm text-muted">Keine offenen Fäden.</p>{/if}
		</section>

		<!-- Was wir wissen / vermuten -->
		<section class="card card-pad">
			<div class="mb-2 flex items-center gap-2"><Lightbulb class="h-4 w-4 text-primary" /><span class="panel-title !m-0">Was wir wissen &amp; vermuten</span></div>
			{#if facts.length}
				<p class="mb-1 text-xs font-medium" style="color:var(--color-success)">Fakten</p>
				<ul class="mb-2 grid gap-1 text-sm">{#each facts as k (k.id)}<li>{k.statement}</li>{/each}</ul>
			{/if}
			{#if theories.length}
				<p class="mb-1 text-xs font-medium" style="color:var(--color-primary)">Theorien &amp; offene Fragen</p>
				<ul class="grid gap-1 text-sm">{#each theories as k (k.id)}<li>{k.statement}</li>{/each}</ul>
			{/if}
			{#if !facts.length && !theories.length}<p class="text-sm text-muted">Noch kein gesichertes Wissen.</p>{/if}
		</section>

		<!-- Zauber-Vorbereitung -->
		<section class="card card-pad">
			<div class="mb-2 flex items-center gap-2"><Sparkles class="h-4 w-4 text-primary" /><span class="panel-title !m-0">Zauber-Vorbereitung</span></div>
			{#if slotsLeft.length}
				<div class="mb-2 flex flex-wrap gap-1.5 text-xs">
					{#each slotsLeft as s (s.level)}<span class="chip">Grad {s.level}: {s.left}/{s.total}</span>{/each}
				</div>
			{/if}
			{#if preparedSpells.length}
				<div class="flex flex-wrap gap-1.5">
					{#each preparedSpells as sp (sp.id)}
						<span class="inline-flex items-center gap-1.5 rounded-lg border border-border px-2 py-1 text-sm">
							<span class="h-2 w-2 rounded-full" style="background:{SPELL_SCHOOLS[sp.school].color}"></span>{sp.name}
						</span>
					{/each}
				</div>
			{:else}<p class="text-sm text-muted">Keine vorbereiteten Zauber.</p>{/if}
			<a href="/character" class="mt-2 inline-block text-xs text-primary">Zauberbuch öffnen →</a>
		</section>

		<!-- Meine Ziele (editierbar) -->
		<section class="card card-pad">
			<div class="mb-2 flex items-center gap-2"><Target class="h-4 w-4 text-accent" /><span class="panel-title !m-0">Meine Ziele</span></div>
			<textarea class="input min-h-24 resize-y text-sm leading-relaxed" placeholder="Was will dein Charakter erreichen? Was planst du für die nächste Session?" bind:value={goals} onblur={() => save('briefingGoals', goals)}></textarea>
		</section>

		<!-- Woran ich denken will (editierbar) -->
		<section class="card card-pad">
			<div class="mb-2 flex items-center gap-2"><Pin class="h-4 w-4 text-accent" /><span class="panel-title !m-0">Woran ich denken will</span></div>
			<textarea class="input min-h-24 resize-y text-sm leading-relaxed" placeholder="Dinge, die du nicht vergessen willst — Namen, Versprechen, Gegenstände, Fragen an den DM…" bind:value={remember} onblur={() => save('briefingRemember', remember)}></textarea>
		</section>

		<!-- Mögliche Leads (Hinweis) -->
		<section class="card card-pad md:col-span-2" style="border-color:color-mix(in oklab,var(--color-primary) 25%,var(--color-border))">
			<div class="mb-1.5 flex items-center gap-2"><Compass class="h-4 w-4 text-primary" /><span class="panel-title !m-0">Mögliche Ansätze</span></div>
			<p class="text-sm text-muted">Aus deinen offenen Fäden &amp; Theorien: prüfe die dringendsten Quests zuerst, folge offenen Fragen. <span class="italic">Dies sind Anregungen — was du tust, entscheidest du.</span></p>
		</section>
	</div>
</div>

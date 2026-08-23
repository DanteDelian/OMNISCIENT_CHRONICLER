<script lang="ts">
	import { scale, fade } from 'svelte/transition';
	import { character } from '$lib/stores/character.svelte';
	import { toasts } from '$lib/stores/toast.svelte';
	import { sound } from '$lib/sound';
	import { renderMarkdown } from '$lib/markdown';
	import { SPELL_SCHOOLS, type Spell, type SpellSchool } from '$lib/types';
	import SchoolIcon from '$lib/components/SchoolIcon.svelte';
	import Search from '@lucide/svelte/icons/search';
	import BookOpen from '@lucide/svelte/icons/book-open';
	import BookMarked from '@lucide/svelte/icons/book-marked';
	import WandSparkles from '@lucide/svelte/icons/wand-sparkles';
	import X from '@lucide/svelte/icons/x';

	const c = $derived(character.current);
	let query = $state('');
	let schoolFilter = $state<SpellSchool | null>(null);
	let selected = $state<Spell | null>(null);

	// Schulen, die im Buch vorkommen (für den Filter)
	const schools = $derived.by(() => {
		const set = new Set<SpellSchool>();
		for (const s of c?.spells ?? []) set.add(s.school);
		return [...set].sort((a, b) => SPELL_SCHOOLS[a].label.localeCompare(SPELL_SCHOOLS[b].label));
	});

	const filtered = $derived.by(() => {
		if (!c) return [];
		const q = query.trim().toLowerCase();
		return c.spells.filter(
			(s) => (!q || s.name.toLowerCase().includes(q)) && (!schoolFilter || s.school === schoolFilter)
		);
	});

	const byLevel = $derived.by(() => {
		const groups = new Map<number, Spell[]>();
		for (const s of filtered) {
			if (!groups.has(s.level)) groups.set(s.level, []);
			groups.get(s.level)!.push(s);
		}
		return [...groups.entries()].sort((a, b) => a[0] - b[0]);
	});

	const preparedCount = $derived(
		c ? c.spells.filter((s) => s.prepared && !s.alwaysPrepared && s.level > 0).length : 0
	);

	function togglePrepared(spell: Spell, e?: Event) {
		e?.stopPropagation();
		if (!c || spell.alwaysPrepared || spell.level === 0) return;
		const spells = c.spells.map((s) =>
			s.id === spell.id ? { ...s, prepared: !s.prepared } : s
		);
		character.patch({ spells });
		if (selected?.id === spell.id) selected = { ...spell, prepared: !spell.prepared };
	}

	/** Wirkt einen Zauber: verbraucht den passenden (oder nächsthöheren) Slot. */
	function cast(spell: Spell, e?: Event) {
		e?.stopPropagation();
		if (!c) return;
		if (spell.level === 0) {
			sound.cast();
			toasts.push(`✨ ${spell.name}`, 'Zaubertrick — kein Platz verbraucht');
			return;
		}
		const slot = c.spellSlots
			.filter((s) => s.level >= spell.level && s.used < s.total)
			.sort((a, b) => a.level - b.level)[0];
		if (!slot) {
			toasts.push('Keine Zauberplätze mehr!', `${spell.name} braucht Grad ${spell.level}+`, 'bad');
			return;
		}
		character.patch({
			spellSlots: c.spellSlots.map((s) =>
				s.level === slot.level ? { ...s, used: s.used + 1 } : s
			)
		});
		sound.cast();
		toasts.push(
			`✨ ${spell.name} gewirkt`,
			`Grad-${slot.level}-Platz verbraucht (${slot.total - slot.used - 1} übrig)${spell.concentration ? ' · Konzentration!' : ''}`,
			'good'
		);
	}

	function levelLabel(lvl: number): string {
		return lvl === 0 ? 'Zaubertricks' : `Grad ${lvl}`;
	}

	function slotsFor(lvl: number): { used: number; total: number } | null {
		if (!c || lvl === 0) return null;
		const s = c.spellSlots.find((x) => x.level === lvl);
		return s ? { used: s.used, total: s.total } : null;
	}
</script>

{#if c}
	{#if c.spells.length === 0}
		<p class="py-2 text-center text-sm text-muted">Noch keine Zauber im Buch.</p>
	{:else}
		<div class="mb-2 flex items-center justify-between gap-2">
			<div class="relative flex-1">
				<Search class="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
				<input class="input !py-1.5 !pl-8 text-sm" placeholder="Zauber suchen…" bind:value={query} />
			</div>
			<span class="chip shrink-0 gap-1 !py-1" title="Vorbereitete Zauber (ohne 'immer bereit')">
				<BookMarked class="h-3.5 w-3.5 text-primary" /> {preparedCount}
			</span>
		</div>

		{#if schools.length > 1}
			<div class="mb-2 flex flex-wrap gap-1">
				{#each schools as sc (sc)}
					<button
						class="inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] transition"
						style="border-color:{schoolFilter === sc ? SPELL_SCHOOLS[sc].color : 'var(--color-border)'};color:{schoolFilter === sc ? SPELL_SCHOOLS[sc].color : 'var(--color-muted)'}"
						onclick={() => (schoolFilter = schoolFilter === sc ? null : sc)}
						title={SPELL_SCHOOLS[sc].label}
					>
						<span class="h-1.5 w-1.5 rounded-full" style="background:{SPELL_SCHOOLS[sc].color}"></span>
						{SPELL_SCHOOLS[sc].label}
					</button>
				{/each}
			</div>
		{/if}

		<div class="flex flex-col gap-3">
			{#each byLevel as [lvl, spells] (lvl)}
				{@const slots = slotsFor(lvl)}
				<div>
					<div class="mb-1 flex items-center justify-between">
						<span class="text-xs font-semibold uppercase tracking-wide text-muted">{levelLabel(lvl)}</span>
						{#if slots}
							<span class="text-[11px] tabular-nums text-muted">{slots.total - slots.used}/{slots.total} Plätze</span>
						{/if}
					</div>
					<div class="flex flex-col gap-1">
						{#each spells as spell (spell.id)}
							{@const school = SPELL_SCHOOLS[spell.school]}
							{@const inactive = spell.level > 0 && !spell.prepared && !spell.alwaysPrepared}
							<div
								class="group flex w-full cursor-pointer items-center gap-2 rounded-lg border border-transparent px-2 py-1.5 text-left transition hover:border-border hover:bg-surface2 {inactive ? 'opacity-45' : ''}"
								role="button"
								tabindex="0"
								onclick={() => (selected = spell)}
								onkeydown={(e) => e.key === 'Enter' && (selected = spell)}
							>
								<span style="color:{school.color}"><SchoolIcon school={spell.school} class="h-4 w-4 shrink-0" /></span>
								<span class="min-w-0 flex-1 truncate text-sm font-medium">{spell.name}</span>
								{#if spell.ritual}<span class="chip !px-1.5 !py-0 text-[10px]" title="Ritual">R</span>{/if}
								{#if spell.concentration}<span class="chip !px-1.5 !py-0 text-[10px]" title="Konzentration">K</span>{/if}
								{#if spell.alwaysPrepared}<span class="chip !px-1.5 !py-0 text-[10px] !text-accent" title="Immer vorbereitet">∞</span>{/if}
								<button
									class="btn btn-icon !h-8 !w-8 opacity-0 transition group-hover:opacity-100 focus-visible:opacity-100 {spell.level === 0 || spell.prepared || spell.alwaysPrepared ? '' : '!hidden'}"
									onclick={(e) => cast(spell, e)}
									title="Wirken"
									aria-label="{spell.name} wirken"
								>
									<WandSparkles class="h-4 w-4 text-primary" />
								</button>
							</div>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	{/if}

	<!-- Zauber-Detail-Modal -->
	{#if selected}
		{@const school = SPELL_SCHOOLS[selected.school]}
		<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
		<div
			class="fixed inset-0 z-[65] flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center"
			transition:fade={{ duration: 150 }}
			onclick={(e) => e.target === e.currentTarget && (selected = null)}
		>
			<div
				class="card rarity-glow w-full max-w-lg overflow-hidden p-0"
				style="--rarity:{school.color}"
				transition:scale={{ duration: 200, start: 0.95 }}
			>
				<div
					class="relative p-5"
					style="background:linear-gradient(180deg, color-mix(in oklab, {school.color} 22%, transparent), transparent)"
				>
					<button class="btn btn-icon btn-ghost absolute right-3 top-3" onclick={() => (selected = null)} aria-label="Schließen">
						<X class="h-5 w-5" />
					</button>
					<div class="flex items-center gap-3">
						<span class="grid h-12 w-12 shrink-0 place-items-center rounded-xl border" style="color:{school.color}; border-color:{school.color}55; background:color-mix(in oklab, {school.color} 12%, transparent)">
							<SchoolIcon school={selected.school} class="h-7 w-7" />
						</span>
						<div class="min-w-0">
							<h3 class="truncate font-display text-2xl font-bold" style="color:{school.color}">{selected.name}</h3>
							<p class="text-xs text-muted">
								{selected.level === 0 ? 'Zaubertrick' : `Grad ${selected.level}`} · {school.label}
								{selected.ritual ? ' · Ritual' : ''}{selected.concentration ? ' · Konzentration' : ''}
							</p>
						</div>
					</div>
				</div>

				<div class="flex flex-col gap-3 p-5 pt-0">
					<div class="grid grid-cols-2 gap-2">
						<div class="stat-tile gap-0.5 !p-2">
							<span class="text-[10px] uppercase text-muted">Zeitaufwand</span>
							<span class="text-sm font-semibold">{selected.castTime}</span>
						</div>
						<div class="stat-tile gap-0.5 !p-2">
							<span class="text-[10px] uppercase text-muted">Reichweite</span>
							<span class="text-sm font-semibold">{selected.range}</span>
						</div>
					</div>

					<div class="prose prose-sm max-w-none rounded-lg bg-surface2 p-3 dark:prose-invert">
						<!-- eslint-disable-next-line svelte/no-at-html-tags -->
						{@html renderMarkdown(selected.description)}
					</div>

					<div class="flex items-center justify-between gap-2 pt-1">
						{#if selected.level > 0 && !selected.alwaysPrepared}
							<button
								class="btn {selected.prepared ? '!border-primary/50 text-primary' : ''}"
								onclick={() => togglePrepared(selected!)}
							>
								<BookOpen class="h-4 w-4" /> {selected.prepared ? 'Vorbereitet' : 'Vorbereiten'}
							</button>
						{:else}
							<span class="text-xs text-muted">{selected.level === 0 ? 'Immer verfügbar' : 'Immer vorbereitet'}</span>
						{/if}
						<button class="btn btn-primary" onclick={(e) => cast(selected!, e)}>
							<WandSparkles class="h-4 w-4" /> Wirken
						</button>
					</div>
				</div>
			</div>
		</div>
	{/if}
{/if}

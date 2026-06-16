<script lang="ts">
	import { goto } from '$app/navigation';
	import { ui } from '$lib/stores/ui.svelte';
	import { navItems } from '$lib/nav';
	import { character } from '$lib/stores/character.svelte';
	import { toasts } from '$lib/stores/toast.svelte';
	import { rollDie } from '$lib/dice';
	import { fmtMod } from '$lib/types';
	import Search from '@lucide/svelte/icons/search';
	import FileText from '@lucide/svelte/icons/file-text';
	import Users from '@lucide/svelte/icons/users';
	import ScrollText from '@lucide/svelte/icons/scroll-text';
	import Package from '@lucide/svelte/icons/package';
	import ClipboardList from '@lucide/svelte/icons/clipboard-list';
	import Dices from '@lucide/svelte/icons/dices';
	import CornerDownLeft from '@lucide/svelte/icons/corner-down-left';

	interface Cmd {
		id: string;
		label: string;
		sub?: string;
		icon: typeof Search;
		run: () => void;
	}

	let query = $state('');
	let results = $state<Cmd[]>([]);
	let active = $state(0);
	let inputEl = $state<HTMLInputElement | null>(null);
	let searchTimer: ReturnType<typeof setTimeout> | null = null;

	const TYPE_ICON: Record<string, typeof Search> = {
		note: FileText,
		glossar: Users,
		quest: ScrollText,
		item: Package,
		prep: ClipboardList
	};

	function close() {
		ui.paletteOpen = false;
		query = '';
		results = [];
		active = 0;
	}

	function navCommands(q: string): Cmd[] {
		const base: Cmd[] = navItems.map((n) => ({
			id: 'nav:' + n.href,
			label: n.label,
			sub: 'Seite öffnen',
			icon: n.icon as typeof Search,
			run: () => {
				goto(n.href);
				close();
			}
		}));
		const actions: Cmd[] = [
			{
				id: 'act:newnote',
				label: 'Neue Notiz',
				sub: 'Schnellnotiz anlegen',
				icon: FileText,
				run: async () => {
					const r = await fetch('/api/notes', {
						method: 'POST',
						headers: { 'content-type': 'application/json' },
						body: JSON.stringify({ title: 'Neue Notiz' })
					});
					const note = await r.json();
					close();
					goto('/notes?path=' + encodeURIComponent(note.path));
				}
			},
			{
				id: 'act:d20',
				label: 'd20 würfeln',
				sub: 'Schnellwurf',
				icon: Dices,
				run: () => {
					const d = rollDie(20);
					toasts.push(`🎲 d20: ${d}`, '', d === 20 ? 'good' : d === 1 ? 'bad' : 'default');
					close();
				}
			},
			{
				id: 'act:init',
				label: 'Initiative würfeln',
				sub: character.current ? `d20 ${fmtMod(character.current.initiativeBonus)}` : 'd20',
				icon: Dices,
				run: () => {
					const b = character.current?.initiativeBonus ?? 0;
					const d = rollDie(20);
					toasts.push(`Initiative: ${d + b}`, `d20 (${d}) ${fmtMod(b)}`, 'default');
					close();
				}
			}
		];
		const all = [...base, ...actions];
		if (!q) return all;
		return all.filter((c) => c.label.toLowerCase().includes(q));
	}

	async function runSearch(q: string) {
		const local = navCommands(q);
		if (q.length < 2) {
			results = local;
			active = 0;
			return;
		}
		try {
			const r = await fetch('/api/search?q=' + encodeURIComponent(q));
			const data = (await r.json()) as {
				type: string;
				title: string;
				sub: string;
				href: string;
			}[];
			const remote: Cmd[] = data.map((d, i) => ({
				id: 'res:' + i,
				label: d.title,
				sub: d.sub,
				icon: TYPE_ICON[d.type] ?? FileText,
				run: () => {
					goto(d.href);
					close();
				}
			}));
			results = [...local, ...remote];
		} catch {
			results = local;
		}
		active = 0;
	}

	$effect(() => {
		// Bei Öffnen Fokus + Default-Liste
		if (ui.paletteOpen) {
			results = navCommands('');
			active = 0;
			queueMicrotask(() => inputEl?.focus());
		}
	});

	function onInput() {
		if (searchTimer) clearTimeout(searchTimer);
		const q = query.trim().toLowerCase();
		searchTimer = setTimeout(() => runSearch(q), 140);
	}

	function onKey(e: KeyboardEvent) {
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			active = Math.min(active + 1, results.length - 1);
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			active = Math.max(active - 1, 0);
		} else if (e.key === 'Enter') {
			e.preventDefault();
			results[active]?.run();
		} else if (e.key === 'Escape') {
			close();
		}
	}

	// Globaler Shortcut
	function onGlobalKey(e: KeyboardEvent) {
		if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
			e.preventDefault();
			ui.paletteOpen = !ui.paletteOpen;
		}
	}
</script>

<svelte:window onkeydown={onGlobalKey} />

{#if ui.paletteOpen}
	<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-[70] flex items-start justify-center bg-black/50 p-4 pt-[12vh] backdrop-blur-sm"
		onclick={(e) => e.target === e.currentTarget && close()}
	>
		<div class="card w-full max-w-xl overflow-hidden p-0 shadow-2xl">
			<div class="flex items-center gap-2 border-b border-border px-4">
				<Search class="h-5 w-5 shrink-0 text-muted" />
				<!-- svelte-ignore a11y_autofocus -->
				<input
					bind:this={inputEl}
					bind:value={query}
					oninput={onInput}
					onkeydown={onKey}
					autofocus
					placeholder="Suchen oder Befehl… (Notizen, NPCs, Quests, Aktionen)"
					class="w-full bg-transparent py-3.5 text-sm outline-none placeholder:text-muted"
				/>
				<kbd class="hidden rounded bg-surface2 px-1.5 py-0.5 text-[10px] text-muted sm:block">ESC</kbd>
			</div>
			<div class="max-h-[50vh] overflow-auto p-2">
				{#each results as cmd, i (cmd.id)}
					{@const Icon = cmd.icon}
					<button
						class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition {i ===
						active
							? 'bg-primary/15'
							: 'hover:bg-surface2'}"
						onclick={() => cmd.run()}
						onmouseenter={() => (active = i)}
					>
						<Icon class="h-4 w-4 shrink-0 {i === active ? 'text-primary' : 'text-muted'}" />
						<span class="min-w-0 flex-1">
							<span class="block truncate text-sm font-medium">{cmd.label}</span>
							{#if cmd.sub}<span class="block truncate text-xs text-muted">{cmd.sub}</span>{/if}
						</span>
						{#if i === active}<CornerDownLeft class="h-3.5 w-3.5 shrink-0 text-muted" />{/if}
					</button>
				{:else}
					<p class="px-3 py-6 text-center text-sm text-muted">Nichts gefunden.</p>
				{/each}
			</div>
		</div>
	</div>
{/if}

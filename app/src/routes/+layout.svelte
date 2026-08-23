<script lang="ts">
	import './layout.css';
	import '@fontsource/inter/400.css';
	import '@fontsource/inter/500.css';
	import '@fontsource/inter/600.css';
	import '@fontsource/inter/700.css';
	import '@fontsource-variable/fraunces';
	import { onMount } from 'svelte';
	import { ModeWatcher } from 'mode-watcher';
	import { fade } from 'svelte/transition';
	import { page } from '$app/state';
	import { navItems, featuredNav, NAV_GROUPS } from '$lib/nav';
	import { character } from '$lib/stores/character.svelte';
	import { live } from '$lib/stores/live.svelte';
	import { ui } from '$lib/stores/ui.svelte';
	import { fx } from '$lib/stores/fx.svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import QuickCapture from '$lib/components/QuickCapture.svelte';
	import Toaster from '$lib/components/Toaster.svelte';
	import CommandPalette from '$lib/components/CommandPalette.svelte';
	import RollOverlay from '$lib/components/RollOverlay.svelte';
	import LevelUpOverlay from '$lib/components/LevelUpOverlay.svelte';
	import Feather from '@lucide/svelte/icons/feather';
	import Search from '@lucide/svelte/icons/search';
	import Menu from '@lucide/svelte/icons/menu';
	import X from '@lucide/svelte/icons/x';

	let { children } = $props();

	onMount(async () => {
		ui.load();
		if (!character.current) {
			await character.refresh();
		}
		live.start();
	});

	// Bei externer Datei-Änderung (z.B. Claude Code editiert campaign/character.json) live nachladen.
	let lastRev = 0;
	$effect(() => {
		if (live.rev !== lastRev) {
			lastRev = live.rev;
			character.refresh();
		}
	});

	function isActive(href: string): boolean {
		const p = page.url.pathname;
		return href === '/' ? p === '/' : p === href || p.startsWith(href + '/');
	}

	const primary = navItems.filter((i) => i.primary);
	const secondary = navItems.filter((i) => !i.primary);
	const FeaturedIcon = featuredNav.icon;

	// „Mehr"-Sheet bei Navigation schließen
	$effect(() => {
		void page.url.pathname;
		ui.moreOpen = false;
	});
</script>

<ModeWatcher defaultMode="dark" />

<div class="oc-atmos" aria-hidden="true"></div>
<div class="vignette" aria-hidden="true"></div>

<div class="relative z-10 flex min-h-dvh flex-col md:flex-row">
	<!-- Desktop-/Tablet-Sidebar -->
	<aside
		class="sticky top-0 z-30 hidden h-dvh w-60 shrink-0 flex-col border-r border-border bg-surface/70 px-3 py-4 backdrop-blur md:flex lg:w-64"
	>
		<a href="/" class="mb-6 flex items-center gap-2 px-2">
			<span class="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-fg">
				<Feather class="h-5 w-5" />
			</span>
			<span class="font-display text-lg font-bold leading-tight">
				Omniscient<br /><span class="text-muted">Chronicler</span>
			</span>
		</a>

		<button
			class="mb-3 flex items-center gap-2 rounded-xl border border-border bg-surface2/60 px-3 py-2 text-sm text-muted transition hover:border-primary/40 hover:text-ink"
			onclick={() => (ui.paletteOpen = true)}
		>
			<Search class="h-4 w-4" />
			<span class="flex-1 text-left">Suchen…</span>
			<kbd class="rounded bg-surface px-1.5 py-0.5 text-[10px]">⌘K</kbd>
		</button>

		<a
			href={featuredNav.href}
			class="mb-4 flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm font-semibold transition
				{isActive(featuredNav.href)
				? 'border-primary/60 bg-primary/20 text-ink'
				: 'border-primary/35 bg-primary/10 text-ink hover:bg-primary/[0.16]'}"
		>
			<FeaturedIcon class="h-5 w-5 text-primary" />
			{featuredNav.label}
		</a>

		<nav class="flex flex-1 flex-col gap-4 overflow-y-auto pb-2">
			{#each NAV_GROUPS as g (g)}
				<div>
					<span class="mb-1 block px-3 text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-muted/60">{g}</span>
					<div class="flex flex-col gap-0.5">
						{#each navItems.filter((i) => i.group === g) as item (item.href)}
							{@const Icon = item.icon}
							<a
								href={item.href}
								class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition
									{isActive(item.href)
									? 'bg-primary/15 text-ink'
									: 'text-muted hover:bg-surface2 hover:text-ink'}"
							>
								<Icon class="h-[18px] w-[18px] {isActive(item.href) ? 'text-primary' : ''}" />
								{item.label}
							</a>
						{/each}
					</div>
				</div>
			{/each}
		</nav>

		<div class="mt-2 flex items-center justify-between px-1">
			<span class="text-xs text-muted">v3 · lokal</span>
			<ThemeToggle />
		</div>
	</aside>

	<!-- Mobile-Topbar -->
	<header
		class="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-surface/80 px-4 py-3 backdrop-blur md:hidden"
	>
		<a href="/" class="flex items-center gap-2">
			<span class="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-fg">
				<Feather class="h-4 w-4" />
			</span>
			<span class="font-display text-base font-bold">Chronicler</span>
		</a>
		<div class="flex items-center gap-1">
			<button
				class="btn btn-icon btn-ghost"
				onclick={() => (ui.paletteOpen = true)}
				aria-label="Suchen"
			>
				<Search class="h-5 w-5" />
			</button>
			<ThemeToggle />
		</div>
	</header>

	<!-- Hauptinhalt -->
	<main class="mx-auto w-full max-w-6xl flex-1 px-4 py-5 pb-24 sm:px-6 md:pb-8">
		{#key page.url.pathname}
			<div in:fade={{ duration: 160 }}>
				{@render children()}
			</div>
		{/key}
	</main>

	<!-- Mobile-Bottom-Nav -->
	<nav
		class="fixed inset-x-0 bottom-0 z-30 flex items-stretch justify-around border-t border-border bg-surface/90 backdrop-blur md:hidden"
		style="padding-bottom: env(safe-area-inset-bottom)"
	>
		{#each primary as item (item.href)}
			{@const Icon = item.icon}
			<a
				href={item.href}
				class="flex min-h-12 flex-1 flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium transition
					{isActive(item.href) ? 'text-primary' : 'text-muted'}"
			>
				<Icon class="h-5 w-5" />
				{item.label}
			</a>
		{/each}
		<button
			class="flex min-h-12 flex-1 flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium transition
				{ui.moreOpen ? 'text-primary' : 'text-muted'}"
			onclick={() => (ui.moreOpen = !ui.moreOpen)}
		>
			<Menu class="h-5 w-5" />
			Mehr
		</button>
	</nav>

	<!-- Mobiles „Mehr"-Sheet -->
	{#if ui.moreOpen}
		<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
		<div
			class="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
			onclick={(e) => e.target === e.currentTarget && (ui.moreOpen = false)}
		>
			<div
				class="absolute inset-x-0 bottom-0 rounded-t-3xl border-t border-border bg-surface p-4 pb-24"
				style="padding-bottom: calc(6rem + env(safe-area-inset-bottom))"
			>
				<div class="mb-3 flex items-center justify-between">
					<span class="panel-title">Weitere Seiten</span>
					<button class="btn btn-icon btn-ghost" onclick={() => (ui.moreOpen = false)} aria-label="Schließen">
						<X class="h-5 w-5" />
					</button>
				</div>
				<a
					href={featuredNav.href}
					class="mb-2 flex items-center gap-3 rounded-xl border border-primary/40 bg-primary/12 px-4 py-3 text-sm font-semibold {isActive(featuredNav.href) ? 'text-primary' : ''}"
				>
					<FeaturedIcon class="h-5 w-5 text-primary" />
					{featuredNav.label}
				</a>
				<div class="grid grid-cols-2 gap-2">
					{#each secondary as item (item.href)}
						{@const Icon = item.icon}
						<a
							href={item.href}
							class="flex min-h-12 items-center gap-3 rounded-xl border border-border bg-surface2 px-4 py-3 text-sm font-medium
								{isActive(item.href) ? 'border-primary/50 text-primary' : ''}"
						>
							<Icon class="h-5 w-5" />
							{item.label}
						</a>
					{/each}
				</div>
			</div>
		</div>
	{/if}
</div>

<!-- Globale Effekt-Ebenen -->
{#if fx.edge}
	<div class="fx-edge fx-{fx.edge}" aria-hidden="true"></div>
{/if}
<QuickCapture />
<Toaster />
<CommandPalette />
<RollOverlay />
<LevelUpOverlay />

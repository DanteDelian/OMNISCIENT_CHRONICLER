<script lang="ts">
	import './layout.css';
	import '@fontsource/inter/400.css';
	import '@fontsource/inter/500.css';
	import '@fontsource/inter/600.css';
	import '@fontsource/inter/700.css';
	import '@fontsource/cinzel/500.css';
	import '@fontsource/cinzel/600.css';
	import '@fontsource/cinzel/700.css';
	import { onMount } from 'svelte';
	import { ModeWatcher } from 'mode-watcher';
	import { page } from '$app/state';
	import { navItems } from '$lib/nav';
	import { character } from '$lib/stores/character.svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import QuickCapture from '$lib/components/QuickCapture.svelte';
	import Toaster from '$lib/components/Toaster.svelte';
	import Feather from '@lucide/svelte/icons/feather';

	let { children } = $props();

	onMount(async () => {
		if (!character.current) {
			try {
				const res = await fetch('/api/character');
				if (res.ok) character.set(await res.json());
			} catch (e) {
				console.error('Charakter laden fehlgeschlagen', e);
			}
		}
	});

	function isActive(href: string): boolean {
		const p = page.url.pathname;
		return href === '/' ? p === '/' : p === href || p.startsWith(href + '/');
	}

	const primary = navItems.filter((i) => i.primary);
</script>

<ModeWatcher defaultMode="dark" />

<div class="flex min-h-dvh flex-col md:flex-row">
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

		<nav class="flex flex-1 flex-col gap-1">
			{#each navItems as item (item.href)}
				{@const Icon = item.icon}
				<a
					href={item.href}
					class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition
						{isActive(item.href)
						? 'bg-primary/15 text-ink'
						: 'text-muted hover:bg-surface2 hover:text-ink'}"
				>
					<Icon class="h-5 w-5 {isActive(item.href) ? 'text-primary' : ''}" />
					{item.label}
				</a>
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
		<ThemeToggle />
	</header>

	<!-- Hauptinhalt -->
	<main class="mx-auto w-full max-w-6xl flex-1 px-4 py-5 pb-24 sm:px-6 md:pb-8">
		{@render children()}
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
				class="flex flex-1 flex-col items-center gap-1 py-2 text-[11px] font-medium transition
					{isActive(item.href) ? 'text-primary' : 'text-muted'}"
			>
				<Icon class="h-5 w-5" />
				{item.label}
			</a>
		{/each}
	</nav>
</div>

<QuickCapture />
<Toaster />

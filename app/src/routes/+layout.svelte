<script lang="ts">
	import '@fontsource-variable/geist';
	import '@fontsource-variable/geist-mono';
	import '@fontsource/instrument-serif';
	import '@fontsource/instrument-serif/400-italic.css';
	import '../app.css';
	import { onMount, untrack } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { Menu, X } from '@lucide/svelte';
	import { fly, fade } from 'svelte/transition';
	import { campaign } from '$lib/stores/campaign.svelte';
	import { live } from '$lib/stores/live.svelte';
	import { ui } from '$lib/stores/ui.svelte';
	import { NAV } from '$lib/nav';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import CommandPalette from '$lib/components/CommandPalette.svelte';
	import DiceTray from '$lib/components/DiceTray.svelte';
	import Toasts from '$lib/components/Toasts.svelte';
	import RefHover from '$lib/components/RefHover.svelte';
	import RestDialog from '$lib/components/RestDialog.svelte';
	import ConcentrationPrompt from '$lib/components/ConcentrationPrompt.svelte';
	import SpellDrawer from '$lib/components/SpellDrawer.svelte';

	let { data, children } = $props();
	let mobileNav = $state(false);
	// Die Druckfassung bringt ihr eigenes, helles Layout mit.
	const bare = $derived(page.url.pathname.startsWith('/druck'));

	// Serverdaten übernehmen (beim ersten Laden und nach jeder Live-Änderung).
	untrack(() => {
		if (data.campaign) campaign.load(data.campaign);
	});
	$effect.pre(() => {
		const next = data.campaign;
		if (next) untrack(() => campaign.load(next));
	});

	onMount(() => {
		live.start();
		const flush = () => campaign.flushAll();
		window.addEventListener('pagehide', flush);
		return () => window.removeEventListener('pagehide', flush);
	});

	function typing(e: KeyboardEvent) {
		const t = e.target as HTMLElement | null;
		return !!t && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName));
	}

	function onkey(e: KeyboardEvent) {
		if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
			e.preventDefault();
			ui.palette = !ui.palette;
			return;
		}
		if (typing(e) || e.metaKey || e.ctrlKey || e.altKey) return;
		if (e.key === '/') {
			e.preventDefault();
			ui.palette = true;
		} else if (e.key.toLowerCase() === 'd') {
			ui.dice = !ui.dice;
		} else if (e.key === 'Escape') {
			ui.dice = false;
			ui.spellDrawer = null;
		} else if (/^[0-9]$/.test(e.key)) {
			const item = NAV.flatMap((g) => g.items).find((i) => i.key === e.key);
			if (item) goto(item.href);
		}
	}
</script>

<svelte:window onkeydown={onkey} />

{#if !data.campaign}
	<div class="starfield"></div>
	{@render children()}
{:else if campaign.data && bare}
	{@render children()}
{:else if campaign.data}
	<div class="starfield"></div>
	<div class="relative z-10 flex min-h-dvh">
		<aside class="no-print sticky top-0 hidden h-dvh w-[248px] shrink-0 border-r border-line bg-bg/60 backdrop-blur-xl lg:block">
			<Sidebar />
		</aside>

		<!-- Mobile Kopfzeile -->
		<div class="no-print fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-bg/80 px-4 backdrop-blur-xl lg:hidden">
			<button class="icon-btn" onclick={() => (mobileNav = true)} aria-label="Menü"><Menu size={20} /></button>
			<span class="title-display text-xl">Valerius</span>
			<img src="/api/assets/{campaign.data.character.avatar ?? campaign.data.character.portrait}" alt="" class="h-8 w-8 rounded-full" />
		</div>
		{#if mobileNav}
			<div class="fixed inset-0 z-50 lg:hidden">
				<button class="absolute inset-0 bg-black/60" aria-label="Schließen" onclick={() => (mobileNav = false)} transition:fade={{ duration: 120 }}></button>
				<div class="absolute inset-y-0 left-0 w-[280px] border-r border-line bg-bg" transition:fly={{ x: -280, duration: 180 }}>
					<button class="icon-btn absolute top-3 right-3" onclick={() => (mobileNav = false)} aria-label="Schließen"><X size={18} /></button>
					<Sidebar onnavigate={() => (mobileNav = false)} />
				</div>
			</div>
		{/if}

		<main class="min-w-0 flex-1 px-4 pt-20 pb-24 sm:px-6 lg:px-8 lg:pt-7">
			{#key page.url.pathname}
				<div class="rise mx-auto max-w-[1520px]">
					{@render children()}
				</div>
			{/key}
		</main>
	</div>

	<CommandPalette />
	<DiceTray />
	<Toasts />
	<RefHover />
	<RestDialog />
	<ConcentrationPrompt />
	<SpellDrawer />
{/if}

<script lang="ts">
	import Card from '$lib/components/ui/Card.svelte';
	import Users from '@lucide/svelte/icons/users';
	import MapPin from '@lucide/svelte/icons/map-pin';
	let { data } = $props();
</script>

<svelte:head><title>Glossar · Omniscient Chronicler</title></svelte:head>

<h1 class="mb-4 font-display text-2xl font-bold">Glossar</h1>

<div class="grid gap-4 md:grid-cols-2">
	<Card>
		{#snippet actions()}<Users class="h-4 w-4 text-primary" />{/snippet}
		<h2 class="panel-title mb-3">Personen ({data.personen.length})</h2>
		<div class="flex flex-col gap-1">
			{#each data.personen as n (n.path)}
				<a class="rounded-lg px-2.5 py-2 transition hover:bg-surface2" href="/glossar/{encodeURIComponent(n.title)}">
					<span class="font-medium">{n.title}</span>
					<span class="block truncate text-xs text-muted">{n.excerpt}</span>
				</a>
			{:else}
				<p class="px-1 py-4 text-sm text-muted">Noch keine Personen.</p>
			{/each}
		</div>
	</Card>

	<Card>
		{#snippet actions()}<MapPin class="h-4 w-4 text-accent" />{/snippet}
		<h2 class="panel-title mb-3">Orte ({data.orte.length})</h2>
		<div class="flex flex-col gap-1">
			{#each data.orte as n (n.path)}
				<a class="rounded-lg px-2.5 py-2 transition hover:bg-surface2" href="/glossar/{encodeURIComponent(n.title)}">
					<span class="font-medium">{n.title}</span>
					<span class="block truncate text-xs text-muted">{n.excerpt}</span>
				</a>
			{:else}
				<p class="px-1 py-4 text-sm text-muted">Noch keine Orte.</p>
			{/each}
		</div>
	</Card>
</div>

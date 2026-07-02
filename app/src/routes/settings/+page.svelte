<script lang="ts">
	import { toasts } from '$lib/stores/toast.svelte';
	import { ui } from '$lib/stores/ui.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import Smartphone from '@lucide/svelte/icons/smartphone';
	import Copy from '@lucide/svelte/icons/copy';
	import Lock from '@lucide/svelte/icons/lock';
	import Sparkles from '@lucide/svelte/icons/sparkles';

	let { data } = $props();

	function copy(text: string) {
		navigator.clipboard?.writeText(text);
		toasts.push('Kopiert', text);
	}
</script>

<svelte:head><title>Einstellungen · Omniscient Chronicler</title></svelte:head>

<h1 class="mb-4 font-display text-2xl font-bold">Einstellungen</h1>

<div class="grid gap-4 md:grid-cols-2">
	<Card title="Darstellung & Effekte">
		<div class="flex items-center justify-between">
			<span class="text-sm">Hell / Dunkel</span>
			<ThemeToggle />
		</div>
		<div class="mt-3 flex items-center justify-between border-t border-border/60 pt-3">
			<div>
				<span class="block text-sm">Sound-Effekte</span>
				<span class="text-xs text-muted">Würfel, Krits, Level-Up (synthetisiert, dezent)</span>
			</div>
			<button
				class="relative h-7 w-12 rounded-full transition {ui.sound ? 'bg-primary' : 'bg-surface2 border border-border'}"
				onclick={() => ui.setSound(!ui.sound)}
				role="switch"
				aria-checked={ui.sound}
				aria-label="Sound-Effekte"
			>
				<span
					class="absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all {ui.sound
						? 'left-[calc(100%-1.625rem)]'
						: 'left-0.5'}"
				></span>
			</button>
		</div>
	</Card>

	<Card title="WLAN-Zugriff">
		<p class="mb-3 flex items-center gap-2 text-sm text-muted">
			<Smartphone class="h-4 w-4" /> Auf Tablet/Handy im selben WLAN öffnen:
		</p>
		{#if data.lanUrls.length}
			<ul class="flex flex-col gap-2">
				{#each data.lanUrls as u (u)}
					<li class="flex items-center justify-between gap-2 rounded-lg bg-surface2 px-3 py-2">
						<code class="truncate text-sm">{u}</code>
						<button class="btn btn-icon !h-8 !w-8" onclick={() => copy(u)} aria-label="Kopieren">
							<Copy class="h-4 w-4" />
						</button>
					</li>
				{/each}
			</ul>
		{:else}
			<p class="text-sm text-muted">Keine Netzwerk-Adresse gefunden.</p>
		{/if}
	</Card>

	<Card title="Sicherheit">
		<div class="flex items-start gap-3 text-sm">
			<Lock class="mt-0.5 h-4 w-4 text-muted" />
			<div>
				{#if data.pinEnabled}
					<p class="font-medium text-success">PIN-Schutz aktiv</p>
				{:else}
					<p class="font-medium">Kein PIN-Schutz</p>
					<p class="text-muted">
						Setze <code>APP_PIN</code> in der <code>.env</code>, um die App im WLAN mit einer PIN zu
						schützen.
					</p>
				{/if}
			</div>
		</div>
	</Card>

	<Card title="Mit Claude Code bearbeiten">
		<div class="flex items-start gap-3 text-sm">
			<Sparkles class="mt-0.5 h-4 w-4 text-primary" />
			<p class="text-muted">
				Alle Kampagnendaten liegen als Dateien in <code>campaign/</code>. Zuhause am PC kannst du sie
				gemeinsam mit Claude Code direkt bearbeiten — das Dashboard aktualisiert sich live.
			</p>
		</div>
	</Card>

	<Card title="Speicherort" class="md:col-span-2">
		<dl class="grid gap-2 text-sm">
			<div>
				<dt class="text-muted">Kampagnendaten (Dateien + Git)</dt>
				<dd><code class="break-all">{data.campaignDir}</code></dd>
			</div>
		</dl>
		<p class="mt-2 text-xs text-muted">
			Versionierung & Sync zwischen Geräten über Git (<code>git pull</code> / <code>git push</code>).
		</p>
	</Card>
</div>

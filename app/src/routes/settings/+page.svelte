<script lang="ts">
	import { toasts } from '$lib/stores/toast.svelte';
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
	<Card title="Darstellung">
		<div class="flex items-center justify-between">
			<span class="text-sm">Hell / Dunkel</span>
			<ThemeToggle />
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

	<Card title="KI-Import (Phase 2)">
		<div class="flex items-start gap-3 text-sm">
			<Sparkles class="mt-0.5 h-4 w-4 text-primary" />
			<p class="text-muted">
				Audio-/Text-Import mit austauschbarem Modell (Gemini oder lokal via Ollama) und
				Diff-Vorschau folgt im KI-Sidecar.
			</p>
		</div>
	</Card>

	<Card title="Speicherorte" class="md:col-span-2">
		<dl class="grid gap-2 text-sm sm:grid-cols-2">
			<div>
				<dt class="text-muted">Vault (Markdown)</dt>
				<dd><code class="break-all">{data.vaultDir}</code></dd>
			</div>
			<div>
				<dt class="text-muted">Daten (SQLite)</dt>
				<dd><code class="break-all">{data.dataDir}</code></dd>
			</div>
		</dl>
	</Card>
</div>

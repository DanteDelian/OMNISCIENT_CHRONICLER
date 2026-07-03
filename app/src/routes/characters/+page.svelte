<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { character } from '$lib/stores/character.svelte';
	import { toasts } from '$lib/stores/toast.svelte';
	import { sound } from '$lib/sound';
	import Card from '$lib/components/ui/Card.svelte';
	import Plus from '@lucide/svelte/icons/plus';
	import Check from '@lucide/svelte/icons/check';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import UsersRound from '@lucide/svelte/icons/users-round';
	import Sparkles from '@lucide/svelte/icons/sparkles';

	interface CharSummary {
		id: string;
		name: string;
		race: string;
		className: string;
		level: number;
		portrait: string;
		hp: { current: number; max: number };
		active: boolean;
	}

	let chars = $state<CharSummary[]>([]);
	let creating = $state(false);
	let pendingDel = $state<string | null>(null);

	// Formular
	let name = $state('');
	let race = $state('');
	let className = $state('');
	let level = $state(1);
	let portrait = $state('🧙');
	const EMOJIS = ['🧙', '🧝', '🛡️', '🗡️', '🏹', '🪓', '🐉', '🦊', '🌙', '🔥', '🎭', '🍀'];

	async function load() {
		const r = await fetch('/api/characters');
		if (r.ok) chars = await r.json();
	}
	onMount(() => {
		load();
		if (page.url.searchParams.get('neu')) creating = true;
	});

	const isImage = (p: string) => p.includes('/') || p.includes('.');

	async function create() {
		if (!name.trim()) return;
		const r = await fetch('/api/characters', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ name, race, className, level, portrait, activate: true })
		});
		if (!r.ok) {
			toasts.push('Anlegen fehlgeschlagen', '', 'bad');
			return;
		}
		sound.levelUp();
		toasts.push('Charakter erstellt!', name, 'good');
		creating = false;
		name = race = className = '';
		level = 1;
		await character.refresh();
		await goto('/character');
	}

	async function activate(id: string) {
		await fetch(`/api/characters/${id}`, {
			method: 'PATCH',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ active: true })
		});
		sound.click();
		await character.refresh();
		await load();
		const c = chars.find((x) => x.id === id);
		toasts.push('Charakter gewechselt', c?.name ?? '', 'good');
	}

	async function del(id: string) {
		if (pendingDel !== id) {
			pendingDel = id;
			setTimeout(() => {
				if (pendingDel === id) pendingDel = null;
			}, 3000);
			return;
		}
		pendingDel = null;
		await fetch(`/api/characters/${id}`, { method: 'DELETE' });
		await character.refresh();
		await load();
		toasts.push('Charakter gelöscht', 'Hinweis: Wiederherstellen geht über Git (Datei in campaign/characters/)');
	}
</script>

<svelte:head><title>Charaktere · Omniscient Chronicler</title></svelte:head>

<div class="mb-4 flex items-center justify-between">
	<div>
		<h1 class="font-display text-2xl font-bold">Charaktere</h1>
		<p class="text-sm text-muted">Verwalte die Helden dieser Kampagne — der aktive Bogen läuft überall im Dashboard.</p>
	</div>
	<button class="btn btn-primary" onclick={() => (creating = !creating)}>
		<Plus class="h-4 w-4" /> Neuer Charakter
	</button>
</div>

{#if creating}
	<Card class="card-ornate mb-4">
		<h2 class="panel-title mb-3">Neuen Charakter erschaffen</h2>
		<form
			class="flex flex-col gap-3"
			onsubmit={(e) => {
				e.preventDefault();
				create();
			}}
		>
			<div class="grid gap-2 sm:grid-cols-2">
				<!-- svelte-ignore a11y_autofocus -->
				<input class="input" placeholder="Name (z.B. Draka Stormscale)" bind:value={name} autofocus required />
				<input class="input" placeholder="Volk (z.B. Dragonborn)" bind:value={race} />
				<input class="input" placeholder="Klasse (z.B. Barbarin)" bind:value={className} />
				<label class="flex items-center gap-2 text-sm text-muted">
					Stufe
					<input class="input !w-20 text-center" type="number" min="1" max="20" bind:value={level} />
				</label>
			</div>
			<div>
				<span class="mb-1 block text-xs text-muted">Porträt (später auch Bild möglich)</span>
				<div class="flex flex-wrap gap-1">
					{#each EMOJIS as e (e)}
						<button
							type="button"
							class="grid h-11 w-11 place-items-center rounded-xl border text-2xl transition {portrait === e
								? 'border-primary bg-primary/15'
								: 'border-border bg-surface2 hover:border-primary/40'}"
							onclick={() => (portrait = e)}
						>
							{e}
						</button>
					{/each}
				</div>
			</div>
			<div class="flex justify-end gap-2">
				<button type="button" class="btn" onclick={() => (creating = false)}>Abbrechen</button>
				<button type="submit" class="btn btn-primary" disabled={!name.trim()}>
					<Sparkles class="h-4 w-4" /> Erschaffen & aktivieren
				</button>
			</div>
		</form>
	</Card>
{/if}

<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
	{#each chars as ch (ch.id)}
		<div class="card card-pad {ch.active ? 'card-ornate ring-1 ring-accent/40' : 'card-hover'}">
			<div class="flex items-center gap-3">
				<span
					class="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl border-2 {ch.active
						? 'border-accent/60'
						: 'border-border'} bg-surface2"
				>
					{#if isImage(ch.portrait)}
						<img src={ch.portrait} alt={ch.name} class="h-full w-full object-cover" />
					{:else}
						<span class="text-4xl leading-none">{ch.portrait || '🧙'}</span>
					{/if}
				</span>
				<div class="min-w-0 flex-1">
					<span class="flex items-center gap-2">
						<span class="truncate font-display text-lg font-bold">{ch.name}</span>
						{#if ch.active}<span class="chip shrink-0 !border-accent/50 !py-0.5 text-[10px] !text-accent">AKTIV</span>{/if}
					</span>
					<span class="block truncate text-sm text-muted">
						Stufe {ch.level}{ch.race ? ` · ${ch.race}` : ''}{ch.className ? ` · ${ch.className}` : ''}
					</span>
					<span class="text-xs text-muted">TP {ch.hp.current}/{ch.hp.max}</span>
				</div>
			</div>
			<div class="mt-3 flex items-center gap-2">
				{#if ch.active}
					<a class="btn flex-1" href="/character"><Check class="h-4 w-4" /> Zum Bogen</a>
				{:else}
					<button class="btn btn-primary flex-1" onclick={() => activate(ch.id)}>Aktivieren</button>
				{/if}
				<button
					class="btn btn-icon !h-10 !w-10 text-danger {pendingDel === ch.id ? '!bg-danger !text-white' : 'btn-ghost'}"
					onclick={() => del(ch.id)}
					disabled={ch.active && chars.length > 1}
					title={ch.active && chars.length > 1
						? 'Erst einen anderen Charakter aktivieren'
						: pendingDel === ch.id
							? 'Nochmal tippen zum Löschen'
							: 'Löschen'}
					aria-label="Löschen"
				>
					<Trash2 class="h-4 w-4" />
				</button>
			</div>
		</div>
	{:else}
		<div class="card card-pad col-span-full grid place-items-center py-14 text-center">
			<UsersRound class="mb-3 h-10 w-10 text-muted opacity-40" />
			<p class="font-display text-lg font-bold">Noch keine Helden in dieser Kampagne</p>
			<p class="mt-1 text-sm text-muted">Erschaffe deinen ersten Charakter — dauert 10 Sekunden.</p>
			<button class="btn btn-primary mt-4" onclick={() => (creating = true)}>
				<Plus class="h-4 w-4" /> Ersten Charakter erstellen
			</button>
		</div>
	{/each}
</div>

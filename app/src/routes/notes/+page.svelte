<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { renderMarkdown } from '$lib/markdown';
	import { toasts } from '$lib/stores/toast.svelte';
	import FileText from '@lucide/svelte/icons/file-text';
	import Plus from '@lucide/svelte/icons/plus';
	import Save from '@lucide/svelte/icons/save';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import Eye from '@lucide/svelte/icons/eye';
	import Pencil from '@lucide/svelte/icons/pencil';

	let { data } = $props();

	let body = $state('');
	let view = $state<'edit' | 'preview'>('edit');
	let dirty = $state(false);
	let lastPath = $state<string | null>(null);

	// Body neu laden, wenn eine andere Notiz gewählt wird.
	$effect(() => {
		const sel = data.selected;
		if (sel && sel.path !== lastPath) {
			body = sel.body;
			lastPath = sel.path;
			dirty = false;
		} else if (!sel) {
			lastPath = null;
		}
	});

	function open(path: string) {
		goto('/notes?path=' + encodeURIComponent(path));
	}

	async function newNote() {
		const title = prompt('Titel der neuen Notiz');
		if (!title) return;
		const res = await fetch('/api/notes', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ title })
		});
		const note = await res.json();
		await goto('/notes?path=' + encodeURIComponent(note.path));
		await invalidateAll();
	}

	async function save() {
		if (!data.selected) return;
		await fetch('/api/notes/file', {
			method: 'PUT',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({
				path: data.selected.path,
				body,
				frontmatter: data.selected.frontmatter
			})
		});
		dirty = false;
		toasts.push('Gespeichert', data.selected.title, 'good');
		await invalidateAll();
	}

	async function del() {
		if (!data.selected) return;
		if (!confirm(`„${data.selected.title}" löschen?`)) return;
		await fetch('/api/notes/file?path=' + encodeURIComponent(data.selected.path), {
			method: 'DELETE'
		});
		await goto('/notes');
		await invalidateAll();
	}

	function onKey(e: KeyboardEvent) {
		if ((e.ctrlKey || e.metaKey) && e.key === 's') {
			e.preventDefault();
			save();
		}
	}
</script>

<svelte:head><title>Notizen · Omniscient Chronicler</title></svelte:head>
<svelte:window onkeydown={onKey} />

<div class="grid gap-4 md:grid-cols-[280px_1fr]">
	<!-- Liste -->
	<aside class="card card-pad md:max-h-[calc(100dvh-7rem)] md:overflow-auto" class:hidden={!!data.selected}>
		<div class="mb-3 flex items-center justify-between">
			<h2 class="panel-title">Notizen ({data.notes.length})</h2>
			<button class="btn btn-icon !h-8 !w-8" onclick={newNote} aria-label="Neue Notiz">
				<Plus class="h-4 w-4" />
			</button>
		</div>
		<ul class="flex flex-col gap-1">
			{#each data.notes as note (note.path)}
				<li>
					<button
						class="flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left transition hover:bg-surface2
							{data.selected?.path === note.path ? 'bg-surface2' : ''}"
						onclick={() => open(note.path)}
					>
						<FileText class="mt-0.5 h-4 w-4 shrink-0 text-muted" />
						<span class="min-w-0">
							<span class="block truncate text-sm font-medium">{note.title}</span>
							<span class="block truncate text-xs text-muted">{note.excerpt || note.path}</span>
						</span>
					</button>
				</li>
			{/each}
			{#if data.notes.length === 0}
				<li class="px-2 py-6 text-center text-sm text-muted">Noch keine Notizen.</li>
			{/if}
		</ul>
	</aside>

	<!-- Editor -->
	<section class="card card-pad min-h-[60vh]">
		{#if data.selected}
			<div class="mb-3 flex flex-wrap items-center justify-between gap-2">
				<div class="flex items-center gap-2">
					<button class="btn btn-ghost !px-2 md:hidden" onclick={() => goto('/notes')}>←</button>
					<div>
						<h2 class="font-display text-lg font-bold leading-tight">{data.selected.title}</h2>
						<span class="text-xs text-muted">{data.selected.path}{dirty ? ' · ungespeichert' : ''}</span>
					</div>
				</div>
				<div class="flex items-center gap-1">
					<button class="btn btn-icon" onclick={() => (view = view === 'edit' ? 'preview' : 'edit')} title="Ansicht wechseln">
						{#if view === 'edit'}<Eye class="h-4 w-4" />{:else}<Pencil class="h-4 w-4" />{/if}
					</button>
					<button class="btn btn-icon btn-ghost text-danger" onclick={del} aria-label="Löschen">
						<Trash2 class="h-4 w-4" />
					</button>
					<button class="btn btn-primary" onclick={save} disabled={!dirty}>
						<Save class="h-4 w-4" /> Speichern
					</button>
				</div>
			</div>

			{#if view === 'edit'}
				<textarea
					class="input min-h-[55vh] resize-none font-mono text-sm leading-relaxed"
					bind:value={body}
					oninput={() => (dirty = true)}
					placeholder="# Titel&#10;&#10;Schreibe in Markdown. [[Wikilinks]] werden verlinkt."
				></textarea>
			{:else}
				<div class="prose prose-sm max-w-none dark:prose-invert">
					<!-- eslint-disable-next-line svelte/no-at-html-tags -->
					{@html renderMarkdown(body)}
				</div>
			{/if}
		{:else}
			<div class="grid min-h-[55vh] place-items-center text-center text-muted">
				<div>
					<FileText class="mx-auto mb-3 h-10 w-10 opacity-40" />
					<p>Wähle links eine Notiz oder erstelle eine neue.</p>
					<button class="btn btn-primary mt-4" onclick={newNote}>
						<Plus class="h-4 w-4" /> Neue Notiz
					</button>
				</div>
			</div>
		{/if}
	</section>
</div>

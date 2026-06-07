<script lang="ts">
	import { goto } from '$app/navigation';
	import Plus from '@lucide/svelte/icons/plus';
	import X from '@lucide/svelte/icons/x';

	let open = $state(false);
	let text = $state('');
	let saving = $state(false);

	async function save() {
		const trimmed = text.trim();
		if (!trimmed) {
			open = false;
			return;
		}
		saving = true;
		try {
			const title = trimmed.split('\n')[0].replace(/^#+\s*/, '').slice(0, 60) || 'Schnellnotiz';
			const res = await fetch('/api/notes', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ title })
			});
			const note = await res.json();
			await fetch('/api/notes/file', {
				method: 'PUT',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ path: note.path, body: `# ${title}\n\n${trimmed}\n` })
			});
			open = false;
			text = '';
			await goto('/notes?path=' + encodeURIComponent(note.path));
		} finally {
			saving = false;
		}
	}

	function onKey(e: KeyboardEvent) {
		if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') save();
		if (e.key === 'Escape') open = false;
	}
</script>

<button
	class="btn btn-primary fixed bottom-24 right-4 z-40 h-14 w-14 rounded-full shadow-lg md:bottom-6 md:right-6"
	onclick={() => (open = true)}
	aria-label="Schnellnotiz"
	title="Schnellnotiz (neue Notiz)"
>
	<Plus class="h-6 w-6" />
</button>

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 backdrop-blur-sm sm:items-center"
		onclick={(e) => e.target === e.currentTarget && (open = false)}
	>
		<div class="card card-pad w-full max-w-lg">
			<div class="mb-3 flex items-center justify-between">
				<h3 class="text-lg font-semibold">Schnellnotiz</h3>
				<button class="btn btn-icon btn-ghost" onclick={() => (open = false)} aria-label="Schließen">
					<X class="h-5 w-5" />
				</button>
			</div>
			<!-- svelte-ignore a11y_autofocus -->
			<textarea
				bind:value={text}
				onkeydown={onKey}
				autofocus
				rows="5"
				placeholder="Gedanke festhalten… (erste Zeile = Titel)"
				class="input resize-none"
			></textarea>
			<div class="mt-3 flex items-center justify-between">
				<span class="text-xs text-muted">Strg+Enter zum Speichern</span>
				<button class="btn btn-primary" onclick={save} disabled={saving}>
					{saving ? 'Speichert…' : 'Speichern'}
				</button>
			</div>
		</div>
	</div>
{/if}

<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { QUEST_STATUS_LABELS, type Quest, type QuestStatus } from '$lib/types';
	import Plus from '@lucide/svelte/icons/plus';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';

	let { data } = $props();

	const COLUMNS: { status: QuestStatus; accent: string }[] = [
		{ status: 'rumor', accent: 'text-accent' },
		{ status: 'active', accent: 'text-primary' },
		{ status: 'done', accent: 'text-success' }
	];
	const ORDER: QuestStatus[] = ['rumor', 'active', 'done'];

	function byStatus(s: QuestStatus): Quest[] {
		return data.quests.filter((q) => q.status === s);
	}

	async function add(status: QuestStatus) {
		const title = prompt('Quest-Titel');
		if (!title) return;
		await fetch('/api/quests', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ title, status })
		});
		await invalidateAll();
	}

	async function patch(id: string, patch: Partial<Quest>) {
		await fetch(`/api/quests/${id}`, {
			method: 'PATCH',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(patch)
		});
		await invalidateAll();
	}

	async function move(q: Quest, dir: -1 | 1) {
		const idx = ORDER.indexOf(q.status);
		const next = ORDER[idx + dir];
		if (next) patch(q.id, { status: next });
	}

	async function del(id: string) {
		if (!confirm('Quest löschen?')) return;
		await fetch(`/api/quests/${id}`, { method: 'DELETE' });
		await invalidateAll();
	}

	const prioCls: Record<string, string> = {
		high: 'border-danger/50 text-danger',
		normal: 'text-muted',
		low: 'opacity-60'
	};
</script>

<svelte:head><title>Quests · Omniscient Chronicler</title></svelte:head>

<h1 class="mb-4 font-display text-2xl font-bold">Quest-Tagebuch</h1>

<div class="grid gap-4 lg:grid-cols-3">
	{#each COLUMNS as col (col.status)}
		<div class="card card-pad">
			<div class="mb-3 flex items-center justify-between">
				<h2 class="panel-title {col.accent}">{QUEST_STATUS_LABELS[col.status]}</h2>
				<button class="btn btn-icon !h-8 !w-8" onclick={() => add(col.status)} aria-label="Quest hinzufügen">
					<Plus class="h-4 w-4" />
				</button>
			</div>
			<div class="flex flex-col gap-2">
				{#each byStatus(col.status) as q (q.id)}
					<div class="rounded-xl border border-border bg-surface2 p-3">
						<input
							class="w-full bg-transparent font-semibold outline-none focus:text-primary"
							value={q.title}
							onchange={(e) => patch(q.id, { title: e.currentTarget.value })}
						/>
						<input
							class="mt-1 w-full bg-transparent text-sm text-muted outline-none"
							value={q.nextStep}
							placeholder="Nächster Schritt…"
							onchange={(e) => patch(q.id, { nextStep: e.currentTarget.value })}
						/>
						<div class="mt-2 flex items-center justify-between gap-2">
							<select
								class="rounded-md border border-border bg-surface px-1.5 py-1 text-xs {prioCls[q.priority]}"
								value={q.priority}
								onchange={(e) => patch(q.id, { priority: e.currentTarget.value as Quest['priority'] })}
							>
								<option value="high">Hoch</option>
								<option value="normal">Normal</option>
								<option value="low">Niedrig</option>
							</select>
							<div class="flex items-center gap-1">
								<button class="btn btn-icon btn-ghost !h-7 !w-7" onclick={() => move(q, -1)} disabled={q.status === 'rumor'} aria-label="Zurück">
									<ChevronLeft class="h-4 w-4" />
								</button>
								<button class="btn btn-icon btn-ghost !h-7 !w-7" onclick={() => move(q, 1)} disabled={q.status === 'done'} aria-label="Weiter">
									<ChevronRight class="h-4 w-4" />
								</button>
								<button class="btn btn-icon btn-ghost !h-7 !w-7 text-danger" onclick={() => del(q.id)} aria-label="Löschen">
									<Trash2 class="h-4 w-4" />
								</button>
							</div>
						</div>
					</div>
				{/each}
				{#if byStatus(col.status).length === 0}
					<p class="px-1 py-4 text-center text-sm text-muted">Leer</p>
				{/if}
			</div>
		</div>
	{/each}
</div>

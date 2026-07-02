<script lang="ts">
	import { toasts } from '$lib/stores/toast.svelte';
	import { fly } from 'svelte/transition';
</script>

<!-- Mobil: unten (über der Bottom-Nav), Desktop: oben rechts -->
<div
	class="pointer-events-none fixed inset-x-4 bottom-40 z-[60] flex flex-col gap-2
		md:inset-x-auto md:bottom-auto md:right-4 md:top-4 md:w-72"
>
	{#each toasts.items as t (t.id)}
		<div
			class="card pointer-events-auto flex items-center gap-2 card-pad py-3 shadow-lg
				{t.tone === 'good' ? 'border-success/50' : t.tone === 'bad' ? 'border-danger/50' : ''}"
			transition:fly={{ y: 20, duration: 200 }}
		>
			<button class="min-w-0 flex-1 text-left" onclick={() => toasts.dismiss(t.id)}>
				<span class="block truncate font-semibold">{t.msg}</span>
				{#if t.sub}<span class="block text-xs text-muted">{t.sub}</span>{/if}
			</button>
			{#if t.action}
				<button
					class="btn btn-primary shrink-0 !px-3 !py-1.5 text-xs"
					onclick={() => toasts.runAction(t.id)}
				>
					{t.action.label}
				</button>
			{/if}
		</div>
	{/each}
</div>

<script lang="ts">
	import { toasts } from '$lib/stores/toast.svelte';
	import { fly } from 'svelte/transition';
</script>

<div class="pointer-events-none fixed right-4 top-4 z-[60] flex w-72 flex-col gap-2">
	{#each toasts.items as t (t.id)}
		<button
			class="card pointer-events-auto card-pad py-3 text-left shadow-lg
				{t.tone === 'good' ? 'border-success/50' : t.tone === 'bad' ? 'border-danger/50' : ''}"
			onclick={() => toasts.dismiss(t.id)}
			transition:fly={{ x: 30, duration: 200 }}
		>
			<div class="font-semibold">{t.msg}</div>
			{#if t.sub}<div class="text-xs text-muted">{t.sub}</div>{/if}
		</button>
	{/each}
</div>

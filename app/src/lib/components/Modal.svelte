<script lang="ts">
	import type { Snippet } from 'svelte';
	import { X } from '@lucide/svelte';
	import { fade, scale } from 'svelte/transition';

	let {
		open,
		title,
		subtitle = '',
		width = 'max-w-lg',
		onclose,
		children,
		footer
	}: {
		open: boolean;
		title: string;
		subtitle?: string;
		width?: string;
		onclose: () => void;
		children: Snippet;
		footer?: Snippet;
	} = $props();

	function onkey(e: KeyboardEvent) {
		if (open && e.key === 'Escape') onclose();
	}
</script>

<svelte:window onkeydown={onkey} />

{#if open}
	<div class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 pt-[10vh]" role="presentation">
		<button class="fixed inset-0 bg-black/60 backdrop-blur-sm" aria-label="Schließen" onclick={onclose} transition:fade={{ duration: 120 }}></button>
		<div class="panel relative w-full {width} p-5" role="dialog" aria-modal="true" aria-label={title} transition:scale={{ start: 0.97, duration: 160 }}>
			<div class="mb-4 flex items-start justify-between gap-4">
				<div>
					<h2 class="title-display text-2xl">{title}</h2>
					{#if subtitle}<p class="mt-1 text-sm text-ink-3">{subtitle}</p>{/if}
				</div>
				<button class="icon-btn" onclick={onclose} aria-label="Schließen"><X size={18} /></button>
			</div>
			{@render children()}
			{#if footer}<div class="mt-5 flex justify-end gap-2">{@render footer()}</div>{/if}
		</div>
	</div>
{/if}

<script lang="ts">
	import { slide } from 'svelte/transition';
	import { character } from '$lib/stores/character.svelte';
	import { renderMarkdown } from '$lib/markdown';
	import type { Feature } from '$lib/types';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';

	const c = $derived(character.current);
	let expanded = $state<string | null>(null);

	function setUses(feature: Feature, current: number) {
		if (!c || !feature.uses) return;
		const features = c.features.map((f) =>
			f.id === feature.id && f.uses ? { ...f, uses: { ...f.uses, current } } : f
		);
		character.patch({ features });
	}

	function pip(feature: Feature, i: number) {
		if (!feature.uses) return;
		const cur = feature.uses.current;
		// Klick auf höchsten gefüllten Punkt = verbrauchen, sonst auffüllen bis i+1
		setUses(feature, cur === i + 1 ? i : i + 1);
	}
</script>

{#if c}
	{#if c.features.length === 0}
		<p class="py-2 text-center text-sm text-muted">Keine Merkmale eingetragen.</p>
	{:else}
		<div class="flex flex-col gap-1.5">
			{#each c.features as f (f.id)}
				<div class="rounded-xl border border-border bg-surface2">
					<button
						class="flex w-full items-center gap-2 px-3 py-2 text-left"
						onclick={() => (expanded = expanded === f.id ? null : f.id)}
					>
						<span class="min-w-0 flex-1">
							<span class="block truncate text-sm font-semibold">{f.name}</span>
							<span class="text-[11px] text-muted">{f.source}</span>
						</span>
						{#if f.uses}
							<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
							<span class="flex shrink-0 items-center gap-1" onclick={(e) => e.stopPropagation()}>
								{#each Array(f.uses.max) as _, i (i)}
									<span
										class="grid h-6 w-6 cursor-pointer place-items-center"
										role="button"
										tabindex="0"
										onclick={() => pip(f, i)}
										onkeydown={(e) => e.key === 'Enter' && pip(f, i)}
										title="{f.uses.current}/{f.uses.max} · Rast: {f.uses.resetOn === 'long' ? 'lang' : 'kurz'}"
									>
										<span
											class="h-3.5 w-3.5 rounded-full border-2 transition {i < f.uses.current
												? 'border-accent bg-accent'
												: 'border-muted'}"
										></span>
									</span>
								{/each}
							</span>
						{/if}
						<ChevronDown class="h-4 w-4 shrink-0 text-muted transition {expanded === f.id ? 'rotate-180' : ''}" />
					</button>
					{#if expanded === f.id}
						<div class="prose prose-sm max-w-none border-t border-border/60 px-3 py-2 dark:prose-invert" transition:slide={{ duration: 160 }}>
							<!-- eslint-disable-next-line svelte/no-at-html-tags -->
							{@html renderMarkdown(f.description)}
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
{/if}

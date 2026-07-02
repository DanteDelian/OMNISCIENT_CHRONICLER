<script lang="ts">
	import type { SpellSchool } from '$lib/types';

	let { school, class: cls = 'h-4 w-4' }: { school: SpellSchool; class?: string } = $props();
</script>

<!-- Handgezeichnete Zauberschulen-Glyphen (Linien-Stil, färben sich über currentColor) -->
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class={cls} aria-hidden="true">
	{#if school === 'abjuration'}
		<!-- Schild -->
		<path d="M12 3 L19 6 V11 C19 15.5 16 19 12 21 C8 19 5 15.5 5 11 V6 Z" />
		<path d="M12 8 V13" />
	{:else if school === 'conjuration'}
		<!-- Beschwörungsportal -->
		<circle cx="12" cy="12" r="7.5" />
		<circle cx="12" cy="12" r="3.5" stroke-dasharray="2 2.4" />
		<path d="M12 1.5 V4 M12 20 V22.5 M1.5 12 H4 M20 12 H22.5" />
	{:else if school === 'divination'}
		<!-- Alles sehendes Auge -->
		<path d="M2.5 12 C5.5 6.5 18.5 6.5 21.5 12 C18.5 17.5 5.5 17.5 2.5 12 Z" />
		<circle cx="12" cy="12" r="2.6" />
	{:else if school === 'enchantment'}
		<!-- Verzaubernder Wirbel -->
		<path d="M12 4 C17 4 20 8 19 12 C18.2 15.4 14 16.5 12 14.5 C10.3 12.8 11.5 10 13.6 10" />
		<path d="M6 18 L7 16 M4.5 13.5 L6.5 13" />
		<circle cx="12" cy="12" r="0.5" />
	{:else if school === 'evocation'}
		<!-- Flamme -->
		<path d="M12 3 C13 7 17 8.5 17 13 A5 5 0 0 1 7 13 C7 10.5 8.5 9 9.5 7.5 C10.3 9 11.5 9.4 12 3 Z" />
		<path d="M12 21 V17" />
	{:else if school === 'illusion'}
		<!-- Doppelter Mond -->
		<path d="M15 4 A8 8 0 1 0 15 20 A6.5 6.5 0 0 1 15 4 Z" />
		<path d="M17 9 L17.6 10.6 L19.2 11.2 L17.6 11.8 L17 13.4 L16.4 11.8 L14.8 11.2 L16.4 10.6 Z" stroke-width="1.2" />
	{:else if school === 'necromancy'}
		<!-- Schädel -->
		<path d="M12 3 C7.5 3 5 6.2 5 10 C5 12.6 6.3 14.4 8 15.4 V18 H16 V15.4 C17.7 14.4 19 12.6 19 10 C19 6.2 16.5 3 12 3 Z" />
		<circle cx="9.3" cy="10.3" r="1.3" fill="currentColor" stroke="none" />
		<circle cx="14.7" cy="10.3" r="1.3" fill="currentColor" stroke="none" />
		<path d="M10 21 V18.5 M14 21 V18.5" />
	{:else}
		<!-- Verwandlung: Kreislauf -->
		<path d="M6 9 A7 7 0 0 1 18 9" />
		<path d="M18 5.5 V9 H14.5" />
		<path d="M18 15 A7 7 0 0 1 6 15" />
		<path d="M6 18.5 V15 H9.5" />
	{/if}
</svg>

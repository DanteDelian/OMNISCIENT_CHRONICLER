<script lang="ts">
	let { class: cls = 'h-6 w-6' }: { class?: string } = $props();
</script>

<!-- Ikosaeder-Silhouette (d20) — färbt sich über currentColor -->
<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round" class={cls} aria-hidden="true">
	<!-- Außenkontur -->
	<polygon points="50,3 91,26 91,74 50,97 9,74 9,26" fill="color-mix(in oklab, currentColor 10%, transparent)" />
	<!-- zentrale Facette -->
	<polygon points="50,20 79,68 21,68" />
	<!-- Kanten zu den Außenecken -->
	<path d="M50 3 L50 20 M91 26 L79 68 M9 26 L21 68 M91 74 L79 68 M9 74 L21 68 M50 97 L79 68 M50 97 L21 68 M9 26 L50 20 M91 26 L50 20" />
</svg>

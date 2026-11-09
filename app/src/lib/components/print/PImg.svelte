<script lang="ts">
	/**
	 * Bild für die Druckfassung. Nimmt „<name>-druck.jpg“, wenn es die Datei gibt:
	 * Chrome bettet JPEGs unverändert ins PDF ein, WebP dagegen verlustfrei und groß.
	 * Fehlt auch das Original (Bild noch nicht erzeugt), entfällt das Bild ganz, damit der Druck nicht hängt.
	 */
	let { name, alt = '', class: cls = '', style = '' }: { name: string; alt?: string; class?: string; style?: string } = $props();

	const druck = $derived(name.replace(/\.(webp|png|jpe?g)$/i, '-druck.jpg'));
	let tries = $state(0);
</script>

{#if tries < 2}
	<img class={cls} {style} {alt} src="/api/assets/{tries ? name : druck}" onerror={() => tries++} />
{/if}

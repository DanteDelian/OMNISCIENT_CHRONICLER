<script lang="ts">
	/**
	 * Bild für die Druckfassung. Nimmt „<name>-druck.jpg“, wenn es die Datei gibt:
	 * Chrome bettet JPEGs unverändert ins PDF ein, WebP dagegen verlustfrei und groß.
	 */
	let { name, alt = '', class: cls = '', style = '' }: { name: string; alt?: string; class?: string; style?: string } = $props();

	const druck = $derived(name.replace(/\.(webp|png|jpe?g)$/i, '-druck.jpg'));
	let failed = $state(false);
</script>

<img class={cls} {style} {alt} src="/api/assets/{failed ? name : druck}" onerror={() => (failed = true)} />

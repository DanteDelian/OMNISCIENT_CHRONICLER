<script lang="ts">
	import PDoc from './PDoc.svelte';
	import PMd from './PMd.svelte';
	import type { DocFile } from '$lib/types';
	import { dateDe } from '$lib/print';

	let { doc }: { doc: DocFile } = $props();

	/** Der erste #-Titel wiederholt den Dokumenttitel, die Kopfzeile zeigt ihn schon. */
	const body = $derived(doc.body.replace(/^#\s+(.*)\n+/, (line, h: string) => (h.startsWith(doc.title) ? '' : line)));
</script>

<PDoc id="doc-{doc.slug}" refs={[`doc:${doc.slug}`]} eyebrow="Archiv · {doc.group}" title={doc.title} subtitle="{doc.subtitle ?? ''}{doc.updated ? ` · Stand ${dateDe(doc.updated)}` : ''}">
	<PMd src={body} />
</PDoc>

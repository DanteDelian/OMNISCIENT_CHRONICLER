<script lang="ts">
	import PDoc from './PDoc.svelte';
	import { campaign } from '$lib/stores/campaign.svelte';
	import { glossaryGroups } from '$lib/terms';

	const groups = $derived(glossaryGroups(campaign.data.character.features));
</script>

<PDoc id="begriffe" eyebrow="Am Tisch" title="Deutsch – Englisch" subtitle="Für den DM, der gern Denglisch spricht: Proben, Zustände, Zauberbegriffe und deine Merkmale." compact>
	<div class="cols-3 gloss">
		{#each groups as g (g.group)}
			<div class="gloss-group">
				<div class="label">{g.group}</div>
				{#each g.terms as [de, en] (de)}
					<div class="gloss-row"><span>{de}</span><i>{en}</i></div>
				{/each}
			</div>
		{/each}
	</div>
</PDoc>

<script lang="ts">
	/** Astrale Trance: täglich eine Waffe oder ein Werkzeug wählen (Hausregel eures DM: keine Fertigkeit). */
	import { campaign } from '$lib/stores/campaign.svelte';
	import { TRANCE_TOOLS } from '$lib/rules';
	import { ui } from '$lib/stores/ui.svelte';

	const s = $derived(campaign.data.state);

	function set(v: string) {
		campaign.change('state', (st) => {
			st.trance = { tool: v };
		});
	}
</script>

<label class="block">
	<span class="mb-1 block text-xs text-ink-3">Waffe oder Werkzeug</span>
	<input class="input" list="trance-tools" value={s.trance.tool} onchange={(e) => set(e.currentTarget.value)} placeholder="z. B. Alchemistenwerkzeug" />
	<datalist id="trance-tools">
		{#each TRANCE_TOOLS as t (t)}<option value={t}></option>{/each}
	</datalist>
</label>
<p class="mt-2 text-xs leading-relaxed text-ink-3">
	Hausregel eures DM: nur Waffe oder Werkzeug, keine Fertigkeit. Die Übung hält bis zum Ende deiner nächsten langen Rast. Tipps: Alchemistenwerkzeug für
	Alchemistenfeuer und Säure, Kräuterkundeausrüstung für Heiltränke, Holzschnitzwerkzeug für bis zu 20 Pfeile pro Rast, Verkleidungsausrüstung für eine neue
	Identität. Mehr in der <a class="text-astral hover:underline" href="/werkstatt" onclick={() => (ui.rest = null)}>Werkstatt</a>.
</p>

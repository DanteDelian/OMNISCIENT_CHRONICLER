<script lang="ts">
	/** Astrale Trance: täglich eine Fertigkeit und eine Waffe oder ein Werkzeug wählen. */
	import { campaign } from '$lib/stores/campaign.svelte';
	import { SKILLS, TRANCE_TOOLS, skillBonus, fmtMod } from '$lib/rules';

	const c = $derived(campaign.data.character);
	const s = $derived(campaign.data.state);
	const open = $derived(SKILLS.filter((k) => !c.skills[k.key]));

	function set(field: 'skill' | 'tool', v: string) {
		campaign.change('state', (st) => {
			st.trance = { ...st.trance, [field]: v };
		});
	}
</script>

<div class="grid gap-3 sm:grid-cols-2">
	<label class="block">
		<span class="mb-1 block text-xs text-ink-3">Fertigkeit</span>
		<select class="input" value={s.trance.skill} onchange={(e) => set('skill', e.currentTarget.value)}>
			<option value="">— keine —</option>
			{#each open as k (k.key)}
				<option value={k.key}>{k.name} (dann {fmtMod(skillBonus(c, { ...s, trance: { ...s.trance, skill: k.key } }, k.key))})</option>
			{/each}
		</select>
	</label>
	<label class="block">
		<span class="mb-1 block text-xs text-ink-3">Waffe oder Werkzeug</span>
		<input class="input" list="trance-tools" value={s.trance.tool} onchange={(e) => set('tool', e.currentTarget.value)} placeholder="z. B. Kräuterkundeausrüstung" />
		<datalist id="trance-tools">
			{#each TRANCE_TOOLS as t (t)}<option value={t}></option>{/each}
		</datalist>
	</label>
</div>
<p class="mt-2 text-xs text-ink-3">Tipp: Heimlichkeit für die Unsichtbare Hand, Überzeugen für Lisbeth und Leon. Kräuterkunde für Heiltränke, Verkleidung für die neue Identität.</p>

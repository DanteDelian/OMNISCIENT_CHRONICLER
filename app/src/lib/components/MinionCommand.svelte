<script lang="ts">
	/**
	 * Allgemeiner Befehl an die Untoten (Tote erwecken): Er kostet einmal eine Bonusaktion und gilt, bis die Aufgabe
	 * erledigt ist. Laut DM gehen Befehle wie „Schützt mich“ (08.11.2026). Ohne Befehl verteidigen sie sich nur.
	 */
	import { Megaphone } from '@lucide/svelte';
	import { campaign } from '$lib/stores/campaign.svelte';
	import { rolls } from '$lib/stores/rolls.svelte';

	let { compact = false }: { compact?: boolean } = $props();

	const PRESETS = [
		'Schützt mich',
		'Greift jeden an, der im Netz festhängt',
		'Schießt auf den nächsten Feind',
		'Bewacht diesen Ort',
		'Folgt mir in 3 m Abstand',
		'Wartet und verteidigt euch nur'
	];
	const cmd = $derived(campaign.data.state.minionCommand ?? '');
	let custom = $state('');

	function set(v: string) {
		campaign.change('state', (s) => {
			if (v) s.minionCommand = v;
			else delete s.minionCommand;
		});
		rolls.event('Befehl an die Untoten', v ? `„${v}“, gilt bis die Aufgabe erledigt ist (1 Bonusaktion)` : 'kein Befehl: Sie verteidigen sich nur', 'info');
	}
</script>

{#if compact}
	<label class="flex items-center gap-2 text-xs text-ink-3">
		<Megaphone size={12} class="shrink-0" />
		<select class="input !h-7 min-w-0 flex-1 !text-xs" value={cmd} onchange={(e) => set(e.currentTarget.value)} aria-label="Allgemeiner Befehl an die Untoten">
			<option value="">kein Befehl (verteidigen sich nur)</option>
			{#each PRESETS as p (p)}<option value={p}>{p}</option>{/each}
			{#if cmd && !PRESETS.includes(cmd)}<option value={cmd}>{cmd}</option>{/if}
		</select>
	</label>
{:else}
	<div class="rounded-xl border border-line bg-white/[0.02] p-3">
		<div class="flex flex-wrap items-baseline justify-between gap-2">
			<div class="flex items-center gap-2 text-sm font-medium"><Megaphone size={14} class="text-s-nekro" />Allgemeiner Befehl</div>
			<span class="text-xs text-ink-3">{cmd ? `aktiv: „${cmd}“` : 'keiner, sie verteidigen sich nur'}</span>
		</div>
		<div class="mt-2 flex flex-wrap gap-1.5">
			{#each PRESETS as p (p)}
				<button class="chip !text-xs {cmd === p ? 'chip-on' : ''}" onclick={() => set(cmd === p ? '' : p)}>{p}</button>
			{/each}
		</div>
		<form
			class="mt-2 flex gap-1.5"
			onsubmit={(e) => {
				e.preventDefault();
				if (custom.trim()) set(custom.trim());
				custom = '';
			}}
		>
			<input class="input !h-8 !text-xs" placeholder="Eigener Befehl …" bind:value={custom} />
			<button class="btn btn-xs" type="submit">Geben</button>
		</form>
		<p class="mt-2 text-[0.7rem] leading-relaxed text-ink-3">
			Eine Bonusaktion gibt allen Untoten in 18 m denselben Befehl. Ein allgemeiner Befehl gilt, bis die Aufgabe erledigt ist (laut DM), dann bleibt deine Bonusaktion für
			Sternenschritt oder die Flammenkugel frei.
		</p>
	</div>
{/if}

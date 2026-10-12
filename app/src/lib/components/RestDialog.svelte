<script lang="ts">
	/** Kurze und lange Rast mit Trefferwürfeln, Arkaner Erholung und Trance-Wahl. */
	import { Moon, Coffee, Dices, Sparkles } from '@lucide/svelte';
	import Modal from './Modal.svelte';
	import Pips from './Pips.svelte';
	import TranceSelect from './TranceSelect.svelte';
	import { campaign } from '$lib/stores/campaign.svelte';
	import { ui } from '$lib/stores/ui.svelte';
	import { arcaneRecovery, longRest, spendHitDie } from '$lib/game';
	import { featureLeft, hitDiceLeft, slotTotals } from '$lib/rules';

	const c = $derived(campaign.data.character);
	const s = $derived(campaign.data.state);
	const recoveryLeft = $derived(featureLeft(c, s, 'arkane-erholung'));
	const budget = $derived(Math.ceil(c.level / 2));

	let picked = $state<number[]>([]);
	let healed = $state<number[]>([]);
	let done = $state(false);

	const pickedSum = $derived(picked.reduce((a, b) => a + b, 0));

	$effect(() => {
		if (ui.rest) {
			picked = [];
			healed = [];
			done = false;
		}
	});

	function usedOf(level: number) {
		return (s.slotsUsed[String(level)] ?? 0) - picked.filter((p) => p === level).length;
	}

	function close() {
		ui.rest = null;
	}
</script>

<Modal open={ui.rest === 'kurz'} title="Kurze Rast" subtitle="Mindestens 1 Stunde. Trefferwürfel ausgeben und 1× pro Tag Arkane Erholung." onclose={close} width="max-w-xl">
	<div class="space-y-5">
		<section class="sunken p-4">
			<div class="mb-2 flex items-center justify-between">
				<div class="flex items-center gap-2 font-medium"><Dices size={16} class="text-life" />Trefferwürfel</div>
				<span class="num text-sm text-ink-2">TP <b class="text-ink">{s.hp}</b>/{c.hp.max}</span>
			</div>
			<Pips total={c.level} left={hitDiceLeft(c, s)} color="var(--color-life)" label="Trefferwürfel" />
			<div class="mt-3 flex flex-wrap items-center gap-2">
				<button
					class="btn btn-life btn-sm"
					disabled={hitDiceLeft(c, s) <= 0 || s.hp >= c.hp.max}
					onclick={() => {
						const v = spendHitDie();
						if (v !== null) healed = [...healed, v];
					}}>1W{c.hp.hitDie} + {Math.floor((c.abilities.con - 10) / 2)} würfeln</button
				>
				{#if healed.length}<span class="text-sm text-ink-2">geheilt: <span class="num text-ink">{healed.join(' + ')} = {healed.reduce((a, b) => a + b, 0)}</span></span>{/if}
			</div>
		</section>

		<section class="sunken p-4">
			<div class="mb-1 flex items-center gap-2 font-medium"><Sparkles size={16} class="text-astral" />Arkane Erholung</div>
			{#if recoveryLeft <= 0}
				<p class="text-sm text-ink-3">Heute schon genutzt. Wieder verfügbar nach der nächsten langen Rast.</p>
			{:else}
				<p class="mb-3 text-sm text-ink-2">Wähle verbrauchte Plätze, zusammen höchstens <b class="text-ink">{budget} Grade</b>. Gewählt: <b class="num text-ink">{pickedSum}</b></p>
				<div class="flex flex-wrap gap-2">
					{#each slotTotals(c) as sl (sl.level)}
						{#each Array.from({ length: Math.max(0, usedOf(sl.level)) }) as _, i (i)}
							<button class="chip" disabled={pickedSum + sl.level > budget} onclick={() => (picked = [...picked, sl.level])}>+ Grad {sl.level}</button>
						{/each}
					{/each}
					{#each picked as p, i (i)}
						<button class="chip chip-on" onclick={() => (picked = picked.filter((_, j) => j !== i))}>Grad {p} ✕</button>
					{/each}
				</div>
				{#if !Object.values(s.slotsUsed).some((v) => v > 0)}<p class="mt-2 text-xs text-ink-3">Keine Plätze verbraucht.</p>{/if}
				<button
					class="btn btn-primary btn-sm mt-3"
					disabled={!picked.length || done}
					onclick={() => {
						arcaneRecovery(picked);
						done = true;
					}}>Plätze zurückholen</button
				>
			{/if}
		</section>
	</div>
	{#snippet footer()}
		<button class="btn" onclick={close}><Coffee size={15} />Rast beenden</button>
	{/snippet}
</Modal>

<Modal open={ui.rest === 'lang'} title="Lange Rast" subtitle="4 Stunden Astrale Trance genügen dir." onclose={close} width="max-w-xl">
	<div class="space-y-4 text-sm">
		<ul class="prose-grim prose-sm">
			<li>Trefferpunkte auf <b>{c.hp.max}</b>, temporäre TP auf 0, Todesrettungswürfe zurückgesetzt</li>
			<li>Alle Zauberplätze, Sternenschritt (3×), Arkane Erholung und die Ohrring-Botschaft zurück</li>
			<li>Trefferwürfel: +{Math.max(1, Math.floor(c.level / 2))} (jetzt {hitDiceLeft(c, s)}/{c.level})</li>
			<li>Konzentration, Schild und Unsichtbarer Diener enden. Erschöpfung −1, falls vorhanden.</li>
			{#if s.minions.length}<li class="text-warn">Untote: Die 24 Stunden laufen weiter. Kontrolle erneuern nicht vergessen (1 Minute, Grad-3-Platz für bis zu 4).</li>{/if}
		</ul>
		<div class="sunken p-4">
			<div class="mb-2 font-medium">Astrale Trance: Übung für heute</div>
			<TranceSelect />
		</div>
	</div>
	{#snippet footer()}
		<button class="btn" onclick={close}>Abbrechen</button>
		<button
			class="btn btn-primary"
			onclick={() => {
				longRest();
				close();
			}}><Moon size={15} />Lange Rast abschließen</button
		>
	{/snippet}
</Modal>

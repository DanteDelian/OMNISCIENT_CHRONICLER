<script lang="ts">
	/** Untote erneuern: Tote erwecken mit dem kleinsten freien Platz ab Grad 3 (hält bis zu 4 weitere 24 Stunden). */
	import { RefreshCw } from '@lucide/svelte';
	import { campaign } from '$lib/stores/campaign.svelte';
	import { renewCapacity, renewMinions } from '$lib/game';
	import { lowestFreeSlot } from '$lib/rules';

	let { size = 'sm' }: { size?: 'sm' | 'xs' } = $props();

	const c = $derived(campaign.data.character);
	const s = $derived(campaign.data.state);
	const open = $derived(s.minions.filter((m) => !m.renewed).length);
	const slot = $derived(lowestFreeSlot(c, s, 3));
	const prepared = $derived(!!campaign.data.spells.find((x) => x.id === 'tote-erwecken')?.prepared);
	const label = $derived(slot === null ? 'Kein Grad-3-Platz' : !prepared ? 'Tote erwecken nicht vorbereitet' : `Erneuern · Grad ${slot}`);
	const title = $derived(
		`${open ? `${open} von ${s.minions.length} noch nicht erneuert` : 'Alle erneuert'}. Ein Platz hält bis zu ${renewCapacity(slot ?? 3)} Untote 24 Stunden ab jetzt (1 Minute, alle in 3 m). Am klügsten abends vor der langen Rast.`
	);
</script>

{#if s.minions.length}
	<button class="btn btn-{size} {open && slot !== null && prepared ? 'btn-primary' : ''}" disabled={slot === null || !prepared} onclick={() => slot !== null && renewMinions(slot)} {title}>
		<RefreshCw size={size === 'xs' ? 11 : 13} />{label}
	</button>
{/if}

<script lang="ts">
	import PDoc from './PDoc.svelte';
	import PMd from './PMd.svelte';
	import { campaign } from '$lib/stores/campaign.svelte';
	import { mdSection, printAnchor } from '$lib/markdown';
	import type { Agent } from '$lib/types';

	const STATUS: Record<Agent['status'], string> = { aktiv: 'Aktiv', kandidat: 'Kandidat', ruhend: 'Ruhend', verloren: 'Verloren' };
	const net = $derived(campaign.data.netzwerk);
	const plan = $derived(campaign.data.docs.find((d) => d.slug === 'aufbauplan'));
	const rules = $derived(mdSection(plan?.body, 'Regeln für die Hand'));
	const roleLabel = (id: string) => net.roles.find((r) => r.id === id)?.label ?? id;
	const wage = (sm: number | undefined) => (!sm ? '' : sm % 10 === 0 ? `${sm / 10} GM/Tag` : `${sm} SM/Tag`);
	/** Leere Zeilen zum Ergänzen mit der Hand */
	const blank = $derived(Math.max(4, 10 - net.agents.length));
</script>

<PDoc id="netzwerk" refs={['page:netzwerk']} eyebrow="Kampagne" title="Die Unsichtbare Hand" subtitle="Rollen und Leute deines Netzwerks. Leere Zeilen zum Ergänzen am Tisch.">
	<h2>Rollen</h2>
	<table class="tight">
		<thead><tr><th>Rolle</th><th>Aufgabe</th><th>Wo finden</th><th>Kosten</th><th>Besetzt</th></tr></thead>
		<tbody>
			{#each net.roles as r (r.id)}
				{@const people = net.agents.filter((a) => a.role === r.id && a.status !== 'verloren')}
				<tr>
					<td><b>{r.label}</b></td>
					<td><PMd src={r.task} inline /></td>
					<td><PMd src={r.where} inline /></td>
					<td>{r.cost}</td>
					<td>{people.map((a) => a.name).join(', ')}</td>
				</tr>
			{/each}
		</tbody>
	</table>

	<h2>Leute</h2>
	<table class="tight people">
		<thead><tr><th>Name</th><th>Rolle</th><th>Status</th><th>Ort</th><th>Lohn</th><th>Treue</th><th>Weiß über dich</th></tr></thead>
		<tbody>
			{#each net.agents as a (a.id)}
				<tr id={printAnchor(`agent:${a.id}`)}>
					<td><b>{a.name}</b></td>
					<td>{roleLabel(a.role)}</td>
					<td>{STATUS[a.status]}</td>
					<td>{a.place ?? ''}</td>
					<td>{wage(a.wage)}</td>
					<td class="nowrap">{'●'.repeat(a.loyalty)}{'○'.repeat(5 - a.loyalty)}</td>
					<td>{#if a.knows}<PMd src={a.knows} inline />{/if}</td>
				</tr>
			{/each}
			{#each Array.from({ length: blank }) as _, i (i)}
				<tr class="blank"><td></td><td></td><td></td><td></td><td></td><td class="nowrap muted">○○○○○</td><td></td></tr>
			{/each}
		</tbody>
	</table>

	{#if rules}
		<div class="box-soft avoid" style="margin-top: 5mm">
			<div class="label" style="margin-bottom: 1mm">Regeln für die Hand · aus dem Aufbauplan</div>
			<PMd src={rules} class="small" />
		</div>
	{/if}
</PDoc>

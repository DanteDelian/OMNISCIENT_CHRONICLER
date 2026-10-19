<script lang="ts">
	import './print.css';
	import { page } from '$app/state';
	import { ArrowLeft, Printer } from '@lucide/svelte';
	import { campaign } from '$lib/stores/campaign.svelte';
	import { PRINT_PARTS, type PrintPart } from '$lib/print';
	import PCover from '$lib/components/print/PCover.svelte';
	import PCharacter from '$lib/components/print/PCharacter.svelte';
	import PTracker from '$lib/components/print/PTracker.svelte';
	import PSpells from '$lib/components/print/PSpells.svelte';
	import PSpellCards from '$lib/components/print/PSpellCards.svelte';
	import PRetinue from '$lib/components/print/PRetinue.svelte';
	import PRules from '$lib/components/print/PRules.svelte';
	import PInventory from '$lib/components/print/PInventory.svelte';
	import PQuests from '$lib/components/print/PQuests.svelte';
	import PJournal from '$lib/components/print/PJournal.svelte';
	import PWorld from '$lib/components/print/PWorld.svelte';
	import PMap from '$lib/components/print/PMap.svelte';
	import PArchiveDoc from '$lib/components/print/PArchiveDoc.svelte';
	import PSources from '$lib/components/print/PSources.svelte';
	import PQuestions from '$lib/components/print/PQuestions.svelte';
	import PMysteries from '$lib/components/print/PMysteries.svelte';
	import PNetwork from '$lib/components/print/PNetwork.svelte';

	const docs = $derived([...campaign.data.docs].sort((a, b) => a.order - b.order));
	const parts = $derived<PrintPart[]>([
		...PRINT_PARTS.filter((p) => p.id !== 'quellen'),
		...docs.map((d) => ({ id: `doc-${d.slug}`, label: d.title, hint: d.subtitle ?? '', group: 'Archiv' as const })),
		...PRINT_PARTS.filter((p) => p.id === 'quellen')
	]);

	// Auswahl: ?teil=bogen,zauber (ohne Parameter: alles)
	const fromUrl = page.url.searchParams.get('teil');
	let chosen = $state<string[] | null>(fromUrl ? fromUrl.split(',').map((s) => s.trim()) : null);
	// „archiv“ steht für alle Archiv-Dokumente plus Quellenverzeichnis.
	const expanded = $derived(chosen?.flatMap((id) => (id === 'archiv' ? [...docs.map((d) => `doc-${d.slug}`), 'quellen'] : [id])) ?? null);
	const active = $derived(parts.filter((p) => (expanded ? expanded.includes(p.id) : true)));
	const toc = $derived(active.filter((p) => p.id !== 'deckblatt'));
	const groups = ['Am Tisch', 'Kampagne', 'Archiv'] as const;

	const PRESETS: { label: string; ids: string[] | null }[] = [
		{ label: 'Alles', ids: null },
		{ label: 'Für den Spieltisch', ids: ['deckblatt', 'bogen', 'spielbogen', 'zauber', 'zauberkarten', 'gefolge', 'regeln', 'fragen'] },
		{ label: 'Kampagne', ids: ['quests', 'raetsel', 'journal', 'welt', 'netzwerk', 'karte'] },
		{ label: 'Archiv', ids: ['archiv'] },
		{ label: 'Nichts', ids: [] }
	];

	function toggle(id: string) {
		const now = expanded ?? parts.map((p) => p.id);
		chosen = now.includes(id) ? now.filter((x) => x !== id) : [...now, id];
	}
</script>

<svelte:head><title>Druckfassung · Valerius</title></svelte:head>

<div class="druck">
	<div class="toolbar">
		<div style="max-width: 210mm; margin: 0 auto; padding: 12px 0 14px">
			<div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap">
				<a href="/" style="display: inline-flex; align-items: center; gap: 6px; color: var(--p-ink-2); font-size: 9.5pt"><ArrowLeft size={15} />Grimoire</a>
				<h1 class="serif" style="font-size: 21pt; line-height: 1; margin-right: auto">Druckfassung</h1>
				<span style="color: var(--p-ink-3); font-size: 9pt">{active.length} von {parts.length} Teilen</span>
				<button class="print-btn" onclick={() => window.print()} disabled={!active.length}><Printer size={16} />Drucken oder als PDF speichern</button>
			</div>
			<div style="display: flex; gap: 6px; flex-wrap: wrap; margin-top: 10px">
				{#each PRESETS as pr (pr.label)}
					<button class="preset" onclick={() => (chosen = pr.ids ? [...pr.ids] : null)}>{pr.label}</button>
				{/each}
			</div>
			<div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 4px 18px; margin-top: 10px">
				{#each groups as g (g)}
					<div>
						<div class="label" style="margin-bottom: 4px">{g}</div>
						{#each parts.filter((p) => p.group === g) as p (p.id)}
							<label class="part" title={p.hint}>
								<input type="checkbox" checked={active.some((a) => a.id === p.id)} onchange={() => toggle(p.id)} />
								<span>{p.label}</span>
							</label>
						{/each}
					</div>
				{/each}
			</div>
			<p style="margin: 10px 0 0; color: var(--p-ink-3); font-size: 8.5pt">
				Im Druckdialog: Papier A4, Ränder „Standard“, <b>Kopf- und Fußzeilen aus</b>. Seitenzahlen und Fußzeile setzt die Druckfassung selbst. Fertige PDFs erzeugt
				<code>npm run druck</code>.
			</p>
		</div>
	</div>

	{#each active as p (p.id)}
		{#if p.id === 'deckblatt'}
			<PCover {toc} />
		{:else if p.id === 'bogen'}
			<PCharacter />
		{:else if p.id === 'spielbogen'}
			<PTracker />
		{:else if p.id === 'zauber'}
			<PSpells />
		{:else if p.id === 'zauberkarten'}
			<PSpellCards />
		{:else if p.id === 'gefolge'}
			<PRetinue />
		{:else if p.id === 'regeln'}
			<PRules />
		{:else if p.id === 'fragen'}
			<PQuestions />
		{:else if p.id === 'raetsel'}
			<PMysteries />
		{:else if p.id === 'netzwerk'}
			<PNetwork />
		{:else if p.id === 'inventar'}
			<PInventory />
		{:else if p.id === 'quests'}
			<PQuests />
		{:else if p.id === 'journal'}
			<PJournal />
		{:else if p.id === 'welt'}
			<PWorld />
		{:else if p.id === 'karte'}
			<PMap />
		{:else if p.id === 'quellen'}
			<PSources />
		{:else if p.id.startsWith('doc-')}
			{@const d = docs.find((x) => `doc-${x.slug}` === p.id)}
			{#if d}<PArchiveDoc doc={d} />{/if}
		{/if}
	{:else}
		<p class="screen-only" style="text-align: center; color: var(--p-ink-2); padding: 20mm 0">Nichts ausgewählt.</p>
	{/each}
</div>

<style>
	.print-btn {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		border-radius: 10px;
		background: #5b47d6;
		color: #fff;
		padding: 8px 14px;
		font-size: 9.5pt;
		font-weight: 600;
		box-shadow: 0 4px 14px rgb(91 71 214 / 0.35);
	}
	.print-btn:disabled {
		opacity: 0.45;
		cursor: default;
	}
	.preset {
		border: 1px solid #cfcae0;
		border-radius: 99px;
		padding: 3px 11px;
		font-size: 8.8pt;
		color: #474357;
		background: #fff;
	}
	.preset:hover {
		border-color: #5b47d6;
		color: #5b47d6;
	}
	.part {
		display: flex;
		align-items: center;
		gap: 7px;
		padding: 2px 0;
		font-size: 9.2pt;
		color: #2a2638;
		cursor: pointer;
	}
	.part input {
		accent-color: #5b47d6;
	}
</style>

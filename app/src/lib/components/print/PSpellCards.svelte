<script lang="ts">
	/** Zauberkarten zum Ausschneiden: Spielkartenformat 63 × 88 mm, 9 pro A4-Seite. */
	import PMd from './PMd.svelte';
	import { campaign } from '$lib/stores/campaign.svelte';
	import { SCHOOL_PRINT } from '$lib/print';
	import type { Spell } from '$lib/types';

	const spells = $derived(
		campaign.data.spells.filter((s) => s.status === 'buch').sort((a, b) => a.level - b.level || a.name.localeCompare(b.name, 'de'))
	);
	const pages = $derived(Array.from({ length: Math.ceil(spells.length / 9) }, (_, i) => spells.slice(i * 9, i * 9 + 9)));

	/** Material kurz: „V, G, M (… 10 GM …)“ → „V, G, M (10 GM)“ */
	function components(c: string): string {
		const cost = c.match(/(\d+)\s*GM/);
		const base = c.replace(/\s*\(.*\)/, '');
		return cost ? `${base} (${cost[1]} GM)` : base;
	}

	/** Kartentext: eigene Kurzregeln oder der volle Regeltext, nie abgeschnitten. */
	function cardText(sp: Spell): string {
		return sp.card ?? sp.text;
	}

	/** Passt der Text nicht auf die Karte, wird die Schrift schrittweise kleiner statt ihn abzuschneiden. */
	function fit(el: HTMLElement, _src: string) {
		const run = () => {
			let size = 6.9;
			el.style.fontSize = '';
			while (el.scrollHeight > el.clientHeight + 1 && size > 5.3) {
				size -= 0.15;
				el.style.fontSize = `${size.toFixed(2)}pt`;
			}
			el.classList.toggle('overfull', el.scrollHeight > el.clientHeight + 1);
		};
		requestAnimationFrame(run);
		document.fonts?.ready.then(run);
		return { update: () => requestAnimationFrame(run) };
	}
</script>

{#each pages as page, pi (pi)}
	<section class="sheet cards-sheet" id={pi === 0 ? 'doc-zauberkarten' : undefined}>
		<div class="cards">
			{#each page as sp (sp.id)}
				<article class="spell-card" style="--c: {SCHOOL_PRINT[sp.school] ?? 'var(--p-accent)'}">
					<div class="card-name">{sp.name}</div>
					<div class="card-grade"><span>{sp.level === 0 ? 'Zaubertrick' : `Grad ${sp.level}`} · {sp.school}</span><span class="card-en">{sp.en}</span></div>
					<dl class="card-meta">
						<dt>Zeit</dt><dd>{sp.time}</dd>
						<dt>Reichweite</dt><dd>{sp.range}</dd>
						<dt>Dauer</dt><dd>{sp.duration}</dd>
						<dt>Kompon.</dt><dd>{components(sp.components)}</dd>
					</dl>
					<div class="card-text" use:fit={cardText(sp) + (sp.valerius ?? '')}><PMd src={cardText(sp)} /></div>
					{#if sp.valerius}<div class="card-val"><PMd src={sp.valerius} inline /></div>{/if}
					<div class="card-foot">
						<span>{[sp.concentration ? 'Konzentration' : '', sp.ritual ? 'Ritual' : ''].filter(Boolean).join(' · ') || ' '}</span>
						{#if sp.level > 0}<span><span class="cb" style="width: 2.4mm; height: 2.4mm; vertical-align: -0.4mm; {sp.prepared ? 'background: var(--p-ink)' : ''}"></span> vorbereitet</span>{/if}
					</div>
				</article>
			{/each}
		</div>
	</section>
{/each}

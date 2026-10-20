<script lang="ts">
	import PDoc from './PDoc.svelte';
	import { campaign } from '$lib/stores/campaign.svelte';
	import { CONDITIONS } from '$lib/rules-ref';
	import { abilityMod, castable, diceDe, fmtMod, saveBonus, slotTotals, spellAttack, spellDc } from '$lib/rules';

	const c = $derived(campaign.data.character);
	const s = $derived(campaign.data.state);
	const inv = $derived(campaign.data.inventory);
	const cr = $derived(campaign.data.creatures);
	const book = $derived(campaign.data.spells.filter(castable));
	const limited = $derived(c.features.filter((f) => f.uses && !f.upcoming));
	const familiar = $derived(cr.familiars.find((f) => f.id === s.familiar.form));
	const fallen = $derived(s.familiar.hp <= 0);
	const potion = $derived(inv.items.find((i) => i.id === 'heiltrank'));
	const qty = (id: string) => inv.items.find((i) => i.id === id)?.qty ?? 0;

	const bonusSpells = $derived(book.filter((sp) => sp.economy === 'bonus').map((sp) => sp.name));
	const reactionSpells = $derived(book.filter((sp) => sp.economy === 'reaktion'));
</script>

<PDoc id="spielbogen" compact onePage eyebrow="Sitzungsbogen" title="Am Tisch" subtitle="Mit Bleistift abhaken, nach der langen Rast radieren.">
	<div class="spread small" style="margin: -1mm 0 2.5mm">
		<span>Datum <span class="write" style="width: 32mm"></span></span>
		<span>Sitzung Nr. <span class="write" style="width: 14mm; min-width: 0"></span></span>
		<span>Ort <span class="write" style="width: 48mm"></span></span>
	</div>

	<div class="grid g2" style="gap: 4mm">
		<div class="box">
			<div class="spread"><h3 style="margin: 0">Trefferpunkte</h3><span class="small soft">Maximum <b class="num">{c.hp.max}</b></span></div>
			<div class="grid g2" style="margin: 1.6mm 0; gap: 2mm">
				<div class="box-soft" style="height: 11mm; padding: 1.4mm 2.4mm"><div class="label">Aktuell</div></div>
				<div class="box-soft" style="height: 11mm; padding: 1.4mm 2.4mm"><div class="label">Temporär</div></div>
			</div>
			<div class="label" style="margin-bottom: 1mm">Zum Durchstreichen</div>
			<div class="boxes" style="gap: 0.9mm">
				{#each Array(c.hp.max) as _, i (i)}<span class="cb" style="width: 3.6mm; height: 3.6mm; font-size: 5pt; text-align: center; line-height: 3.4mm; color: #b5b0c4">{c.hp.max - i}</span>{/each}
			</div>
			<div class="spread small" style="margin-top: 2.4mm">
				<span>Trefferwürfel <span class="muted">W{c.hp.hitDie} {fmtMod(abilityMod(c, 'con'))}</span></span>
				<span class="boxes">{#each Array(c.level) as _, i (i)}<span class="cb"></span>{/each}</span>
			</div>
			<div class="spread small" style="margin-top: 1.6mm">
				<span>Todesrettung <span class="muted">ab 10</span></span>
				<span>Erfolg <span class="boxes">{#each Array(3) as _, i (i)}<span class="dot"></span>{/each}</span> &nbsp; Fehlschlag <span class="boxes">{#each Array(3) as _, i (i)}<span class="dot"></span>{/each}</span></span>
			</div>
		</div>

		<div class="box">
			<div class="spread"><h3 style="margin: 0">Zauberplätze</h3><span class="small soft">SG <b class="num">{spellDc(c)}</b> · Angriff <b class="num">{fmtMod(spellAttack(c))}</b></span></div>
			{#each slotTotals(c) as sl (sl.level)}
				<div class="spread" style="margin-top: 1.8mm">
					<span>Grad {sl.level}</span>
					<span class="boxes">{#each Array(sl.total) as _, i (i)}<span class="cb lg"></span>{/each}</span>
				</div>
			{/each}
			<h3 style="margin-top: 3.2mm">Kräfte</h3>
			{#each limited as f (f.id)}
				<div class="spread small" style="margin-top: 1.2mm">
					<span>{f.name} <span class="muted tiny">{f.uses?.reset === 'long' ? 'lange Rast' : 'kurze Rast'}</span></span>
					<span class="boxes">{#each Array(f.uses?.max ?? 0) as _, i (i)}<span class="cb"></span>{/each}</span>
				</div>
			{/each}
			<div class="spread small" style="margin-top: 1.2mm"><span>Inspiration</span><span class="dot"></span></div>
		</div>
	</div>

	<div class="grid g2" style="gap: 4mm; margin-top: 2.5mm">
		<div class="box">
			<div class="spread"><h3 style="margin: 0">Konzentration</h3><span class="tiny muted">SG 10 oder halber Schaden · KO-RW {fmtMod(saveBonus(c, 'con'))}</span></div>
			<div style="margin-top: 2mm">Zauber <span class="write" style="width: 62mm"></span></div>
		</div>
		<div class="box">
			<div class="spread"><h3 style="margin: 0">Astrale Trance heute</h3><span class="tiny muted">Hausregel: keine Fertigkeit</span></div>
			<div class="small" style="margin-top: 2mm">Waffe oder Werkzeug <span class="write" style="width: 46mm"></span></div>
		</div>
	</div>

	<div class="box" style="margin-top: 2.5mm">
		<div class="spread">
			<h3 style="margin: 0">Gefolge</h3>
			<span class="small">Vertrauter: {#if fallen}<b>keiner</b> <span class="muted">({familiar?.name} gefallen)</span>{:else}<b>{familiar?.name ?? '—'}</b> <span class="muted">(RK {familiar?.ac}, {familiar?.hp} TP)</span>{/if} · neue Gestalt <span class="write" style="width: 26mm"></span></span>
		</div>
		<div class="small" style="margin-top: 1.4mm">Unsichtbarer Diener aktiv bis <span class="write" style="width: 22mm; min-width: 0"></span> <span class="muted tiny">(1 Stunde, Befehl = Bonusaktion)</span></div>
		<table style="margin-top: 1.6mm">
			<thead><tr><th style="width: 46%">Untote · Name</th><th>Art</th><th class="c">TP</th><th>Kontrolle bis</th></tr></thead>
			<tbody>
				{#each Array(Math.max(4, s.minions.length)) as _, i (i)}
					{@const m = s.minions[i]}
					<tr style="height: 5.6mm">
						<td>{m?.name ?? ''}{#if m?.gear}{' '}<span class="tiny muted">· {m.gear}</span>{/if}</td>
						<td>{m ? (m.kind === 'skelett' ? 'Skelett' : 'Zombie') : ''}</td>
						<td class="c num">{m ? `${m.hp}/${m.maxHp}` : ''}</td>
						<td></td>
					</tr>
				{/each}
			</tbody>
		</table>
		<p class="tiny muted" style="margin: 1mm 0 0">Skelett RK 13, 13 TP, Kurzbogen +4 (1W6 + 2), Dolch +4 (1W4 + 2) · Zombie RK 8, 22 TP · Erneuern: 1 Minute, Grad-3-Platz für bis zu 4.</p>
	</div>

	<div class="grid" style="grid-template-columns: 1.6fr 1fr; gap: 4mm; margin-top: 2.5mm">
		<div class="box">
			<h3 style="margin: 0 0 1.4mm">Zustände</h3>
			<div class="grid g4" style="gap: 0.8mm 2mm">
				{#each CONDITIONS as cond (cond.id)}<span class="small"><span class="cb" style="width: 2.8mm; height: 2.8mm"></span> {cond.name}</span>{/each}
			</div>
			<div class="small" style="margin-top: 1.6mm">Erschöpfung <span class="boxes">{#each Array(6) as _, i (i)}<span class="cb" style="width: 3.6mm; height: 3.6mm; font-size: 5.6pt; text-align: center; line-height: 3.3mm; color: #9a95ab">{i + 1}</span>{/each}</span></div>
		</div>
		<div class="box">
			<h3 style="margin: 0 0 1.4mm">Vorräte</h3>
			<div class="small">GM <span class="write" style="min-width: 12mm"></span> SM <span class="write" style="min-width: 12mm"></span></div>
			<div class="tiny muted" style="margin: 0.6mm 0 1.4mm">Stand Grimoire: {inv.currency.gm} GM · {inv.currency.sm} SM · {inv.currency.km} KM</div>
			<div class="small">Rationen <span class="write" style="min-width: 9mm"></span> <span class="muted tiny">({qty('rationen')})</span></div>
			<div class="small" style="margin-top: 1mm">Heiltränke <span class="boxes">{#each Array(Math.max(potion?.qty ?? 0, 1)) as _, i (i)}<span class="cb" style="width: 2.8mm; height: 2.8mm"></span>{/each}</span> <span class="muted tiny">{potion?.heal ? diceDe(potion.heal) : ''}</span></div>
			<div class="small" style="margin-top: 1mm">Gift <span class="boxes">{#each Array(Math.max(qty('gift'), 1)) as _, i (i)}<span class="cb" style="width: 2.8mm; height: 2.8mm"></span>{/each}</span></div>
		</div>
	</div>

	<div class="grid g3 tiny" style="gap: 3mm; margin-top: 2.5mm; line-height: 1.38">
		<div class="box-soft">
			<div class="label">Aktion</div>
			Zauber wirken · Dolch {fmtMod(c.attacks[0]?.bonus ?? 0)} ({diceDe(c.attacks[0]?.damage ?? '')}) · Spurt · Rückzug · Ausweichen · Helfen · Verstecken · Vorbereiten · Heiltrank trinken
		</div>
		<div class="box-soft">
			<div class="label">Bonusaktion</div>
			Sternenschritt (9 m Teleport) · Untote befehligen (alle in 18 m) · Diener befehligen{bonusSpells.length ? ` · ${bonusSpells.join(', ')}` : ''}
		</div>
		<div class="box-soft">
			<div class="label">Reaktion</div>
			{#each reactionSpells as sp, i (sp.id)}{i ? ' · ' : ''}<b>{sp.name}</b>{/each} · Gelegenheitsangriff · Vertrauter überbringt Berührungszauber (seine Reaktion)
		</div>
	</div>

	<div class="box fill" style="margin-top: 2.5mm; display: flex; flex-direction: column">
		<h3 style="margin: 0">Notizen</h3>
		<div class="lines" style="flex: 1; min-height: 14mm"></div>
	</div>
</PDoc>

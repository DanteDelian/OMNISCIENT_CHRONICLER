<script lang="ts">
	import { Printer, Dices, CircleHelp } from '@lucide/svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Markdown from '$lib/components/Markdown.svelte';
	import TranceSelect from '$lib/components/TranceSelect.svelte';
	import { campaign } from '$lib/stores/campaign.svelte';
	import { rolls } from '$lib/stores/rolls.svelte';
	import {
		ABILITIES,
		ABILITY_SHORT,
		ECONOMY_LABEL,
		SKILLS,
		abilityMod,
		diceDe,
		fmtMod,
		initiative,
		passivePerception,
		saveBonus,
		skillBonus,
		skillProficient,
		spellAttack,
		spellDc
	} from '$lib/rules';

	const c = $derived(campaign.data.character);
	const s = $derived(campaign.data.state);

	const combat = $derived([
		['Rüstungsklasse', String(c.ac.base), c.ac.formula],
		['Trefferpunkte', String(c.hp.max), `Trefferwürfel ${c.level}W${c.hp.hitDie}`],
		['Initiative', fmtMod(initiative(c)), 'GE-Modifikator'],
		['Bewegung', `${c.speed} m`, '30 Fuß'],
		['Übungsbonus', fmtMod(c.proficiencyBonus), `Stufe ${c.level}`],
		['Zauber-SG', String(spellDc(c)), '8 + ÜB + IN'],
		['Zauberangriff', fmtMod(spellAttack(c)), 'ÜB + IN'],
		['Vorbereitbar', String(c.spellcasting.preparedMax), 'IN-Modifikator + Stufe'],
		['Passive Wahrnehmung', String(passivePerception(c, s)), '10 + Wahrnehmung'],
		['Dunkelsicht', `${c.darkvision} m`, '60 Fuß']
	]);

	const featureGroups = $derived(
		['Astralelf', 'Magier', 'Schule der Beschwörung', 'Magische Ohrringe'].map((src) => ({
			src,
			list: c.features.filter((f) => f.source === src)
		}))
	);
</script>

<svelte:head><title>Charakterbogen · Valerius</title></svelte:head>

<PageHeader eyebrow="Charakterbogen" title={c.name} subtitle="{c.race} · {c.className} {c.level} ({c.subclass}) · {c.alignment}">
	{#snippet actions()}
		<button class="btn no-print" onclick={() => window.print()}><Printer size={15} />Drucken</button>
	{/snippet}
</PageHeader>

<div class="grid gap-4 xl:grid-cols-3">
	<!-- Identität -->
	<section class="panel p-5 xl:row-span-2">
		<img src="/api/assets/{c.portrait}" alt="Valerius als Floshem" class="mx-auto h-56 w-56 rounded-full" />
		<dl class="mt-5 space-y-3 text-sm">
			<div><dt class="eyebrow">Spitzname</dt><dd>„{c.nickname}“</dd></div>
			<div><dt class="eyebrow">Tarnidentität</dt><dd>„{c.alias}, {c.aliasTitle}“ <Markdown src={c.aliasNote ?? ''} class="prose-sm mt-1" /></dd></div>
			<div><dt class="eyebrow">Volk · Klasse</dt><dd>{c.race} · {c.className} {c.level} · {c.subclass}</dd></div>
			<div><dt class="eyebrow">Gesinnung</dt><dd>{c.alignment}</dd></div>
			<div>
				<dt class="eyebrow">Hintergrund</dt>
				<dd class="flex items-center gap-1.5 text-warn"><CircleHelp size={14} />{c.background || 'nicht im Bogen eingetragen'}</dd>
			</div>
			<div><dt class="eyebrow">Ziel</dt><dd class="text-ink-2">{c.goal}</dd></div>
			<div><dt class="eyebrow">Aussehen</dt><dd class="text-ink-2">{c.appearance}</dd></div>
			<div><dt class="eyebrow">Spieler</dt><dd>{c.player}</dd></div>
		</dl>
	</section>

	<!-- Attribute -->
	<section class="panel p-5 xl:col-span-2">
		<div class="eyebrow mb-3">Attribute und Rettungswürfe</div>
		<div class="grid grid-cols-3 gap-2 md:grid-cols-6">
			{#each ABILITIES as a (a.key)}
				{@const prof = c.saves.includes(a.key)}
				<div class="rounded-2xl border p-3 text-center {prof ? 'border-astral/40 bg-astral/[0.06]' : 'border-line bg-white/[0.02]'}">
					<div class="text-xs text-ink-3">{a.name}</div>
					<button class="num mt-1 text-3xl font-semibold hover:text-astral" onclick={() => rolls.check(`${a.name}-Wurf`, abilityMod(c, a.key))} title="Attributswurf würfeln">
						{fmtMod(abilityMod(c, a.key))}
					</button>
					<div class="num text-sm text-ink-3">Wert {c.abilities[a.key]}</div>
					<button class="mt-2 w-full rounded-lg bg-white/[0.04] py-1 text-xs hover:bg-white/[0.08]" onclick={() => rolls.check(`Rettungswurf ${a.name}`, saveBonus(c, a.key))}>
						RW <b class="num">{fmtMod(saveBonus(c, a.key))}</b>{prof ? ' ●' : ''}
					</button>
				</div>
			{/each}
		</div>
		<p class="mt-3 text-xs text-ink-3">● = geübt. Weisheit 8 ergibt −1, nicht −2 wie in den alten Bögen.</p>
	</section>

	<!-- Kampfwerte -->
	<section class="panel p-5 xl:col-span-2">
		<div class="eyebrow mb-3">Kampf und Magie</div>
		<div class="grid grid-cols-2 gap-2 sm:grid-cols-5">
			{#each combat as [label, value, hint] (label)}
				<div class="sunken p-3">
					<div class="num text-2xl font-semibold">{value}</div>
					<div class="text-xs text-ink-2">{label}</div>
					<div class="text-[0.65rem] text-ink-3">{hint}</div>
				</div>
			{/each}
		</div>
		<p class="mt-3 text-xs text-ink-3">{c.hp.note}</p>
	</section>
</div>

<div class="mt-4 grid gap-4 xl:grid-cols-3">
	<!-- Fertigkeiten -->
	<section class="panel p-5">
		<div class="eyebrow mb-3">Fertigkeiten</div>
		<table class="w-full text-sm">
			<tbody>
				{#each SKILLS as k (k.key)}
					{@const prof = skillProficient(c, s, k.key)}
					<tr class="border-b border-line last:border-0">
						<td class="py-1.5">{#if prof === 'fest'}<span class="text-astral">●</span>{:else if prof === 'trance'}<span class="text-gold">✦</span>{:else}<span class="text-ink-3">○</span>{/if}</td>
						<td class="py-1.5 {prof ? 'text-ink' : 'text-ink-2'}">
							{k.name}
							{#if prof === 'fest'}<span class="block text-[0.65rem] text-ink-3">{c.skills[k.key]}</span>{/if}
							{#if prof === 'trance'}<span class="block text-[0.65rem] text-gold">Astrale Trance (heute)</span>{/if}
						</td>
						<td class="py-1.5 text-xs text-ink-3">{ABILITY_SHORT[k.ability]}</td>
						<td class="py-1.5 text-right">
							<button class="num rounded-md px-1.5 font-medium hover:bg-white/10" onclick={() => rolls.check(k.name, skillBonus(c, s, k.key))}>{fmtMod(skillBonus(c, s, k.key))}</button>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</section>

	<div class="space-y-4 xl:col-span-2">
		<!-- Angriffe -->
		<section id="angriffe" class="panel scroll-mt-24 p-5">
			<div class="eyebrow mb-3">Angriffe</div>
			<div class="space-y-2">
				{#each c.attacks as a (a.id)}
					<div class="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-white/[0.02] px-3 py-2.5">
						<div class="min-w-0 flex-1">
							<div class="font-medium">{a.name}</div>
							<div class="text-xs text-ink-3">{a.range} · {a.props}</div>
						</div>
						<button class="btn btn-sm" onclick={() => rolls.check(`${a.name}: Angriff`, a.bonus)}>Angriff {fmtMod(a.bonus)}</button>
						<button class="btn btn-sm" onclick={() => rolls.damage(`${a.name}: Schaden`, a.damage)}><Dices size={13} />{diceDe(a.damage)} {a.damageType}</button>
						{#if a.damageAlt}<button class="btn btn-sm" onclick={() => rolls.damage(`${a.name}: zweihändig`, a.damageAlt!)}>{diceDe(a.damageAlt)} zweihändig</button>{/if}
					</div>
				{/each}
				<p class="text-xs text-ink-3">Zaubertricks mit Schaden (Totenglocke) stehen im Zauberbuch.</p>
			</div>
		</section>

		<!-- Übungen -->
		<section class="panel p-5">
			<div class="eyebrow mb-3">Übungen und Sprachen</div>
			<dl class="grid gap-3 text-sm sm:grid-cols-2">
				<div><dt class="text-xs text-ink-3">Rüstungen</dt><dd>{c.proficiencies.armor}</dd></div>
				<div><dt class="text-xs text-ink-3">Waffen</dt><dd>{c.proficiencies.weapons}</dd></div>
				<div><dt class="text-xs text-ink-3">Werkzeuge</dt><dd>{c.proficiencies.tools}</dd></div>
				<div><dt class="text-xs text-ink-3">Sprachen</dt><dd>{c.proficiencies.languages}</dd></div>
				<div class="sm:col-span-2"><dt class="text-xs text-ink-3">Zauberfokus</dt><dd>{c.spellcasting.focus}</dd></div>
			</dl>
			<div class="mt-4 rounded-2xl border border-gold/25 bg-gold/[0.04] p-4">
				<div class="mb-2 text-sm font-medium text-gold">✦ Astrale Trance: Übung bis zur nächsten langen Rast</div>
				<TranceSelect />
			</div>
		</section>
	</div>
</div>

<!-- Merkmale -->
<section class="mt-4">
	<h2 class="title-display mb-3 text-3xl">Merkmale</h2>
	<div class="grid gap-4 lg:grid-cols-2">
		{#each featureGroups as g (g.src)}
			{#if g.list.length}
				<div class="space-y-3">
					<div class="eyebrow">{g.src}</div>
					{#each g.list as f (f.id)}
						<article id={f.id} class="panel scroll-mt-24 p-4 {f.upcoming ? 'opacity-70' : ''}">
							<div class="flex flex-wrap items-center gap-2">
								<h3 class="text-base font-semibold">{f.name}</h3>
								<span class="badge">{ECONOMY_LABEL[f.economy] ?? f.economy}</span>
								{#if f.uses}<span class="badge" style="--c: var(--color-gold)">{f.uses.max}× pro {f.uses.reset === 'long' ? 'langer Rast' : 'kurzer Rast'}</span>{/if}
								{#if f.upcoming}<span class="badge" style="--c: var(--color-astral-2)">Ausblick</span>{/if}
							</div>
							<Markdown src={f.text} class="prose-sm mt-2" />
							{#if f.note}<p class="mt-2 rounded-lg bg-warn/[0.07] px-3 py-2 text-xs text-ink-2"><b class="text-warn">Hinweis:</b> <Markdown src={f.note} inline /></p>{/if}
						</article>
					{/each}
				</div>
			{/if}
		{/each}
	</div>
</section>

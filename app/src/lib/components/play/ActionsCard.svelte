<script lang="ts">
	/** „Was kann ich jetzt tun?“ – nach Aktionsart sortiert, mit Würfeln und Wirken. */
	import { Dices, Info } from '@lucide/svelte';
	import CastButton from '../CastButton.svelte';
	import Markdown from '../Markdown.svelte';
	import { campaign } from '$lib/stores/campaign.svelte';
	import { rolls } from '$lib/stores/rolls.svelte';
	import { ui } from '$lib/stores/ui.svelte';
	import { useFeature } from '$lib/game';
	import { ACTIONS } from '$lib/rules-ref';
	import { attackBonus, SCHOOL_COLOR, castable, diceDe, featureLeft, fmtMod, spellAttack, spellDc } from '$lib/rules';
	import type { Attack, Feature, Spell } from '$lib/types';

	type Tab = 'aktion' | 'bonus' | 'reaktion' | 'lang' | 'standard';
	let tab = $state<Tab>('aktion');

	const c = $derived(campaign.data.character);
	const s = $derived(campaign.data.state);
	const spells = $derived(campaign.data.spells.filter(castable));

	interface Row {
		key: string;
		name: string;
		meta: string;
		color: string;
		tags: string[];
		spell?: Spell;
		attack?: Attack;
		feature?: Feature;
		pseudo?: { text: string; enabled: boolean };
	}

	function spellMeta(sp: Spell): string {
		const parts = [sp.range.replace(/\s*\(.*?\)/, '')];
		if (sp.attack) parts.push(`Angriff ${fmtMod(spellAttack(c))}`);
		if (sp.save) parts.push(`${sp.save}-RW SG ${spellDc(c)}`);
		if (sp.rolls?.[0]) parts.push(sp.rolls.map((r) => diceDe(r.expr)).join(' / '));
		return parts.join(' · ');
	}

	function spellRow(sp: Spell): Row {
		const tags: string[] = [];
		if (sp.level > 0) tags.push(`Grad ${sp.level}`);
		else tags.push('Trick');
		if (sp.concentration) tags.push('K');
		if (sp.ritual && !sp.prepared) tags.push('Ritual');
		return { key: `s-${sp.id}`, name: sp.name, meta: spellMeta(sp), color: SCHOOL_COLOR[sp.school], tags, spell: sp };
	}

	const rows = $derived.by((): Record<Exclude<Tab, 'standard'>, Row[]> => {
		const byEco = (eco: string, preparedOnly: boolean) =>
			spells.filter((sp) => sp.economy === eco && (sp.level === 0 || !preparedOnly || sp.prepared)).map(spellRow);
		const featureRows = (eco: string) =>
			c.features
				.filter((f) => f.economy === eco && !f.upcoming)
				.map((f) => ({ key: `f-${f.id}`, name: f.name, meta: f.summary, color: 'var(--color-gold)', tags: [f.uses ? `${featureLeft(c, s, f.id)}/${f.uses.max}` : 'Merkmal'], feature: f }));
		return {
			aktion: [
				...byEco('aktion', true).sort((a, b) => (a.spell!.level - b.spell!.level) || a.name.localeCompare(b.name)),
				...c.attacks.map((a) => ({ key: `a-${a.id}`, name: a.name, meta: `${a.range} · ${a.props ?? ''}`, color: 'var(--color-ink-2)', tags: ['Waffe'], attack: a })),
				...featureRows('aktion')
			],
			bonus: [
				...featureRows('bonus'),
				{
					key: 'p-untote',
					name: 'Untote befehligen',
					meta: 'Allen Untoten in 18 m gleichzeitig denselben Befehl geben (Tote erwecken).',
					color: 'var(--color-s-nekro)',
					tags: [`${s.minions.length} aktiv`],
					pseudo: { text: 'Befehl', enabled: s.minions.length > 0 }
				},
				{
					key: 'p-diener',
					name: 'Diener befehligen',
					meta: 'Unsichtbarer Diener: bis 4,5 m bewegen und mit einem Gegenstand interagieren.',
					color: 'var(--color-s-besch)',
					tags: [s.servant ? 'aktiv' : 'nicht aktiv'],
					pseudo: { text: 'Befehl', enabled: s.servant }
				},
				...byEco('bonus', true)
			],
			reaktion: [
				...byEco('reaktion', true),
				...c.attacks
					.filter((a) => a.id === 'dolch' || a.id === 'kampfstab')
					.map((a) => ({ key: `ga-${a.id}`, name: `Gelegenheitsangriff (${a.name})`, meta: 'Wenn ein sichtbarer Feind deine Reichweite verlässt.', color: 'var(--color-ink-3)', tags: ['Waffe'], attack: a }))
			],
			lang: spells.filter((sp) => sp.economy === 'minute' || sp.economy === 'stunde' || (sp.ritual && !sp.prepared)).map(spellRow)
		};
	});

	const TABS: { id: Tab; label: string }[] = [
		{ id: 'aktion', label: 'Aktion' },
		{ id: 'bonus', label: 'Bonusaktion' },
		{ id: 'reaktion', label: 'Reaktion' },
		{ id: 'lang', label: 'Außerhalb des Kampfes' },
		{ id: 'standard', label: 'Standardaktionen' }
	];

	const HINT: Record<Tab, string> = {
		aktion: 'Eine Aktion pro Zug. Zaubertricks unbegrenzt, Zauber kosten einen Platz.',
		bonus: 'Eine Bonusaktion pro Zug. Sternenschritt ist kein Zauber, danach darfst du trotzdem normal zaubern.',
		reaktion: 'Eine Reaktion pro Runde: Schild oder Gegenzauber, nie beides.',
		lang: 'Rituale ohne Zauberplatz (+10 Minuten) und Zauber mit langer Wirkzeit.',
		standard: 'Was jeder im Kampf mit seiner Aktion tun kann.'
	};
</script>

<section class="panel flex flex-col p-5">
	<div class="mb-3 flex flex-wrap items-center justify-between gap-2">
		<div class="eyebrow">Was kann ich tun?</div>
		<a class="text-xs text-ink-3 hover:text-ink" href="/zauber">Zauberbuch →</a>
	</div>
	<div class="mb-3 flex gap-1 overflow-x-auto rounded-xl bg-black/30 p-1" role="tablist">
		{#each TABS as t (t.id)}
			<button
				role="tab"
				aria-selected={tab === t.id}
				class="shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition {tab === t.id ? 'bg-white/10 text-ink' : 'text-ink-3 hover:text-ink'}"
				onclick={() => (tab = t.id)}>{t.label}</button
			>
		{/each}
	</div>
	<p class="mb-3 flex items-start gap-2 text-xs text-ink-3"><Info size={13} class="mt-0.5 shrink-0" />{HINT[tab]}</p>

	{#if tab === 'standard'}
		<ul class="grid gap-2 sm:grid-cols-2">
			{#each ACTIONS as a (a.name)}
				<li class="rounded-xl border border-line bg-white/[0.02] p-3">
					<div class="text-sm font-medium">{a.name}</div>
					<p class="mt-0.5 text-xs leading-relaxed text-ink-2">{a.text}</p>
					{#if a.valerius}<p class="mt-1 text-xs text-astral">{a.valerius}</p>{/if}
				</li>
			{/each}
		</ul>
	{:else}
		<ul class="space-y-1.5">
			{#each rows[tab] as r (r.key)}
				<li class="group flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-xl border border-line bg-white/[0.02] py-2 pr-2 pl-3 transition hover:border-white/15 hover:bg-white/[0.035]">
					<span class="h-8 w-1 shrink-0 rounded-full" style="background: {r.color}"></span>
					<!-- Mindestbreite für den Namen: Bei wenig Platz rutschen die Knöpfe in eine zweite Zeile -->
					<div class="min-w-[min(100%,9.5rem)] flex-1">
						<div class="flex items-center gap-2">
							{#if r.spell}
								<button class="truncate text-left text-sm font-medium hover:text-astral" onclick={() => (ui.spellDrawer = r.spell!.id)}>{r.name}</button>
							{:else if r.feature}
								<a class="truncate text-sm font-medium hover:text-astral" href="/bogen#{r.feature.id}" data-ref="feature:{r.feature.id}">{r.name}</a>
							{:else}
								<span class="truncate text-sm font-medium">{r.name}</span>
							{/if}
							{#each r.tags as t (t)}<span class="badge !h-[1.1rem] !text-[0.6rem]">{t}</span>{/each}
						</div>
						<div class="truncate text-xs text-ink-3"><Markdown src={r.meta} inline /></div>
					</div>
					<div class="ml-auto flex shrink-0 items-center gap-1.5">
						{#if r.spell}
							{#if r.spell.rolls?.[0]}
								<button class="btn btn-xs" onclick={() => rolls.damage(`${r.spell!.name}`, r.spell!.rolls![0].expr)} title={r.spell.rolls[0].label}>
									<Dices size={11} />{diceDe(r.spell.rolls[0].expr)}
								</button>
							{/if}
							<CastButton spell={r.spell} size="xs" />
						{:else if r.attack}
							<button class="btn btn-xs" onclick={() => rolls.check(`${r.attack!.name}: Angriff`, attackBonus(c, s, r.attack!))}>{fmtMod(attackBonus(c, s, r.attack))}</button>
							<button class="btn btn-xs" onclick={() => rolls.damage(`${r.attack!.name}: Schaden`, r.attack!.damage)}><Dices size={11} />{diceDe(r.attack.damage)}</button>
							{#if r.attack.damageAlt}<button class="btn btn-xs" onclick={() => rolls.damage(`${r.attack!.name}: zweihändig`, r.attack!.damageAlt!)} title="zweihändig">{diceDe(r.attack.damageAlt)}</button>{/if}
						{:else if r.feature?.uses}
							<button class="btn btn-xs btn-primary" disabled={featureLeft(c, s, r.feature.id) <= 0} onclick={() => useFeature(r.feature!.id)}>Nutzen</button>
						{:else if r.pseudo}
							<button class="btn btn-xs" disabled={!r.pseudo.enabled} onclick={() => rolls.event(r.name, 'Bonusaktion verbraucht')}>{r.pseudo.text}</button>
						{/if}
					</div>
				</li>
			{:else}
				<li class="py-6 text-center text-sm text-ink-3">Nichts in dieser Kategorie.</li>
			{/each}
		</ul>
	{/if}
</section>

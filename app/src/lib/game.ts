/** Spielaktionen auf dem Live-Zustand (state.json). Alle speichern automatisch. */
import { campaign } from './stores/campaign.svelte';
import { rolls } from './stores/rolls.svelte';
import { ui } from './stores/ui.svelte';
import { concentrationDc, slotsLeft } from './rules';
import type { Minion, Spell } from './types';
import { uid } from './format';

const st = () => campaign.data.state;
const ch = () => campaign.data.character;
const save = () => campaign.touch('state');

export function damage(amount: number) {
	if (!amount || amount < 0) return;
	const s = st();
	let rest = amount;
	if (s.tempHp > 0) {
		const used = Math.min(s.tempHp, rest);
		s.tempHp -= used;
		rest -= used;
	}
	const wasDown = s.hp === 0;
	const before = s.hp;
	s.hp = Math.max(0, s.hp - rest);
	if (wasDown && rest > 0) {
		s.deathSaves.fail = Math.min(3, s.deathSaves.fail + 1);
		rolls.event('Schaden bei 0 TP', '1 Todesrettungswurf-Fehlschlag (kritischer Treffer: 2)', 'bad');
	} else if (s.hp === 0) {
		const overflow = rest - before;
		if (overflow >= ch().hp.max) {
			rolls.event('Sofortiger Tod', `Überhang ${overflow} ≥ TP-Maximum ${ch().hp.max}`, 'bad');
		} else {
			rolls.event('Bewusstlos', 'Valerius ist auf 0 TP. Todesrettungswürfe!', 'bad');
		}
		if (s.concentration) endConcentration('(bewusstlos)');
	} else {
		rolls.event(`−${amount} TP`, `noch ${s.hp}/${ch().hp.max}`, 'bad');
	}
	if (s.concentration && s.hp > 0) ui.concentrationCheck = { dc: concentrationDc(amount), damage: amount };
	save();
}

export function heal(amount: number) {
	if (!amount || amount < 0) return;
	const s = st();
	if (s.hp === 0) s.deathSaves = { success: 0, fail: 0 };
	s.hp = Math.min(ch().hp.max, s.hp + amount);
	rolls.event(`+${amount} TP`, `jetzt ${s.hp}/${ch().hp.max}`, 'good');
	save();
}

export function setTempHp(n: number) {
	st().tempHp = Math.max(0, Math.floor(n));
	save();
}

export function setSlotUsed(level: number, used: number) {
	const total = ch().spellcasting.slots[String(level)] ?? 0;
	st().slotsUsed[String(level)] = Math.min(total, Math.max(0, used));
	save();
}

/** Pip-Klick: voller Pip = eine Nutzung verbrauchen, leerer Pip = eine zurückgeben. */
export function toggleFeatureUse(id: string, full: boolean) {
	const f = ch().features.find((x) => x.id === id);
	if (!f?.uses) return;
	const used = st().featureUsed[id] ?? 0;
	st().featureUsed[id] = Math.min(f.uses.max, Math.max(0, used + (full ? 1 : -1)));
	save();
}

export function toggleSlot(level: number, full: boolean) {
	const used = st().slotsUsed[String(level)] ?? 0;
	setSlotUsed(level, used + (full ? 1 : -1));
}

export function useFeature(id: string) {
	const f = ch().features.find((x) => x.id === id);
	if (!f?.uses) return false;
	const used = st().featureUsed[id] ?? 0;
	if (used >= f.uses.max) {
		rolls.event(`${f.name} verbraucht`, 'Erst nach der nächsten langen Rast wieder.', 'bad');
		return false;
	}
	st().featureUsed[id] = used + 1;
	rolls.event(f.name, `noch ${f.uses.max - used - 1}/${f.uses.max}`);
	save();
	return true;
}

export function endConcentration(reason = 'beendet') {
	const s = st();
	if (!s.concentration) return;
	rolls.event(`Konzentration ${reason}`, s.concentration.name, 'bad');
	s.concentration = null;
	ui.concentrationCheck = null;
	save();
}

/** Zauber wirken: Platz verbrauchen, Konzentration setzen, Schild aktivieren. */
export function castSpell(sp: Spell, slotLevel: number | null, asRitual = false) {
	const s = st();
	if (sp.level > 0 && !asRitual) {
		if (slotLevel === null || slotsLeft(ch(), s, slotLevel) <= 0) {
			rolls.event('Kein Zauberplatz frei', sp.name, 'bad');
			return false;
		}
		s.slotsUsed[String(slotLevel)] = (s.slotsUsed[String(slotLevel)] ?? 0) + 1;
	}
	if (sp.concentration) {
		if (s.concentration && s.concentration.spellId !== sp.id) {
			rolls.event('Konzentration gewechselt', `${s.concentration.name} endet`, 'info');
		}
		s.concentration = { spellId: sp.id, name: sp.name, since: Date.now() };
	}
	if (sp.id === 'schild') s.shield = true;
	if (sp.id === 'unsichtbarer-diener') s.servant = true;
	const how = asRitual ? 'als Ritual' : sp.level === 0 ? 'Zaubertrick' : `Grad ${slotLevel}`;
	rolls.event(`${sp.name} gewirkt`, how, 'info');
	save();
	return true;
}

export function toggleCondition(id: string) {
	const s = st();
	s.conditions = s.conditions.includes(id) ? s.conditions.filter((c) => c !== id) : [...s.conditions, id];
	if (id === 'kampfunfaehig' && s.conditions.includes(id) && s.concentration) endConcentration('(kampfunfähig)');
	save();
}

export function setDeathSave(kind: 'success' | 'fail', n: number) {
	const s = st();
	s.deathSaves[kind] = s.deathSaves[kind] === n ? n - 1 : n;
	if (s.deathSaves.success >= 3) rolls.event('Stabil', 'Drei Erfolge: Valerius ist stabil.', 'good');
	if (s.deathSaves.fail >= 3) rolls.event('Tot', 'Drei Fehlschläge.', 'bad');
	save();
}

export function rollDeathSave() {
	const r = rolls.check('Todesrettungswurf', 0, 'normal');
	const s = st();
	if (r.natural === 20) {
		s.hp = 1;
		s.deathSaves = { success: 0, fail: 0 };
		rolls.event('Natürliche 20!', 'Valerius kommt mit 1 TP zurück.', 'good');
	} else if (r.natural === 1) {
		s.deathSaves.fail = Math.min(3, s.deathSaves.fail + 2);
	} else if (r.total >= 10) {
		s.deathSaves.success = Math.min(3, s.deathSaves.success + 1);
	} else {
		s.deathSaves.fail = Math.min(3, s.deathSaves.fail + 1);
	}
	save();
}

/** Kurze Rast: Trefferwürfel einzeln würfeln. */
export function spendHitDie() {
	const s = st();
	const c = ch();
	if (s.hitDiceUsed >= c.level) return null;
	const conMod = Math.floor((c.abilities.con - 10) / 2);
	const r = rolls.damage('Trefferwürfel', `1d${c.hp.hitDie}+${conMod}`);
	if (!r) return null;
	s.hitDiceUsed++;
	const healed = Math.max(0, r.total);
	if (s.hp === 0 && healed > 0) s.deathSaves = { success: 0, fail: 0 };
	s.hp = Math.min(c.hp.max, s.hp + healed);
	save();
	return r.total;
}

/** Arkane Erholung: gewählte Plätze (Summe ≤ 3) zurückholen. */
export function arcaneRecovery(levels: number[]) {
	const s = st();
	for (const l of levels) {
		const k = String(l);
		s.slotsUsed[k] = Math.max(0, (s.slotsUsed[k] ?? 0) - 1);
	}
	s.featureUsed['arkane-erholung'] = 1;
	rolls.event('Arkane Erholung', levels.map((l) => `Grad ${l}`).join(', '), 'good');
	save();
}

export function longRest() {
	const s = st();
	const c = ch();
	s.hp = c.hp.max;
	s.tempHp = 0;
	s.deathSaves = { success: 0, fail: 0 };
	s.slotsUsed = Object.fromEntries(Object.keys(c.spellcasting.slots).map((k) => [k, 0]));
	for (const f of c.features) if (f.uses) s.featureUsed[f.id] = 0;
	s.hitDiceUsed = Math.max(0, s.hitDiceUsed - Math.max(1, Math.floor(c.level / 2)));
	s.exhaustion = Math.max(0, s.exhaustion - 1);
	s.concentration = null;
	s.shield = false;
	s.servant = false;
	for (const m of s.minions) m.renewed = false;
	rolls.event('Lange Rast', 'TP, Plätze, Sternenschritt und Ohrring sind zurück. Trance-Übung neu wählen!', 'good');
	save();
}

export function addMinion(kind: Minion['kind']) {
	const block = campaign.data.creatures.undead.find((u) => u.id === kind);
	const n = st().minions.filter((m) => m.kind === kind).length + 1;
	st().minions.push({
		id: uid(kind),
		kind,
		name: `${block?.name ?? kind} ${n}`,
		hp: block?.hp ?? 10,
		maxHp: block?.hp ?? 10,
		renewed: true
	});
	save();
}

export function removeMinion(id: string) {
	st().minions = st().minions.filter((m) => m.id !== id);
	save();
}

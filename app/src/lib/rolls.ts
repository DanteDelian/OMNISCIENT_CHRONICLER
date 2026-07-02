/**
 * Zentrale Wurf-Pipeline (Client): würfelt, zeigt das Schicksalswurf-Overlay,
 * protokolliert als Toast und spielt Sound. Von Skills/Saves/Angriffen/Palette genutzt.
 */
import { rollDie, rollExpr } from '$lib/dice';
import { fmtMod } from '$lib/types';
import { roll } from '$lib/stores/roll.svelte';
import { toasts } from '$lib/stores/toast.svelte';
import { sound } from '$lib/sound';

export type RollMode = 'normal' | 'adv' | 'dis';

export function performCheck(label: string, bonus: number, mode: RollMode = 'normal') {
	const a = rollDie(20);
	let d20 = a;
	let dDetail = `d20 (${a})`;
	if (mode !== 'normal') {
		const b = rollDie(20);
		d20 = mode === 'adv' ? Math.max(a, b) : Math.min(a, b);
		dDetail = `${mode === 'adv' ? 'Vorteil' : 'Nachteil'} (${a}/${b})`;
	}
	const total = d20 + bonus;
	const crit: 'hit' | 'miss' | undefined = d20 === 20 ? 'hit' : d20 === 1 ? 'miss' : undefined;
	const detail = `${dDetail} ${fmtMod(bonus)}`;
	sound.diceRattle();
	roll.show({ label, d20, bonus, total, crit, detail });
	toasts.push(`${label}: ${total}`, detail, crit === 'hit' ? 'good' : crit === 'miss' ? 'bad' : 'default');
	return { total, d20, crit };
}

export function performDamage(label: string, expr: string, suffix = '') {
	const r = rollExpr(expr);
	if (!r) {
		toasts.push('Ungültiger Würfelausdruck', expr, 'bad');
		return null;
	}
	sound.diceRattle();
	roll.show({ label, bonus: 0, total: r.total, detail: `${expr} → ${r.detail}${suffix}` });
	toasts.push(`${label}: ${r.total}`, `${expr} → ${r.detail}${suffix}`);
	return r;
}

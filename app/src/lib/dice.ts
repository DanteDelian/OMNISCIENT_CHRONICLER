/** Würfel: Ausdrücke wie „2d8+3“, „1W20+4“, „6d6“. */

export function rollDie(sides: number): number {
	const buf = new Uint32Array(1);
	crypto.getRandomValues(buf);
	return 1 + (buf[0] % sides);
}

export interface RollResult {
	expr: string;
	total: number;
	dice: { sides: number; value: number }[];
	modifier: number;
	detail: string;
}

export function rollExpr(expr: string): RollResult | null {
	const clean = expr.replace(/\s/g, '').replace(/[wW]/g, 'd');
	const terms = clean.match(/[+-]?[^+-]+/g);
	if (!terms) return null;
	const dice: { sides: number; value: number }[] = [];
	let modifier = 0;
	const parts: string[] = [];
	for (const term of terms) {
		const sign = term.startsWith('-') ? -1 : 1;
		const t = term.replace(/^[+-]/, '');
		const m = t.match(/^(\d*)d(\d+)$/);
		if (m) {
			const n = Math.min(60, Math.max(1, Number(m[1] || 1)));
			const sides = Number(m[2]);
			if (sides < 2) return null;
			const vals: number[] = [];
			for (let i = 0; i < n; i++) {
				const v = rollDie(sides);
				vals.push(v);
				dice.push({ sides, value: sign * v });
			}
			parts.push(`${sign < 0 ? '−' : ''}[${vals.join(', ')}]`);
		} else if (/^\d+$/.test(t)) {
			modifier += sign * Number(t);
		} else {
			return null;
		}
	}
	const total = dice.reduce((a, d) => a + d.value, 0) + modifier;
	const modStr = modifier ? (modifier > 0 ? ` + ${modifier}` : ` − ${Math.abs(modifier)}`) : '';
	return { expr, total, dice, modifier, detail: parts.join(' + ') + modStr };
}

export type RollMode = 'normal' | 'vorteil' | 'nachteil';

export function rollD20(bonus: number, mode: RollMode = 'normal') {
	const a = rollDie(20);
	const b = mode === 'normal' ? null : rollDie(20);
	const natural = b === null ? a : mode === 'vorteil' ? Math.max(a, b) : Math.min(a, b);
	return { a, b, natural, total: natural + bonus };
}

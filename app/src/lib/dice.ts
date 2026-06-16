/** Gemeinsame Würfel-Helfer (Client & Server). */

export function rollDie(sides: number): number {
	return 1 + Math.floor(Math.random() * sides);
}

/**
 * Würfelt einen einfachen Ausdruck wie "1d8+2", "2d6" oder "d4-1".
 * Liefert null bei ungültigem Ausdruck.
 */
export function rollExpr(expr: string): { total: number; detail: string } | null {
	const m = expr.replace(/\s/g, '').match(/^(\d*)[dD](\d+)([+-]\d+)?$/);
	if (!m) return null;
	const n = Math.min(50, Math.max(1, parseInt(m[1] || '1', 10)));
	const sides = parseInt(m[2], 10);
	const mod = parseInt(m[3] || '0', 10);
	if (!sides || sides < 2) return null;
	const rolls = Array.from({ length: n }, () => rollDie(sides));
	const total = rolls.reduce((a, b) => a + b, 0) + mod;
	const modStr = mod ? (mod > 0 ? `+${mod}` : `${mod}`) : '';
	return { total, detail: `[${rolls.join(', ')}]${modStr}` };
}

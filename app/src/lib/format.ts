/** Kleine Format-Helfer für deutsche Anzeigen. */

const MONTHS = ['Jan.', 'Feb.', 'März', 'Apr.', 'Mai', 'Juni', 'Juli', 'Aug.', 'Sep.', 'Okt.', 'Nov.', 'Dez.'];

export function fmtDate(iso: string | null | undefined): string {
	if (!iso) return '';
	const [y, m, d] = iso.split('-').map(Number);
	if (!y || !m || !d) return iso;
	return `${String(d).padStart(2, '0')}.${String(m).padStart(2, '0')}.${y}`;
}

export function fmtMonth(iso: string | null | undefined): string {
	if (!iso) return '';
	const [y, m] = iso.split('-').map(Number);
	return `${MONTHS[(m || 1) - 1]} ${y}`;
}

export function todayIso(): string {
	const d = new Date();
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function daysBetween(a: string, b: string): number {
	return Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);
}

export function timeHM(ts: number): string {
	const d = new Date(ts);
	return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** Gesamtvermögen in Goldmünzen (1 GM = 10 SM = 100 KM). */
export function goldValue(c: { gm: number; sm: number; km: number }): number {
	return c.gm + c.sm / 10 + c.km / 100;
}

export function fmtGold(n: number): string {
	return n.toLocaleString('de-DE', { minimumFractionDigits: n % 1 ? 1 : 0, maximumFractionDigits: 2 });
}

/** Betrag in GM lesbar: ab 1 GM in Gold, darunter in Silber oder Kupfer. `zero` ersetzt einen Betrag von 0. */
export function fmtCoins(gm: number, zero = '0 GM'): string {
	if (gm === 0) return zero;
	if (gm >= 1) return `${fmtGold(gm)} GM`;
	if (gm >= 0.1 && Math.round(gm * 100) % 10 === 0) return `${Math.round(gm * 10)} SM`;
	return `${Math.round(gm * 100)} KM`;
}

export function uid(prefix = 'id'): string {
	return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

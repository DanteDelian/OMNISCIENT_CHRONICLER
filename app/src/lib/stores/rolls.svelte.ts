/** Würfelprotokoll und Benachrichtigungen (unten rechts). */
import { rollD20, rollExpr, type RollMode } from '$lib/dice';
import { fmtMod, maxOf } from '$lib/rules';

export interface LogEntry {
	id: number;
	kind: 'd20' | 'dmg' | 'event';
	label: string;
	total?: number;
	detail: string;
	crit?: 'hit' | 'miss';
	/** Kleinstes und größtes mögliches Ergebnis (für die Würfelanimation) */
	range?: [number, number];
	/** Seitenzahl des größten Würfels: bestimmt die Form in der Würfelschale */
	die?: number;
	tone?: 'good' | 'bad' | 'info';
	at: number;
}

let seq = 1;

class RollStore {
	log = $state<LogEntry[]>([]);
	toasts = $state<LogEntry[]>([]);
	mode = $state<RollMode>('normal');

	private push(e: Omit<LogEntry, 'id' | 'at'>) {
		const entry: LogEntry = { ...e, id: seq++, at: Date.now() };
		this.log = [entry, ...this.log].slice(0, 80);
		this.toasts = [entry, ...this.toasts].slice(0, 4);
		setTimeout(() => {
			this.toasts = this.toasts.filter((t) => t.id !== entry.id);
		}, e.kind === 'event' ? 5000 : 7000);
		return entry;
	}

	/** W20-Probe mit Bonus (Vorteil/Nachteil aus dem Würfelmodus). */
	check(label: string, bonus: number, mode: RollMode = this.mode) {
		const r = rollD20(bonus, mode);
		const dice = r.b === null ? `W20 (${r.a})` : `${mode === 'vorteil' ? 'Vorteil' : 'Nachteil'} (${r.a} | ${r.b})`;
		const entry = this.push({
			kind: 'd20',
			label,
			total: r.total,
			detail: `${dice} ${fmtMod(bonus)}`,
			range: [1 + bonus, 20 + bonus],
			die: 20,
			crit: r.natural === 20 ? 'hit' : r.natural === 1 ? 'miss' : undefined
		});
		if (this.mode !== 'normal') this.mode = 'normal';
		return { ...r, entry };
	}

	/** Schadens- oder Heilwurf, z. B. „2d8“. */
	damage(label: string, expr: string) {
		const r = rollExpr(expr);
		if (!r) {
			this.event('Ungültiger Würfelausdruck', expr, 'bad');
			return null;
		}
		const min = r.dice.reduce((a, d) => a + Math.sign(d.value), 0) + r.modifier;
		const die = Math.max(0, ...r.dice.map((d) => d.sides));
		this.push({ kind: 'dmg', label, total: r.total, detail: `${expr.replace(/d/g, 'W')} → ${r.detail}`, range: [min, maxOf(expr)], die });
		return r;
	}

	event(label: string, detail = '', tone: LogEntry['tone'] = 'info') {
		return this.push({ kind: 'event', label, detail, tone });
	}

	dismiss(id: number) {
		this.toasts = this.toasts.filter((t) => t.id !== id);
	}
}

export const rolls = new RollStore();

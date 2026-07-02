export interface ToastAction {
	label: string;
	fn: () => void;
}

export interface Toast {
	id: number;
	msg: string;
	sub?: string;
	tone?: 'default' | 'good' | 'bad';
	action?: ToastAction;
}

let _id = 0;

class ToastStore {
	items = $state<Toast[]>([]);

	push(msg: string, sub?: string, tone: Toast['tone'] = 'default', action?: ToastAction) {
		const id = ++_id;
		this.items = [...this.items, { id, msg, sub, tone, action }];
		// Toasts mit Aktion (z.B. Rückgängig) bleiben länger stehen
		setTimeout(() => this.dismiss(id), action ? 6500 : 3800);
	}

	runAction(id: number) {
		const t = this.items.find((x) => x.id === id);
		t?.action?.fn();
		this.dismiss(id);
	}

	dismiss(id: number) {
		this.items = this.items.filter((t) => t.id !== id);
	}
}

export const toasts = new ToastStore();

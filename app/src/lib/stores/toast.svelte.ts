export interface Toast {
	id: number;
	msg: string;
	sub?: string;
	tone?: 'default' | 'good' | 'bad';
}

let _id = 0;

class ToastStore {
	items = $state<Toast[]>([]);

	push(msg: string, sub?: string, tone: Toast['tone'] = 'default') {
		const id = ++_id;
		this.items = [...this.items, { id, msg, sub, tone }];
		setTimeout(() => this.dismiss(id), 3800);
	}

	dismiss(id: number) {
		this.items = this.items.filter((t) => t.id !== id);
	}
}

export const toasts = new ToastStore();

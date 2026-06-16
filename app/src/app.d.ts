// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { DndEvent } from 'svelte-dnd-action';

declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	// Events von svelte-dnd-action (Drag-and-drop im Dashboard)
	namespace svelteHTML {
		interface HTMLAttributes<T> {
			onconsider?: (
				event: CustomEvent<DndEvent<{ id: string }>> & { target: EventTarget & T }
			) => void;
			onfinalize?: (
				event: CustomEvent<DndEvent<{ id: string }>> & { target: EventTarget & T }
			) => void;
		}
	}
}

export {};

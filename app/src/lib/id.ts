import { v7 as uuidv7 } from 'uuid';

/** Zeit-sortierbare UUID v7 — gut für lokale IDs und späteren Cloud-Sync. */
export function newId(): string {
	return uuidv7();
}

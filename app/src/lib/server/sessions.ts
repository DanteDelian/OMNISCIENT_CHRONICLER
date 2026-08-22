import type { Session, IngestKind } from '$lib/types';
import { loadJson, saveJson } from './campaign';
import { newId } from '$lib/id';

const FILE = 'sessions.json';

function all(): Session[] {
	return loadJson<Session[]>(FILE, []);
}

export function listSessions(): Session[] {
	return all().sort((a, b) => b.number - a.number);
}

export function getSession(id: string): Session | null {
	return all().find((s) => s.id === id) ?? null;
}

export function nextSessionNumber(): number {
	return all().reduce((max, s) => Math.max(max, s.number), 0) + 1;
}

export function createSession(input: {
	characterId: string | null;
	title: string;
	date?: string;
	rawNotes: string;
	summary: string;
	highlights: string[];
	changeKinds: IngestKind[];
	appliedCount: number;
}): Session {
	const now = Date.now();
	const sessions = all();
	const session: Session = {
		id: newId(),
		characterId: input.characterId,
		number: nextSessionNumber(),
		title: input.title.trim() || `Session ${nextSessionNumber()}`,
		date: input.date || new Date().toISOString().slice(0, 10),
		rawNotes: input.rawNotes,
		summary: input.summary,
		highlights: input.highlights,
		changeKinds: input.changeKinds,
		appliedCount: input.appliedCount,
		createdAt: now,
		updatedAt: now
	};
	sessions.push(session);
	saveJson(FILE, sessions);
	return session;
}

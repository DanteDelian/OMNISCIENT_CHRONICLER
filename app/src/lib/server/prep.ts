import type { SessionPlan } from '$lib/types';
import { loadJson, saveJson } from './campaign';
import { newId } from '$lib/id';

const FILE = 'prep.json';

function all(): SessionPlan[] {
	return loadJson<SessionPlan[]>(FILE, []);
}

export function listPlans(characterId: string): SessionPlan[] {
	return all()
		.filter((p) => !characterId || p.characterId === characterId)
		.sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getPlan(id: string): SessionPlan | null {
	return all().find((p) => p.id === id) ?? null;
}

export function createPlan(characterId: string, data: Partial<SessionPlan>): SessionPlan {
	const plans = all();
	const plan: SessionPlan = {
		id: newId(),
		characterId,
		title: data.title || 'Neue Session',
		sessionDate: data.sessionDate || '',
		status: data.status || 'planning',
		strongStart: data.strongStart || '',
		scenes: data.scenes || [],
		secrets: data.secrets || [],
		npcs: data.npcs || '',
		locations: data.locations || '',
		treasure: data.treasure || '',
		notes: data.notes || '',
		checklist: data.checklist || [],
		updatedAt: Date.now()
	};
	plans.push(plan);
	saveJson(FILE, plans);
	return plan;
}

export function updatePlan(id: string, data: Partial<SessionPlan>): void {
	const plans = all();
	const idx = plans.findIndex((p) => p.id === id);
	if (idx < 0) return;
	plans[idx] = { ...plans[idx], ...data, id, updatedAt: Date.now() };
	saveJson(FILE, plans);
}

export function deletePlan(id: string): void {
	saveJson(
		FILE,
		all().filter((p) => p.id !== id)
	);
}

import type { Quest, QuestStatus } from '$lib/types';
import { getDb } from './db';
import { newId } from '$lib/id';

type Row = Record<string, unknown>;

function toQuest(r: Row): Quest {
	return {
		id: r.id as string,
		characterId: r.character_id as string,
		title: r.title as string,
		giver: r.giver as string,
		status: r.status as QuestStatus,
		priority: r.priority as Quest['priority'],
		nextStep: r.next_step as string,
		reward: r.reward as string,
		notes: r.notes as string,
		sortOrder: r.sort_order as number,
		updatedAt: r.updated_at as number
	};
}

export function listQuests(characterId: string): Quest[] {
	const rows = getDb()
		.prepare(
			'SELECT * FROM quest WHERE character_id = ? AND deleted_at IS NULL ORDER BY sort_order, updated_at DESC'
		)
		.all(characterId) as Row[];
	return rows.map(toQuest);
}

export function createQuest(characterId: string, data: Partial<Quest>): Quest {
	const now = Date.now();
	const q: Quest = {
		id: newId(),
		characterId,
		title: data.title || 'Neue Quest',
		giver: data.giver || '',
		status: data.status || 'active',
		priority: data.priority || 'normal',
		nextStep: data.nextStep || '',
		reward: data.reward || '',
		notes: data.notes || '',
		sortOrder: data.sortOrder ?? now,
		updatedAt: now
	};
	getDb()
		.prepare(
			`INSERT INTO quest (id, character_id, title, giver, status, priority, next_step, reward, notes, sort_order, created_at, updated_at)
			 VALUES (@id, @character_id, @title, @giver, @status, @priority, @next_step, @reward, @notes, @sort_order, @created_at, @updated_at)`
		)
		.run({
			id: q.id,
			character_id: q.characterId,
			title: q.title,
			giver: q.giver,
			status: q.status,
			priority: q.priority,
			next_step: q.nextStep,
			reward: q.reward,
			notes: q.notes,
			sort_order: q.sortOrder,
			created_at: now,
			updated_at: now
		});
	return q;
}

export function updateQuest(id: string, data: Partial<Quest>): void {
	const now = Date.now();
	const map: Record<string, string> = {
		title: 'title',
		giver: 'giver',
		status: 'status',
		priority: 'priority',
		nextStep: 'next_step',
		reward: 'reward',
		notes: 'notes',
		sortOrder: 'sort_order'
	};
	const fields: string[] = [];
	const params: Row = { id, updated_at: now };
	for (const [k, col] of Object.entries(map)) {
		if (k in data) {
			fields.push(`${col} = @${col}`);
			params[col] = (data as Record<string, unknown>)[k];
		}
	}
	if (!fields.length) return;
	getDb()
		.prepare(`UPDATE quest SET ${fields.join(', ')}, updated_at = @updated_at WHERE id = @id`)
		.run(params);
}

export function deleteQuest(id: string): void {
	getDb().prepare('UPDATE quest SET deleted_at = ? WHERE id = ?').run(Date.now(), id);
}

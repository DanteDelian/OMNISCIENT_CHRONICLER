import type { WorldEntry } from '$lib/types';

export const TONE: Record<WorldEntry['tone'], { label: string; color: string }> = {
	ally: { label: 'Verbündet', color: 'var(--color-life)' },
	neutral: { label: 'Neutral', color: 'var(--color-astral-2)' },
	enemy: { label: 'Gefahr', color: 'var(--color-blood)' },
	unknown: { label: 'Unklar', color: 'var(--color-astral)' },
	dead: { label: 'Tot / ausgelöscht', color: 'var(--color-ink-3)' }
};

export const KIND_LABEL: Record<WorldEntry['kind'], string> = {
	person: 'Person',
	fraktion: 'Fraktion',
	ort: 'Ort'
};

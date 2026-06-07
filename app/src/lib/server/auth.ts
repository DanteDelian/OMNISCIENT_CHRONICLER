import { createHash } from 'node:crypto';
import { env } from '$env/dynamic/private';

/** PIN-Schutz ist aktiv, sobald APP_PIN gesetzt ist. */
export function pinEnabled(): boolean {
	return !!(env.APP_PIN && env.APP_PIN.length > 0);
}

/** Cookie-Token, das die PIN nicht im Klartext ablegt. */
export function pinToken(): string {
	return createHash('sha256').update('omnichron:' + (env.APP_PIN || '')).digest('hex');
}

export function checkPin(input: string): boolean {
	return pinEnabled() && input === env.APP_PIN;
}

export const PIN_COOKIE = 'cc_pin';

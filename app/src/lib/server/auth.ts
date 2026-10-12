import { createHash } from 'node:crypto';
import { env } from '$env/dynamic/private';

/** PIN-Schutz ist aktiv, sobald APP_PIN gesetzt ist (sinnvoll, wenn die App im WLAN läuft). */
export function pinEnabled(): boolean {
	return !!env.APP_PIN;
}

export function pinToken(): string {
	return createHash('sha256').update('valerius:' + (env.APP_PIN || '')).digest('hex');
}

export function checkPin(input: string): boolean {
	return pinEnabled() && input === env.APP_PIN;
}

export const PIN_COOKIE = 'grimoire_pin';

/**
 * Datei-Zugriff auf campaign/ — die einzige Wahrheit.
 * Schreibt atomar, meldet Änderungen (eigene und externe, z. B. von Claude Code) per Event.
 */
import fs from 'node:fs';
import path from 'node:path';
import { EventEmitter } from 'node:events';
import { env } from '$env/dynamic/private';

function findRepoRoot(): string {
	const cwd = process.cwd();
	if (fs.existsSync(path.join(cwd, 'campaign'))) return cwd;
	if (fs.existsSync(path.join(cwd, '..', 'campaign'))) return path.resolve(cwd, '..');
	return cwd;
}

export const REPO_ROOT = findRepoRoot();
export const CAMPAIGN_DIR = path.resolve(REPO_ROOT, env.CAMPAIGN_DIR || 'campaign');
export const ASSETS_DIR = path.join(CAMPAIGN_DIR, 'assets');

export interface ChangeEvent {
	file: string;
	origin?: string;
}

export const changes = new EventEmitter();
changes.setMaxListeners(100);

/** Zähler, der sich bei jeder Änderung erhöht (für den Daten-Cache). */
export let revision = 0;

function abs(rel: string): string {
	const p = path.resolve(CAMPAIGN_DIR, rel);
	if (p !== CAMPAIGN_DIR && !p.startsWith(CAMPAIGN_DIR + path.sep)) throw new Error(`Ungültiger Pfad: ${rel}`);
	return p;
}

export function readJson<T>(rel: string, fallback: T): T {
	const p = abs(rel);
	if (!fs.existsSync(p)) return fallback;
	try {
		return JSON.parse(fs.readFileSync(p, 'utf-8')) as T;
	} catch (e) {
		console.error(`[campaign] ${rel} ist kein gültiges JSON`, e);
		return fallback;
	}
}

export function readText(rel: string): string {
	const p = abs(rel);
	// Git checkt unter Windows mit CRLF aus. Die Markdown-Verarbeitung erwartet LF.
	return fs.existsSync(p) ? fs.readFileSync(p, 'utf-8').replace(/\r\n?/g, '\n') : '';
}

export function listFiles(relDir: string, ext: string): string[] {
	const p = abs(relDir);
	if (!fs.existsSync(p)) return [];
	return fs
		.readdirSync(p)
		.filter((f) => f.toLowerCase().endsWith(ext))
		.sort();
}

const ownWrites = new Map<string, number>();

export function writeJson(rel: string, data: unknown, origin?: string) {
	const p = abs(rel);
	fs.mkdirSync(path.dirname(p), { recursive: true });
	const tmp = `${p}.${process.pid}.tmp`;
	fs.writeFileSync(tmp, JSON.stringify(data, null, 2) + '\n', 'utf-8');
	fs.renameSync(tmp, p);
	ownWrites.set(rel, Date.now());
	revision++;
	changes.emit('change', { file: rel, origin } satisfies ChangeEvent);
}

// ---------- Watcher für externe Änderungen (Claude Code, Editor, Git) ----------
let watching = false;
const pending = new Map<string, ReturnType<typeof setTimeout>>();

export function startWatcher() {
	if (watching) return;
	watching = true;
	try {
		fs.watch(CAMPAIGN_DIR, { recursive: true }, (_event, filename) => {
			if (!filename) return;
			const rel = filename.split(path.sep).join('/');
			if (rel.endsWith('.tmp') || rel.startsWith('.')) return;
			clearTimeout(pending.get(rel));
			pending.set(
				rel,
				setTimeout(() => {
					pending.delete(rel);
					// Eigene Schreibvorgänge wurden schon gemeldet.
					const own = ownWrites.get(rel);
					if (own && Date.now() - own < 1500) return;
					revision++;
					changes.emit('change', { file: rel } satisfies ChangeEvent);
				}, 150)
			);
		});
	} catch (e) {
		console.error('[campaign] Datei-Watcher konnte nicht starten', e);
	}
}

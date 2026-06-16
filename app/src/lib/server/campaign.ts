import fs from 'node:fs';
import path from 'node:path';
import { EventEmitter } from 'node:events';
import { env } from '$env/dynamic/private';

/**
 * Findet das Repo-Root unabhängig vom Start-Verzeichnis:
 * - Dev (cwd = .../app): Eltern-Verzeichnis enthält campaign/ (oder heißt der cwd "app")
 * - Prod (cwd = Repo-Root): campaign/ liegt direkt darin
 */
function findRepoRoot(): string {
	const cwd = process.cwd();
	if (fs.existsSync(path.join(cwd, 'campaign'))) return cwd;
	if (fs.existsSync(path.join(cwd, '..', 'campaign'))) return path.resolve(cwd, '..');
	if (path.basename(cwd) === 'app') return path.resolve(cwd, '..');
	return cwd;
}

export const REPO_ROOT = findRepoRoot();
export const CAMPAIGN_DIR = path.resolve(REPO_ROOT, env.CAMPAIGN_DIR || 'campaign');
export const LORE_DIR = path.join(CAMPAIGN_DIR, 'lore');
export const ASSETS_DIR = path.join(CAMPAIGN_DIR, 'assets');
export const HISTORY_DIR = path.join(CAMPAIGN_DIR, '.history');

export function campaignFile(rel: string): string {
	return path.resolve(CAMPAIGN_DIR, rel);
}

export function ensureDirs() {
	for (const d of [
		CAMPAIGN_DIR,
		LORE_DIR,
		ASSETS_DIR,
		HISTORY_DIR,
		path.join(LORE_DIR, 'npcs'),
		path.join(LORE_DIR, 'places'),
		path.join(LORE_DIR, 'notes')
	]) {
		fs.mkdirSync(d, { recursive: true });
	}
}

// ---------- Change-Benachrichtigung (für SSE-Live-Updates) ----------
export const changes = new EventEmitter();
changes.setMaxListeners(50);

function emitChange(rel: string) {
	changes.emit('change', rel);
}

/** Externe Schreiber (z.B. vault.ts) melden hierüber Änderungen für die Live-Updates. */
export function notifyChange(rel: string) {
	changes.emit('change', rel);
}

// ---------- JSON ----------
export function loadJson<T>(rel: string, fallback: T): T {
	const p = campaignFile(rel);
	if (!fs.existsSync(p)) return fallback;
	try {
		return JSON.parse(fs.readFileSync(p, 'utf-8')) as T;
	} catch (e) {
		console.error(`campaign: ${rel} ist kein gültiges JSON`, e);
		return fallback;
	}
}

export function saveJson(rel: string, data: unknown) {
	ensureDirs();
	const p = campaignFile(rel);
	fs.mkdirSync(path.dirname(p), { recursive: true });
	fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n', 'utf-8');
	emitChange(rel);
}

export function fileExists(rel: string): boolean {
	return fs.existsSync(campaignFile(rel));
}

// ---------- Text (Markdown, Chronik) ----------
export function loadText(rel: string, fallback = ''): string {
	const p = campaignFile(rel);
	return fs.existsSync(p) ? fs.readFileSync(p, 'utf-8') : fallback;
}

export function saveText(rel: string, text: string) {
	ensureDirs();
	const p = campaignFile(rel);
	fs.mkdirSync(path.dirname(p), { recursive: true });
	fs.writeFileSync(p, text, 'utf-8');
	emitChange(rel);
}

// ---------- Leichtgewichtige In-Session-Historie (HP-Verlauf etc.) ----------
export function appendEvent(entry: Record<string, unknown>) {
	ensureDirs();
	fs.appendFileSync(
		path.join(HISTORY_DIR, 'events.jsonl'),
		JSON.stringify(entry) + '\n',
		'utf-8'
	);
}

export function readEvents(limit = 200): Record<string, unknown>[] {
	const p = path.join(HISTORY_DIR, 'events.jsonl');
	if (!fs.existsSync(p)) return [];
	const lines = fs.readFileSync(p, 'utf-8').trim().split('\n').filter(Boolean);
	const out: Record<string, unknown>[] = [];
	for (const l of lines.slice(-limit)) {
		try {
			out.push(JSON.parse(l));
		} catch {
			/* skip */
		}
	}
	return out;
}

// ---------- Datei-Watcher (erkennt externe Edits, z.B. durch Claude Code) ----------
let watching = false;
export function startWatcher() {
	if (watching) return;
	watching = true;
	ensureDirs();
	import('chokidar')
		.then(({ default: chokidar }) => {
			chokidar
				.watch(CAMPAIGN_DIR, {
					ignoreInitial: true,
					ignored: (p: string) => p.includes('.history')
				})
				.on('all', (_event: string, file: string) => {
					const rel = path.relative(CAMPAIGN_DIR, file).split(path.sep).join('/');
					changes.emit('change', rel);
				});
		})
		.catch((e) => console.error('chokidar konnte nicht geladen werden', e));
}

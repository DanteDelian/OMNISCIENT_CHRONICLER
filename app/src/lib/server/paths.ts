import fs from 'node:fs';
import path from 'node:path';
import { env } from '$env/dynamic/private';

/**
 * Findet das Repo-Root unabhängig davon, von wo der Prozess gestartet wurde:
 * - Dev (cwd = .../app): das Eltern-Verzeichnis enthält vault/
 * - Prod (cwd = Repo-Root): vault/ liegt direkt darin
 */
function findRepoRoot(): string {
	const cwd = process.cwd();
	if (fs.existsSync(path.join(cwd, 'vault'))) return cwd;
	if (fs.existsSync(path.join(cwd, '..', 'vault'))) return path.resolve(cwd, '..');
	return path.resolve(cwd, '..');
}

const REPO_ROOT = findRepoRoot();

/** Verzeichnis für SQLite-DB und Uploads (überschreibbar via DATA_DIR). */
export const DATA_DIR = path.resolve(REPO_ROOT, env.DATA_DIR || 'data');

/** Markdown-Vault (Obsidian-kompatibel), überschreibbar via VAULT_DIR. */
export const VAULT_DIR = path.resolve(REPO_ROOT, env.VAULT_DIR || 'vault');

export const UPLOADS_DIR = path.resolve(DATA_DIR, 'uploads');

export const DB_PATH = path.resolve(DATA_DIR, 'chronicler.db');

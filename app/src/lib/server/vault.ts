import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import type { Note } from '$lib/types';
import { VAULT_DIR } from './paths';

const IGNORE_DIRS = new Set(['.obsidian', '.git', 'node_modules', '.trash']);

function ensureVault() {
	fs.mkdirSync(VAULT_DIR, { recursive: true });
	fs.mkdirSync(path.join(VAULT_DIR, 'Notizen'), { recursive: true });
}

/** Wandelt einen relativen Pfad in einen sicheren absoluten Pfad im Vault. */
function safeAbs(relPath: string): string {
	const clean = relPath.replace(/\\/g, '/').replace(/^\/+/, '');
	const abs = path.resolve(VAULT_DIR, clean);
	if (abs !== VAULT_DIR && !abs.startsWith(VAULT_DIR + path.sep)) {
		throw new Error('Pfad außerhalb des Vaults');
	}
	return abs;
}

function relOf(abs: string): string {
	return path.relative(VAULT_DIR, abs).split(path.sep).join('/');
}

function extractLinks(body: string): string[] {
	const out = new Set<string>();
	const re = /\[\[([^\]|#]+)(?:[#|][^\]]*)?\]\]/g;
	let m: RegExpExecArray | null;
	while ((m = re.exec(body))) out.add(m[1].trim());
	return [...out];
}

function deriveTitle(relPath: string, fm: Record<string, unknown>, body: string): string {
	if (typeof fm.title === 'string' && fm.title.trim()) return fm.title.trim();
	const h1 = body.match(/^#\s+(.+)$/m);
	if (h1) return h1[1].trim();
	return path.basename(relPath, '.md');
}

function toExcerpt(body: string): string {
	const text = body
		.replace(/^#.*$/gm, '')
		.replace(/[*_>#`-]/g, '')
		.replace(/\[\[([^\]|]+)(\|[^\]]+)?\]\]/g, '$1')
		.replace(/\s+/g, ' ')
		.trim();
	return text.slice(0, 160);
}

function parseNote(abs: string): Note {
	const raw = fs.readFileSync(abs, 'utf-8');
	const { data, content } = matter(raw);
	const rel = relOf(abs);
	const tags = Array.isArray(data.tags)
		? (data.tags as unknown[]).map(String)
		: typeof data.tags === 'string'
			? [data.tags]
			: [];
	return {
		path: rel,
		title: deriveTitle(rel, data, content),
		frontmatter: data,
		body: content,
		excerpt: toExcerpt(content),
		tags,
		links: extractLinks(content),
		updatedAt: fs.statSync(abs).mtimeMs
	};
}

function walk(dir: string, acc: string[]) {
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		if (entry.isDirectory()) {
			if (IGNORE_DIRS.has(entry.name)) continue;
			walk(path.join(dir, entry.name), acc);
		} else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
			acc.push(path.join(dir, entry.name));
		}
	}
}

/** Alle Notizen im Vault (ohne Body-Volltext zu wiederholen — Body ist enthalten). */
export function listNotes(): Note[] {
	ensureVault();
	const files: string[] = [];
	walk(VAULT_DIR, files);
	return files
		.map(parseNote)
		.sort((a, b) => b.updatedAt - a.updatedAt);
}

export function readNote(relPath: string): Note | null {
	const abs = safeAbs(relPath);
	if (!fs.existsSync(abs)) return null;
	return parseNote(abs);
}

export function writeNote(
	relPath: string,
	body: string,
	frontmatter?: Record<string, unknown>
): Note {
	const abs = safeAbs(relPath);
	fs.mkdirSync(path.dirname(abs), { recursive: true });
	const content =
		frontmatter && Object.keys(frontmatter).length
			? matter.stringify(body, frontmatter)
			: body;
	fs.writeFileSync(abs, content, 'utf-8');
	return parseNote(abs);
}

function slugify(title: string): string {
	return (
		title
			.toLowerCase()
			.replace(/[äöü]/g, (c) => ({ ä: 'ae', ö: 'oe', ü: 'ue' })[c] || c)
			.replace(/ß/g, 'ss')
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-+|-+$/g, '') || 'notiz'
	);
}

export function createNote(title: string, folder = 'Notizen'): Note {
	ensureVault();
	const base = slugify(title);
	let rel = `${folder}/${base}.md`;
	let i = 2;
	while (fs.existsSync(safeAbs(rel))) {
		rel = `${folder}/${base}-${i++}.md`;
	}
	const body = `# ${title}\n\n`;
	return writeNote(rel, body, { created: new Date().toISOString() });
}

export function deleteNote(relPath: string): void {
	const abs = safeAbs(relPath);
	if (fs.existsSync(abs)) fs.rmSync(abs);
}

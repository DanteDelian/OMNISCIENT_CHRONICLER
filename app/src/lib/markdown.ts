import { marked } from 'marked';

marked.setOptions({ breaks: true, gfm: true });

/**
 * Rendert Markdown zu HTML und wandelt Obsidian-Wikilinks [[Ziel]] / [[Ziel|Text]]
 * in interne Links um. Läuft sowohl im Browser als auch auf dem Server.
 */
export function renderMarkdown(src: string): string {
	const withLinks = src.replace(
		/\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|([^\]]+))?\]\]/g,
		(_m, target: string, label?: string) => {
			const text = (label || target).trim();
			const href = '/glossar/' + encodeURIComponent(target.trim());
			return `[${text}](${href})`;
		}
	);
	return marked.parse(withLinks) as string;
}

/**
 * Markdown → HTML mit [[Wikilinks]] (inkl. Vorschaukarten-Attribut) und
 * Hinweis-Kästen im GitHub-Stil: > [!TIP] Titel / [!RULE] / [!WARNING] / [!NOTE] / [!FIX]
 */
import { marked } from 'marked';
import type { RefEntry } from './types';

marked.setOptions({ gfm: true, breaks: true });

type Resolver = (name: string) => RefEntry | undefined;

const CALLOUT_LABEL: Record<string, string> = {
	tip: 'Tipp',
	rule: 'Regel',
	warning: 'Achtung',
	note: 'Hinweis',
	fix: 'Korrigiert'
};

function escapeAttr(s: string): string {
	return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

export function linkify(src: string, resolve?: Resolver): string {
	return src.replace(/\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|([^\]]+))?\]\]/g, (_m, target: string, label?: string) => {
		const text = (label || target).trim();
		const hit = resolve?.(target.trim());
		if (!hit) return `<span class="ref-missing" title="Noch kein Eintrag: ${escapeAttr(target.trim())}">${text}</span>`;
		return `<a class="ref" href="${hit.href}" data-ref="${escapeAttr(hit.key)}">${text}</a>`;
	});
}

function callouts(html: string): string {
	return html.replace(/<blockquote>([\s\S]*?)<\/blockquote>/g, (whole, inner: string) => {
		const m = inner.match(/^\s*<p>\[!(\w+)\]\s*([\s\S]*?)(<br>\s*|<\/p>)/i);
		if (!m) return whole;
		const type = m[1].toLowerCase();
		const label = CALLOUT_LABEL[type] ?? 'Hinweis';
		let rest = inner.slice(m[0].length);
		if (m[3].startsWith('<br>')) rest = '<p>' + rest;
		return `<div class="callout callout-${type}"><div class="callout-title" data-label="${label}">${m[2]}</div>${rest}</div>`;
	});
}

export function renderMarkdown(src: string, resolve?: Resolver): string {
	if (!src) return '';
	const html = marked.parse(linkify(src, resolve), { async: false }) as string;
	return callouts(html);
}

/** Einzeiliges Markdown (ohne <p>-Hülle), z. B. für Listenpunkte. */
export function renderInline(src: string, resolve?: Resolver): string {
	if (!src) return '';
	return marked.parseInline(linkify(src, resolve), { async: false }) as string;
}

/** Sprungmarke eines Index-Eintrags in der Druckfassung (PDF-interne Verweise). */
/** Den Inhalt eines „## Abschnitts“ aus einem Markdown-Dokument holen (bis zum nächsten „## “). */
export function mdSection(md: string | undefined, heading: string): string {
	const m = md?.match(new RegExp(`^## ${heading}\\n([\\s\\S]*?)(?=^## |$(?![\\s\\S]))`, 'm'));
	return m?.[1].trim() ?? '';
}

export function printAnchor(key: string): string {
	return 'ref-' + key.replace(/[^a-z0-9]+/gi, '-');
}

/** Druckfassung: Verweise werden zu PDF-internen Sprüngen statt App-Links. */
function linkifyPrint(src: string, resolve?: Resolver): string {
	return src.replace(/\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|([^\]]+))?\]\]/g, (_m, target: string, label?: string) => {
		const text = (label || target).trim();
		const hit = resolve?.(target.trim());
		return hit ? `<a class="xref" href="#${printAnchor(hit.key)}">${text}</a>` : `<span class="xref">${text}</span>`;
	});
}

export function renderPrint(src: string, resolve?: Resolver, inline = false): string {
	if (!src) return '';
	if (inline) return marked.parseInline(linkifyPrint(src, resolve), { async: false }) as string;
	return callouts(marked.parse(linkifyPrint(src, resolve), { async: false }) as string);
}

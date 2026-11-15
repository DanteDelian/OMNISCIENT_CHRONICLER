/**
 * Graphen für das Beziehungsnetz (Seite Netzwerk) und die Ermittlungswand (Seite Rätselwand).
 * Hier entstehen Knoten und Kanten aus den Kampagnendaten, gezeichnet wird in ForceGraph.svelte.
 */
import { extractLinks } from './refs';
import { collectClues, QUESTION_TO } from './raetsel';
import { TONE } from './tone';
import type { CampaignData, RefEntry, WorldEntry } from './types';

export type NodeShape = 'circle' | 'diamond' | 'hex' | 'square' | 'star' | 'triangle';

export interface GraphNode {
	id: string;
	label: string;
	color: string;
	r: number;
	shape: NodeShape;
	/** Wofür der Knoten steht (Legende, Seitenleiste) */
	kind: string;
	group?: string;
	href?: string;
	/** Index-Schlüssel für die Vorschaukarte */
	ref?: string;
	/** Zweite Zeile in der Seitenleiste */
	sub?: string;
	/** Text für die Seitenleiste (Markdown) */
	text?: string;
	image?: string;
	imageFocus?: string;
	/** Gestrichelter Rand: vermutet oder unbekannt */
	dashed?: boolean;
	/** Beschriftung immer zeigen */
	labelAlways?: boolean;
}

export interface GraphLink {
	source: string;
	target: string;
	kind: string;
	color?: string;
	dashed?: boolean;
	width?: number;
	label?: string;
}

export interface Graph {
	nodes: GraphNode[];
	links: GraphLink[];
}

export type Resolve = (name: string) => RefEntry | undefined;

/** Kantenarten mit Beschriftung und Farbe (Legende, Seitenleiste) */
export const LINK_KINDS: Record<string, { label: string; color: string; dashed?: boolean }> = {
	verweis: { label: 'erwähnt', color: 'rgb(255 255 255 / 0.16)' },
	gefaehrte: { label: 'reist mit dir', color: 'rgb(230 189 110 / 0.5)' },
	vergangenheit: { label: 'aus deiner Vergangenheit', color: 'rgb(230 189 110 / 0.28)', dashed: true },
	eltern: { label: 'Eltern und Kinder', color: 'rgb(110 200 255 / 0.55)' },
	geschwister: { label: 'Geschwister', color: 'rgb(110 200 255 / 0.4)' },
	ehe: { label: 'verheiratet', color: 'rgb(230 189 110 / 0.6)' },
	theorie: { label: 'vermutet', color: 'rgb(160 148 255 / 0.5)', dashed: true },
	feindschaft: { label: 'Feindschaft', color: 'rgb(255 95 109 / 0.65)', dashed: true },
	geheimnis: { label: 'dein Geheimnis', color: 'rgb(230 189 110 / 0.22)' },
	weiss: { label: 'weiß es', color: 'rgb(255 181 71 / 0.7)' },
	ahnt: { label: 'ahnt es', color: 'rgb(255 181 71 / 0.45)', dashed: true },
	hand: { label: 'Rolle der Hand', color: 'rgb(110 200 255 / 0.4)', dashed: true },
	agent: { label: 'besetzt die Rolle', color: 'rgb(110 200 255 / 0.7)' },
	faden: { label: 'Faden', color: 'rgb(255 95 109 / 0.32)' },
	quelle: { label: 'steht in', color: 'rgb(255 255 255 / 0.12)', dashed: true }
};

class GraphBuilder {
	nodes = new Map<string, GraphNode>();
	links = new Map<string, GraphLink>();

	node(n: GraphNode): string {
		if (!this.nodes.has(n.id)) this.nodes.set(n.id, n);
		return n.id;
	}

	link(source: string, target: string, kind: string, extra: Partial<GraphLink> = {}) {
		if (source === target || !this.nodes.has(source) || !this.nodes.has(target)) return;
		const [a, b] = source < target ? [source, target] : [target, source];
		const key = `${a}|${b}|${kind}`;
		const hit = this.links.get(key);
		if (hit) {
			hit.width = Math.min(4, (hit.width ?? 1) + 0.5);
			return;
		}
		const style = LINK_KINDS[kind];
		this.links.set(key, { source, target, kind, color: style?.color, dashed: style?.dashed, width: 1, ...extra });
	}

	degree(): Map<string, number> {
		const d = new Map<string, number>();
		for (const l of this.links.values()) {
			d.set(l.source, (d.get(l.source) ?? 0) + 1);
			d.set(l.target, (d.get(l.target) ?? 0) + 1);
		}
		return d;
	}

	graph(): Graph {
		return { nodes: [...this.nodes.values()], links: [...this.links.values()] };
	}
}

/** Kurzer Name für die Beschriftung: ohne Spitznamen in „…“, bei langen Namen der erste Alias. */
export function shortLabel(name: string, aliases: string[] = []): string {
	const plain = name.replace(/\s*[„"“][^„"“”]*[“”"]\s*/g, ' ').replace(/\s+/g, ' ').trim();
	if (plain.length <= 20 || !aliases.length) return plain;
	return aliases[0];
}

const SHAPE_OF_KIND: Record<string, NodeShape> = {
	person: 'circle',
	fraktion: 'hex',
	ort: 'diamond',
	Person: 'circle',
	Fraktion: 'hex',
	Ort: 'diamond',
	Quest: 'hex',
	Zauber: 'diamond',
	Merkmal: 'circle',
	Kreatur: 'circle',
	Gegenstand: 'diamond',
	Dokument: 'square',
	Journal: 'square',
	Seite: 'square',
	Regel: 'square'
};

const KIND_COLOR: Record<string, string> = {
	Quest: 'var(--color-warn)',
	Zauber: 'var(--color-astral-2)',
	Merkmal: 'var(--color-gold)',
	Kreatur: 'var(--color-s-nekro)',
	Gegenstand: 'var(--color-s-verw)',
	Dokument: 'var(--color-ink-2)',
	Journal: 'var(--color-s-herv)',
	Seite: 'var(--color-ink-3)',
	Regel: 'var(--color-s-bann)'
};

function worldNode(w: WorldEntry): GraphNode {
	return {
		id: `world:${w.slug}`,
		label: shortLabel(w.name, w.aliases),
		color: TONE[w.tone]?.color ?? 'var(--color-ink-2)',
		r: w.kind === 'fraktion' ? 9 : w.kind === 'ort' ? 8 : 7,
		shape: SHAPE_OF_KIND[w.kind] ?? 'circle',
		kind: w.kind === 'person' ? 'Person' : w.kind === 'fraktion' ? 'Fraktion' : 'Ort',
		group: w.group,
		href: `/welt/${w.slug}`,
		ref: `world:${w.slug}`,
		sub: w.status,
		text: w.summary,
		image: w.image,
		imageFocus: w.imageFocus
	};
}

/** Größe nach Zahl der Verbindungen: Wer viele Fäden hat, wird groß und immer beschriftet. */
function sizeByDegree(b: GraphBuilder, base: number, labelFrom: number, only: (n: GraphNode) => boolean) {
	const deg = b.degree();
	for (const n of b.nodes.values()) {
		if (n.kind === 'Valerius' || !only(n)) continue;
		const d = deg.get(n.id) ?? 0;
		n.r = Math.max(n.r, base + Math.min(12, Math.sqrt(d) * 2.4));
		if (d >= labelFrom) n.labelAlways = true;
	}
}

export const WORLD_LAYERS = [
	{ id: 'verweise', label: 'Verweise', hint: 'Wer wen in seinem Eintrag erwähnt' },
	{ id: 'familie', label: 'Haus Lhaaz', hint: 'Stammbaum, Ehen und Feindschaften' },
	{ id: 'geheimnisse', label: 'Wer weiß was?', hint: 'Deine Geheimnisse und ihre Mitwisser' },
	{ id: 'hand', label: 'Die Hand', hint: 'Rollen und Leute deiner Organisation' }
] as const;

export type WorldLayer = (typeof WORLD_LAYERS)[number]['id'];

/** Das Beziehungsnetz: Valerius in der Mitte, die Welt drumherum, dazu Familie, Geheimnisse und die Hand. */
export function worldGraph(d: CampaignData, resolve: Resolve, layers: Set<WorldLayer>, groups: Set<string>): Graph {
	const b = new GraphBuilder();
	const me = b.node({
		id: 'valerius',
		label: 'Valerius',
		color: 'var(--color-gold)',
		r: 15,
		shape: 'star',
		kind: 'Valerius',
		href: '/bogen',
		sub: `${d.character.race} · ${d.character.className} ${d.character.level} · „${d.character.alias ?? ''}“`,
		text: d.character.goal,
		labelAlways: true
	});
	const visible = d.world.filter((w) => groups.has(w.group));
	for (const w of visible) b.node(worldNode(w));
	const worldId = (name: string) => {
		const hit = resolve(name);
		return hit?.key.startsWith('world:') && b.nodes.has(hit.key) ? hit.key : undefined;
	};

	for (const w of visible) {
		if (w.group === 'gruppe') b.link(me, `world:${w.slug}`, 'gefaehrte');
		if (w.group === 'vergangenheit') b.link(me, `world:${w.slug}`, 'vergangenheit');
	}

	if (layers.has('verweise')) {
		for (const w of visible) {
			for (const name of extractLinks(w.body)) {
				const target = worldId(name);
				if (target) b.link(`world:${w.slug}`, target, 'verweis');
			}
		}
	}

	if (layers.has('familie')) {
		for (const tree of d.trees) {
			const idOf = new Map<string, string>();
			for (const n of tree.nodes) {
				const linked = n.ref ? worldId(n.ref) : undefined;
				if (linked) idOf.set(n.id, linked);
				else if (!n.ref || !resolve(n.ref)) {
					idOf.set(
						n.id,
						b.node({
							id: `tree:${tree.id}:${n.id}`,
							label: n.label,
							color: TONE[n.tone ?? 'unknown'].color,
							r: 6,
							shape: 'circle',
							kind: 'Person',
							group: 'lhaaz',
							sub: n.sub?.replace(/ · /g, ', '),
							text: `Im Stammbaum „${tree.title}“, ohne eigenen Welt-Eintrag.`,
							dashed: true
						})
					);
				}
			}
			for (const e of tree.edges) {
				const kind = e.kind === 'eltern' ? 'eltern' : e.kind;
				const extra = e.uncertain ? { dashed: true } : {};
				if (e.kind === 'eltern') {
					for (const p of e.from) for (const c of e.to) if (idOf.get(p) && idOf.get(c)) b.link(idOf.get(p)!, idOf.get(c)!, kind, extra);
				} else if (idOf.get(e.from[0]) && idOf.get(e.to[0])) {
					b.link(idOf.get(e.from[0])!, idOf.get(e.to[0])!, kind, { ...extra, label: e.label });
				}
			}
		}
	}

	if (layers.has('geheimnisse')) {
		const STATUS: Record<string, { color: string; label: string }> = {
			sicher: { color: 'var(--color-life)', label: 'sicher' },
			gefaehrdet: { color: 'var(--color-warn)', label: 'gefährdet' },
			aufgeflogen: { color: 'var(--color-blood)', label: 'aufgeflogen' }
		};
		for (const s of d.geheimnisse.secrets.filter((x) => x.status !== 'archiv')) {
			const st = STATUS[s.status] ?? STATUS.sicher;
			const id = b.node({
				id: `secret:${s.id}`,
				label: s.title,
				color: st.color,
				r: 8,
				shape: 'square',
				kind: 'Geheimnis',
				href: `/geheimnisse#${s.id}`,
				sub: `Geheimnis · ${st.label}`,
				text: s.truth
			});
			b.link(me, id, 'geheimnis');
			for (const [list, kind] of [
				[s.knownBy, 'weiss'],
				[s.suspects, 'ahnt']
			] as const) {
				for (const w of list) {
					let target = worldId(w.who);
					if (!target) {
						target = b.node({ id: `who:${w.who}`, label: w.who.replace(/[„“"]/g, ''), color: 'var(--color-ink-3)', r: 5, shape: 'circle', kind: 'Person', text: w.how, dashed: true });
					}
					b.link(target, id, kind, { label: w.how });
				}
			}
		}
	}

	if (layers.has('hand')) {
		for (const r of d.netzwerk.roles) {
			const filled = d.netzwerk.agents.some((a) => a.role === r.id && a.status === 'aktiv');
			const id = b.node({
				id: `rolle:${r.id}`,
				label: r.label,
				color: 'var(--color-astral-2)',
				r: 7,
				shape: 'hex',
				kind: 'Rolle der Hand',
				href: '/netzwerk?ansicht=hand',
				sub: `${filled ? 'besetzt' : 'offen'} · ${r.cost}`,
				text: `${r.task}. **Wo:** ${r.where}`,
				dashed: !filled
			});
			b.link(me, id, 'hand');
		}
		for (const a of d.netzwerk.agents.filter((x) => x.status !== 'verloren')) {
			const target =
				(a.ref && worldId(a.ref)) ||
				b.node({ id: `agent:${a.id}`, label: a.name, color: 'var(--color-astral-2)', r: 6, shape: 'circle', kind: 'Agent', href: `/netzwerk?ansicht=hand#${a.id}`, sub: a.status, text: a.knows ? `**Weiß über dich:** ${a.knows}` : a.notes });
			b.link(target, `rolle:${a.role}`, 'agent');
		}
	}

	sizeByDegree(b, 6, 7, (n) => n.id.startsWith('world:'));
	return b.graph();
}

export const MYSTERY_LAYERS = [
	{ id: 'fragen', label: 'Offene Fragen', color: 'var(--color-astral)' },
	{ id: 'theorie', label: 'Theorien', color: 'var(--color-astral-2)' },
	{ id: 'offen', label: 'Offene Punkte', color: 'var(--color-warn)' },
	{ id: 'mysterien', label: 'Mysterien', color: 'var(--color-life)' },
	{ id: 'widersprueche', label: 'Widersprüche', color: 'var(--color-blood)' }
] as const;

export type MysteryLayer = (typeof MYSTERY_LAYERS)[number]['id'];

/** Namen, die als Wort im Text zu häufig Falsches treffen würden */
const MENTION_STOP = new Set(['turm', 'lhaaz', 'festung', 'siedlung', 'allianz', 'orc', 'dino', 'fee', 'satyr', 'reittier', 'zuflucht', 'karte', 'leons stadt']);

/**
 * Wer wird in einem Text erwähnt? [[Verweise]] zählen sicher, dazu Namen und Aliasse von Welt-Einträgen als
 * ganzes Wort (ab 4 Buchstaben). So hängen auch Theorien ohne Verweis an den richtigen Personen.
 */
function mentionFinder(d: CampaignData, resolve: Resolve) {
	const matchers = d.world.map((w) => {
		const names = [w.name, ...w.aliases]
			.map((n) => n.replace(/\s*[„"“][^„"“”]*[“”"]\s*/g, ' ').trim())
			.filter((n) => n.length >= 4 && !MENTION_STOP.has(n.toLowerCase()));
		const pattern = names.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
		return { key: `world:${w.slug}`, re: pattern ? new RegExp(`(?<![\\p{L}])(?:${pattern})(?![\\p{L}])`, 'iu') : null };
	});
	return (text: string): string[] => {
		const keys = new Set<string>();
		for (const name of extractLinks(text)) {
			const hit = resolve(name);
			if (hit) keys.add(hit.key);
		}
		const plain = text.replace(/\[\[[^\]]*\]\]/g, ' ');
		for (const m of matchers) if (m.re?.test(plain)) keys.add(m.key);
		return [...keys];
	};
}

function short(text: string, words = 7): string {
	const plain = text
		.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_m, t, l) => l || t)
		.replace(/[*_`]/g, '')
		.trim();
	const parts = plain.split(/\s+/);
	return parts.length > words ? parts.slice(0, words).join(' ') + ' …' : plain;
}

/**
 * Die Ermittlungswand: offene Fragen, Theorien, offene Punkte, Mysterien und Widersprüche, verbunden mit den
 * Personen, Orten und Gruppen, die sie betreffen. Wo viele Fäden zusammenlaufen, liegt ein Knoten.
 */
export function mysteryGraph(d: CampaignData, resolve: Resolve, layers: Set<MysteryLayer>, to: Set<string>): Graph {
	const b = new GraphBuilder();
	const mentions = mentionFinder(d, resolve);
	const byKey = new Map(d.index.map((e) => [e.key, e]));

	const entity = (key: string): string | undefined => {
		if (b.nodes.has(key)) return key;
		const e = byKey.get(key);
		if (!e) return undefined;
		const w = key.startsWith('world:') ? d.world.find((x) => `world:${x.slug}` === key) : undefined;
		if (w) return b.node({ ...worldNode(w), r: 6 });
		return b.node({
			id: key,
			label: shortLabel(e.title),
			color: KIND_COLOR[e.kind] ?? 'var(--color-ink-2)',
			r: 6,
			shape: SHAPE_OF_KIND[e.kind] ?? 'square',
			kind: e.kind,
			href: e.href,
			ref: key,
			sub: e.meta,
			text: e.summary
		});
	};
	const connect = (id: string, keys: string[], kind = 'faden') => {
		for (const k of keys) {
			const target = entity(k);
			if (target) b.link(id, target, kind);
		}
	};

	if (layers.has('fragen')) {
		for (const q of d.fragen.filter((x) => x.status === 'offen' && to.has(x.to))) {
			const id = b.node({
				id: `frage:${q.id}`,
				label: q.topic,
				color: q.to === 'dm' ? 'var(--color-astral)' : q.to === 'tisch' ? 'var(--color-astral-2)' : 'var(--color-gold)',
				r: 8,
				shape: 'circle',
				kind: 'Frage',
				href: `/raetsel?ansicht=listen#${q.id}`,
				sub: QUESTION_TO[q.to].label,
				text: q.question
			});
			const keys = new Set([...(q.links ?? []).map((l) => resolve(l)?.key).filter((k): k is string => !!k), ...mentions(q.question)]);
			connect(id, [...keys]);
		}
	}

	const clues = collectClues(d);
	clues.forEach((c, i) => {
		if (!layers.has(c.kind)) return;
		const id = b.node({
			id: `clue:${i}`,
			label: short(c.text, 5),
			color: c.kind === 'theorie' ? 'var(--color-astral-2)' : 'var(--color-warn)',
			r: 4.5,
			shape: 'diamond',
			kind: c.kind === 'theorie' ? 'Theorie' : 'Offener Punkt',
			href: c.source.href,
			ref: c.source.ref,
			sub: `${c.kind === 'theorie' ? 'Theorie' : 'Offen'} · aus ${c.source.title}${c.when ? ` · ${c.when}` : ''}`,
			text: c.text
		});
		const keys = mentions(c.text);
		// Die Fundstelle zählt, wenn sie selbst ein Thema ist (Person, Ort, Quest) oder der Text niemanden nennt
		const src = c.source.ref;
		const srcIsTopic = src.startsWith('world:') || src.startsWith('quest:');
		if (srcIsTopic && !keys.includes(src)) keys.push(src);
		if (!keys.length) keys.push(src);
		connect(id, keys);
	});

	if (layers.has('mysterien')) {
		for (const q of d.quests.filter((x) => x.kind === 'Mysterium' && (x.status === 'aktiv' || x.status === 'geruecht'))) {
			const id = b.node({
				id: `quest:${q.id}`,
				label: q.title,
				color: 'var(--color-life)',
				r: 10,
				shape: 'hex',
				kind: 'Mysterium',
				href: `/quests#${q.id}`,
				ref: `quest:${q.id}`,
				sub: q.status === 'aktiv' ? 'Mysterium · aktiv' : 'Mysterium · Gerücht',
				text: q.next || q.notes,
				labelAlways: true
			});
			const keys = new Set([...(q.links ?? []).map((l) => resolve(l)?.key).filter((k): k is string => !!k), ...mentions(`${q.next ?? ''}`)]);
			keys.delete(id);
			connect(id, [...keys]);
		}
	}

	if (layers.has('widersprueche')) {
		for (const j of d.journal) {
			(j.contradictions ?? []).forEach((text, i) => {
				const id = b.node({
					id: `widerspruch:${j.id}:${i}`,
					label: short(text, 5),
					color: 'var(--color-blood)',
					r: 7,
					shape: 'triangle',
					kind: 'Widerspruch',
					href: `/journal#${j.id}`,
					ref: `journal:${j.id}`,
					sub: `Widerspruch · ${j.title} · ${j.dateLabel}`,
					text
				});
				const keys = mentions(text);
				connect(id, keys.length ? keys : [`journal:${j.id}`]);
			});
		}
	}

	// Nur Personen, Orte und Gruppen wachsen mit ihren Fäden: Dokumente sind Fundstellen, keine Brennpunkte
	sizeByDegree(b, 6, 4, (n) => n.id.startsWith('world:'));
	return b.graph();
}

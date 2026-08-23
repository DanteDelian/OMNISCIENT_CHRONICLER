import { listNotes } from './vault';

export type MapConfidence = 'confirmed' | 'approximate' | 'rumored' | 'mentioned';
export type MapKind = 'place' | 'person';

export interface MapNode {
	id: string; // Notiz-Pfad
	title: string;
	kind: MapKind;
	type: string; // grobe Art aus Tags (stadt/region/fraktion/…)
	degree: number;
}
export interface MapEdge {
	source: string;
	target: string;
	type: string; // z.B. „nördlich_von" (räumlich) oder „verbunden" (Wikilink)
	confidence: MapConfidence;
	spatial: boolean; // aus strukturierter Relation (räumlich) statt bloßem Wikilink?
	distance?: string;
}

function tagsOf(fm: Record<string, unknown> | undefined): string[] {
	const t = fm?.tags;
	if (Array.isArray(t)) return t.map(String);
	if (typeof t === 'string') return [t];
	return [];
}

/**
 * Das „Kampagnen-Geflecht": Orte UND Personen als Knoten, Kanten NUR aus real
 * beschriebenen Daten — `[[Wikilinks]]` zwischen Einträgen sowie (falls gepflegt)
 * strukturierte räumliche `relations`-Frontmatter mit Confidence. Nichts wird erfunden.
 */
export function buildMapGraph(): { nodes: MapNode[]; edges: MapEdge[] } {
	const notes = listNotes().filter(
		(n) => n.path.startsWith('places/') || n.path.startsWith('npcs/')
	);
	const byTitle = new Map(notes.map((n) => [n.title.toLowerCase(), n]));

	const nodes: MapNode[] = notes.map((n) => {
		const kind: MapKind = n.path.startsWith('places/') ? 'place' : 'person';
		const type =
			tagsOf(n.frontmatter).find(
				(t) => !['ort', 'orte', 'place', 'npc', 'person'].includes(t.toLowerCase())
			) || (kind === 'place' ? 'ort' : 'person');
		return { id: n.path, title: n.title, kind, type, degree: 0 };
	});
	const nodeByPath = new Map(nodes.map((n) => [n.id, n]));

	const edges: MapEdge[] = [];
	const seen = new Set<string>();
	const clean = (s: string) => s.replace(/\[\[|\]\]/g, '').split(/[#|]/)[0].trim().toLowerCase();

	function addEdge(
		a: string,
		b: string,
		type: string,
		confidence: MapConfidence,
		spatial: boolean,
		distance?: string
	) {
		if (a === b) return;
		const key = [a, b].sort().join('|');
		const existing = seen.has(key);
		if (existing && !spatial) return; // Wikilink nicht über eine bestehende Kante legen
		if (existing) {
			// räumliche Relation ersetzt/verstärkt eine bloße Wikilink-Kante
			const e = edges.find((x) => [x.source, x.target].sort().join('|') === key);
			if (e) Object.assign(e, { type, confidence, spatial, distance });
			return;
		}
		seen.add(key);
		edges.push({ source: a, target: b, type, confidence, spatial, distance });
		nodeByPath.get(a)!.degree++;
		nodeByPath.get(b)!.degree++;
	}

	// (1) räumliche Relationen zuerst (höchste Aussagekraft)
	for (const n of notes) {
		const rels = Array.isArray(n.frontmatter?.relations) ? (n.frontmatter!.relations as unknown[]) : [];
		for (const raw of rels) {
			const r = raw as { to?: string; type?: string; confidence?: MapConfidence; distance?: string };
			const target = r.to && byTitle.get(clean(String(r.to)));
			if (target) addEdge(n.path, target.path, r.type || 'verbunden', r.confidence || 'confirmed', true, r.distance);
		}
	}
	// (2) Wikilinks als „verbunden" (mentioned)
	for (const n of notes) {
		for (const l of n.links) {
			const target = byTitle.get(l.toLowerCase());
			if (target) addEdge(n.path, target.path, 'verbunden', 'mentioned', false);
		}
	}

	return { nodes, edges };
}

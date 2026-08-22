/**
 * KI-Sidecar — steckbarer Provider, der aus Roh-Sessiontext strukturierte
 * Kampagnen-Vorschläge (SessionUpdatesDTO) macht. Vollständig OPTIONAL:
 * ohne konfigurierten Provider funktioniert die Werkstatt weiter (manuell).
 *
 * Standard-Provider: Gemini (REST, kein SDK). Austauschbar über AI_PROVIDER.
 * Env: AI_PROVIDER=gemini|none · GEMINI_API_KEY=… · GEMINI_MODEL=gemini-2.5-flash
 */
import { env } from '$env/dynamic/private';
import type { SessionUpdatesDTO, AiStatus } from '$lib/types';

export interface AiProvider {
	readonly name: string;
	readonly model: string;
	processSession(rawText: string, context: string): Promise<SessionUpdatesDTO>;
}

const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';

function resolveProviderName(): string {
	const explicit = (env.AI_PROVIDER || '').trim().toLowerCase();
	if (explicit) return explicit;
	// Auto: Gemini, sobald ein Key vorhanden ist — sonst „none".
	return env.GEMINI_API_KEY ? 'gemini' : 'none';
}

const SYSTEM_PROMPT = `Du bist der „Chronist" — die KI-Schicht eines persönlichen D&D-5e-Kampagnen-Archivs.
Deine Aufgabe: Aus rohen Session-Notizen (Deutsch) präzise, strukturierte Aktualisierungs-VORSCHLÄGE ableiten.

WICHTIGE PRINZIPIEN:
- Du INTERPRETIERST und STRUKTURIERST — du entscheidest nicht. Der Mensch prüft jeden Vorschlag.
- Erfinde nichts. Nutze nur, was im Text steht oder klar daraus folgt. Keine erfundene Geografie, keine erfundenen Fakten.
- Deutsch, stimmungsvoll aber knapp. Eigennamen exakt übernehmen.

GIB AUSSCHLIESSLICH GÜLTIGES JSON in genau dieser Form zurück (keine Code-Fences, kein Text drumherum):
{
  "session_title": "kurzer Titel der Session",
  "session_summary": "2-3 Sätze Zusammenfassung",
  "session_highlights": ["Stichpunkt", "..."],
  "chronik_append": "Fließtext-Absatz für die Chronik (Markdown, Vergangenheit).",
  "analyse_content": "kurze strategische Analyse / offene Fäden (Markdown) oder \"\".",
  "quests": [{ "title": "", "giver": "", "status": "rumor|active|done", "priority": "low|normal|high", "next_step": "", "reward": "" }],
  "inventory": [{ "name": "", "quantity": 1, "weight": 0, "category": "weapon|armor|gear|consumable|magic|treasure", "note": "" }],
  "glossar": [{ "type": "Personen|Orte", "name": "", "content": "Markdown-Kurzeintrag, beginne mit einem Satz Wer/Was." }],
  "character": { "hp_max": null, "level": null, "gold_delta": 0, "silver_delta": 0, "copper_delta": 0, "new_conditions": [] }
}
Regeln:
- inventory.quantity NEGATIV bei Verlust/Verbrauch (z.B. „einen Trank benutzt" -> -1).
- Nur Felder füllen, für die es Belege gibt; leere Arrays statt Erfindungen. "character" darf null sein.
- quests: bereits erledigte -> status "done"; neue Gerüchte -> "rumor".`;

class GeminiProvider implements AiProvider {
	readonly name = 'gemini';
	readonly model: string;
	private key: string;

	constructor(key: string, model: string) {
		this.key = key;
		this.model = model;
	}

	async processSession(rawText: string, context: string): Promise<SessionUpdatesDTO> {
		const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(this.model)}:generateContent?key=${encodeURIComponent(this.key)}`;
		const body = {
			systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
			contents: [
				{
					role: 'user',
					parts: [
						{
							text: `=== BISHERIGER KAMPAGNEN-KONTEXT ===\n${context}\n\n=== ROHE SESSION-NOTIZEN ===\n${rawText}`
						}
					]
				}
			],
			generationConfig: { responseMimeType: 'application/json', temperature: 0.4 }
		};
		const res = await fetch(url, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(body)
		});
		if (!res.ok) {
			const detail = await res.text().catch(() => '');
			throw new Error(`Gemini-Fehler ${res.status}: ${detail.slice(0, 300)}`);
		}
		const data = (await res.json()) as {
			candidates?: { content?: { parts?: { text?: string }[] } }[];
		};
		const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
		return parseDto(text);
	}
}

/** Defensives Parsen: JSON aus evtl. vorhandenen Code-Fences/Text herausschälen. */
export function parseDto(text: string): SessionUpdatesDTO {
	let s = text.trim();
	const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
	if (fence) s = fence[1].trim();
	const start = s.indexOf('{');
	const end = s.lastIndexOf('}');
	if (start > 0 || end < s.length - 1) s = s.slice(start, end + 1);
	const raw = JSON.parse(s) as Partial<SessionUpdatesDTO>;
	return {
		session_title: raw.session_title || '',
		session_summary: raw.session_summary || '',
		session_highlights: Array.isArray(raw.session_highlights) ? raw.session_highlights : [],
		chronik_append: raw.chronik_append || '',
		analyse_content: raw.analyse_content || '',
		quests: Array.isArray(raw.quests) ? raw.quests : [],
		inventory: Array.isArray(raw.inventory) ? raw.inventory : [],
		glossar: Array.isArray(raw.glossar) ? raw.glossar : [],
		character: raw.character ?? null
	};
}

/**
 * Offline-/Demo-Provider (AI_PROVIDER=mock): liefert einen kleinen, deterministischen
 * Patch ohne externen Aufruf. Nützlich ohne API-Schlüssel und für Tests.
 */
class MockProvider implements AiProvider {
	readonly name = 'mock';
	readonly model = 'offline-demo';
	async processSession(rawText: string): Promise<SessionUpdatesDTO> {
		const first = rawText.split(/\n|\./)[0]?.trim().slice(0, 80) || 'Neue Ereignisse';
		return {
			session_title: first,
			session_summary: 'Automatisch erzeugter Demo-Patch (Offline-Modus, kein KI-Aufruf).',
			session_highlights: ['Demo-Eintrag aus dem Offline-Modus'],
			chronik_append: rawText.trim().slice(0, 600) || 'Die Reise ging weiter.',
			analyse_content: 'Offene Fäden aus dieser Session prüfen.',
			quests: [
				{ title: 'Demo-Quest', giver: '', status: 'active', priority: 'normal', next_step: 'Nächsten Schritt festlegen', reward: '' }
			],
			inventory: [{ name: 'Demo-Fund', quantity: 1, weight: 0, category: 'gear', note: 'aus dem Offline-Modus' }],
			glossar: [{ type: 'Personen', name: 'Demo-NSC', content: 'Ein im Offline-Modus angelegter Beispiel-Eintrag.' }],
			character: { hp_max: null, level: null, gold_delta: 5, silver_delta: 0, copper_delta: 0, new_conditions: [] }
		};
	}
}

export function getAiProvider(): AiProvider | null {
	const name = resolveProviderName();
	if (name === 'mock') return new MockProvider();
	if (name === 'gemini' && env.GEMINI_API_KEY) {
		return new GeminiProvider(env.GEMINI_API_KEY, env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL);
	}
	return null;
}

export function aiStatus(): AiStatus {
	const provider = getAiProvider();
	if (provider) {
		return { configured: true, provider: provider.name, model: provider.model };
	}
	return {
		configured: false,
		provider: resolveProviderName(),
		model: env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL,
		hint: 'Kein KI-Schlüssel gesetzt. Trage GEMINI_API_KEY in die .env ein (oder verarbeite die Session mit Claude Code).'
	};
}

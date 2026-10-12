/**
 * Regel-Referenz für den Spieltisch (D&D 5e, Spielerhandbuch 2014 / SRD 5.1).
 * Eigene, vollständige Zusammenfassungen. „Für Valerius“ ergänzt passende Hinweise.
 */

export interface Condition {
	id: string;
	name: string;
	effects: string[];
	valerius?: string;
}

export const CONDITIONS: Condition[] = [
	{
		id: 'blind',
		name: 'Blind',
		effects: [
			'Du kannst nicht sehen und scheiterst automatisch an Würfen, die Sicht erfordern.',
			'Angriffe gegen dich haben Vorteil, deine Angriffe haben Nachteil.'
		],
		valerius: 'Zauber, die ein sichtbares Ziel brauchen (Totenglocke, Gegenzauber), gehen nicht.'
	},
	{
		id: 'bezaubert',
		name: 'Bezaubert',
		effects: [
			'Du kannst den Bezauberer nicht angreifen und nicht mit schädlichen Fähigkeiten oder Zaubern anvisieren.',
			'Der Bezauberer hat Vorteil auf soziale Attributswürfe gegen dich.'
		],
		valerius: 'Feenabstammung: Vorteil auf Rettungswürfe gegen Bezauberung.'
	},
	{
		id: 'taub',
		name: 'Taub',
		effects: ['Du kannst nicht hören und scheiterst automatisch an Würfen, die Gehör erfordern.']
	},
	{
		id: 'veraengstigt',
		name: 'Verängstigt',
		effects: [
			'Nachteil auf Attributswürfe und Angriffe, solange die Quelle der Furcht in Sichtlinie ist.',
			'Du kannst dich nicht freiwillig auf die Quelle zubewegen.'
		]
	},
	{
		id: 'gepackt',
		name: 'Gepackt',
		effects: [
			'Bewegungsrate 0, Boni auf die Bewegungsrate zählen nicht.',
			'Endet, wenn der Packende kampfunfähig wird oder du aus seiner Reichweite gebracht wirst.'
		],
		valerius: 'Sternenschritt befreit dich: Teleport ist keine Bewegung.'
	},
	{
		id: 'kampfunfaehig',
		name: 'Kampfunfähig',
		effects: ['Du kannst keine Aktionen und keine Reaktionen ausführen.'],
		valerius: 'Beendet deine Konzentration.'
	},
	{
		id: 'unsichtbar',
		name: 'Unsichtbar',
		effects: [
			'Ohne Magie oder besondere Sinne nicht zu sehen. Zum Verstecken gilt der Bereich als komplett verschleiert.',
			'Geräusche und Spuren können deinen Standort verraten.',
			'Angriffe gegen dich haben Nachteil, deine Angriffe haben Vorteil.'
		]
	},
	{
		id: 'gelaehmt',
		name: 'Gelähmt',
		effects: [
			'Kampfunfähig, du kannst dich nicht bewegen und nicht sprechen.',
			'Rettungswürfe auf ST und GE scheitern automatisch.',
			'Angriffe gegen dich haben Vorteil. Jeder Treffer aus 1,5 m ist ein kritischer Treffer.'
		],
		valerius: 'Keine verbalen Komponenten möglich. Gegenzauber vorher ist der beste Schutz.'
	},
	{
		id: 'versteinert',
		name: 'Versteinert',
		effects: [
			'Du wirst mit allem, was du trägst, zu fester, lebloser Substanz. Gewicht × 10, du alterst nicht.',
			'Kampfunfähig, keine Bewegung, keine Sprache, keine Wahrnehmung der Umgebung.',
			'Angriffe gegen dich haben Vorteil. Rettungswürfe auf ST und GE scheitern automatisch.',
			'Resistenz gegen jeden Schaden. Immun gegen Gift und Krankheit, bestehende ruhen.'
		]
	},
	{
		id: 'vergiftet',
		name: 'Vergiftet',
		effects: ['Nachteil auf Angriffswürfe und Attributswürfe.']
	},
	{
		id: 'liegend',
		name: 'Liegend',
		effects: [
			'Du kannst nur kriechen, außer du stehst auf (kostet die Hälfte deiner Bewegung).',
			'Deine Angriffe haben Nachteil.',
			'Angriffe gegen dich haben aus 1,5 m Vorteil, aus größerer Entfernung Nachteil.'
		]
	},
	{
		id: 'festgehalten',
		name: 'Festgehalten',
		effects: [
			'Bewegungsrate 0.',
			'Angriffe gegen dich haben Vorteil, deine Angriffe haben Nachteil.',
			'Nachteil auf GE-Rettungswürfe.'
		],
		valerius: 'Das ist der Zustand, den dein Netz verursacht.'
	},
	{
		id: 'betaeubt',
		name: 'Betäubt',
		effects: [
			'Kampfunfähig, du kannst dich nicht bewegen und nur stockend sprechen.',
			'Rettungswürfe auf ST und GE scheitern automatisch.',
			'Angriffe gegen dich haben Vorteil.'
		]
	},
	{
		id: 'bewusstlos',
		name: 'Bewusstlos',
		effects: [
			'Kampfunfähig, keine Bewegung, keine Sprache, keine Wahrnehmung der Umgebung.',
			'Du lässt fallen, was du hältst, und bist liegend.',
			'Rettungswürfe auf ST und GE scheitern automatisch.',
			'Angriffe gegen dich haben Vorteil. Jeder Treffer aus 1,5 m ist ein kritischer Treffer.'
		]
	}
];

export const EXHAUSTION = [
	'Nachteil auf Attributswürfe',
	'Bewegungsrate halbiert',
	'Nachteil auf Angriffe und Rettungswürfe',
	'Trefferpunkte-Maximum halbiert',
	'Bewegungsrate 0',
	'Tod'
];

export interface RuleItem {
	name: string;
	text: string;
	valerius?: string;
}

export const ACTIONS: RuleItem[] = [
	{ name: 'Angriff', text: 'Ein Nahkampf- oder Fernkampfangriff mit einer Waffe oder waffenlos.', valerius: 'Dolch +4 (1W4 + 1) oder Stab +3 (1W6, zweihändig 1W8).' },
	{ name: 'Zaubern', text: 'Einen Zauber mit der Wirkzeit 1 Aktion wirken.' },
	{ name: 'Spurt', text: 'Zusätzliche Bewegung in Höhe deiner Bewegungsrate für diesen Zug.', valerius: '9 m + 9 m, mit Sternenschritt 27 m in einer Runde.' },
	{ name: 'Rückzug', text: 'Deine Bewegung provoziert in diesem Zug keine Gelegenheitsangriffe.' },
	{ name: 'Ausweichen', text: 'Bis zu deinem nächsten Zug haben Angriffe gegen dich Nachteil, wenn du den Angreifer sehen kannst, und du hast Vorteil auf GE-Rettungswürfe.', valerius: 'Gut, wenn du Konzentration (Netz) unbedingt halten musst.' },
	{ name: 'Helfen', text: 'Ein Verbündeter hat Vorteil auf seinen nächsten Attributswurf für eine Aufgabe, bei der du hilfst, oder auf seinen nächsten Angriff gegen eine Kreatur in 1,5 m von dir.', valerius: 'Das kann auch dein Vertrauter.' },
	{ name: 'Verstecken', text: 'GE-Wurf (Heimlichkeit). Gelingt er, bist du versteckt, solange man dich nicht entdeckt.' },
	{ name: 'Vorbereiten', text: 'Du legst einen Auslöser und eine Reaktion fest. Ein vorbereiteter Zauber verbraucht den Platz sofort und braucht Konzentration bis zum Auslöser.' },
	{ name: 'Suchen', text: 'Du suchst gezielt, meist mit Wahrnehmung oder Nachforschung.' },
	{ name: 'Gegenstand benutzen', text: 'Mit einem Gegenstand interagieren, der eine Aktion braucht, zum Beispiel einen Heiltrank trinken.' }
];

export const SPELL_RULES: RuleItem[] = [
	{ name: 'Verbal (V)', text: 'Du musst sprechen können. In magischer Stille oder geknebelt geht das nicht.' },
	{ name: 'Gestik (G)', text: 'Du brauchst mindestens eine freie Hand.', valerius: 'Den Stab einhändig führen, sonst kein Gegenzauber.' },
	{ name: 'Material (M)', text: 'Ein Komponentenbeutel oder Zauberfokus ersetzt Materialien ohne Preisangabe. Materialien mit Preis brauchst du wirklich.', valerius: 'Dein Arkaner Fokus ist der Ring. Vertrauten finden kostet trotzdem 10 GM Material.' },
	{ name: 'Bonusaktions-Zauber', text: 'Wirkst du einen Zauber als Bonusaktion, darfst du im selben Zug mit deiner Aktion nur noch einen Zaubertrick mit 1 Aktion Wirkzeit wirken.', valerius: 'Sternenschritt ist kein Zauber und löst die Regel nicht aus.' },
	{ name: 'Konzentration', text: 'Nur ein Konzentrationszauber gleichzeitig. Bei Schaden ein KO-Rettungswurf gegen SG 10 oder den halben Schaden (der höhere Wert), pro Schadensquelle. Endet auch, wenn du kampfunfähig wirst oder stirbst.', valerius: 'KO-Rettungswurf +3: bei SG 10 hältst du zu 70 %.' },
	{ name: 'Rituale', text: 'Zauber mit Ritual-Merkmal können ohne Zauberplatz gewirkt werden. Die Wirkzeit verlängert sich um 10 Minuten.', valerius: 'Als Magier musst du Rituale nicht einmal vorbereiten, sie müssen nur im Buch stehen.' },
	{ name: 'Zauber wahrnehmen', text: 'Wer dich beim Zaubern sieht oder hört, bemerkt es, außer eine Regel sagt etwas anderes.' }
];

export const COMBAT_RULES: RuleItem[] = [
	{ name: 'Gelegenheitsangriff', text: 'Verlässt eine sichtbare feindliche Kreatur deine Reichweite, kannst du mit deiner Reaktion einen Nahkampfangriff gegen sie machen.' },
	{ name: 'Halbe Deckung', text: '+2 auf RK und GE-Rettungswürfe (etwa durch eine niedrige Mauer oder eine andere Kreatur).' },
	{ name: 'Dreivierteldeckung', text: '+5 auf RK und GE-Rettungswürfe (etwa durch eine Schießscharte).' },
	{ name: 'Volle Deckung', text: 'Du kannst nicht direkt von Angriffen oder Zaubern anvisiert werden.' },
	{ name: 'Vorteil und Nachteil', text: 'Zwei W20 würfeln, den höheren (Vorteil) oder niedrigeren (Nachteil) nehmen. Beides zusammen hebt sich auf, egal wie viele Quellen.' },
	{ name: 'Kritischer Treffer', text: 'Eine natürliche 20 trifft immer. Alle Schadenswürfel werden doppelt gewürfelt.' },
	{ name: 'Packen', text: 'Statt eines Angriffs: ST (Athletik) gegen ST (Athletik) oder GE (Akrobatik) des Ziels. Das Ziel ist gepackt.' },
	{ name: 'Stoßen', text: 'Statt eines Angriffs: ST (Athletik) gegen ST (Athletik) oder GE (Akrobatik). Ziel 1,5 m wegstoßen oder umwerfen.' }
];

export const VISION_RULES: RuleItem[] = [
	{ name: 'Leicht verschleiert', text: 'Dämmerlicht, lockerer Nebel, Laub: Nachteil auf Wahrnehmung, die Sicht braucht.', valerius: 'Das Innere deines Netzes ist leicht verschleiert.' },
	{ name: 'Komplett verschleiert', text: 'Dunkelheit, dichter Nebel: Wer hineinsieht, ist praktisch blind.' },
	{ name: 'Dunkelsicht', text: 'Dämmerlicht wie helles Licht, Dunkelheit wie Dämmerlicht, aber nur in Grautönen.', valerius: 'Du hast 18 m Dunkelsicht. Vertraute: Eule 36 m; Echse, Frosch, Ratte, Spinne 9 m; Fledermaus 18 m Blindsicht; Falke, Rabe, Katze, Wiesel keine.' }
];

export const DEATH_RULES: RuleItem[] = [
	{ name: 'Todesrettungswürfe', text: 'Bei 0 TP würfelst du zu Beginn jedes Zuges einen W20: 10 oder mehr ist ein Erfolg, sonst ein Fehlschlag. 3 Erfolge: stabil. 3 Fehlschläge: tot.' },
	{ name: 'Natürliche 1 und 20', text: 'Eine 1 zählt als zwei Fehlschläge. Eine 20 gibt dir sofort 1 TP zurück.' },
	{ name: 'Schaden bei 0 TP', text: 'Jeder Schaden zählt als ein Fehlschlag, ein kritischer Treffer als zwei. Ist der Schaden mindestens so hoch wie dein TP-Maximum, stirbst du sofort.' },
	{ name: 'Heilung', text: 'Jede Heilung bei 0 TP holt dich zurück und setzt die Todesrettungswürfe zurück.' }
];

export const REST_RULES: RuleItem[] = [
	{ name: 'Kurze Rast', text: 'Mindestens 1 Stunde. Du kannst Trefferwürfel ausgeben: je W6 + KO-Modifikator heilen.', valerius: 'Je Würfel W6 + 3 (Ø 6,5). Dazu 1× pro Tag Arkane Erholung (Plätze bis zusammen 3 Grade).' },
	{ name: 'Lange Rast', text: 'Normalerweise 8 Stunden, höchstens eine pro 24 Stunden. Alle TP, alle Zauberplätze und die Hälfte deiner Trefferwürfel (mindestens 1) zurück.', valerius: 'Astrale Trance: Dir reichen 4 Stunden. Du erhältst 2 Trefferwürfel zurück und wählst deine Tagesübung neu.' },
	{ name: 'Erschöpfung', text: 'Eine lange Rast mit Essen und Trinken senkt die Erschöpfung um eine Stufe.' }
];

# Omniscient Chronicler — Ziel-Funktionen

> Das Produkt ist **kein** weiterer Charakterbogen und **kein** Wiki mit D&D-Skin.
> Es ist ein **lebendiges Kampagnen-Gedächtnis**: das Buch, in dem eine über Jahre laufende
> D&D-5e-Kampagne lebt — persönlich, lokal, privat.

## Vision

Nach einer Session erzählst du einfach, **was passiert ist**. Die App leitet daraus geprüfte,
quellenverfolgte Aktualisierungen ab — Chronik, Charakter, Inventar, Quests, NSCs, Orte, Wissen —
und bereitet dich auf die nächste Session vor. Über viele Sessions entsteht eine visuelle,
lebendige Erinnerung an die gesamte Kampagne.

## Leitprinzipien

1. **Deine Dateien sind die Wahrheit.** Alles liegt lesbar in `campaign/` (JSON + Markdown),
   Git-versioniert, exportierbar, kein Lock-in.
2. **Lokal-first & privat.** Läuft auf deinem Rechner/LAN. Externe KI ist **optional**, nie Voraussetzung.
3. **KI schlägt vor, du entscheidest.** Die KI interpretiert und strukturiert — sie überschreibt nie
   blind und erfindet nichts. Jede Änderung ist einzeln bestätigbar.
4. **Wissen hat Ebenen.** Fakt ≠ Gerücht ≠ Theorie. Eine Theorie wird nie automatisch zum Fakt.
5. **Provenance.** Jede übernommene Änderung weiß, aus welcher Session sie stammt.
6. **Gamefyed, aber kein Videospiel.** Immersive Dark-Fantasy-Atmosphäre — kein Effektgewitter,
   keine künstliche Gamification (keine Freundschaftsbalken, keine NSC-XP, keine Deko-Belohnungen).

## Kern-Workflow

```
PLAY  →  RAW  →  PROCESS  →  REVIEW  →  CAMPAIGN  →  NEXT SESSION
Spielen  Notizen  KI-Patch   Freigabe   wächst mit   Vorbereitung
```

## Funktionsbereiche

### Campaign State (Startseite) — ✅ gebaut
Erzählt zuerst die **aktuelle Lage**: Ort & Situation (editierbar), Held-Kurzstatus, letzte & nächste
Session, offene Fäden (Quests), zuletzt erfahrenes Wissen. Prominenter „Session verarbeiten"-Einstieg.

### Session-Werkstatt (RAW → Patch → Review) — ✅ gebaut
Roh-Notizen eingeben → optionaler KI-Sidecar erzeugt einen **Campaign-Patch** (Diff) → je Änderung
**Akzeptieren / Bearbeiten / Ablehnen** mit Herkunfts-Kennzeichnung (Bekannt/Abgeleitet/Vorschlag).
Erst nach Freigabe werden Dateien geschrieben; jede Übernahme legt eine **Session-Entität** an und
hängt Provenance an.

### Charakter — ✅ gebaut
Voller interaktiver 5e-Bogen: Attribute, Fertigkeiten & Rettungswürfe (anklickbar würfeln), Angriffe,
Zauberbuch, Zauberplätze, Merkmale, Zustände, Rasten, Trefferpunkte/Todesrettung, Währung, eigene
Tracker, Würfel, Event-Verlauf & Snapshots. Mehrere Charaktere pro Kampagne.

### Chronik — ✅ Basis (Ausbau geplant)
Session-Logbuch als lesbare Geschichte. *Geplant:* Kapitelstruktur, pro-Session-Seiten.

### Welt & Personen (Glossar) — ✅ gebaut
NSCs & Orte als verlinkte Notizen (`[[Wikilinks]]`). *Geplant:* reichere NSC-/Orts-Seiten
(„Was wissen wir / Wichtige Momente / Offene Fragen").

### Quests — ✅ gebaut
Gerücht / Aktiv / Abgeschlossen, mit nächstem Schritt, Priorität, Provenance.

### Wissen (Fakt / Gerücht / Theorie) — ✅ gebaut
Atomare Aussagen mit **Ebene**, **Sicht** (Charakter- vs. Spielerwissen), **Thema** und **Quell-Session**.
Nach Thema gruppiert, filterbar.

### Session-Vorbereitung — ✅ gebaut
Lazy-DM-Methode: starker Auftakt, Szenen, Geheimnisse (aufdeckbar), NSCs, Orte, Schätze, Checkliste.

### Kampf-Tracker — ✅ gebaut
Initiative-Reihenfolge, aktiver Zug, Runden, HP & Zustände der Gegner, „Held übernehmen".

### Suche & Befehlspalette — ✅ gebaut
⌘K-Palette mit Volltextsuche über Charakter, Notizen, Quests. *Geplant:* semantische Suche (lokal).

### Living Campaign Map — 🔜 geplant (nächster großer Schritt)
Eine Karte, die aus **beschriebenen** räumlichen Relationen wächst (mit Confidence:
confirmed/approximate/rumored/unknown) — **niemals erfundene Geografie**. Zuerst visuelles Gedächtnis
(Relationen-Graph + anheftbare echte Kartenbilder), kein Dungeon-Editor.

## Bewusst NICHT gebaut (Simplifications)

- Kein Dungeon-/Karten-Editor, keine erfundene Weltgeografie.
- Keine künstliche Gamification (Beziehungs-Scores, NSC-XP, Freundschaftsbalken, Deko-Rewards).
- Kein zentraler Chatbot — KI erscheint **kontextuell**, wo sie hilft.
- Keine Datenbank, keine Microservices, kein Cloud-Konto-Zwang.
- Kein Nachbau vollständiger, geschützter Regelwerke — eigene/gepflegte Inhalte statt Lizenz-Reproduktion.

## Roadmap (Kurz)

- **V1 (aktuell):** Werkstatt · Wissens-Layer · Campaign-State-Startseite · Provenance · Cleanup ✅
- **V1.x:** „Seit letzter Session"-Ansicht · reichere NSC-/Orts-Seiten · Chronik-Kapitel
- **V2:** Living Campaign Map · Mysteries · Charakter-Journey-Timeline
- **Später:** semantische Suche (lokale Embeddings) · Kampagnen-Q&A / Konsistenz-Check

# campaign/ — Valerius' Daten (die einzige Wahrheit)

Alles, was das Grimoire anzeigt, steht in diesen Dateien. Ändert man sie (von Hand, per Claude Code oder
über die App), aktualisiert sich jedes offene Gerät live. Nach inhaltlichen Änderungen: `cd app && npm run check:data`.

## Dateien

| Datei | Inhalt | Schreibt die App? |
| :-- | :-- | :-- |
| `character.json` | Charakterbogen: Attribute, Übungen, TP-Maximum, Angriffe, Merkmale (`features`) | nein |
| `state.json` | Spielstand: aktuelle TP, verbrauchte Plätze, Kräfte, Zustände, Konzentration, Trance, Untote | ja |
| `spells.json` | Zauber mit vollständigem Regeltext, Tipps, Verweisen, Korrekturen | ja (nur `prepared`) |
| `creatures.json` | Wertblöcke: Vertraute, Diener, Untote, Gefährtin | nein |
| `inventory.json` | Geld, Gegenstände, Wunschliste | ja |
| `quests.json` | Quests mit Status, nächstem Schritt, Verweisen | ja |
| `journal.json` | Chronik: datierte Einträge (Sessions, Nachrichten, Planung, Notizen) | ja |
| `map.json` | Kartenbild und Markierungen | ja |
| `sources.json` | Originale in Google Drive mit Link, Stand und Bewertung | nein |
| `stammbaum.json` | Stammbäume (Haus Lhaaz), erscheinen auf der Welt-Seite des Hauses, bei jeder Person darin und im Druck | nein |
| `docs/*.md` | Archiv-Dokumente (Prüfbericht, Lage, Taktik, DM-Nachrichten, Backstory, Alchemie, Einkauf) | nein |
| `world/*.md` | Personen, Fraktionen, Orte | nein |
| `assets/` | Bilder, abrufbar unter `/api/assets/<datei>` | nein |

## Verweise

- In jedem Markdown-Text (auch in JSON-Strings) verlinkt `[[Name]]` oder `[[Name|Anzeigetext]]` auf einen Eintrag.
- Aufgelöst wird über Namen und Aliasse von: Welt-Einträgen, Zaubern (deutsch und englisch), Merkmalen, Kreaturen,
  Quests, Gegenständen, Dokumenten (Titel und `aliases`) und Journal-Einträgen. Dazu kommen die Seiten
  `Echsen-Karte`/`Wüstenkarte`, `Zauberbuch`, `Gefolge` und `Regeln`.
- Groß- und Kleinschreibung und Spitznamen in „…“ spielen keine Rolle (`[[Aella Rayann]]` findet `Aella Rayann „Khoraa“ Stormscale`).
- Unaufgelöste Verweise erscheinen gestrichelt. `npm run check:data` listet sie.

## Felder im Detail

### world/*.md (Frontmatter)
```yaml
name: Lisbeth Lhaaz
aliases: [Lisbeth, Tantchen Lisbeth]
kind: person            # person | fraktion | ort
group: lhaaz            # gruppe | lhaaz | kontakt | bedrohung | vergangenheit | ort
tone: enemy             # ally | neutral | enemy | unknown | dead
status: Lebt, misstrauisch
summary: Ein Satz für Karten und Vorschauen.
```

### docs/*.md (Frontmatter)
`title`, `subtitle`, `icon` (shield-check, compass, scroll-text, swords, mail, book-open, flask-conical, shopping-bag),
`order`, `group`, `aliases`, `updated` (JJJJ-MM-TT). Hinweiskästen: `> [!TIP] Titel`, `[!RULE]`, `[!WARNING]`, `[!NOTE]`, `[!FIX]`.

### journal.json
```json
{
  "id": "j14-das-boot", "order": 140, "chapter": "Kapitel 7", "title": "Das Boot kommt",
  "type": "session",                       // session | nachricht | planung | notiz
  "date": "2026-10-18",                    // ISO oder null
  "dateMode": "exakt",                     // exakt | ca | spaetestens | zeitraum | unbekannt
  "dateLabel": "18.10.2026", "dateBasis": "Woher das Datum stammt",
  "ingame": "Morgen nach dem Plündern",
  "places": ["Die Siedlung"], "people": ["Leon Lhaaz"],
  "summary": "Ein Satz.", "events": ["Ein Ereignis pro Eintrag, Markdown und [[Verweise]] erlaubt"],
  "loot": [], "lost": [], "encounters": [], "level": null,
  "quests": [{ "ref": "boot-abfangen", "change": "erledigt" }],   // neu | angenommen | aktualisiert | erledigt | gescheitert
  "notes": [], "contradictions": [], "sources": ["kampagnen-log"]
}
```
`order` bestimmt die Reihenfolge (in Zehnerschritten, damit man dazwischen einfügen kann).

### spells.json
Pflicht: `id, name, en, level (0 = Zaubertrick), school, status, time, economy, range, components, duration, text`.
- `status`: `buch` (im Zauberbuch) · `frage` (mit DM klären) · `vorschlag` (nicht im Buch, mit `why` und `slot`)
- `economy`: `aktion | bonus | reaktion | minute | stunde` (steuert die Aktionsliste am Spieltisch)
- optional: `prepared, ritual, concentration, trigger, target, area, attack, save, damage, rolls[{label, expr}], source,
  valerius, higher, tips[], uses[], rulings[], synergies[{with, text}], conflicts[{with, text}], corrections[{doc, text}], note, docs[]`
- Würfelausdrücke in `rolls`: `2d8`, `1d20+4` (Anzeige wird automatisch zu 2W8).

### quests.json
`id, title, status (aktiv | geruecht | erledigt | gescheitert), urgent, kind, giver, next, reward, notes, links[]`.

### inventory.json
`currency {gm, sm, km}`, `items[{id, name, group, qty, desc, note, magic, heal}]` mit `group` aus
`koerper | verbrauch | beute | plot | gelagert | verloren`, dazu `wishlist[{id, name, price, priceText, priority, phase, why, done}]`.

### stammbaum.json
`trees[{id, world, title, note, nodes[], edges[]}]`. `world` ist der Slug des Welt-Eintrags, auf dessen Seite der Baum steht.
- `nodes[{id, label, ref, sub, x, y, tone, uncertain}]`: `x` ist die Spalte (halbe Werte erlaubt), `y` die Generation (0 oben).
  `ref` verlinkt auf einen Welt-Eintrag, `sub` trennt Zeilen mit „ · “ (je höchstens etwa 22 Zeichen, längere werden schmaler gesetzt), `uncertain` zeichnet den Kasten gestrichelt.
- `edges[{kind, from[], to[], label}]` mit `kind` aus `eltern` (from = Eltern, to = Kinder), `geschwister`, `ehe`,
  `theorie` (gestrichelt: offen oder vermutet) und `feindschaft` (roter Bogen mit Pfeil). Außer `eltern` verbinden alle
  Arten genau zwei Personen derselben Generation.
- Nur Belegtes durchziehen. Vermutungen als `theorie` und im `note` als *Theorie* kennzeichnen.

### sources.json
`id, title, url, kind (doc | bild), modified, status (kanon | referenz | teilweise | veraltet | gemini), group, local, summary`.

## Grundsätze

1. **Nichts erfinden.** Was nicht in den Quellen steht, wird als *Theorie* markiert oder als offene Frage notiert.
2. **Quellen angeben.** Journal-Einträge, Korrekturen und Zauber verweisen auf `sources.json`.
3. **Widersprüche sichtbar machen** (`contradictions` im Journal, Abschnitt „Offene Fragen“ im Prüfbericht), nicht stillschweigend auflösen.
4. **Gemini-Entwürfe** (Status `gemini`) sind Vorschläge, keine Fakten.

## Google Drive

Ordner „Valerius“: https://drive.google.com/drive/folders/13bTXk9i1u6Nu9rRG_5afo8RW0Id-61vT
Ordner „Kho“ (Gefährtin): https://drive.google.com/drive/folders/1HFBGateqVOesOlInskMQMx6WtBmlc6cn

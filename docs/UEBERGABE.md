# Übergabe: Umbau zum Astral-Grimoire

**Stand: 15.11.2026 · von Claude Fable 5.2 an Claude Opus 5.5.** Lies zuerst `CLAUDE.md`, dann dieses Dokument, dann `docs/ARCHITECTURE.md` und `campaign/README.md`. Danach kannst du ohne Rückfrage weiterarbeiten.

## 1 · Der Auftrag

Patricks Ziel im Wortlaut:

> Verbessere dieses Projekt grundlegend und hole das absolute Maximum aus der Vision „Valerius · Grimoire“ heraus. Du hast freie Hand bei Architektur, Libraries und Techstack.
> 1. GUI & UX: Baue die gesamte Oberfläche zu einem echten Triple-A Astral-Grimoire und High-End-Spieltisch um (Atmosphäre, Typografie, Animationen, interaktive Graphen für Netzwerk/Rätselwand, maximaler Komfort am Tisch).
> 2. Inhalt & Logik: Durchdenke alle Kampagnen-Unterlagen in campaign/ und docs/ tiefgehend auf Logik, versteckte Muster, offene Fäden, Synergien für Valerius und taktische Verbesserungen.

Dazu zwei Zusätze von ihm:

- **Bilder:** Das AGY-Kontingent ist leer. Alle Bild-Assets sollen später mit AGY entstehen. Bis dahin alles andere machen, keine Bilder erzeugen.
- **Regeltexte:** „Alle Regeltexte aus dem D&D 5e sollen komplett wiedergegeben werden wie bei Zaubern.“ Maßstab sind die Zauber in `spells.json`: voller Wortlaut, nicht Zusammenfassung. SRD-Inhalte werden vollständig übersetzt (CC BY 4.0), alles andere (Xanathars, Tashas, Spielleiterhandbuch, Schule der Beschwörung) vollständig in eigenen Worten, wie es `CLAUDE.md` vorschreibt.

**Teil 2 (Inhalt) ist im Kern erledigt. Teil 1 (Oberfläche) ist noch nicht begonnen.** Der größte Teil der Arbeit liegt also vor dir.

## 2 · Was fertig ist

### Inhalt und Logik (gepusht, Commit `2b68543` und der Übergabe-Commit)

- **Neues Dokument `campaign/docs/analyse.md` („Tiefenanalyse“):** Plan für die Stunden vor dem Überfall, Regeln, die ihn entscheiden, neue Tricks, verborgene Muster als Theorien, lose Fäden, Uhren. Das ist das Herzstück von Teil 2. Lies es, bevor du Inhalte anfasst.
- **Berichtigt** (alles im Prüfbericht unter B 19 festgehalten): *Schutz vor Gut und Böse* verbraucht Material, das ein Fokus nicht ersetzt. Riesen zwängen sich nur durch 3 m. Skelette RK 12. *Geringe Beschwörung* verschwindet auch, wenn sie Schaden zufügt. Dazu ein Dutzend veraltete Stellen.
- **Taktik-Handbuch:** Briefing für den Überfall neu, Morgen-Trick, Skelette auf der Scheibe, Rochade.
- **Zauberbuch:** sechs neue Vorschläge mit vollem Regeltext (*Alarm*, *Sprachen verstehen*, *Illusionsschrift*, *Magischer Mund*, *Gedanken wahrnehmen*, *Verbannung*).
- **Charakterbogen:** neue Merkmale mit vollem Text (*Zauberwirken*, *Dein Zauberbuch*, *Attributswerterhöhung*, Ausblick Stufe 10 und 14).
- **21 neue Fragen** in `fragen.json`, Quests, Inventar, Geheimnisse, Stammbaum (der Baron), rund 25 Welt-Einträge, Journal-Eintrag `j19-tiefenanalyse`.
- **Neu: `campaign/uhren.json`** (Fristen, Gefahren, Ziele). Typen, Laden, Speichern und Datenprüfung sind verdrahtet (`Clock`, `CampaignData.uhren`, `WRITABLE`). **Es gibt noch keine Oberfläche dafür.**

### Regeltexte: zehn Kapitel, geschrieben, aber noch nicht eingebunden

`campaign/regeln/01-zustaende.md` bis `10-magische-gegenstaende.md`, zusammen rund 2.300 Zeilen: Zustände, Aktionen im Kampf, Kampfablauf und Bewegung, Angriffe und Deckung, Schaden und Sterben, Zauberwirken, Attribute und Fertigkeiten, Reisen und Rasten, Ausrüstung, magische Gegenstände. Jede Regel hat den vollen Wortlaut und eine Notiz „Für Valerius“.

**Die App liest diese Dateien noch nicht.** Die Seite `/regeln`, der Spieltisch und der Druck hängen weiter an den alten Kurzfassungen in `app/src/lib/rules-ref.ts`. Das Einbinden ist deine erste Aufgabe (Abschnitt 4 A).

## 3 · Was offen ist, in dieser Reihenfolge

| | Aufgabe | Umfang |
| :-: | :-- | :-- |
| A | Regelwerk in die App einbinden, `rules-ref.ts` ablösen | mittel |
| B | Restliche Regeltexte: Wertblöcke, Gegenstände | klein bis mittel |
| C | Design-System zum Astral-Grimoire umbauen | groß |
| D | Interaktive Graphen: Beziehungsnetz und Ermittlungswand | groß |
| E | Tischkomfort: Kampfmodus, Rückgängig, Würfel, Uhren | groß |
| F | Druckfassung nachziehen | klein |
| G | Doku, Prüfung, Abschluss | klein |
| H | Bilder mit AGY | erst, wenn Patrick sagt, das Kontingent ist zurück |

Committe nach jedem abgeschlossenen Block und pushe sofort (siehe Abschnitt 5). Patrick stößt an Nutzungsgrenzen: Kleine, fertige Schritte sind mehr wert als ein großer halber.

## 4 · Spezifikationen

### A · Regelwerk einbinden

**Format der Kapiteldateien** (so sind alle zehn geschrieben):

```markdown
---
title: Zustände
en: Conditions
order: 1
icon: activity          # Lucide-Name: activity, swords, flag, crosshair, heart-pulse, sparkles, dices, tent, backpack, gem
source: SRD 5.1
summary: Ein Satz für die Kapitelkarte.
---
Einleitung des Kapitels (alles vor der ersten ##-Überschrift).

## Blind {Blinded} {#blind}
<!-- auch: Alias 1, Alias 2 -->
<!-- quelle: Xanathars Ratgeber für alles, in eigenen Worten -->

Voller Regeltext in Markdown. Unterabschnitte mit ###.

> [!VAL]
> Was die Regel für Valerius bedeutet.
```

- `## Name {Englisch} {#id}`: Name, englischer Begriff, Sprungmarke. Die IDs sind über alle Kapitel eindeutig.
- `<!-- auch: … -->`: weitere Namen für `[[Verweise]]` und die Suche. `<!-- quelle: … -->`: überschreibt die Quelle des Kapitels und kennzeichnet alles, was nicht aus dem SRD stammt.
- `> [!VAL]`: höchstens einer pro Regel, am Ende.
- Die IDs in `01-zustaende.md` entsprechen genau den IDs in `state.conditions` (`blind`, `bezaubert`, `taub`, `veraengstigt`, `gepackt`, `kampfunfaehig`, `unsichtbar`, `gelaehmt`, `versteinert`, `vergiftet`, `liegend`, `festgehalten`, `betaeubt`, `bewusstlos`), dazu `erschoepfung`. Nicht umbenennen.
- In den Regeldateien stehen noch keine `[[Verweise]]`. Sobald die Regeln im Index sind, kannst du sie untereinander und aus den Dokumenten heraus verlinken (`[[Festgehalten]]`, `[[Deckung]]`, `[[Konzentration]]`).

**Schritte:**

1. `app/src/lib/rulebook.ts`: reine Funktion `parseRuleChapter(datei, frontmatter, body)`, die auch im Prüfskript unter Node läuft. Typen in `types.ts`: `Rule { id, name, en?, aliases, text, valerius?, source?, summary }` und `RuleChapter { slug, title, en?, order, icon?, source?, summary?, intro, rules }`. `slug` ist der Dateiname ohne Nummer, `summary` einer Regel ihr erster Absatz ohne Markdown.
2. `lib/server/data.ts`: `loadRules()` mit `listFiles('regeln', '.md')` und gray-matter, wie `loadDocs()`. `CampaignData.rules`.
3. `lib/refs.ts`: je Regel ein Index-Eintrag mit `key: rule:<slug>/<id>`, `kind: 'Regel'`, `href: /regeln/<slug>#<id>`, Namen aus Name, englischem Begriff und Aliassen. In `KIND_ORDER` hinten einsortieren, damit Zauber, Merkmale und Gegenstände bei Namensgleichheit gewinnen („Schild“, „Dunkelsicht“, „Heiltrank“).
4. `scripts/check-data.mjs`: Kapitel genauso laden, prüfen: Pflichtfelder, eindeutige IDs, Zustands-IDs, Verweise.
5. Seiten: `/regeln` als Übersicht (Kapitelkarten, Suche über Name, Englisch, Alias und Text, das Glossar bleibt) und `/regeln/[kapitel]` (Inhaltsverzeichnis, jede Regel als Abschnitt mit Sprungmarke, „Für Valerius“ als goldener Kasten, Quelle).
6. Abnehmer von `rules-ref.ts` umstellen und die Datei danach löschen: `play/ConditionsCard.svelte` (Zustände aus dem Kapitel, voller Text statt `title`-Tooltip), `play/ActionsCard.svelte` (Reiter „Standardaktionen“ aus Kapitel `aktionen`), `print/PTracker.svelte`, `print/PRules.svelte`, `terms.ts` (`glossaryGroups(features, rules)`). Das reine Wörterbuch `GLOSSARY` nach `lib/glossary.ts`, die sechs Kurzzeilen `EXHAUSTION` nach `lib/rules.ts`.
7. Fußzeile der Regelseite: den vollständigen CC-BY-Hinweis auf das SRD 5.1 stehen lassen und um „in eigener deutscher Übersetzung“ ergänzen.
8. `campaign/README.md` und `docs/ARCHITECTURE.md` nachziehen.

### B · Restliche Regeltexte

- **Wertblöcke in `creatures.json`:** Skelett, Zombie und die 15 Vertrauten sind gekürzt. Bring sie auf den vollen SRD-Wortlaut (alle Merkmale, Aktionen, Sinne, Sprachen, Herausforderungsgrad). Die Typen `Familiar` und `UndeadBlock` und `StatBlock.svelte` brauchen dafür wohl Felder für Aktionen der Vertrauten.
- **Gegenstände im Inventar:** Wo ein Gegenstand eine Regel hat (Heiltrank, Dolch, Kampfstab, Kurzbogen, Alchemistenwerkzeug), auf die Regel im neuen Kapitel verweisen statt sie zu kürzen.
- **Mögliche weitere Kapitel**, wenn Zeit bleibt: Gifte (SRD), Gegenstände und ihre Trefferpunkte, die Magiertabelle bis Stufe 20.
- **Nicht bauen:** Gegnerwerte als Feature. Der DM skaliert seine Gegner, Patrick hat eine Gegner-Seite abgelehnt (Gedächtnis `fokus-auf-valerius`).

### C · Design-System: vom Dashboard zum Grimoire

Der Ist-Zustand ist ein sauberes, dunkles Dashboard: Geist als Schrift, flache Karten, ein statisches Sternenmuster. Das wirkt wie ein gutes Werkzeug, nicht wie ein Zauberbuch. Fast alle Seiten ziehen ihr Aussehen aus den Klassen in `app/src/app.css` (`panel`, `btn`, `chip`, `badge`, `eyebrow`, `title-display`, `prose-grim`, `callout`). **Dort anzusetzen verändert die ganze App auf einmal.** Meine Richtung, du darfst abweichen:

- **Schrift:** Überschriften in einer Antiqua mit Charakter (Cormorant oder ähnlich), Kapitälchen für `eyebrow` (Cinzel), Fließtext der Lore in einer Buchschrift (EB Garamond oder Spectral), Bedienelemente und Zahlen weiter in Geist. Alles über `@fontsource`, die App läuft ohne Netz.
- **Hintergrund:** ein gezeichnetes Sternenfeld auf Canvas mit Tiefe, langsamem Nebel und seltenen Sternschnuppen. Pausiert, wenn der Tab verdeckt ist, steht still bei `prefers-reduced-motion`.
- **Flächen:** Karten mit feiner Doppellinie, Eckornamenten und einem Hauch Gold für alles, was Valerius selbst betrifft. Trennlinien als Sternbild oder Raute statt als Strich.
- **Bewegung:** weiche Seitenwechsel (View Transitions, wo es sie gibt), gestaffeltes Erscheinen der Karten, ein Lichtschein in der Farbe der Zauberschule beim Wirken, Zauberplätze als Kristalle, die beim Verbrauch erlöschen, ein Trefferpunkte-Ring, der bei Schaden reagiert.
- **Tablet zuerst mitdenken:** Am Tisch liegt ein Tablet. Große Ziele für den Finger, nichts hängt an Hover.
- **Grenze:** Die Druckfassung (`routes/druck/print.css`, alles unter `.druck`) bleibt hell und unberührt.

Prüfe jede Seite im Browser nach dem Umbau der Tokens: Es gibt 16 Routen (siehe `lib/nav.ts`).

### D · Interaktive Graphen

Bibliothek: `d3-force` für die Anordnung (noch nicht installiert), Zeichnen in SVG, Ziehen, Zoomen und Verschieben über Pointer-Events. Ein wiederverwendbarer Baustein `ForceGraph.svelte`, zwei Seiten nutzen ihn:

- **Netzwerk (`/netzwerk`):** In `netzwerk.json` steht noch kein einziger Agent. Der Graph muss also heute schon etwas zeigen: das **Beziehungsnetz der Welt**. Knoten sind die Welt-Einträge, gefärbt nach `tone` (`lib/tone.ts`), Kanten entstehen aus den Verweisen zwischen den Einträgen (`campaign.data.backlinks`, `extractLinks`). Darüber als zuschaltbare Ebenen: wer welches Geheimnis kennt oder ahnt (`geheimnisse.json`: `knownBy`, `suspects`), die Rollen und Leute der Hand, die Familie Lhaaz (`stammbaum.json`). Klick öffnet eine Seitenleiste mit Zusammenfassung und Verweisen, Hover hebt die Nachbarn hervor, Filter nach `group`.
- **Rätselwand (`/raetsel`):** eine Ermittlungswand. Knoten: offene Fragen (`fragen.json`), Theorien und offene Punkte (`collectClues` in `lib/raetsel.ts`), Mysterien, Widersprüche. Kanten zu den Einträgen, die sie erwähnen. So wird sichtbar, wo sich die Fäden bündeln: bei Lucira, der Society, dem Turm. Die bestehenden Listen bleiben als zweite Ansicht, am Tisch wird weiter abgehakt.

### E · Tischkomfort

- **Rückgängig:** Ein Fehltipp auf dem Tablet darf nichts kosten. Verlauf im `campaign`-Store (`lib/stores/campaign.svelte.ts`): vor jeder Änderung an `state` einen Schnappschuss ablegen, die letzten 30 behalten, Strg+Z und ein Knopf im Toast.
- **Kampfmodus:** eine aufgeräumte Ansicht nur für den Kampf. Was in diesem Zug schon verbraucht ist (Aktion, Bonusaktion, Reaktion, Bewegung), ein Knopf „Zug beenden“, ein Rundenzähler, die laufende Konzentration mit Restdauer, laufende Effekte mit Ablauf (*Schild* bis zum nächsten Zug, *Netz* eine Stunde). **Nur für Valerius**, keine Initiative-Liste der Gegner und keine Mitspieler-Verwaltung.
- **Uhren:** eine Karte am Spieltisch für die dringenden Uhren, dazu Anlegen, Bearbeiten und Löschen (passt zu den Quests). Felder per Klick füllen und leeren. In Texten ist die Karte schon als „Karte **Uhren** am Spieltisch“ angekündigt.
- **Würfel:** die Würfelschale (`DiceTray.svelte`, `stores/rolls.svelte.ts`) mit Vorteil und Nachteil, freier Formel, Verlauf und einer sichtbaren Wurfanimation.
- **Bildschirm an:** Wake Lock als Schalter, damit das Tablet am Tisch nicht einschläft.
- **Zustände:** am Spieltisch den vollen Regeltext zeigen, sobald Teil A steht.

### F · Druckfassung

`lib/print.ts` und `lib/components/print/`. Nachziehen: Regeln als „Spickzettel“ (Name, erster Absatz, Für Valerius) und als eigenes „Regelwerk“ im vollen Wortlaut, die Uhren, die neuen Merkmale, die Tiefenanalyse als Archiv-Dokument (läuft über `PArchiveDoc` vermutlich schon mit).

### G · Abschluss

`docs/FEATURES.md` ist auf dem Stand von Oktober. `docs/ARCHITECTURE.md` und `README.md` kennen weder die Regelkapitel noch die Uhren. Am Ende diese Übergabe löschen und den Hinweis oben in `CLAUDE.md` entfernen.

## 5 · Arbeitsregeln

- **`CLAUDE.md` gilt:** Svelte 5 Runes, Änderungen an Daten nur über `campaign.change('<datei>', fn)`, neue Oberfläche aus dem Design-System bauen, vor jedem Commit `npm run check` und `npm run check:data` grün.
- **Git:** auf `main` committen und sofort `git push origin main`, ohne zu fragen (Gedächtnis `push-after-commit`). Kein Force-Push.
- **Fokus auf Valerius** (Gedächtnis `fokus-auf-valerius`): keine Features für wechselnde Mitspieler oder Gegnerwerte.
- **Nichts erfinden:** Unbelegtes in Kampagnentexten als `*Theorie:*`, Offenes als `**Offen:**`. Beides sammelt die Rätselwand von selbst ein.
- **Sprache:** Deutsch, Begriffe wie in Patricks Bögen (Magier, Menschenkenntnis, GM/SM/KM, Meter mit Fuß in Klammern).
- **Im Browser prüfen:** Vorschau über `.claude/launch.json`, Eintrag `chronicler`. Screenshots zeigen, nicht um Prüfung bitten.
- **Subagenten nur, wenn Patrick es verlangt.**

## 6 · Fallstricke

- **Drei geänderte Bilder liegen uncommittet im Arbeitsverzeichnis:** `campaign/assets/twee.jpg`, `twee.webp`, `twee-druck.jpg`. Sie stammen von Patrick, nicht von mir. Nicht mitcommitten und nicht zurücksetzen, sondern fragen.
- **Port 5173 war belegt** (vermutlich läuft dort schon ein Server von Patrick). Die Vorschau weicht auf 5174 aus und braucht beim ersten Start rund eine Minute.
- **Zeilenenden:** Das Repo erzwingt LF (`.gitattributes`). Einzelne Dateien liegen lokal mit CRLF vor (`DocIcon.svelte`, `map.json`, `sources.json`). Ersetzungen per Skript mit `\n` scheitern dort. Nimm das Edit-Werkzeug oder normalisiere beim Lesen.
- **JSON-Dateien** mit zwei Leerzeichen und abschließendem Zeilenumbruch schreiben (`JSON.stringify(x, null, 2) + '\n'`), dann bleiben die Diffs klein.
- **`npm run check:data` bricht bei toten Verweisen ab.** Neue Namen erst anlegen, dann verlinken.
- **Bilder:** `bilder.json` enthält neun Aufträge, deren Dateien noch fehlen. Das Prüfskript meldet sie als Hinweis, nicht als Fehler. So lassen.

## 7 · Regelfakten, die schon geprüft sind

Damit du sie nicht noch einmal nachschlagen musst:

- **Fokus und verbrauchte Komponenten:** Laut Sage Advice ersetzt ein Zauberfokus eine Komponente nur, wenn sie keinen Preis hat **und** nicht verbraucht wird. Per Websuche bestätigt.
- **Geringe Beschwörung:** Die Errata zum Spielerhandbuch ergänzt „oder Schaden zufügt“. Bestätigt.
- **Seelenmünzen** (*Baldur's Gate: Abstieg nach Avernus*): Ein Zauber, der Flüche bricht, befreit die Seele. Bestätigt. In der Kampagne ist das nur eine Theorie.
- **Zauber aus Gegenständen** brauchen keine Komponenten (SRD), und ohne Komponenten ist das Wirken nicht wahrnehmbar (Xanathars). Daraus folgt: kein *Gegenzauber* gegen einen Verständigungsstein. Die Frage an den DM steht in `fragen.json`.
- **Verständigungssteine:** Hat einer gesendet, sind beide bis zum Morgengrauen stumm.
- **Zwängen:** eine Größenkategorie kleiner, nicht beliebig.
- **Valerius' Werte gehen auf:** Standardwerte 15, 14, 13, 12, 10, 8, dazu +2 Intelligenz und +1 Konstitution vom Volk und je +1 auf Stufe 4. Offen sind seine zweite Sprache und sein Hintergrund.
- **Nicht aus dem SRD** und deshalb in eigenen Worten: Improvisieren, Tätigkeiten beim Reisen, Extreme Hitze, Gegenstände erkennen, Spruchrollen herstellen, Zauberwirken wahrnehmen, Einen Zauber erkennen, Ungültige Ziele, Arkaner Grimoire. Jede dieser Regeln trägt ein `<!-- quelle: … -->`.

Die Regelkapitel habe ich aus dem Gedächtnis übersetzt. Wo dir eine Zahl verdächtig vorkommt, prüfe sie gegen das SRD 5.1.

## 8 · Woran du merkst, dass du fertig bist

- [ ] `/regeln` zeigt die zehn Kapitel im vollen Wortlaut, `rules-ref.ts` gibt es nicht mehr, Regeln sind über Strg+K und `[[Verweise]]` erreichbar
- [ ] Wertblöcke im vollen Wortlaut
- [ ] Die Oberfläche fühlt sich wie ein Grimoire an, nicht wie ein Dashboard, auf dem Laptop und auf dem Tablet
- [ ] Beziehungsnetz und Ermittlungswand lassen sich ziehen, zoomen und anklicken und zeigen echte Daten
- [ ] Rückgängig, Kampfmodus, Uhren, Würfel und Wake Lock funktionieren am Tisch
- [ ] Druckfassung vollständig, `npm run druck` läuft durch
- [ ] `npm run check` und `npm run check:data` grün, alles gepusht
- [ ] Doku aktuell, diese Übergabe gelöscht

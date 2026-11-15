# Valerius · Grimoire

Das Astral-Grimoire für **Valerius „Floshem“ Moonwhisper**, Astralelf-Magier der Schule der Beschwörung, Stufe 5,
in der Kampagne um Xantus: Spieltisch, Kampfbegleiter, Regelwerk und Kampagnen-Chronik in einem. Lokal, ohne Cloud,
für Laptop und Tablet am Spieltisch gebaut und auch auf dem Handy nutzbar.

## Was drin ist

| Bereich | Was du dort tust |
| :-- | :-- |
| **Spieltisch** | TP-Ring mit Schaden und Heilen, temporäre TP, Todesrettung · Zauberplätze als Kristalle, Kräfte zum Abhaken · „Was kann ich tun?“ nach Aktion, Bonusaktion und Reaktion · Wirken verbraucht Plätze, setzt Konzentration und leuchtet in der Farbe der Schule · Konzentrationsprobe erscheint automatisch nach Schaden · Proben und Rettungswürfe per Klick · Zustände im vollen Regeltext · Uhren · Gefolge · Lage und Schnellnotiz |
| **Kampf** | Rundenzähler, Aktion, Bonusaktion und Reaktion zum Abhaken, Bewegung in Feldern mit Spurt und Aufstehen, laufende Effekte mit Ablauf in Runden, Hinweise aus den Regeln, Schild und Gegenzauber direkt wirkbar. Nur für Valerius, die Gegner führt der DM |
| **Charakterbogen** | Alle Werte, Fertigkeiten mit Herkunft der Übung, Angriffe, Merkmale, Astrale Trance |
| **Zauberbuch** | Vollständige Regeltexte, deine Werte, Trefferrechner, Tipps, Einsatzideen, Synergien und Konflikte, Korrekturen mit Quelle. Zauber-Sets für den Tag (Vorbereitung per Klick), freie Plätze, Vorschläge |
| **Gefolge** | Wertblöcke im vollen Wortlaut, Untote mit Live-TP, Waffen und Erneuern der 24-Stunden-Kontrolle, alle Vertrauten-Gestalten, Unsichtbarer Diener, Aella |
| **Inventar** | Geldbeutel mit Wechseln, Gegenstände (Heiltrank trinken heilt direkt), Einkaufszettel mit „leistbar“ und Wegen ohne Gold |
| **Werkstatt** | Was Valerius selbst herstellt (Alchemie, Heiltränke, Pfeile), Vorräte, Kosten und was es der Unsichtbaren Hand bringt |
| **Journal** | Datierte Chronik mit Orten, Personen, Beute, Gegnern, Quest-Änderungen, Widersprüchen und Quellen |
| **Quests** | Dringend, aktiv, Gerüchte, erledigt, gescheitert, jeweils mit Verlauf aus dem Journal |
| **Rätselwand** | Ermittlungswand als Graph: offene Fragen, Theorien, Mysterien und Widersprüche um die Einträge, bei denen sich die Fäden bündeln. Dazu die Listen zum Abhaken am Tisch |
| **Welt** | Personen, Fraktionen und Orte mit Stammbaum und Rückverweisen |
| **Karte** | Echsen-Karte mit Zoom, gedeuteten und ungedeuteten Markierungen, eigene Markierungen per Klick |
| **Netzwerk** | Beziehungsnetz der Welt als Graph mit Ebenen (Verweise, Familie Lhaaz, Geheimnisse, Unsichtbare Hand) zum Ziehen, Zoomen und Suchen. Dazu die Hand: Rollen, Leute mit Treue, Lohn und Wissen |
| **Wer weiß was?** | Floshems Ruf, Valerius' Geheimnisse und wer sie kennt oder ahnt, als Tabelle zum Anklicken |
| **Archiv** | Tiefenanalyse, Prüfbericht, Lage, Taktik-Handbuch, DM-Nachrichten, Stufe-6-Planer, Backstory, Alchemie, Einkauf, Aufbauplan und alle Drive-Originale mit Bewertung |
| **Regeln** | D&D 5e im vollen Wortlaut, von den Zuständen bis zur Magiertabelle, jede Regel mit „Für Valerius“, Suche, dazu alle Fachbegriffe Deutsch–Englisch |
| **Druckfassung** | Alles als helles A4-Layout: Deckblatt, Charakterbogen, Sitzungsbogen zum Abhaken, Zauberbuch im Regelbuch-Stil, Zauberkarten, Gefolge, Spickzettel, Begriffe, Fragen an den DM, Inventar, Quests, Uhren, Rätselwand, Journal, Welt, Netzwerk, Wer weiß was?, Karte, volles Regelwerk mit Sprungmarken, Archiv. Teile frei wählbar, PDFs per Befehl |

Überall: **Suche mit Strg+K** (oder `/`), **Rückgängig mit Strg+Z**, **Vorschaukarten** beim Überfahren von Verweisen,
**Würfelschale** mit `D` (rollende Würfel, Vorteil und Nachteil), Ziffern `1` bis `0` springen zu den Bereichen,
in der Seitenleiste ein Schalter, der den Bildschirm des Tablets wach hält.

## Starten

Doppelklick auf **`start.bat`**. Beim ersten Mal werden Abhängigkeiten installiert und die App gebaut, danach öffnet
sich der Browser auf <http://localhost:3000>. Tablet oder Handy im selben WLAN: `http://<IP-des-Laptops>:3000`.

Entwicklung:

```bash
cd app
npm install
npm run dev          # http://localhost:5173
npm run check        # Typprüfung
npm run check:data   # Kampagnendaten, Regeln und alle Verweise prüfen
npm run build        # Produktionsbuild
npm run druck        # alle PDFs nach druck/ (das Grimoire muss laufen)
```

**Ausdrucken:** Seite **Druckfassung** öffnen (Seitenleiste unter „Wissen“ oder `/druck`), Teile auswählen, „Drucken“.
Im Druckdialog Kopf- und Fußzeilen ausschalten, die Seitenzahlen setzt die Druckfassung selbst. Fertige PDFs
(komplett und einzeln) erzeugt `npm run druck` im Ordner `druck/`.

## Daten

Alles liegt lesbar in [`campaign/`](campaign/README.md) (JSON und Markdown) und ist per Git versioniert, auch die
Regelkapitel in `campaign/regeln/`. Die App schreibt nur den Spielstand, das Inventar, Quests, Journal, Karte, die
Vorbereitung der Zauber, Fragen, Netzwerk, Zauber-Sets, Geheimnisse und Uhren zurück.
Ändert Claude Code eine Datei, aktualisieren sich alle offenen Geräte sofort.

**Nach einer Session:** Erzähl Claude Code, was passiert ist. Claude legt einen datierten Journal-Eintrag an,
aktualisiert Quests, Inventar, Uhren, Personen und Orte und verlinkt alles. Am Tisch landen Schnellnotizen automatisch
im Journal.

## Optional

`.env` im Hauptordner (Vorlage `.env.example`): `APP_PIN` schützt die App im WLAN mit einer PIN, `PORT` und
`HOST` steuern den Server.

---

Enthält Regelinhalte aus dem System Reference Document 5.1 („SRD 5.1“) von Wizards of the Coast LLC, verfügbar unter
https://dnd.wizards.com/resources/systems-reference-document, lizenziert unter der Creative Commons Attribution 4.0
International License (https://creativecommons.org/licenses/by/4.0/legalcode), in eigener deutscher Übersetzung.
Regeln und Zauber aus anderen Büchern (Xanathars Ratgeber für alles, Tashas Kessel voller Allem, Spielleiterhandbuch)
stehen in eigenen Worten und sind mit ihrer Quelle gekennzeichnet.

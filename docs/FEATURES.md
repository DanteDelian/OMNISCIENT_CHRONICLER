# Funktionen und Ideen

## Vorhanden (November 2026)

- **Spieltisch:** Kampfwerte, TP-Ring (Schaden schüttelt, Heilung leuchtet), temporäre TP, Todesrettung, Zauberplätze als
  Kristalle, Kräfte, Trefferwürfel, „Was kann ich tun?“ nach Aktionsart, Wirken mit Platzverbrauch, Konzentration und
  Lichtschein in der Farbe der Zauberschule, automatische Konzentrationsprobe, Proben per Klick, Zustände im vollen
  Regeltext mit „Für Valerius“, Erschöpfung, Gefolge, Lage, dringende Quests, Schnellnotiz ins Journal.
- **Kampfmodus** (Seite Kampf, Knopf im Kopf des Spieltischs): Rundenzähler, Aktion, Bonusaktion und Reaktion zum
  Abhaken (Wirken und Würfe markieren sie selbst), Bewegung in Feldern zu 1,5 m mit Spurt und Aufstehen, laufende
  Effekte mit Ablauf in Runden (Schild bis zum nächsten Zug, Netz eine Stunde), eigene Effekte, Hinweise aus den Regeln
  (Bonusaktionszauber, Liegend, Bewegungsrate 0, Untote ohne Befehl), Schild und Gegenzauber direkt wirkbar.
  Nur für Valerius: keine Gegner, keine Initiative-Liste.
- **Uhren:** Fristen, wachsende Gefahren und Ziele als Felderringe am Spieltisch, Felder per Klick, Anlegen,
  Bearbeiten, Löschen. Im Druck zum Weiterführen mit dem Bleistift.
- **Rückgängig:** jeder Schritt in den Spieldateien (Spielstand, Inventar, Uhren, Quests, Fragen, Netzwerk,
  Geheimnisse, Zauber-Sets, Karte) mit Strg+Z, Knopf in der Seitenleiste, in der mobilen Kopfzeile und in der Meldung.
- **Würfelschale:** rollender Würfel in der Form der Würfelart (W4 bis W20), natürliche 20 leuchtet golden,
  Vorteil und Nachteil, freie Formel, Verlauf. Meldungen rollen ihr Ergebnis aus.
- **Bildschirm wach halten** (Wake Lock) als Schalter in der Seitenleiste, fürs Tablet am Tisch.
- **Rasten:** kurze Rast mit Trefferwürfeln und Arkaner Erholung (Auswahl bis 3 Grade), lange Rast mit Trance-Wahl.
- **Zauberbuch:** vollständige Regeltexte, Werte für Valerius, Trefferrechner, Tipps, Einsatzideen, Regelklarstellungen,
  Synergien und Konflikte, Korrekturen mit Quelle, Vorbereitung x/9, Zauber-Sets für den Tag, Vorschläge.
- **Regelwerk:** Kapitel im vollen Wortlaut von den Zuständen bis zur Magiertabelle (SRD 5.1 übersetzt, Regeln aus
  Spielerhandbuch, Xanathars und Spielleiterhandbuch in eigenen Worten), jede Regel mit „Für Valerius“, Suche mit
  Treffermarkierung, Inhaltsleiste je Kapitel, Wörterbuch Deutsch–Englisch.
  Regeln sind über Strg+K und `[[Verweise]]` erreichbar.
- **Gefolge:** Wertblöcke im vollen Wortlaut (Skelett, Zombie, 15 Vertrauten-Gestalten), Untote mit Live-TP.
- **Beziehungsnetz** (Seite Netzwerk): interaktiver Graph der Welt mit zuschaltbaren Ebenen (Verweise, Familie Lhaaz,
  Geheimnisse, Unsichtbare Hand), ziehen, zoomen, suchen, Seitenleiste mit Zusammenfassung.
- **Ermittlungswand** (Seite Rätselwand): offene Fragen, Theorien, offene Punkte, Mysterien und Widersprüche als
  Graph um die Einträge, bei denen sich die Fäden bündeln. Die Listen zum Abhaken bleiben als zweite Ansicht.
- **Charakterbogen**, **Inventar** mit Geld und Wunschliste, **Werkstatt**, **Quests** mit Verlauf, **Journal** mit
  Datum und Datumsherkunft, **Welt** mit Rückverweisen und Stammbaum, **Karte** mit Markierungen,
  **Wer weiß was?**, **Archiv** mit Tiefenanalyse, Prüfbericht und Drive-Bewertung.
- **Druckfassung:** helles A4-Layout mit Deckblatt, Bogen, Sitzungsbogen, Zauberbuch, Zauberkarten, Gefolge,
  Spickzettel, vollem Regelwerk mit Sprungmarken, Uhren, Kampagnenteilen und Archiv; PDFs per `npm run druck`.
- **Überall:** Astral-Grimoire-Design (Sternenfeld auf Canvas, Antiqua, Kapitälchen, Buchschrift, Goldornamente),
  weiche Seitenwechsel, Suche (Strg+K), Vorschaukarten, Würfelschale (D), Tastenkürzel 1 bis 0,
  Live-Abgleich zwischen Geräten, große Ziele auf Touch-Geräten, ruhige Darstellung bei reduzierter Bewegung.
- **Stimmungsbilder:** alle 21 Aufträge aus `bilder.json` als gemalte Szenen für Welt- und Journal-Einträge (Kopfbild,
  Karte in der Liste, Druck). Neue Aufträge erzeugt `python -P scripts/bilder.py` mit der Antigravity-CLI; bei einer
  Kontingentsperre wechselt das Skript selbst das Agentenmodell.

## Ideen für später

- **Stufe 6:** wenn es so weit ist, nach dem Ablauf in `CLAUDE.md` (TP-Wurf, zwei Zauber ins Buch, Gutartiges
  Versetzen aktiv, Zauber-Sets nachziehen). Der Plan steht in `campaign/docs/stufe-6.md`.
- **Kampfbilanz:** Am Ende eines Kampfes Runden, verbrauchte Plätze und Schaden als Vorschlag für die Session-Notizen.
- **Uhren und Journal:** Beim Füllen eines Feldes auf Wunsch eine Schnellnotiz mit Datum anlegen.

Bewusst nicht geplant: Gegnerwerte und eine Initiative-Liste der Gegner (der DM skaliert seine Gegner, die Runde
wechselt).

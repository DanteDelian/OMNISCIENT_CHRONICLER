# Valerius · Grimoire

Das Session-Dashboard und Nachschlagewerk für **Valerius „Floshem“ Moonwhisper**, Astralelf-Magier der
Schule der Beschwörung, Stufe 5, in der Kampagne um Xantus. Lokal, ohne Cloud, für den Laptop am Spieltisch
gebaut und auch auf Tablet und Handy nutzbar.

## Was drin ist

| Bereich | Was du dort tust |
| :-- | :-- |
| **Spieltisch** | TP mit Schaden und Heilen, temporäre TP, Todesrettung · Zauberplätze und Kräfte zum Abhaken · „Was kann ich tun?“ nach Aktion, Bonusaktion und Reaktion · Wirken verbraucht Plätze und setzt Konzentration · Konzentrationsprobe erscheint automatisch nach Schaden · Proben und Rettungswürfe per Klick · Zustände mit Regeltext · Gefolge · Lage und Schnellnotiz |
| **Charakterbogen** | Alle Werte, Fertigkeiten mit Herkunft der Übung, Angriffe, Merkmale, Astrale Trance. Druckbar |
| **Zauberbuch** | Vollständige Regeltexte, deine Werte, Trefferrechner, Tipps, Einsatzideen, Synergien und Konflikte, Korrekturen mit Quelle. Vorbereitung (x/9), freie Plätze, Vorschläge |
| **Gefolge** | Untote mit Live-TP und 24-Stunden-Kontrolle, alle Vertrauten-Gestalten, Unsichtbarer Diener, Draka |
| **Inventar** | Geldbeutel mit Wechseln, Gegenstände (Heiltrank trinken heilt direkt), Wunschliste mit „leistbar“ |
| **Journal** | Datierte Chronik mit Orten, Personen, Beute, Gegnern, Quest-Änderungen, Widersprüchen und Quellen |
| **Quests** | Dringend, aktiv, Gerüchte, erledigt, gescheitert, jeweils mit Verlauf aus dem Journal |
| **Welt** | 32 Personen, Fraktionen und Orte mit Rückverweisen |
| **Karte** | Echsen-Karte mit Zoom, gedeuteten und ungedeuteten Markierungen, eigene Markierungen per Klick |
| **Archiv** | Prüfbericht, Taktik-Handbuch, DM-Nachrichten, Backstory, Alchemie, Einkauf und alle Drive-Originale mit Bewertung |
| **Regeln** | Zustände, Aktionen, Zauberwirken, Deckung, Licht, Todesrettung, Rasten, jeweils mit Bezug zu Valerius |

Überall: **Suche mit Strg+K** (oder `/`), **Vorschaukarten** beim Überfahren von Verweisen, **Würfelschale** mit `D`,
Ziffern `1` bis `0` springen zu den Bereichen.

## Starten

Doppelklick auf **`start.bat`**. Beim ersten Mal werden Abhängigkeiten installiert und die App gebaut, danach öffnet
sich der Browser auf <http://localhost:3000>. Tablet oder Handy im selben WLAN: `http://<IP-des-Laptops>:3000`.

Entwicklung:

```bash
cd app
npm install
npm run dev          # http://localhost:5173
npm run check        # Typprüfung
npm run check:data   # Kampagnendaten und alle Verweise prüfen
npm run build        # Produktionsbuild
```

## Daten

Alles liegt lesbar in [`campaign/`](campaign/README.md) (JSON und Markdown) und ist per Git versioniert.
Die App schreibt nur den Spielstand, das Inventar, Quests, Journal, Karte und die Vorbereitung der Zauber zurück.
Ändert Claude Code eine Datei, aktualisieren sich alle offenen Geräte sofort.

**Nach einer Session:** Erzähl Claude Code, was passiert ist. Claude legt einen datierten Journal-Eintrag an,
aktualisiert Quests, Inventar, Personen und Orte und verlinkt alles. Am Tisch landen Schnellnotizen automatisch
im Journal.

## Optional

`.env` im Hauptordner (Vorlage `.env.example`): `APP_PIN` schützt die App im WLAN mit einer PIN, `PORT` und
`HOST` steuern den Server.

---

Regelinhalte teilweise nach dem System Reference Document 5.1 von Wizards of the Coast LLC (CC BY 4.0), in eigener
deutscher Fassung. Toll the Dead und Ice Knife stammen aus Xanathars Ratgeber für alles und sind in eigenen Worten
zusammengefasst.

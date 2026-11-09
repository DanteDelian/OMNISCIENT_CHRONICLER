# campaign/assets/ — Bilder

Abrufbar im Grimoire unter `/api/assets/<dateiname>`.

| Datei | Herkunft | Verwendung |
| :-- | :-- | :-- |
| `floshem.jpg` | Drive, „1791721883346.jpg“ (12.10.2026) | Original des Porträts |
| `floshem-portrait.webp` | daraus rund freigestellt, 640 px | `character.json` → `portrait` |
| `floshem-avatar.webp` | daraus, 160 px | `character.json` → `avatar` |
| `karte-wueste.jpg` | Drive, „Karte wüste für Valerius.jpg“ | Original der Echsen-Karte |
| `karte-wueste.webp` | daraus verkleinert, 2400 px | `map.json` → `image` |
| `floshem-portrait-druck.jpg` | Porträt auf Weiß, JPEG | Druckfassung |
| `karte-wueste-druck.jpg` | Karte, 1800 px, JPEG | Druckfassung |
| `<id>.jpg`, `<id>.webp`, `<id>-druck.jpg` | KI-Bilder aus `campaign/bilder.json`, siehe unten | Welt-Einträge (`image`), Journal (`images`), Gefolge (`retinueImage`), Werkstatt |

Neues Porträt: Bild hier ablegen (oder Claude bitten, es aus Drive zu holen), rund freistellen,
als WebP speichern und die Dateinamen in `character.json` eintragen.

**Druckversionen:** Gibt es zu einem Bild eine Datei `<name>-druck.jpg`, nimmt die Druckfassung (`/druck`) diese. Chrome bettet JPEGs unverändert ins PDF ein, WebP dagegen verlustfrei, was die PDFs stark aufbläht. Fehlt die Druckversion, wird das Original verwendet.

## KI-Bilder

Alle Stimmungsbilder stehen als Aufträge in **`campaign/bilder.json`**: ein gemeinsamer Stil (`stil`) und je Bild
`id`, `titel`, `fuer` (wo es erscheint) und `prompt`. Erzeugt werden sie mit der **Antigravity-CLI `agy`**
(Gemini-Bildmodell über Patricks Antigravity-Konto, keine Kosten je Bild):

```bash
cd app
python -P scripts/bilder.py              # alle fehlenden Bilder
python -P scripts/bilder.py --nur fee    # nur diese IDs (kommagetrennt)
python -P scripts/bilder.py --neu --nur fee   # vorhandenes Bild neu erzeugen
python -P scripts/bilder.py --liste      # zeigen, was fehlt
```

Jedes Bild landet dreifach hier: `<id>.jpg` (Original, 1376 × 768), `<id>.webp` (App) und `<id>-druck.jpg`
(1000 px, Druckfassung). Nach etwa 13 Bildern sperrt agy für einige Stunden (429). Das Skript hört dann auf und
nennt die Wartezeit, ein neuer Aufruf macht mit den fehlenden weiter.

**Einbinden:** Welt-Eintrag im Frontmatter `image: fee.webp` (optional `imageFocus: 47% 20%` für den Bildausschnitt),
Journal-Eintrag `images: [{ "file": "nebel-tueren.webp", "caption": "…" }]`, Untote über `retinueImage` in
`creatures.json`. Die Werkstatt nimmt `werkstatt.webp`.

Die Bilder sind Stimmungsbilder, keine Fakten: Details wie Kleidung oder Begleiter im Hintergrund sind nicht Kanon.
Das erste Bild der Diener (20.10.2026) stammte noch von FLUX.1-dev über Hugging Face, seit dem 09.11.2026 kommen alle
Bilder aus Gemini.

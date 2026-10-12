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

Neues Porträt: Bild hier ablegen (oder Claude bitten, es aus Drive zu holen), rund freistellen,
als WebP speichern und die Dateinamen in `character.json` eintragen.

**Druckversionen:** Gibt es zu einem Bild eine Datei `<name>-druck.jpg`, nimmt die Druckfassung (`/druck`) diese. Chrome bettet JPEGs unverändert ins PDF ein, WebP dagegen verlustfrei, was die PDFs stark aufbläht. Fehlt die Druckversion, wird das Original verwendet.

# campaign/assets/ — Bilder

Abrufbar im Grimoire unter `/api/assets/<dateiname>`.

| Datei | Herkunft | Verwendung |
| :-- | :-- | :-- |
| `floshem.jpg` | Drive, „1791721883346.jpg“ (12.10.2026) | Original des Porträts |
| `floshem-portrait.webp` | daraus rund freigestellt, 640 px | `character.json` → `portrait` |
| `floshem-avatar.webp` | daraus, 160 px | `character.json` → `avatar` |
| `karte-wueste.jpg` | Drive, „Karte wüste für Valerius.jpg“ | Original der Echsen-Karte |
| `karte-wueste.webp` | daraus verkleinert, 2400 px | `map.json` → `image` |

Neues Porträt: Bild hier ablegen (oder Claude bitten, es aus Drive zu holen), rund freistellen,
als WebP speichern und die Dateinamen in `character.json` eintragen.

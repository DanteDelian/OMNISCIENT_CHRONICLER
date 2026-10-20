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
| `diener.jpg` | KI-Bild, FLUX.1 Schnell über Pollinations (20.10.2026), Signatur unten links entfernt | Original der stummen Diener |
| `diener.webp` | daraus, 1280 px | `creatures.json` → `retinueImage` (Gefolge-Seite) |
| `diener-druck.jpg` | daraus, 1000 px, JPEG | Druckfassung (Gefolge) |

Neues Porträt: Bild hier ablegen (oder Claude bitten, es aus Drive zu holen), rund freistellen,
als WebP speichern und die Dateinamen in `character.json` eintragen.

**Druckversionen:** Gibt es zu einem Bild eine Datei `<name>-druck.jpg`, nimmt die Druckfassung (`/druck`) diese. Chrome bettet JPEGs unverändert ins PDF ein, WebP dagegen verlustfrei, was die PDFs stark aufbläht. Fehlt die Druckversion, wird das Original verwendet.

**Die stummen Diener neu erzeugen:** Das Bild entstand mit dem Rest des Gratisguthabens (FLUX.1 Schnell), deshalb sind die
Knochen offen zu sehen und keine der drei Figuren trägt den Bogen. Mit frischem Tagesguthaben geht es mit GPT Image 2 (kostenlos
freigegeben, rund 0,035 bis 0,14 Pollen je Bild), Anfrage mit `private=true`. Danach `diener.jpg`, `diener.webp` und
`diener-druck.jpg` ersetzen. Prompt:

> Painterly fantasy illustration, Dungeons and Dragons character art, rich detail, moody dusk lighting. Three silent hooded
> servants stand in a row on the deck of a small wooden river boat on a misty jungle river. They are skeletons hidden under long
> hooded robes crudely stitched together from mismatched dark uniforms and rough leather and fur, covered from head to toe.
> Deep hoods hide their faces in shadow, only a faint bony jaw and two tiny pale green lights show. Skeletal fingers hold their
> weapons: the left servant holds a shortbow and wears a quiver of arrows, the other two each hold a plain steel dagger low at
> their side. They stand perfectly still like loyal guards. Faint green magic drifts in the air, fireflies, dark jungle and
> steep river banks behind them. Muted greens, deep browns and teal, painterly brushwork, no text, no watermark.

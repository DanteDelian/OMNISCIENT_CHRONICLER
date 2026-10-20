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
| `diener.jpg` | KI-Bild, FLUX.1-dev über den Hugging-Face-Space `black-forest-labs/FLUX.1-dev` (ZeroGPU, kostenlos, Seed 11, 20.10.2026), winziger Phantasietext unten links entfernt | Original der stummen Diener |
| `diener.webp` | daraus, 1280 px | `creatures.json` → `retinueImage` (Gefolge-Seite) |
| `diener-druck.jpg` | daraus, 1000 px, JPEG | Druckfassung (Gefolge) |

Neues Porträt: Bild hier ablegen (oder Claude bitten, es aus Drive zu holen), rund freistellen,
als WebP speichern und die Dateinamen in `character.json` eintragen.

**Druckversionen:** Gibt es zu einem Bild eine Datei `<name>-druck.jpg`, nimmt die Druckfassung (`/druck`) diese. Chrome bettet JPEGs unverändert ins PDF ein, WebP dagegen verlustfrei, was die PDFs stark aufbläht. Fehlt die Druckversion, wird das Original verwendet.

**Die stummen Diener neu erzeugen:** Mit `HF_TOKEN` über den Space `black-forest-labs/FLUX.1-dev` (1536 × 1024, Guidance 3,5,
28 Schritte), das kostet nur GPU-Minuten des kostenlosen Kontingents. Danach `diener.jpg`, `diener.webp` (1280 px) und
`diener-druck.jpg` (1000 px) ersetzen. Prompt:

> Painterly fantasy illustration in the style of Dungeons and Dragons character art, rich detail, moody dusk lighting. Three
> silent servants stand in a row on the deck of a small wooden river boat on a misty jungle river at dusk. They are completely
> disguised: long hooded robes crudely stitched together from mismatched dark uniforms and rough orcish leather and fur,
> covering them from head to toe. Their faces are hidden behind dark cloth veils deep inside the shadow of their hoods, nothing
> of the face is visible. Their hands are wrapped in dirty cloth strips. The servant on the left carries a shortbow in one hand
> and a quiver of arrows on its back. The servant in the middle and the servant on the right each hold a plain steel dagger low
> at their side. They stand perfectly still like loyal bodyguards, eerie and mysterious. Faint green magical glow drifts in the
> air, fireflies, dark jungle and steep river banks behind them. Muted greens, deep browns and teal, painterly brushwork. No
> text, no watermark, no signature.

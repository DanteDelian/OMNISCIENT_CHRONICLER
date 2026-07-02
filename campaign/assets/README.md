# campaign/assets/ — Bilder

Bilder hier ablegen; im Dashboard erreichbar unter `/api/assets/<dateiname>`.

## Aus Google Drive zu übernehmen (manuell, 1 Minute)

Ordner: https://drive.google.com/drive/folders/13bTXk9i1u6Nu9rRG_5afo8RW0Id-61vT

| Drive-Datei | Hier speichern als | Verwendung |
| :-- | :-- | :-- |
| `Valerius Icon für die Map.png` | `valerius.png` | Charakter-Porträt — danach in `campaign/character.json` das Feld `portrait` auf `/api/assets/valerius.png` setzen (oder Claude sagen: „setz mein Porträt") |
| `Karte wüste für Valerius.jpg` | `karte-wueste.jpg` | Wird in der Lore-Notiz „Wüstenkarte" angezeigt |

*(Warum manuell? Die Drive-Anbindung von Claude liefert Binärdateien nur als riesigen Base64-Text — Herunterladen im Browser ist schneller und sauberer.)*

"""Bilder für das Grimoire mit der Antigravity-CLI (agy, Gemini über Patricks Antigravity-Konto) erzeugen.

Liest die Aufträge aus campaign/bilder.json und legt für jedes fehlende Bild drei Dateien an:
  campaign/assets/<id>.jpg        Original (1376 × 768)
  campaign/assets/<id>.webp       für die App
  campaign/assets/<id>-druck.jpg  für die Druckfassung (1000 px)

Aufruf (aus app/):
  python -P scripts/bilder.py              alle fehlenden Bilder
  python -P scripts/bilder.py --nur a,b    nur diese IDs
  python -P scripts/bilder.py --neu        vorhandene Bilder neu erzeugen
  python -P scripts/bilder.py --liste      nur anzeigen, was fehlt

Kontingent: nach etwa 13 Bildern meldet agy 429 RESOURCE_EXHAUSTED mit der Wartezeit. Das Skript hört dann
auf und nennt sie. Später einfach erneut starten: Fertige Bilder werden übersprungen.
"""
import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
CAMPAIGN = ROOT / 'campaign'
ASSETS = CAMPAIGN / 'assets'
AGY = Path(os.path.expandvars(r'%LOCALAPPDATA%')) / 'agy' / 'bin' / 'agy.exe'


def task_text(name: str, prompt: str, style: str) -> str:
    return (
        f'Use your image generation tool to create exactly one image and save it in the current folder as {name}.png. '
        f'Image: {prompt} {style} '
        'Do nothing else: no code, no other files, no shell commands. Reply only with the saved file name.'
    )


def wait_time(text: str) -> str | None:
    """Wartezeit aus einer Kontingent-Meldung lesen (Stunden, Minuten, Sekunden einzeln)."""
    if not re.search(r'429|RESOURCE_EXHAUSTED|quota', text, re.I):
        return None
    parts = {u: int(n) for n, u in re.findall(r'(\d+)\s*([hms])', text)}
    return ' '.join(f'{parts[u]} {name}' for u, name in (('h', 'Std.'), ('m', 'Min.'), ('s', 'Sek.')) if u in parts) or 'unbekannt'


def save_variants(png: Path, image_id: str) -> None:
    im = Image.open(png).convert('RGB')
    w, h = im.size
    im.save(ASSETS / f'{image_id}.jpg', quality=92)
    im.save(ASSETS / f'{image_id}.webp', quality=84, method=6)
    im.resize((1000, round(1000 * h / w)), Image.LANCZOS).save(ASSETS / f'{image_id}-druck.jpg', quality=84, optimize=True)


def generate(item: dict, style: str) -> str:
    """Ein Bild erzeugen. Gibt 'ok', 'fehler' oder 'kontingent:<zeit>' zurück."""
    work = Path(tempfile.mkdtemp(prefix=f'agy-{item["id"]}-'))
    try:
        cmd = [str(AGY), '-p', task_text(item['id'], item['prompt'], style), '--sandbox', '--dangerously-skip-permissions', '--print-timeout', '6m']
        try:
            run = subprocess.run(cmd, cwd=work, capture_output=True, text=True, encoding='utf-8', errors='replace', timeout=420)
        except subprocess.TimeoutExpired:
            return 'fehler: Zeitüberschreitung'
        out = (run.stdout or '') + (run.stderr or '')
        pngs = sorted(work.glob('*.png'), key=lambda p: p.stat().st_mtime)
        if pngs:
            save_variants(pngs[-1], item['id'])
            return 'ok'
        wait = wait_time(out)
        if wait:
            return f'kontingent:{wait}'
        return 'fehler: ' + (out.strip().splitlines() or ['keine Ausgabe'])[-1][:200]
    finally:
        shutil.rmtree(work, ignore_errors=True)


def main() -> int:
    sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser()
    ap.add_argument('--nur', default='')
    ap.add_argument('--neu', action='store_true')
    ap.add_argument('--liste', action='store_true')
    args = ap.parse_args()

    data = json.loads((CAMPAIGN / 'bilder.json').read_text(encoding='utf-8'))
    only = {s.strip() for s in args.nur.split(',') if s.strip()}
    items = [b for b in data['bilder'] if not only or b['id'] in only]
    todo = [b for b in items if args.neu or not (ASSETS / f'{b["id"]}.webp').exists()]

    if args.liste:
        for b in items:
            print(('fehlt  ' if b in todo else 'fertig ') + f'{b["id"]:<20} {b["titel"]} · {b["fuer"]}')
        return 0
    if not AGY.exists():
        print(f'agy nicht gefunden: {AGY}')
        return 1

    print(f'{len(todo)} Bild(er) zu erzeugen, je etwa 80 Sekunden.')
    for n, item in enumerate(todo, 1):
        print(f'[{n}/{len(todo)}] {item["id"]} ({item["titel"]}) …', flush=True)
        result = generate(item, data['stil'])
        if result.startswith('kontingent:'):
            print(f'Kontingent erschöpft. Wieder möglich in etwa {result.split(":", 1)[1]}. Danach erneut starten.')
            return 2
        print(f'    {result}', flush=True)
    print('Fertig.')
    return 0


if __name__ == '__main__':
    sys.exit(main())

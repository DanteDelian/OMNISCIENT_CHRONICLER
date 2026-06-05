import os
import time
import sys
import io
import subprocess
from pathlib import Path
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

# Zwinge stdout und stderr unter Windows zu UTF-8, um Emoji-Abstürze zu verhindern
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8")

# Watch directories
WATCH_AUDIO_DIR = Path("00_Ingest_Buffer/raw_audio")
WATCH_TEXT_DIR = Path("00_Ingest_Buffer/raw_text")
PYTHON_EXEC = Path("venv/Scripts/python.exe")

if not PYTHON_EXEC.exists():
    PYTHON_EXEC = Path(sys.executable) # Fallback to system python if venv doesn't exist

class IngestHandler(FileSystemEventHandler):
    def __init__(self):
        super().__init__()
        self.processed_files = set()

    def is_file_ready(self, filepath: Path) -> bool:
        """Prüft, ob die Datei vollständig geschrieben wurde."""
        try:
            # Versuche, die Datei exklusiv zu öffnen, um zu sehen, ob sie gesperrt ist
            with open(filepath, 'rb') as f:
                pass
            return True
        except IOError:
            return False

    def on_created(self, event):
        if event.is_directory:
            return
        
        filepath = Path(event.src_path)
        ext = filepath.suffix.lower()
        
        # Ignoriere temporäre Dateien, gitkeeps oder bereits verarbeitete Dateien
        if filepath.name == ".gitkeep" or filepath.name.startswith("session_raw_latest"):
            return
            
        if ext not in (".mp3", ".m4a", ".wav", ".md"):
            return
            
        print(f"👀 Neue Datei erkannt: {filepath.name}")
        
        # Warte, bis die Datei fertig geschrieben ist (wichtig bei großen Audio-Uploads)
        attempts = 0
        while not self.is_file_ready(filepath):
            time.sleep(1)
            attempts += 1
            if attempts > 60: # Max 1 Minute warten
                print(f"⚠️ Datei {filepath.name} konnte nach 60 Sekunden nicht exklusiv geöffnet werden. Versuche Verarbeitung trotzdem...")
                break
                
        # Vermeide doppelte Triggerung durch kurz hintereinander liegende Events
        try:
            file_key = (filepath, filepath.stat().st_size)
            if file_key in self.processed_files:
                return
            self.processed_files.add(file_key)
        except Exception:
            pass
        
        # Triggere die Pipeline
        print(f"🚀 Starte Ingest-Pipeline für {filepath.name}...")
        try:
            # Führe ingest_pipeline.py aus
            cmd = [str(PYTHON_EXEC), "ingest_pipeline.py", str(filepath)]
            subprocess.run(cmd, check=True)
            print(f"✅ Pipeline-Lauf beendet für: {filepath.name}")
        except subprocess.CalledProcessError as e:
            print(f"❌ Fehler beim Ausführen der Pipeline: {e}")

def start_watching():
    # Ordner erstellen, falls nicht vorhanden
    WATCH_AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    WATCH_TEXT_DIR.mkdir(parents=True, exist_ok=True)
    
    event_handler = IngestHandler()
    observer = Observer()
    
    # Überwache beide Ordner
    observer.schedule(event_handler, path=str(WATCH_AUDIO_DIR), recursive=False)
    observer.schedule(event_handler, path=str(WATCH_TEXT_DIR), recursive=False)
    
    observer.start()
    print(f"🎙️ Chronist-Watcher ist aktiv! Überwache Ordner:")
    print(f"   👉 {WATCH_AUDIO_DIR.resolve()}")
    print(f"   👉 {WATCH_TEXT_DIR.resolve()}")
    print("Drücke Strg+C zum Beenden...")
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
        print("\n👋 Watcher gestoppt.")
    observer.join()

if __name__ == "__main__":
    start_watching()

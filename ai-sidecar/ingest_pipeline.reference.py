import os
import sys
import io
import json
import glob
import subprocess
from pathlib import Path
from typing import List, Optional
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from google import genai
from google.genai import types

# Zwinge stdout und stderr unter Windows zu UTF-8, um Emoji-Abstürze zu verhindern
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8")

# Load environment variables
load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    print("❌ FEHLER: GEMINI_API_KEY ist nicht in der .env-Datei gesetzt!")
    sys.exit(1)

# Initialize Gemini Client
client = genai.Client(api_key=GEMINI_API_KEY)

# Define schemas for structured output
class GlossaryUpdate(BaseModel):
    type: str = Field(description="Entweder 'Personen' oder 'Orte'")
    name: str = Field(description="Name der Person oder des Ortes (z.B. 'Saladin' oder 'Silberwald'). Keine Sonderzeichen im Dateinamen.")
    content: str = Field(description="Kompletter neuer oder aktualisierter Markdown-Inhalt für diesen Glossareintrag. Verwende Obsidian Wikilinks [[Name]] zur Verknüpfung mit anderen Personen, Orten oder Quests. Verwende ansprechendes Layout mit Überschriften.")

class MatrixUpdates(BaseModel):
    chronik_append: Optional[str] = Field(description="Stichpunkte der neuen Ereignisse, die chronologisch an das Logbuch in chronik.md angehängt werden sollen (im Markdown Format mit *). Wenn nichts Neues passiert ist, leer lassen.")
    quests_content: str = Field(description="Kompletter neuer Inhalt für quests.md. Aktualisiere den Status bestehender Quests oder füge neue hinzu (Stati: NEU, AKTIV, ABGESCHLOSSEN). Behalte das Tabellenlayout bei.")
    inventar_content: str = Field(description="Kompletter neuer Inhalt für inventar.md. Aktualisiere Finanzen (Gold/Silber/Kupfer) und Gegenstände. Berechne den Gesamtwert neu.")
    analyse_content: str = Field(description="Kompletter neuer Inhalt für analyse.md. Aktualisiere Valerius' strategische Analysen, Bedrohungen und nächste Schritte.")
    glossar_updates: List[GlossaryUpdate] = Field(description="Liste von neuen oder aktualisierten Personen- und Orts-Einträgen.")

def run_git_commands():
    """Führt Git Add, Commit und Push aus."""
    print("🔄 Starte Git-Synchronisation...")
    try:
        # Check if it's a git repo
        if not Path(".git").exists():
            print("⚠️ Kein Git-Repository gefunden. Überspringe Git-Push.")
            return

        # git add
        subprocess.run(["git", "add", "."], check=True)
        
        # git commit
        commit_msg = "Chronist: Session Update - Valerius' Taten wurden aufgezeichnet"
        # Check if there are changes to commit
        status = subprocess.run(["git", "status", "--porcelain"], capture_output=True, text=True)
        if not status.stdout.strip():
            print("ℹ️ Keine Änderungen zum Committen vorhanden.")
            return
            
        subprocess.run(["git", "commit", "-m", commit_msg], check=True)
        
        # git push
        # Get current branch name
        branch_res = subprocess.run(["git", "rev-parse", "--abbrev-ref", "HEAD"], capture_output=True, text=True)
        branch = branch_res.stdout.strip() or "main"
        
        subprocess.run(["git", "push", "origin", branch], check=True)
        print("🚀 Git-Synchronisation erfolgreich abgeschlossen!")
    except subprocess.CalledProcessError as e:
        print(f"⚠️ Git-Fehler: {e}. Eventuell sind die Anmeldeinformationen nicht konfiguriert oder das Remote-Repository existiert nicht.")

def transcribe_audio(audio_path: Path) -> Path:
    """Transkribiert eine Audiodatei über die Gemini API."""
    print(f"🎙️ Transkribiere Audiodatei: {audio_path.name}...")
    
    # Upload the file to Gemini API
    uploaded_file = client.files.upload(file=audio_path)
    print(f"📤 Datei hochgeladen. ID: {uploaded_file.name}. Warte auf Transkription...")
    
    prompt = """
    Du bist ein meisterhafter D&D-Chronist und Schreiber. Deine Aufgabe ist es, diese Audioaufnahme einer D&D-Spielrunde präzise ins Deutsche zu transkribieren.
    
    WICHTIGE INSTRUKTIONEN:
    1. Achte extrem auf typische Fantasy- und D&D-Eigennamen (z.B. Valerius Moonwhisper, Saladin, Xantus, Lhaaz, Bag of Holding, etc.).
    2. Schreibe das Gesprochene flüssig und verständlich auf, ohne Füllwörter (wie 'äh', 'hm'), es sei denn, sie sind für den Kontext extrem wichtig.
    3. Strukturiere das Transkript grob in logische Abschnitte, falls sich Themen ändern.
    4. Antworte NUR mit dem transkribierten Text.
    """
    
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=[uploaded_file, prompt]
    )
    
    # Clean up file in cloud after processing (good practice)
    try:
        client.files.delete(name=uploaded_file.name)
    except Exception as e:
        print(f"⚠️ Fehler beim Löschen der temporären Cloud-Datei: {e}")
        
    transcript_path = Path("00_Ingest_Buffer/raw_text/session_raw_latest.md")
    transcript_path.write_text(response.text, encoding="utf-8")
    print(f"📝 Transkript gespeichert unter: {transcript_path}")
    return transcript_path

def read_vault_file(path: str) -> str:
    """Liest eine Datei aus dem Vault, falls sie existiert."""
    p = Path(path)
    if p.exists():
        return p.read_text(encoding="utf-8")
    return ""

def get_glossary_data() -> str:
    """Sammelt alle existierenden Glossar-Einträge und formatiert sie als XML-String."""
    glossary_str = ""
    for folder in ["Personen", "Orte"]:
        path = Path("04_Glossar") / folder
        if path.exists():
            for f in path.glob("*.md"):
                if f.name == ".gitkeep":
                    continue
                content = f.read_text(encoding="utf-8")
                glossary_str += f"<glossar_entry type='{folder}' name='{f.stem}'>\n{content}\n</glossar_entry>\n"
    return glossary_str

def parse_matrix(text_path: Path):
    """Analysiert den Rohtext und aktualisiert die Obsidian-Dateien mithilfe der Gemini Matrix."""
    print("🔮 Starte Gemini Matrix-Parsing...")
    raw_content = text_path.read_text(encoding="utf-8")
    
    # Read existing files
    chronik = read_vault_file("01_Chronik/chronik.md")
    quests = read_vault_file("03_Quests_Inventar/quests.md")
    inventar = read_vault_file("03_Quests_Inventar/inventar.md")
    analyse = read_vault_file("05_Strategie/analyse.md")
    glossary = get_glossary_data()
    
    system_instruction = """
    Du bist der "Matrix-Parser", das Kern-KI-Orchestriersystem von Antigravity 2.0. Du agierst als leitender Chronist und DevOps-Ingenieur für die D&D-Kampagne "Valerius Chronicles".
    Deine Aufgabe ist es, ein rohes Spielsitzungs-Transkript (oder rohe Notizen) zu analysieren und die bestehenden Dokumente des Obsidian-Vaults präzise zu aktualisieren.
    
    Hier sind die bestehenden Dokumente als Referenz. Du musst die neuen Informationen intelligent einarbeiten:
    - Chronik: Füge neue Plotpunkte hinzu. Hänge sie als Stichpunkte (Append-Only) an.
    - Quests: Aktualisiere Stati (NEU, AKTIV, ABGESCHLOSSEN) von Quests. Behalte das Tabellenlayout bei.
    - Inventar: Berechne Finanzen (Gold/Silber/Kupfer) neu. Wenn die Spieler Gold ausgeben, ziehe es ab. Wenn sie Gegenstände erhalten oder verkaufen, aktualisiere die Tabelle. Berechne den Gesamtwert neu.
    - Strategie/Analyse: Schreibe Valerius' Pläne, Träume und Gefahrenanalysen neu, um den aktuellen Stand widerzuspiegeln.
    - Glossar (Personen & Orte): Erstelle neue Einträge oder aktualisiere bestehende Einträge. Nutze Obsidian [[Wikilinks]] für Verknüpfungen (z.B. [[Saladin]], [[Niewinter]]). Behalte bestehende Details bei und füge neue Erkenntnisse hinzu.
    
    Gib deine Antwort exakt im vorgegebenen JSON-Format aus, das dem Schema entspricht.
    """
    
    contents = f"""
    === ROHTEXT / TRANSKRIPT DER NEUEN SESSION ===
    {raw_content}
    
    === BESTEHENDE CHRONIK (01_Chronik/chronik.md) ===
    {chronik}
    
    === BESTEHENDE QUESTS (03_Quests_Inventar/quests.md) ===
    {quests}
    
    === BESTEHENDES INVENTAR (03_Quests_Inventar/inventar.md) ===
    {inventar}
    
    === BESTEHENDE STRATEGIE (05_Strategie/analyse.md) ===
    {analyse}
    
    === BESTEHENDE GLOSSAR-EINTRÄGE ===
    {glossary}
    """
    
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=contents,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=MatrixUpdates,
            system_instruction=system_instruction
        )
    )
    
    # Parse JSON output
    try:
        updates = MatrixUpdates.model_validate_json(response.text)
    except Exception as e:
        print(f"❌ FEHLER beim Parsen der Gemini-Antwort: {e}")
        print("Rohantwort von Gemini:")
        print(response.text)
        sys.exit(1)
        
    # Apply updates
    # 1. Chronik (Append)
    if updates.chronik_append and updates.chronik_append.strip():
        chronik_path = Path("01_Chronik/chronik.md")
        current_chronik = chronik_path.read_text(encoding="utf-8")
        
        # Append points before the last line or just at the end
        new_chronik = current_chronik.rstrip() + "\n" + updates.chronik_append.strip() + "\n"
        chronik_path.write_text(new_chronik, encoding="utf-8")
        print("📝 Chronik aktualisiert (Ereignisse angehängt).")
        
    # 2. Quests
    if updates.quests_content:
        Path("03_Quests_Inventar/quests.md").write_text(updates.quests_content, encoding="utf-8")
        print("📝 Quests (quests.md) aktualisiert.")
        
    # 3. Inventar
    if updates.inventar_content:
        Path("03_Quests_Inventar/inventar.md").write_text(updates.inventar_content, encoding="utf-8")
        print("📝 Inventar (inventar.md) aktualisiert.")
        
    # 4. Strategie
    if updates.analyse_content:
        Path("05_Strategie/analyse.md").write_text(updates.analyse_content, encoding="utf-8")
        print("📝 Strategie (analyse.md) aktualisiert.")
        
    # 5. Glossar
    for item in updates.glossar_updates:
        folder = "Personen" if item.type.lower() == "personen" else "Orte"
        # Sanitize filename (remove special chars, spaces to underscores or just CamelCase)
        safe_name = "".join(c for c in item.name if c.isalnum() or c in (" ", "_", "-")).strip()
        if not safe_name:
            continue
        
        file_path = Path("04_Glossar") / folder / f"{safe_name}.md"
        file_path.parent.mkdir(parents=True, exist_ok=True)
        file_path.write_text(item.content, encoding="utf-8")
        print(f"📝 Glossar-Eintrag ({folder}) aktualisiert/erstellt: {safe_name}.md")

def process_file(file_path: Path):
    """Verarbeitet eine Datei basierend auf ihrem Typ (Audio oder Text)."""
    file_path = Path(file_path)
    if not file_path.exists():
        print(f"❌ Datei existiert nicht: {file_path}")
        return
        
    ext = file_path.suffix.lower()
    
    if ext in (".mp3", ".m4a", ".wav", ".mp4", ".aac"):
        # Audio-Verarbeitung
        try:
            transcript_path = transcribe_audio(file_path)
            parse_matrix(transcript_path)
            # Move processed audio to a backup folder or just leave it
            # We will keep it but rename it or leave it.
            print(f"✅ Audio {file_path.name} erfolgreich verarbeitet.")
        except Exception as e:
            print(f"❌ Fehler bei der Audio-Verarbeitung: {e}")
            return
    elif ext == ".md":
        # Direkte Textverarbeitung
        try:
            parse_matrix(file_path)
            print(f"✅ Textnotiz {file_path.name} erfolgreich verarbeitet.")
        except Exception as e:
            print(f"❌ Fehler bei der Text-Verarbeitung: {e}")
            return
    else:
        print(f"⚠️ Unbekanntes Dateiformat: {ext}. Unterstützt werden: .mp3, .m4a, .wav, .md")
        return
        
    # Git Sync
    run_git_commands()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Verwendung: python ingest_pipeline.py <Dateipfad>")
        sys.exit(1)
        
    target_file = Path(sys.argv[1])
    process_file(target_file)

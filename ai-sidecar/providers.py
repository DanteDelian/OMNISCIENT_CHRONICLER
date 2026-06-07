"""Austauschbare KI-Provider: Parsing (Gemini/Ollama) und Transkription (Gemini/Whisper).

Alle Modell-IDs sind über Umgebungsvariablen konfigurierbar – nichts ist hartcodiert.
"""
import os
import json
from pathlib import Path

from schemas import SessionUpdates

GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
OLLAMA_BASE = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "gemma2")
WHISPER_MODEL = os.getenv("WHISPER_MODEL", "base")

SYSTEM = """Du bist der „Chronist", das KI-Kernsystem des Omniscient Chronicler für eine D&D-Kampagne.
Deine Aufgabe: ein rohes Sitzungs-Transkript (oder Notizen) analysieren und STRUKTURIERTE Aktualisierungs-Vorschläge erzeugen.

Regeln:
- Schlage NUR vor, was sich tatsächlich aus dem Transkript ergibt. Erfinde nichts.
- chronik_append: neue Ereignisse als Markdown-Stichpunkte (jede Zeile mit "* "). Wenn nichts Neues: leer lassen.
- analyse_content: nur ausfüllen, wenn sich Bedrohungen/Theorien/Pläne ändern – dann der komplette neue Markdown-Text.
- quests: neue oder geänderte Quests (Status: rumor=Gerücht, active=aktiv, done=abgeschlossen).
- inventory: erhaltene/verlorene Gegenstände.
- glossar: neue/aktualisierte Personen & Orte (Markdown mit [[Wikilinks]]).
- character: nur Felder setzen, die sich ändern (z.B. neue max. TP bei Stufenaufstieg, Gold-Differenz, neue Zustände).
- Antworte AUSSCHLIESSLICH im vorgegebenen JSON-Schema, auf Deutsch."""


def build_prompt(transcript: str, context: dict) -> str:
    def sec(title, key):
        val = context.get(key, "")
        return f"\n=== {title} ===\n{val}\n" if val else ""

    return (
        "=== ROHTEXT / TRANSKRIPT DER NEUEN SESSION ===\n"
        + transcript
        + sec("BESTEHENDE CHRONIK", "chronik")
        + sec("BESTEHENDE QUESTS", "quests")
        + sec("BESTEHENDES INVENTAR", "inventar")
        + sec("BESTEHENDE STRATEGIE/ANALYSE", "analyse")
        + sec("BESTEHENDE GLOSSAR-EINTRÄGE", "glossar")
        + sec("CHARAKTER (aktueller Stand)", "character")
    )


# ---------- Parsing ----------

def parse_gemini(transcript, context, model=None) -> SessionUpdates:
    from google import genai
    from google.genai import types

    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY ist nicht gesetzt.")
    client = genai.Client(api_key=api_key)
    resp = client.models.generate_content(
        model=model or GEMINI_MODEL,
        contents=build_prompt(transcript, context),
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=SessionUpdates,
            system_instruction=SYSTEM,
        ),
    )
    return SessionUpdates.model_validate_json(resp.text)


def parse_ollama(transcript, context, model=None) -> SessionUpdates:
    import httpx

    schema = SessionUpdates.model_json_schema()
    messages = [
        {"role": "system", "content": SYSTEM},
        {"role": "user", "content": build_prompt(transcript, context)},
    ]
    last_err = None
    for _ in range(3):
        payload = {
            "model": model or OLLAMA_MODEL,
            "messages": messages,
            "format": schema,
            "stream": False,
            "options": {"temperature": 0.2},
        }
        r = httpx.post(f"{OLLAMA_BASE}/api/chat", json=payload, timeout=600)
        r.raise_for_status()
        content = r.json()["message"]["content"]
        try:
            return SessionUpdates.model_validate_json(content)
        except Exception as e:  # noqa: BLE001
            last_err = e
            messages.append({"role": "assistant", "content": content})
            messages.append(
                {
                    "role": "user",
                    "content": f"Die Antwort war kein gültiges JSON gemäß Schema ({e}). Antworte erneut, ausschließlich mit gültigem JSON.",
                }
            )
    raise RuntimeError(f"Ollama lieferte kein gültiges JSON: {last_err}")


def parse_session(transcript, context, provider=None, model=None) -> SessionUpdates:
    provider = provider or os.getenv("PARSE_PROVIDER") or os.getenv("AI_PROVIDER") or "ollama"
    if provider == "gemini":
        return parse_gemini(transcript, context, model)
    return parse_ollama(transcript, context, model)


# ---------- Transkription ----------

def transcribe_gemini(path: str, model=None) -> str:
    from google import genai

    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY ist nicht gesetzt.")
    client = genai.Client(api_key=api_key)
    uploaded = client.files.upload(file=path)
    prompt = (
        "Transkribiere diese D&D-Spielrunden-Aufnahme präzise ins Deutsche. "
        "Achte auf Fantasy-Eigennamen. Entferne Füllwörter. Antworte nur mit dem Transkript."
    )
    resp = client.models.generate_content(model=model or GEMINI_MODEL, contents=[uploaded, prompt])
    try:
        client.files.delete(name=uploaded.name)
    except Exception:  # noqa: BLE001
        pass
    return resp.text or ""


def transcribe_whisper(path: str, model=None, language="de") -> str:
    try:
        from faster_whisper import WhisperModel
    except ImportError as e:
        raise RuntimeError(
            "faster-whisper ist nicht installiert. Für lokale Transkription: "
            "pip install faster-whisper (benötigt Python 3.11/3.12)."
        ) from e
    wm = WhisperModel(model or WHISPER_MODEL, device="auto", compute_type="int8")
    segments, _ = wm.transcribe(path, language=language)
    return " ".join(s.text.strip() for s in segments).strip()


def transcribe(path: str, provider=None, model=None, language="de") -> str:
    provider = provider or os.getenv("TRANSCRIBE_PROVIDER") or os.getenv("AI_PROVIDER") or "gemini"
    if provider == "whisper":
        return transcribe_whisper(path, model, language)
    return transcribe_gemini(path, model)

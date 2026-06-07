"""FastAPI-Sidecar: Transkription + strukturiertes Parsing für den Omniscient Chronicler.

Start:  uvicorn server:app --port 8756
"""
import os
import sys
import io
import tempfile
from pathlib import Path

from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

# UTF-8 unter Windows erzwingen
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8")

# .env aus dem Repo-Root laden (geteilt mit der App)
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

import providers  # noqa: E402
from schemas import ParseRequest  # noqa: E402

app = FastAPI(title="Omniscient Chronicler Sidecar")


@app.get("/health")
def health():
    return {
        "ok": True,
        "parse_provider": os.getenv("PARSE_PROVIDER") or os.getenv("AI_PROVIDER") or "ollama",
        "transcribe_provider": os.getenv("TRANSCRIBE_PROVIDER") or os.getenv("AI_PROVIDER") or "gemini",
        "ollama_model": providers.OLLAMA_MODEL,
        "gemini_model": providers.GEMINI_MODEL,
    }


@app.post("/transcribe")
async def transcribe(file: UploadFile = File(...), provider: str = Form(None), model: str = Form(None)):
    suffix = Path(file.filename or "audio").suffix or ".mp3"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name
    try:
        text = providers.transcribe(tmp_path, provider=provider or None, model=model or None)
        return {"transcript": text}
    except Exception as e:  # noqa: BLE001
        return JSONResponse({"error": str(e)}, status_code=500)
    finally:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass


@app.post("/parse")
def parse(req: ParseRequest):
    try:
        updates = providers.parse_session(req.transcript, req.context, req.provider, req.model)
        return JSONResponse(updates.model_dump())
    except Exception as e:  # noqa: BLE001
        return JSONResponse({"error": str(e)}, status_code=500)


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("SIDECAR_PORT", "8756"))
    uvicorn.run(app, host="127.0.0.1", port=port)

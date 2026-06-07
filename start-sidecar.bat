@echo off
title Chronicler KI-Sidecar
echo ============================================================
echo   KI-Sidecar (Transkription + Parsing)
echo ============================================================
cd /d "%~dp0ai-sidecar"

if not exist venv (
	echo [Setup] Erstelle venv und installiere Abhaengigkeiten ^(einmalig^)...
	python -m venv venv
	call venv\Scripts\pip install -r requirements.txt
)

echo Starte KI-Sidecar auf http://127.0.0.1:8756 ...
venv\Scripts\python server.py
pause

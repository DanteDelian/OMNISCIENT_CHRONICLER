@echo off
title Omniscient Chronicler v3
echo ============================================================
echo   OMNISCIENT CHRONICLER v3 - lokal-first D^&D Dashboard
echo ============================================================
echo.

cd /d "%~dp0app"

if not exist node_modules (
	echo [Setup] Installiere Abhaengigkeiten ^(einmalig^)...
	call npm install
)

if not exist build (
	echo [Setup] Baue die App ^(einmalig^)...
	call npm run build
)

if exist "%~dp0ai-sidecar\venv" (
	echo [KI] Starte KI-Sidecar in separatem Fenster...
	start "Chronicler KI-Sidecar" cmd /c "cd /d %~dp0ai-sidecar && venv\Scripts\python server.py"
)

echo.
echo Starte Server... im WLAN erreichbar unter http://DEINE-IP:3000
echo Beenden mit Strg+C.
echo.

set PORT=3000
set HOST=0.0.0.0
node --env-file-if-exists=..\.env build
pause

@echo off
title Omniscient Chronicler v4
echo ============================================================
echo   OMNISCIENT CHRONICLER v4 - lokal-first D^&D Dashboard
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

echo.
echo Starte Server... im WLAN erreichbar unter http://DEINE-IP:3000
echo ^(genaue Adresse: Dashboard -^> Einstellungen -^> WLAN-Zugriff^)
echo Beenden mit Strg+C.
echo.

set PORT=3000
set HOST=0.0.0.0
node --env-file-if-exists=..\.env build
pause

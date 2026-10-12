@echo off
setlocal
title Valerius - Grimoire
echo ============================================================
echo   VALERIUS - GRIMOIRE   (Strg+C beendet den Server)
echo ============================================================
echo.

cd /d "%~dp0app"

where node >nul 2>nul
if errorlevel 1 (
	echo [Fehler] Node.js ist nicht installiert: https://nodejs.org
	pause
	exit /b 1
)

if not exist node_modules (
	echo [Setup] Installiere Abhaengigkeiten ^(einmalig^)...
	call npm install || goto :fehler
)

rem Neu bauen, wenn es noch keinen Build gibt oder der Code sich geaendert hat (Git-Stand).
set "HEADREV=ohne-git"
for /f %%i in ('git -C .. rev-parse HEAD 2^>nul') do set "HEADREV=%%i"
set "BUILTREV="
if exist build\.rev set /p BUILTREV=<build\.rev
if not exist build goto :bauen
if not "%HEADREV%"=="%BUILTREV%" goto :bauen
goto :starten

:bauen
echo [Setup] Baue die App...
call npm run build || goto :fehler
> build\.rev echo %HEADREV%

:starten
rem Port aus .env lesen (Standard 3000). HOST setzt adapter-node selbst auf 0.0.0.0.
if not defined PORT if exist ..\.env for /f "usebackq tokens=1,* delims==" %%a in ("..\.env") do if /i "%%a"=="PORT" set "PORT=%%b"
if not defined PORT set PORT=3000
echo.
echo Laptop:        http://localhost:%PORT%
echo Tablet/Handy:  http://IP-DIESES-LAPTOPS:%PORT%  (gleiches WLAN)
echo.
start "" cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:%PORT%"
node --env-file-if-exists=..\.env build
goto :eof

:fehler
echo.
echo [Fehler] Etwas ist schiefgelaufen. Siehe Meldungen oben.
pause
exit /b 1

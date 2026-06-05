@echo off
title D^&D Omniscient Chronicler Watcher
echo ========================================================
echo   OMNISCIENT CHRONICLER v2.0 - WATCHER STARTING...
echo ========================================================
echo.
if not exist venv (
    echo [ERROR] Virtuelle Umgebung 'venv' wurde nicht gefunden!
    echo Bitte starte zuerst das Setup oder erstelle die virtuelle Umgebung.
    pause
    exit /b
)
.\venv\Scripts\python.exe watcher.py
pause

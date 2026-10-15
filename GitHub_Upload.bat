@echo off
title GitHub Upload
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0upload.ps1"

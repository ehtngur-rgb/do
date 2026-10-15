@echo off
chcp 65001 > nul
title 소리로 움직이는 AI 로봇 친구 체험 프로그램
echo ========================================================
echo   [체험 프로그램 실행 중] 손이 불편한 친구를 돕는 AI 로봇
echo ========================================================
echo.
echo 웹 서버를 시작하고 브라우저를 열고 있습니다...
echo 잠시만 기다려 주세요!
echo (이 창을 닫으면 프로그램이 종료됩니다.)
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0server.ps1"

pause

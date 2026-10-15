@echo off
chcp 65001 > nul
set "PATH=C:\Program Files\Git\cmd;C:\PROGRA~1\Git\cmd;%PATH%"

echo ===================================================
echo   [배리어프리 음성 로봇] GitHub 원클릭 업로드
echo   저장소: https://github.com/ehtnqur-rgb/do.git
echo ===================================================
echo.

echo [1/3] 변경사항 준비 중...
git branch -M main
git remote remove origin >nul 2>nul
git remote add origin https://github.com/ehtnqur-rgb/do.git
git add -A
git commit -m "소리로 움직이는 도우미 로봇 친구 (배리어프리 체험) 웹 배포" >nul 2>nul

echo [2/3] GitHub로 업로드(Push) 전송 중...
echo * 브라우저에 GitHub 인증(Authorize) 창이 나타나면 녹색 버튼을 눌러주세요!
echo.

git push -u origin main --force

if %errorlevel% equ 0 (
    echo.
    echo ===================================================
    echo  [성공!] GitHub 업로드가 완료되었습니다!
    echo  저장소: https://github.com/ehtnqur-rgb/do
    echo ===================================================
) else (
    echo.
    echo ===================================================
    echo  [안내] GitHub 로그인 인증이 필요합니다.
    echo ===================================================
)

echo.
pause

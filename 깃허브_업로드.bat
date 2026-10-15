@echo off
chcp 65001 > nul
echo ===================================================
echo   [배리어프리 음성 로봇] GitHub 자동 업로드
echo   저장소: https://github.com/ehtnqur-rgb/do.git
echo ===================================================
echo.

where git >nul 2>nul
if %errorlevel% neq 0 (
    echo [알림] Git이 설치되어 있지 않습니다.
    echo Git을 설치하시겠습니까? (자동 설치 시도)
    pause
    winget install --id Git.Git -e --source winget --accept-source-agreements --accept-package-agreements
    echo.
    echo Git 설치가 완료되었습니다. 이 창을 닫고 다시 실행해 주세요!
    pause
    exit /b
)

echo [1/4] Git 초기화 중...
if not exist .git (
    git init
    git branch -M main
)

echo [2/4] 원격 저장소 연결 중...
git remote remove origin >nul 2>nul
git remote add origin https://github.com/ehtnqur-rgb/do.git

echo [3/4] 파일 추가 및 커밋 중...
git add .
git commit -m "소리로 움직이는 도우미 로봇 친구 (배리어프리 3D 체험)"

echo [4/4] GitHub로 업로드(Push) 중...
echo (처음 한 번 브라우저에서 GitHub 로그인 창이 뜰 수 있습니다)
git push -u origin main --force

echo.
echo ===================================================
echo [완료] GitHub 업로드가 성공적으로 완료되었습니다!
echo 저장소 확인: https://github.com/ehtnqur-rgb/do
echo ===================================================
pause

@echo off
chcp 65001 > nul
setlocal

set "GH_EXE=C:\Program Files\GitHub CLI\gh.exe"
set "GIT_EXE=C:\Program Files\Git\cmd\git.exe"
set "PATH=C:\Program Files\Git\cmd;C:\Program Files\GitHub CLI;%PATH%"

cls
echo ========================================================
echo   🤖 [배리어프리 음성 로봇] GitHub 원클릭 업로드
echo   저장소: https://github.com/ehtnqur-rgb/do
echo ========================================================
echo.

:: 1. Check Git
if not exist "%GIT_EXE%" (
    echo [오류] Git 프로그램을 찾을 수 없습니다.
    echo 잠시 후 창이 닫힙니다.
    pause
    exit /b
)

:: 2. Check GitHub CLI Auth
echo [1/4] GitHub 로그인 상태 확인 중...
"%GH_EXE%" auth status >nul 2>nul
if %errorlevel% neq 0 (
    echo.
    echo --------------------------------------------------------
    echo  🔑 [브라우저 로그인 1회 인증 안내]
    echo.
    echo  1. 엔터(Enter) 키를 누르면 브라우저 인증 창이 열립니다.
    echo  2. 8자리 일회용 코드가 이미 복사되어 있으니,
    echo     웹 화면에서 [Ctrl + V] 로 붙여넣고 [Continue] 를 누르세요!
    echo --------------------------------------------------------
    echo.
    
    "%GH_EXE%" auth login --web --clipboard -h github.com -p https
    if %errorlevel% neq 0 (
        echo.
        echo [안내] 로그인이 완료되지 않았습니다. 다시 실행해 주세요.
        echo.
        pause
        exit /b
    )
    "%GH_EXE%" auth setup-git
) else (
    echo  -> 이미 GitHub에 정상 로그인되어 있습니다.
)

:: 3. Configure local git
echo.
echo [2/4] 프로젝트 파일 및 최신 상태 커밋 중...
"%GIT_EXE%" branch -M main
"%GIT_EXE%" remote remove origin >nul 2>nul
"%GIT_EXE%" remote add origin https://github.com/ehtnqur-rgb/do.git
"%GIT_EXE%" add -A
"%GIT_EXE%" commit -m "소리로 움직이는 도우미 로봇 친구 (배리어프리 체험) 웹 배포" >nul 2>nul

:: 4. Push to GitHub
echo.
echo [3/4] GitHub로 파일 전체 업로드(Push) 중...
"%GIT_EXE%" push -u origin main --force
if %errorlevel% neq 0 (
    echo.
    echo [재시도] gh 자격증명으로 직접 푸시 시도 중...
    "%GH_EXE%" auth setup-git
    "%GIT_EXE%" push -u origin main --force
)

if %errorlevel% neq 0 (
    echo.
    echo --------------------------------------------------------
    echo  [오류] 업로드에 실패했습니다.
    echo  원인: 저장소 접근 권한 또는 네트워크 문제입니다.
    echo --------------------------------------------------------
    echo.
    pause
    exit /b
)

:: 5. Automatically convert repo to Public & enable GitHub Pages if possible
echo.
echo [4/4] 태블릿 접속용 웹사이트(GitHub Pages) 설정 중...
"%GH_EXE%" repo edit ehtnqur-rgb/do --visibility public --accept-visibility-change-consequences >nul 2>nul
"%GH_EXE%" api repos/ehtnqur-rgb/do/pages -X POST -f "source[branch]=main" -f "source[path]=/" >nul 2>nul

echo.
echo ========================================================
echo  🎉 축하합니다! 모든 작업이 성공적으로 완료되었습니다!
echo ========================================================
echo.
echo  💻 업로드된 GitHub 저장소:
echo     https://github.com/ehtnqur-rgb/do
echo.
echo  📱 태블릿 접속 웹사이트 주소:
echo     https://ehtnqur-rgb.github.io/do/
echo.
echo  📷 태블릿 접속용 QR 코드:
echo     폴더 안의 tablet_qr_code.png 파일을 태블릿 카메라로 비춰보세요!
echo.
echo ========================================================
echo 창을 닫으려면 아무 키나 누르세요...
pause >nul

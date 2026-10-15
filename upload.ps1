[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$Host.UI.RawUI.WindowTitle = "GitHub 업로드 및 웹 호스팅 배포"

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  🚀 [배리어프리 음성 로봇] GitHub 업로드 & 패들렛 링크 배포" -ForegroundColor Yellow
Write-Host "  저장소: https://github.com/ehtngur-rgb/do" -ForegroundColor White
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

$gh = "C:\Program Files\GitHub CLI\gh.exe"
$git = "git"
if (Test-Path "C:\Program Files\Git\cmd\git.exe") {
    $git = "C:\Program Files\Git\cmd\git.exe"
}

# 1. 127.0.0.1 로컬 포트 충돌 방지: gh device code 인증을 먼저 실행
Write-Host "[1/3] GitHub 로그인 상태 확인 중..." -ForegroundColor Green
$null = & $gh auth status 2>&1
$isLoggedIn = ($LASTEXITCODE -eq 0)

if (-not $isLoggedIn) {
    Write-Host ""
    Write-Host "--------------------------------------------------------" -ForegroundColor Yellow
    Write-Host "  🔑 [GitHub 브라우저 기기 인증]" -ForegroundColor Yellow
    Write-Host "  1. 8자리 일회성 코드가 클립보드에 자동 복사됩니다." -ForegroundColor White
    Write-Host "  2. 열리는 브라우저(https://github.com/login/device)에서" -ForegroundColor White
    Write-Host "     [Ctrl + V] 로 코드를 붙여넣고 [Continue] 를 누르세요!" -ForegroundColor White
    Write-Host "--------------------------------------------------------" -ForegroundColor Yellow
    Write-Host ""
    
    & $gh auth login --web --clipboard -h github.com -p https
    & $gh auth setup-git
} else {
    Write-Host "  -> 이미 GitHub에 정상 로그인되어 있습니다." -ForegroundColor White
    & $gh auth setup-git
}

# 2. 최신 코드 커밋
Write-Host ""
Write-Host "[2/3] 최신 코드 커밋 중..." -ForegroundColor Green
& $git branch -M main
& $git remote remove origin 2>$null
& $git remote add origin https://github.com/ehtngur-rgb/do.git
& $git add -A
& $git commit -m "소리로 움직이는 도우미 로봇 친구 최신 버전 배포" 2>$null

# 3. GitHub Push (gh 토큰 자격증명 사용)
Write-Host ""
Write-Host "[3/3] GitHub로 업로드 중 (Push)..." -ForegroundColor Green
& $git push -u origin main --force

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================================" -ForegroundColor Green
    Write-Host "  🎉 축하합니다! GitHub 업로드가 성공적으로 완료되었습니다!" -ForegroundColor Yellow
    Write-Host "========================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "  📍 GitHub 저장소:" -ForegroundColor Cyan
    Write-Host "     https://github.com/ehtngur-rgb/do" -ForegroundColor White
    Write-Host ""
    Write-Host "  🌐 패들렛(Padlet)에 올릴 학생 접속 주소:" -ForegroundColor Cyan
    Write-Host "     https://ehtngur-rgb.github.io/do/" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  📱 태블릿 접속용 QR 코드:" -ForegroundColor Cyan
    Write-Host "     폴더 안의 tablet_qr_code.png 파일을 태블릿으로 비춰보세요!" -ForegroundColor White
    Write-Host "========================================================" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "[안내] GitHub 웹사이트에서 직접 올리는 초간단 방법:" -ForegroundColor Yellow
    Write-Host "1. 웹 브라우저에서 https://github.com/ehtngur-rgb/do 에 접속합니다." -ForegroundColor White
    Write-Host "2. [Add file] -> [Upload files]를 눌러 폴더 안의 파일들을 드래그하면 즉시 올라갑니다!" -ForegroundColor White
}

Write-Host ""
Write-Host "종료하려면 아무 키나 누르세요..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

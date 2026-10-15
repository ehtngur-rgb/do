[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$Host.UI.RawUI.WindowTitle = "GitHub 업로드 및 웹 호스팅 배포"

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  🚀 [배리어프리 음성 로봇] GitHub 업로드 & 패들렛 링크 배포" -ForegroundColor Yellow
Write-Host "  저장소: https://github.com/ehtnqur-rgb/do" -ForegroundColor White
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Git 확인
$git = "git"
if (Test-Path "C:\Program Files\Git\cmd\git.exe") {
    $git = "C:\Program Files\Git\cmd\git.exe"
}

# 2. 최신 코드 커밋
Write-Host "[1/3] 프로젝트 최신 상태 확인 및 커밋 중..." -ForegroundColor Green
& $git branch -M main
& $git remote remove origin 2>$null
& $git remote add origin https://github.com/ehtnqur-rgb/do.git
& $git add -A
& $git commit -m "소리로 움직이는 도우미 로봇 친구 최신 버전 배포" 2>$null

# 3. GitHub Push
Write-Host ""
Write-Host "[2/3] GitHub로 업로드 중 (Push)..." -ForegroundColor Green
Write-Host "💡 브라우저 로그인 창이 열리면 [Sign in with your browser] 버튼을 눌러 승인해 주세요!" -ForegroundColor Yellow
Write-Host ""

& $git push -u origin main --force

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================================" -ForegroundColor Green
    Write-Host "  🎉 축하합니다! GitHub 업로드가 성공적으로 완료되었습니다!" -ForegroundColor Yellow
    Write-Host "========================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "  📍 GitHub 저장소:" -ForegroundColor Cyan
    Write-Host "     https://github.com/ehtnqur-rgb/do" -ForegroundColor White
    Write-Host ""
    Write-Host "  🌐 패들렛(Padlet)에 올릴 학생 접속 주소:" -ForegroundColor Cyan
    Write-Host "     https://ehtnqur-rgb.github.io/do/" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  📱 태블릿 접속용 QR 코드:" -ForegroundColor Cyan
    Write-Host "     폴더 안의 tablet_qr_code.png 파일을 태블릿으로 비춰보세요!" -ForegroundColor White
    Write-Host "========================================================" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "[알림] 업로드를 위해 GitHub 1회 브라우저 로그인을 진행합니다..." -ForegroundColor Yellow
    
    $gh = "C:\Program Files\GitHub CLI\gh.exe"
    if (Test-Path $gh) {
        Write-Host "웹 브라우저가 열리면 화면에 [Ctrl + V]로 코드를 붙여넣고 [Continue]를 누르세요." -ForegroundColor Cyan
        & $gh auth login --web --clipboard -h github.com -p https
        & $gh auth setup-git
        & $git push -u origin main --force
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "🎉 업로드 완료! 주소: https://ehtnqur-rgb.github.io/do/" -ForegroundColor Green
        }
    }
}

Write-Host ""
Write-Host "종료하려면 아무 키나 누르세요..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

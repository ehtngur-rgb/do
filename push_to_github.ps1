[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$Host.UI.RawUI.WindowTitle = "[배리어프리 음성 로봇] GitHub 업로드"

$env:PATH = "C:\Program Files\Git\cmd;$env:PATH"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " [배리어프리 음성 로봇] GitHub 원클릭 업로드" -ForegroundColor Yellow
Write-Host " 대상 저장소: https://github.com/ehtnqur-rgb/do.git" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/3] 변경사항 커밋 준비 중..." -ForegroundColor Gray
git branch -M main
try { git remote remove origin } catch {}
git remote add origin https://github.com/ehtnqur-rgb/do.git
git add -A
git commit -m "소리로 움직이는 도우미 로봇 친구 (배리어프리 체험) 웹 배포" 2>$null

Write-Host "[2/3] GitHub로 전송(Push) 중..." -ForegroundColor Cyan
Write-Host " 💡 브라우저에 GitHub 인증(Authorize) 창이 나타나면 녹색 버튼을 눌러주세요!" -ForegroundColor Yellow
Write-Host ""

git push -u origin main --force

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "==========================================================" -ForegroundColor Green
    Write-Host " 🎉 [성공] GitHub 파일 업로드가 완료되었습니다!" -ForegroundColor Green
    Write-Host " 저장소 확인: https://github.com/ehtnqur-rgb/do" -ForegroundColor Cyan
    Write-Host "==========================================================" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "==========================================================" -ForegroundColor Red
    Write-Host " [안내] GitHub 로그인 인증이 진행 중이거나 취소되었습니다." -ForegroundColor Yellow
    Write-Host " 브라우저에서 'Authorize Git Credential Manager'를 허용해 주세요." -ForegroundColor Gray
    Write-Host "==========================================================" -ForegroundColor Red
}

Write-Host ""
Write-Host "아무 키나 누르면 이 창이 닫힙니다..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

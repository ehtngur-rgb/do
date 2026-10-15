$gitPath = "C:\Program Files\Git\cmd\git.exe"
& $gitPath add -A
& $gitPath commit -m "태블릿 QR 코드 이미지 및 배치 파일 업데이트"
& $gitPath log -n 2 --oneline

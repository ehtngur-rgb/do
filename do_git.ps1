$gitPath = "C:\Program Files\Git\cmd\git.exe"
& $gitPath init
& $gitPath branch -M main
& $gitPath remote remove origin 2>$null
& $gitPath remote add origin "https://github.com/ehtnqur-rgb/do.git"
& $gitPath add -A
& $gitPath commit -m "소리로 움직이는 도우미 로봇 친구 배리어프리 체험 웹 배포"
& $gitPath status

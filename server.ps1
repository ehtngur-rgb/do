# Simple Local Web Server for Voice Robot Experience
param (
    [int]$Port = 8080
)

$ErrorActionPreference = "Continue"
$root = $PSScriptRoot
if (-not $root) { $root = (Get-Location).Path }

Add-Type -AssemblyName System.Net.Http -ErrorAction SilentlyContinue

# Ensure Typecast API Key is retrieved from environment (checking with and without leading space)
$typecastApiKey = $env:TYPECAST_API_KEY
if (-not $typecastApiKey) { $typecastApiKey = ${env: TYPECAST_API_KEY} }
if (-not $typecastApiKey) { $typecastApiKey = [System.Environment]::GetEnvironmentVariable("TYPECAST_API_KEY", "User") }
if (-not $typecastApiKey) { $typecastApiKey = [System.Environment]::GetEnvironmentVariable(" TYPECAST_API_KEY", "User") }
if (-not $typecastApiKey) { $typecastApiKey = [System.Environment]::GetEnvironmentVariable("TYPECAST_API_KEY", "Machine") }
if (-not $typecastApiKey) { $typecastApiKey = [System.Environment]::GetEnvironmentVariable(" TYPECAST_API_KEY", "Machine") }

# If found in registry, sync to current process
if ($typecastApiKey) {
    $env:TYPECAST_API_KEY = $typecastApiKey
}

# Local audio cache folder to save credits and ensure ultra-low latency for repeated phrases
$audioCacheDir = Join-Path $root "audio_cache"
if (-not (Test-Path $audioCacheDir)) {
    New-Item -ItemType Directory -Path $audioCacheDir -Force | Out-Null
}

$httpClient = $null
$cachedPlan = $null
$cachedCredits = $null

if ($typecastApiKey) {
    try {
        $httpClient = New-Object System.Net.Http.HttpClient
        $httpClient.Timeout = [System.TimeSpan]::FromSeconds(15)
        $httpClient.DefaultRequestHeaders.Add("X-API-KEY", $typecastApiKey)

        # Check account status once on startup
        $subResp = $httpClient.GetAsync("https://api.typecast.ai/v1/users/me/subscription").Result
        if ($subResp.StatusCode -eq 200) {
            $subData = $subResp.Content.ReadAsStringAsync().Result | ConvertFrom-Json
            $cachedPlan = $subData.plan
            $cachedCredits = $subData.credits.plan_credits
        }
    } catch {
        # Non-fatal if offline
    }
}

# Content-Type Mapping
$mimeTypes = @{
    ".html" = "text/html; charset=utf-8"
    ".htm"  = "text/html; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".js"   = "application/javascript; charset=utf-8"
    ".json" = "application/json; charset=utf-8"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".gif"  = "image/gif"
    ".svg"  = "image/svg+xml"
    ".ico"  = "image/x-icon"
    ".mp3"  = "audio/mpeg"
    ".wav"  = "audio/wav"
}

# Detect primary active local IPv4 address for Tablet connection
$localIp = $null
try {
    $localIp = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Wi-Fi*", "이더넷*", "Ethernet*" -ErrorAction SilentlyContinue | Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.254.*" }).IPAddress | Select-Object -First 1
} catch {}

# Try ports until one binds
$listener = $null
$boundPort = $Port
for ($i = 0; $i -lt 15; $i++) {
    $testPort = $Port + $i
    try {
        $tempListener = New-Object System.Net.HttpListener
        $tempListener.Prefixes.Add("http://localhost:$testPort/")
        $tempListener.Prefixes.Add("http://127.0.0.1:$testPort/")
        if ($localIp) {
            try { $tempListener.Prefixes.Add("http://$($localIp):$testPort/") } catch {}
        }
        $tempListener.Start()
        $listener = $tempListener
        $boundPort = $testPort
        break
    } catch {
        if ($tempListener) { $tempListener.Close() }
    }
}

if (-not $listener) {
    Write-Host "[오류] 사용 가능한 로컬 포트를 찾지 못했습니다." -ForegroundColor Red
    exit 1
}

$url = "http://localhost:$boundPort/"
$tabletUrl = if ($localIp) { "http://$($localIp):$boundPort/" } else { $url }

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " [소리로 움직이는 도우미 로봇 체험] 웹 서버 시작!" -ForegroundColor Yellow
Write-Host " 💻 컴퓨터 접속 주소: $url" -ForegroundColor Green
if ($localIp) {
    Write-Host " 📱 태블릿 접속 주소: $tabletUrl" -ForegroundColor Magenta
}
if ($typecastApiKey) {
    $masked = if ($typecastApiKey.Length -gt 10) { $typecastApiKey.Substring(0, 6) + "..." + $typecastApiKey.Substring($typecastApiKey.Length - 4) } else { "***" }
    Write-Host " [Typecast] API 키 연결 완료: $masked (플랜: $cachedPlan, 크레딧: $cachedCredits)" -ForegroundColor Cyan
} else {
    Write-Host " [Typecast] API 키 미등록 (브라우저 내장 음성 엔진 사용)" -ForegroundColor Gray
}
Write-Host " 마이크 권한 팝업 없는 무손(Hands-Free) 전용 브라우저 실행 중..." -ForegroundColor Magenta
Write-Host " (종료하려면 이 창을 닫거나 Ctrl+C)" -ForegroundColor Gray
Write-Host "==========================================================" -ForegroundColor Cyan

# Find Chrome or Edge to launch with auto-grant microphone flags
$browserExe = $null
$candidateBrowsers = @(
    "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
    "$env:LocalAppData\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
    "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe"
)

foreach ($b in $candidateBrowsers) {
    if (Test-Path $b) {
        $browserExe = $b
        break
    }
}

$profileDir = Join-Path $env:TEMP "VoiceRobotProfile"
$browserArgs = @(
    "--use-fake-ui-for-media-stream",
    "--unsafely-treat-insecure-origin-as-secure=$url",
    "--autoplay-policy=no-user-gesture-required",
    "--user-data-dir=`"$profileDir`"",
    "$url"
)

if ($browserExe) {
    Write-Host "[실행] 브라우저 자동 마이크 허용 모드로 열기: $browserExe" -ForegroundColor Green
    Start-Process -FilePath $browserExe -ArgumentList ($browserArgs -join " ")
} else {
    Write-Host "[실행] 기본 브라우저로 엽니다..." -ForegroundColor Yellow
    Start-Process $url
}

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $localPath = $request.Url.LocalPath
        if ($localPath -eq "/" -or [string]::IsNullOrWhiteSpace($localPath)) {
            $localPath = "/index.html"
        }

        # -------------------------------------------------------------
        # 0. API Endpoint: Network Info for Tablet QR Connection
        # -------------------------------------------------------------
        if ($localPath -eq "/api/network-info") {
            $response.AddHeader("Access-Control-Allow-Origin", "*")
            $response.AddHeader("Cache-Control", "no-cache")
            $netObj = @{
                localIp = $localIp
                port = $boundPort
                localUrl = if ($localIp) { "http://$($localIp):$boundPort/" } else { "http://localhost:$boundPort/" }
                localhostUrl = "http://localhost:$boundPort/"
            }
            $jsonBytes = [System.Text.Encoding]::UTF8.GetBytes(($netObj | ConvertTo-Json))
            $response.ContentType = "application/json; charset=utf-8"
            $response.StatusCode = 200
            $response.ContentLength64 = $jsonBytes.Length
            $response.OutputStream.Write($jsonBytes, 0, $jsonBytes.Length)
            $response.Close()
            continue
        }

        # -------------------------------------------------------------
        # 1. API Endpoints for Typecast Integration
        # -------------------------------------------------------------
        if ($localPath.StartsWith("/api/typecast/")) {
            $response.AddHeader("Access-Control-Allow-Origin", "*")
            $response.AddHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
            $response.AddHeader("Access-Control-Allow-Headers", "Content-Type")

            if ($request.HttpMethod -eq "OPTIONS") {
                $response.StatusCode = 200
                $response.Close()
                continue
            }

            # GET /api/typecast/status
            if ($localPath -eq "/api/typecast/status") {
                $statusObj = @{
                    configured = [bool]$typecastApiKey
                    maskedKey = if ($typecastApiKey -and $typecastApiKey.Length -gt 10) {
                        $typecastApiKey.Substring(0, 6) + "..." + $typecastApiKey.Substring($typecastApiKey.Length - 4)
                    } else { $null }
                    plan = $cachedPlan
                    credits = $cachedCredits
                }
                $jsonBytes = [System.Text.Encoding]::UTF8.GetBytes(($statusObj | ConvertTo-Json))
                $response.ContentType = "application/json; charset=utf-8"
                $response.StatusCode = 200
                $response.ContentLength64 = $jsonBytes.Length
                $response.OutputStream.Write($jsonBytes, 0, $jsonBytes.Length)
                $response.Close()
                continue
            }

            # POST /api/typecast/tts
            if ($localPath -eq "/api/typecast/tts" -and $request.HttpMethod -eq "POST") {
                if (-not $typecastApiKey -or -not $httpClient) {
                    $errObj = @{ error = "API_KEY_NOT_CONFIGURED"; message = "Typecast API 키가 환경 변수에 설정되지 않았습니다." }
                    $errBytes = [System.Text.Encoding]::UTF8.GetBytes(($errObj | ConvertTo-Json))
                    $response.ContentType = "application/json; charset=utf-8"
                    $response.StatusCode = 400
                    $response.ContentLength64 = $errBytes.Length
                    $response.OutputStream.Write($errBytes, 0, $errBytes.Length)
                    $response.Close()
                    continue
                }

                $ttsText = ""
                $ttsVoiceId = "tc_61377fdaa23e3c47ccf5e93e" # Default: Robo (Kid-friendly Robot Voice)
                $ttsModel = "ssfm-v30"

                try {
                    $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
                    $bodyStr = $reader.ReadToEnd()
                    $reqObj = $bodyStr | ConvertFrom-Json
                    if ($reqObj.text) { $ttsText = $reqObj.text.Trim() }
                    if ($reqObj.voice_id) { $ttsVoiceId = $reqObj.voice_id }
                    if ($reqObj.model) { $ttsModel = $reqObj.model }
                } catch {}

                if ([string]::IsNullOrWhiteSpace($ttsText)) {
                    $errObj = @{ error = "EMPTY_TEXT"; message = "음성 합성할 텍스트가 비어 있습니다." }
                    $errBytes = [System.Text.Encoding]::UTF8.GetBytes(($errObj | ConvertTo-Json))
                    $response.ContentType = "application/json; charset=utf-8"
                    $response.StatusCode = 400
                    $response.ContentLength64 = $errBytes.Length
                    $response.OutputStream.Write($errBytes, 0, $errBytes.Length)
                    $response.Close()
                    continue
                }

                # Check local audio cache first
                $cacheKey = "$ttsVoiceId|$ttsModel|$ttsText"
                $hasher = [System.Security.Cryptography.MD5]::Create()
                $hashBytes = $hasher.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($cacheKey))
                $hashStr = [System.BitConverter]::ToString($hashBytes).Replace("-", "").ToLower()
                $cachedFile = Join-Path $audioCacheDir "$hashStr.wav"

                if ([System.IO.File]::Exists($cachedFile)) {
                    $cachedBytes = [System.IO.File]::ReadAllBytes($cachedFile)
                    $response.ContentType = "audio/wav"
                    $response.StatusCode = 200
                    $response.ContentLength64 = $cachedBytes.Length
                    $response.OutputStream.Write($cachedBytes, 0, $cachedBytes.Length)
                    $response.Close()
                    continue
                }

                # Call Typecast API
                try {
                    $tcPayload = @{
                        voice_id = $ttsVoiceId
                        text = $ttsText
                        model = $ttsModel
                    } | ConvertTo-Json

                    $httpContent = New-Object System.Net.Http.StringContent($tcPayload, [System.Text.Encoding]::UTF8, "application/json")
                    $tcResp = $httpClient.PostAsync("https://api.typecast.ai/v1/text-to-speech", $httpContent).Result
                    $tcStatus = [int]$tcResp.StatusCode

                    if ($tcStatus -eq 200) {
                        $audioBytes = $tcResp.Content.ReadAsByteArrayAsync().Result
                        try {
                            [System.IO.File]::WriteAllBytes($cachedFile, $audioBytes)
                        } catch {}

                        $response.ContentType = "audio/wav"
                        $response.StatusCode = 200
                        $response.ContentLength64 = $audioBytes.Length
                        $response.OutputStream.Write($audioBytes, 0, $audioBytes.Length)
                        $response.Close()
                        continue
                    } else {
                        $tcErrStr = $tcResp.Content.ReadAsStringAsync().Result
                        Write-Host "[Typecast API 응답 $tcStatus] $tcErrStr" -ForegroundColor Yellow
                        $errObj = @{ error = "TYPECAST_API_ERROR"; status = $tcStatus; detail = $tcErrStr }
                        $errBytes = [System.Text.Encoding]::UTF8.GetBytes(($errObj | ConvertTo-Json))
                        $response.ContentType = "application/json; charset=utf-8"
                        $response.StatusCode = 502
                        $response.ContentLength64 = $errBytes.Length
                        $response.OutputStream.Write($errBytes, 0, $errBytes.Length)
                        $response.Close()
                        continue
                    }
                } catch {
                    $exMsg = $_.Exception.Message
                    Write-Host "[Typecast 요청 예외] $exMsg" -ForegroundColor Red
                    $errObj = @{ error = "TYPECAST_REQUEST_EXCEPTION"; message = $exMsg }
                    $errBytes = [System.Text.Encoding]::UTF8.GetBytes(($errObj | ConvertTo-Json))
                    $response.ContentType = "application/json; charset=utf-8"
                    $response.StatusCode = 500
                    $response.ContentLength64 = $errBytes.Length
                    $response.OutputStream.Write($errBytes, 0, $errBytes.Length)
                    $response.Close()
                    continue
                }
            }
        }

        # -------------------------------------------------------------
        # 2. Static File Serving
        # -------------------------------------------------------------
        $relPath = $localPath.TrimStart("/").Replace("/", [System.IO.Path]::DirectorySeparatorChar)
        $filePath = [System.IO.Path]::Combine($root, $relPath)

        if ([System.IO.File]::Exists($filePath)) {
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            $contentType = if ($mimeTypes.ContainsKey($ext)) { $mimeTypes[$ext] } else { "application/octet-stream" }
            $response.ContentType = $contentType
            $response.AddHeader("Access-Control-Allow-Origin", "*")
            $response.AddHeader("Cache-Control", "no-cache, no-store, must-revalidate")
            $response.AddHeader("Pragma", "no-cache")
            $response.AddHeader("Expires", "0")
            $response.StatusCode = 200

            try {
                $bytes = [System.IO.File]::ReadAllBytes($filePath)
                $response.ContentLength64 = $bytes.Length
                if ($request.HttpMethod -ne "HEAD") {
                    $response.OutputStream.Write($bytes, 0, $bytes.Length)
                }
            } catch {}
        } else {
            $response.StatusCode = 404
            $notFoundBytes = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found: $localPath")
            $response.ContentLength64 = $notFoundBytes.Length
            try {
                $response.OutputStream.Write($notFoundBytes, 0, $notFoundBytes.Length)
            } catch {}
        }
        try {
            $response.Close()
        } catch {}
    }
} finally {
    if ($listener) {
        $listener.Stop()
        $listener.Close()
    }
    if ($httpClient) {
        $httpClient.Dispose()
    }
}

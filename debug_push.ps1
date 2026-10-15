$env:PATH = "C:\Program Files\Git\cmd;C:\Program Files\Git\mingw64\bin;$env:PATH"
$processInfo = New-Object System.Diagnostics.ProcessStartInfo
$processInfo.FileName = "C:\Program Files\Git\cmd\git.exe"
$processInfo.Arguments = "push -u origin main --force"
$processInfo.RedirectStandardOutput = $true
$processInfo.RedirectStandardError = $true
$processInfo.UseShellExecute = $false
$processInfo.CreateNoWindow = $true

$process = New-Object System.Diagnostics.Process
$process.StartInfo = $processInfo
$process.Start() | Out-Null
$stdout = $process.StandardOutput.ReadToEnd()
$stderr = $process.StandardError.ReadToEnd()
$process.WaitForExit()

Write-Host "ExitCode: $($process.ExitCode)"
Write-Host "STDOUT: $stdout"
Write-Host "STDERR: $stderr"

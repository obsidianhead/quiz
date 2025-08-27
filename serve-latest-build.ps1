# serve-latest-build.ps1
# This script serves the latest build version using Python's HTTP server with full debugging

Write-Host "[DEBUG] Current directory: $(Get-Location)"

$versionFile = "version.txt"
if (!(Test-Path $versionFile)) {
    Write-Host "[ERROR] version.txt not found!"
    exit 1
}

$buildVersion = Get-Content $versionFile | Select-Object -First 1
Write-Host "[DEBUG] buildVersion: $buildVersion"

$buildDir = Join-Path $PWD "build\build_v$buildVersion"
Write-Host "[DEBUG] buildDir resolved to: $buildDir"

$pythonExe = Join-Path $PWD ".venv\Scripts\python.exe"
Write-Host "[DEBUG] pythonExe resolved to: $pythonExe"

$serveDir = Join-Path $PWD 'build\local'
Write-Host "[DEBUG] serveDir resolved to: $serveDir"

if (!(Test-Path $serveDir)) {
    Write-Host "[ERROR] Serve directory $serveDir does not exist!"
    Write-Host "[DEBUG] Listing contents of build directory:"
    Get-ChildItem -Path (Join-Path $PWD "build")
    exit 1
}

Write-Host "[DEBUG] Listing contents of serveDir:"
Get-ChildItem -Path $serveDir

if (!(Test-Path $pythonExe)) {
    Write-Host "[ERROR] Python executable not found at $pythonExe"
    exit 1
}

Write-Host "[DEBUG] Starting server with command:"
Write-Host "& $pythonExe -m http.server 8080 --directory $serveDir"

& $pythonExe -m http.server 8080 --directory $serveDir

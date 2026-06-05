param(
    [string]$AuthKey = $env:GIGACHAT_AUTH_KEY
)

$ErrorActionPreference = "Stop"
if ([string]::IsNullOrWhiteSpace($AuthKey)) {
    throw "Set GIGACHAT_AUTH_KEY or pass -AuthKey."
}

$env:GIGACHAT_AUTH_KEY = $AuthKey
Write-Host "Testing base GigaChat connectivity..." -ForegroundColor Cyan
& "$PSScriptRoot/test-gigachat.ps1" -AuthKey $AuthKey

Write-Host ""
Write-Host "For the complete three-step career flow, run test-backend-ai.ps1 against the API." -ForegroundColor Yellow

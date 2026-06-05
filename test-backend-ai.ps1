param(
    [string]$ApiBase = $(if ($env:API_BASE_URL) { $env:API_BASE_URL } else { "http://127.0.0.1:5234/api" }),
    [string]$JwtKey = $env:JWT_KEY,
    [int]$CandidateUserId = $(if ($env:CANDIDATE_USER_ID) { [int]$env:CANDIDATE_USER_ID } else { 0 })
)

$ErrorActionPreference = "Stop"
if ([string]::IsNullOrWhiteSpace($JwtKey)) {
    throw "Set JWT_KEY or pass -JwtKey."
}
if ($CandidateUserId -le 0) {
    throw "Set CANDIDATE_USER_ID or pass -CandidateUserId."
}

function ConvertTo-Base64Url([string]$Value) {
    return [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($Value)).
        TrimEnd("=").
        Replace("+", "-").
        Replace("/", "_")
}

function New-TestJwt([string]$Key, [int]$UserId) {
    $header = ConvertTo-Base64Url (@{ alg = "HS256"; typ = "JWT" } | ConvertTo-Json -Compress)
    $now = [int][DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
    $payload = ConvertTo-Base64Url (@{
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier" = "$UserId"
        "http://schemas.microsoft.com/ws/2008/06/identity/claims/role" = "candidate"
        iat = $now
        exp = $now + 3600
    } | ConvertTo-Json -Compress)
    $unsigned = "$header.$payload"
    $hmac = [Security.Cryptography.HMACSHA256]::new([Text.Encoding]::UTF8.GetBytes($Key))
    $signature = [Convert]::ToBase64String(
        $hmac.ComputeHash([Text.Encoding]::UTF8.GetBytes($unsigned))
    ).TrimEnd("=").Replace("+", "-").Replace("/", "_")
    return "$unsigned.$signature"
}

$headers = @{
    Authorization = "Bearer $(New-TestJwt $JwtKey $CandidateUserId)"
    Accept = "application/json"
}

$job = Invoke-RestMethod `
    -Uri "$ApiBase/candidate/me/ai-career-recommendations/jobs" `
    -Method Post `
    -Headers $headers `
    -Body (@{ reason = "manual" } | ConvertTo-Json) `
    -ContentType "application/json"

Write-Host "Queued job $($job.jobId)" -ForegroundColor Cyan
do {
    Start-Sleep -Seconds 2
    $job = Invoke-RestMethod `
        -Uri "$ApiBase/candidate/me/ai-career-recommendations/jobs/$($job.jobId)" `
        -Headers $headers
    Write-Host "status=$($job.status) steps=$($job.steps.status -join ',')" -ForegroundColor Yellow
} while ($job.status -in @("queued", "running"))

$overview = Invoke-RestMethod `
    -Uri "$ApiBase/candidate/me/ai-career-recommendations" `
    -Headers $headers

[pscustomobject]@{
    Status = $overview.status
    Source = $overview.source
    Summary = $overview.summary
    Items = @($overview.items).Count
    PartialFailures = @($overview.partialFailures).Count
} | Format-List

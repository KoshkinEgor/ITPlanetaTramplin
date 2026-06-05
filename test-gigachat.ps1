param(
    [string]$AuthKey = $env:GIGACHAT_AUTH_KEY,
    [string]$OAuthUrl = $(if ($env:GIGACHAT_OAUTH_URL) { $env:GIGACHAT_OAUTH_URL } else { "https://ngw.devices.sberbank.ru:9443/api/v2/oauth" }),
    [string]$ChatUrl = $(if ($env:GIGACHAT_CHAT_URL) { $env:GIGACHAT_CHAT_URL } else { "https://gigachat.devices.sberbank.ru/api/v1/chat/completions" })
)

$ErrorActionPreference = "Stop"
if ([string]::IsNullOrWhiteSpace($AuthKey)) {
    throw "Set GIGACHAT_AUTH_KEY or pass -AuthKey."
}

$oauthHeaders = @{
    Authorization = "Basic $AuthKey"
    RqUID = [Guid]::NewGuid().ToString()
    Accept = "application/json"
}
$oauth = Invoke-RestMethod `
    -Uri $OAuthUrl `
    -Method Post `
    -Headers $oauthHeaders `
    -Body "scope=GIGACHAT_API_PERS" `
    -ContentType "application/x-www-form-urlencoded"

$chatHeaders = @{
    Authorization = "Bearer $($oauth.access_token)"
    Accept = "application/json"
}
$body = @{
    model = "GigaChat"
    temperature = 0.2
    messages = @(
        @{ role = "system"; content = "Return valid JSON only." },
        @{ role = "user"; content = 'Return {"status":"ok"}.' }
    )
} | ConvertTo-Json -Depth 5

$response = Invoke-RestMethod `
    -Uri $ChatUrl `
    -Method Post `
    -Headers $chatHeaders `
    -Body $body `
    -ContentType "application/json"

[pscustomobject]@{
    OAuth = "ok"
    Model = $response.model
    Content = $response.choices[0].message.content
} | Format-List

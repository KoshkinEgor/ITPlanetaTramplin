using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using ITPlanetaTramplin.Api.Integrations;
using Microsoft.Extensions.Options;

namespace ITPlanetaTramplin.Api.Services;

public interface IGigaChatClient
{
    Task<GigaChatCompletionResult> CompleteJsonAsync(string systemPrompt, string userPrompt, CancellationToken cancellationToken = default);
}

public sealed record GigaChatCompletionResult(
    bool IsSuccess,
    string? Content,
    string? ErrorCode,
    int? HttpStatus,
    bool IsRetryable,
    int ResponseLength)
{
    public static GigaChatCompletionResult Success(string? content, int httpStatus = 200) =>
        new(true, content, null, httpStatus, false, content?.Length ?? 0);

    public static GigaChatCompletionResult Failure(
        string errorCode,
        bool isRetryable,
        int? httpStatus = null,
        int responseLength = 0) =>
        new(false, null, errorCode, httpStatus, isRetryable, responseLength);
}

public sealed class GigaChatClient : IGigaChatClient
{
    private readonly HttpClient _httpClient;
    private readonly IOptionsMonitor<GigaChatOptions> _options;
    private readonly ILogger<GigaChatClient> _logger;
    private string? _accessToken;
    private DateTimeOffset _tokenExpiresAt;
    private readonly System.Threading.SemaphoreSlim _tokenSemaphore = new(1, 1);

    public GigaChatClient(HttpClient httpClient, IOptionsMonitor<GigaChatOptions> options, ILogger<GigaChatClient> logger)
    {
        _httpClient = httpClient;
        _options = options;
        _logger = logger;
    }

    public async Task<GigaChatCompletionResult> CompleteJsonAsync(string systemPrompt, string userPrompt, CancellationToken cancellationToken = default)
    {
        var options = _options.CurrentValue;
        if (!options.Enabled || string.IsNullOrWhiteSpace(options.AuthKey))
        {
            return GigaChatCompletionResult.Failure("configuration", false);
        }

        try
        {
            using var timeout = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            timeout.CancelAfter(TimeSpan.FromSeconds(Math.Max(5, options.TimeoutSeconds)));

            var tokenResult = await GetAccessTokenAsync(options, timeout.Token);
            if (string.IsNullOrWhiteSpace(tokenResult.Token))
            {
                return GigaChatCompletionResult.Failure(
                    tokenResult.ErrorCode ?? "oauth",
                    tokenResult.IsRetryable,
                    tokenResult.HttpStatus);
            }

            using var request = new HttpRequestMessage(HttpMethod.Post, options.ChatCompletionsUrl);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", tokenResult.Token);
            request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
            request.Content = new StringContent(JsonSerializer.Serialize(new
            {
                model = options.Model,
                temperature = 0.2,
                max_tokens = 8192,
                messages = new[]
                {
                    new { role = "system", content = systemPrompt },
                    new { role = "user", content = userPrompt },
                },
            }), Encoding.UTF8, "application/json");

            using var response = await _httpClient.SendAsync(request, timeout.Token);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning(
                    "GigaChat chat completion failed with status {StatusCode}.",
                    (int)response.StatusCode);
                var statusCode = (int)response.StatusCode;
                return GigaChatCompletionResult.Failure(
                    $"provider_http_{statusCode}",
                    statusCode == 408 || statusCode == 429 || statusCode >= 500,
                    statusCode);
            }

            using var stream = await response.Content.ReadAsStreamAsync(timeout.Token);
            using var document = await JsonDocument.ParseAsync(stream, cancellationToken: timeout.Token);
            var content = document.RootElement
                .GetProperty("choices")[0]
                .GetProperty("message")
                .GetProperty("content")
                .GetString();
            return GigaChatCompletionResult.Success(content);
        }
        catch (TaskCanceledException ex)
        {
            _logger.LogWarning(ex, "GigaChat request timed out.");
            return GigaChatCompletionResult.Failure("timeout", true);
        }
        catch (HttpRequestException ex)
        {
            _logger.LogWarning(ex, "GigaChat network request failed.");
            return GigaChatCompletionResult.Failure("network", true, (int?)ex.StatusCode);
        }
        catch (JsonException ex)
        {
            _logger.LogWarning(ex, "GigaChat response envelope is invalid JSON.");
            return GigaChatCompletionResult.Failure("invalid_envelope", true);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "GigaChat response envelope has an unexpected shape.");
            return GigaChatCompletionResult.Failure("invalid_envelope", true);
        }
    }

    private async Task<TokenResult> GetAccessTokenAsync(GigaChatOptions options, CancellationToken cancellationToken)
    {
        if (!string.IsNullOrWhiteSpace(_accessToken) && _tokenExpiresAt > DateTimeOffset.UtcNow.AddMinutes(1))
        {
            return new(_accessToken, null, null, false);
        }

        await _tokenSemaphore.WaitAsync(cancellationToken);
        try
        {
            if (!string.IsNullOrWhiteSpace(_accessToken) && _tokenExpiresAt > DateTimeOffset.UtcNow.AddMinutes(1))
            {
                return new(_accessToken, null, null, false);
            }

            using var request = new HttpRequestMessage(HttpMethod.Post, options.OAuthUrl);
            request.Headers.Authorization = new AuthenticationHeaderValue("Basic", options.AuthKey);
            request.Headers.Add("RqUID", Guid.NewGuid().ToString());
            request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
            request.Content = new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["scope"] = options.Scope,
            });

            using var response = await _httpClient.SendAsync(request, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning(
                    "GigaChat OAuth failed with status {StatusCode}.",
                    (int)response.StatusCode);
                var statusCode = (int)response.StatusCode;
                return new(
                    null,
                    $"oauth_http_{statusCode}",
                    statusCode,
                    statusCode == 408 || statusCode == 429 || statusCode >= 500);
            }

            using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
            using var document = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);

            _accessToken = document.RootElement.GetProperty("access_token").GetString();
            var expiresAt = document.RootElement.TryGetProperty("expires_at", out var expiresAtElement)
                ? expiresAtElement.GetInt64()
                : DateTimeOffset.UtcNow.AddMinutes(25).ToUnixTimeMilliseconds();
            _tokenExpiresAt = expiresAt > 9_999_999_999
                ? DateTimeOffset.FromUnixTimeMilliseconds(expiresAt)
                : DateTimeOffset.FromUnixTimeSeconds(expiresAt);

            return new(_accessToken, null, null, false);
        }
        finally
        {
            _tokenSemaphore.Release();
        }
    }

    private sealed record TokenResult(
        string? Token,
        string? ErrorCode,
        int? HttpStatus,
        bool IsRetryable);

}

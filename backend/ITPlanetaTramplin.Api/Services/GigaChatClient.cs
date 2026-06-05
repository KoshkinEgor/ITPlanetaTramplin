using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using ITPlanetaTramplin.Api.Integrations;
using Microsoft.Extensions.Options;

namespace ITPlanetaTramplin.Api.Services;

public interface IGigaChatClient
{
    Task<string?> CompleteJsonAsync(string systemPrompt, string userPrompt, CancellationToken cancellationToken = default);
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

    public async Task<string?> CompleteJsonAsync(string systemPrompt, string userPrompt, CancellationToken cancellationToken = default)
    {
        var options = _options.CurrentValue;
        if (!options.Enabled || string.IsNullOrWhiteSpace(options.AuthKey))
        {
            return null;
        }

        try
        {
            using var timeout = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            timeout.CancelAfter(TimeSpan.FromSeconds(Math.Max(5, options.TimeoutSeconds)));

            var token = await GetAccessTokenAsync(options, timeout.Token);
            if (string.IsNullOrWhiteSpace(token))
            {
                return null;
            }

            using var request = new HttpRequestMessage(HttpMethod.Post, options.ChatCompletionsUrl);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
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
                var errorBody = await response.Content.ReadAsStringAsync(timeout.Token);
                _logger.LogWarning(
                    "GigaChat chat completion failed with status {StatusCode}. Body: {Body}",
                    (int)response.StatusCode,
                    Truncate(errorBody, 500));
                return null;
            }

            using var stream = await response.Content.ReadAsStreamAsync(timeout.Token);
            using var document = await JsonDocument.ParseAsync(stream, cancellationToken: timeout.Token);
            return document.RootElement
                .GetProperty("choices")[0]
                .GetProperty("message")
                .GetProperty("content")
                .GetString();
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or JsonException or InvalidOperationException)
        {
            _logger.LogWarning(ex, "GigaChat request failed.");
            return null;
        }
    }

    private async Task<string?> GetAccessTokenAsync(GigaChatOptions options, CancellationToken cancellationToken)
    {
        if (!string.IsNullOrWhiteSpace(_accessToken) && _tokenExpiresAt > DateTimeOffset.UtcNow.AddMinutes(1))
        {
            return _accessToken;
        }

        await _tokenSemaphore.WaitAsync(cancellationToken);
        try
        {
            if (!string.IsNullOrWhiteSpace(_accessToken) && _tokenExpiresAt > DateTimeOffset.UtcNow.AddMinutes(1))
            {
                return _accessToken;
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
                var errorBody = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogWarning(
                    "GigaChat OAuth failed with status {StatusCode}. Body: {Body}",
                    (int)response.StatusCode,
                    Truncate(errorBody, 500));
                return null;
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

            return _accessToken;
        }
        finally
        {
            _tokenSemaphore.Release();
        }
    }

    private static string Truncate(string? value, int maxLength)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return "";
        }

        return value.Length <= maxLength ? value : value[..maxLength];
    }
}

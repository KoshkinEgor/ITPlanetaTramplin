using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using DTO;
using Microsoft.Extensions.Options;

namespace ITPlanetaTramplin.Api.Integrations;

internal sealed class DadataService
{
    private readonly HttpClient _httpClient;
    private readonly DadataOptions _options;

    public DadataService(HttpClient httpClient, IOptions<DadataOptions> options)
    {
        _httpClient = httpClient;
        _options = options.Value;

        if (_httpClient.BaseAddress is null)
        {
            _httpClient.BaseAddress = new Uri(_options.BaseUrl.TrimEnd('/'));
        }

        if (_httpClient.DefaultRequestHeaders.Authorization is null && !string.IsNullOrWhiteSpace(_options.ApiKey))
        {
            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Token", _options.ApiKey);
        }
    }

    public bool IsConfigured => _options.IsConfigured;

    public async Task<EmployerInnLookupDTO?> FindPartyByInnAsync(string inn, CancellationToken cancellationToken)
    {
        if (!_options.IsConfigured)
        {
            throw new InvalidOperationException("Интеграция DaData не настроена.");
        }

        using var response = await _httpClient.PostAsJsonAsync(
            "/suggestions/api/4_1/rs/findById/party",
            new
            {
                query = inn,
                branch_type = "MAIN",
            },
            cancellationToken);

        response.EnsureSuccessStatusCode();

        await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        using var document = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);

        if (!document.RootElement.TryGetProperty("suggestions", out var suggestions) || suggestions.GetArrayLength() == 0)
        {
            return null;
        }

        var suggestion = suggestions[0];
        var data = suggestion.GetProperty("data");
        var status = ReadNestedString(data, "state", "status");

        return new EmployerInnLookupDTO
        {
            Inn = ReadString(data, "inn") ?? inn,
            CompanyName = ReadString(suggestion, "value")
                ?? ReadNestedString(data, "name", "short_with_opf")
                ?? ReadNestedString(data, "name", "full_with_opf")
                ?? inn,
            LegalName = ReadNestedString(data, "name", "full_with_opf"),
            LegalAddress = ReadNestedString(data, "address", "value"),
            Kpp = ReadString(data, "kpp"),
            Ogrn = ReadString(data, "ogrn"),
            Status = status,
            IsActive = string.Equals(status, "ACTIVE", StringComparison.OrdinalIgnoreCase),
        };
    }

    private static string? ReadString(JsonElement element, string propertyName)
    {
        if (!element.TryGetProperty(propertyName, out var property) || property.ValueKind == JsonValueKind.Null)
        {
            return null;
        }

        return property.ValueKind == JsonValueKind.String ? property.GetString() : property.ToString();
    }

    private static string? ReadNestedString(JsonElement element, params string[] path)
    {
        var current = element;

        foreach (var segment in path)
        {
            if (!current.TryGetProperty(segment, out current) || current.ValueKind == JsonValueKind.Null)
            {
                return null;
            }
        }

        return current.ValueKind == JsonValueKind.String ? current.GetString() : current.ToString();
    }
}

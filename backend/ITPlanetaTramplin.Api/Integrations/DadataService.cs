using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Globalization;
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
            Emails = ReadStringArray(data, "emails"),
        };
    }

    public async Task<List<AddressSuggestionDTO>> SuggestAddressesAsync(
        string query,
        string? city,
        decimal? latitude,
        decimal? longitude,
        int count,
        CancellationToken cancellationToken)
    {
        if (!_options.IsConfigured)
        {
            throw new InvalidOperationException("Интеграция DaData не настроена.");
        }

        var trimmedQuery = query?.Trim();
        if (string.IsNullOrWhiteSpace(trimmedQuery))
        {
            return [];
        }

        var payload = new Dictionary<string, object?>
        {
            ["query"] = trimmedQuery,
            ["count"] = Math.Clamp(count, 1, 12),
        };

        if (!string.IsNullOrWhiteSpace(city))
        {
            payload["locations"] = new[]
            {
                new
                {
                    city = city.Trim(),
                },
            };
        }

        if (latitude.HasValue && longitude.HasValue)
        {
            payload["locations_geo"] = new[]
            {
                new
                {
                    lat = latitude.Value,
                    lon = longitude.Value,
                    radius_meters = 80_000,
                },
            };
        }

        return await SendAddressLookupRequestAsync(
            "/suggestions/api/4_1/rs/suggest/address",
            payload,
            cancellationToken);
    }

    public async Task<List<AddressSuggestionDTO>> GeolocateAddressesAsync(
        decimal latitude,
        decimal longitude,
        int count,
        int radiusMeters,
        CancellationToken cancellationToken)
    {
        if (!_options.IsConfigured)
        {
            throw new InvalidOperationException("Интеграция DaData не настроена.");
        }

        return await SendAddressLookupRequestAsync(
            "/suggestions/api/4_1/rs/geolocate/address",
            new
            {
                lat = latitude,
                lon = longitude,
                count = Math.Clamp(count, 1, 12),
                radius_meters = Math.Clamp(radiusMeters, 50, 10_000),
            },
            cancellationToken);
    }

    private async Task<List<AddressSuggestionDTO>> SendAddressLookupRequestAsync(
        string path,
        object payload,
        CancellationToken cancellationToken)
    {
        using var response = await _httpClient.PostAsJsonAsync(path, payload, cancellationToken);
        response.EnsureSuccessStatusCode();

        await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        using var document = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);

        if (!document.RootElement.TryGetProperty("suggestions", out var suggestions) || suggestions.ValueKind != JsonValueKind.Array)
        {
            return [];
        }

        var items = new List<AddressSuggestionDTO>();
        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var suggestion in suggestions.EnumerateArray())
        {
            var mappedSuggestion = MapAddressSuggestion(suggestion);
            if (mappedSuggestion is null)
            {
                continue;
            }

            var dedupeKey = string.IsNullOrWhiteSpace(mappedSuggestion.UnrestrictedValue)
                ? mappedSuggestion.Value
                : mappedSuggestion.UnrestrictedValue;

            if (seen.Add(dedupeKey))
            {
                items.Add(mappedSuggestion);
            }
        }

        return items;
    }

    private static string? ReadString(JsonElement element, string propertyName)
    {
        if (element.ValueKind != JsonValueKind.Object)
        {
            return null;
        }

        if (!element.TryGetProperty(propertyName, out var property) || property.ValueKind == JsonValueKind.Null)
        {
            return null;
        }

        return property.ValueKind == JsonValueKind.String ? property.GetString() : property.ToString();
    }

    private static string? ReadNestedString(JsonElement element, params string[] path)
    {
        if (element.ValueKind != JsonValueKind.Object)
        {
            return null;
        }

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

    private static List<string> ReadStringArray(JsonElement element, string propertyName)
    {
        var values = new List<string>();

        if (!element.TryGetProperty(propertyName, out var property) || property.ValueKind != JsonValueKind.Array)
        {
            return values;
        }

        foreach (var item in property.EnumerateArray())
        {
            if (item.ValueKind == JsonValueKind.String)
            {
                var value = item.GetString();
                if (!string.IsNullOrWhiteSpace(value))
                {
                    values.Add(value.Trim());
                }

                continue;
            }

            var unrestrictedValue = ReadString(item, "unrestricted_value") ?? ReadString(item, "value");
            if (!string.IsNullOrWhiteSpace(unrestrictedValue))
            {
                values.Add(unrestrictedValue.Trim());
            }
        }

        return values
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    private static AddressSuggestionDTO? MapAddressSuggestion(JsonElement suggestion)
    {
        var data = suggestion.TryGetProperty("data", out var nestedData) && nestedData.ValueKind == JsonValueKind.Object
            ? nestedData
            : default;

        var value = ReadString(suggestion, "value")
            ?? ReadString(suggestion, "unrestricted_value")
            ?? ReadString(data, "result");

        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        var unrestrictedValue = ReadString(suggestion, "unrestricted_value") ?? value;
        var city = FirstNonEmpty(
            ReadString(data, "city_with_type"),
            ReadString(data, "settlement_with_type"),
            ReadString(data, "city"),
            ReadString(data, "settlement"));
        var street = FirstNonEmpty(ReadString(data, "street"), ReadString(data, "street_with_type"));
        var streetWithType = FirstNonEmpty(ReadString(data, "street_with_type"), street);
        var house = ReadString(data, "house");
        var region = FirstNonEmpty(ReadString(data, "region_with_type"), ReadString(data, "region"));
        var label = BuildAddressLabel(streetWithType, house, city, value);
        var details = BuildAddressDetails(city, region, label, value);

        return new AddressSuggestionDTO
        {
            Value = value,
            UnrestrictedValue = unrestrictedValue,
            Label = label,
            Details = details,
            City = city,
            Street = street,
            House = house,
            Kind = ResolveAddressKind(data),
            Latitude = ParseNullableDecimal(ReadString(data, "geo_lat")),
            Longitude = ParseNullableDecimal(ReadString(data, "geo_lon")),
            StreetFiasId = ReadString(data, "street_fias_id"),
            FiasId = ReadString(data, "fias_id"),
        };
    }

    private static string BuildAddressLabel(string? street, string? house, string? city, string fallbackValue)
    {
        if (!string.IsNullOrWhiteSpace(street) && !string.IsNullOrWhiteSpace(house))
        {
            return $"{street}, д. {house}";
        }

        if (!string.IsNullOrWhiteSpace(street))
        {
            return street;
        }

        if (!string.IsNullOrWhiteSpace(city))
        {
            return city;
        }

        return fallbackValue;
    }

    private static string? BuildAddressDetails(string? city, string? region, string label, string fallbackValue)
    {
        var details = string.Join(", ", new[] { city, region }
            .Where(item => !string.IsNullOrWhiteSpace(item))
            .Distinct(StringComparer.OrdinalIgnoreCase));

        if (!string.IsNullOrWhiteSpace(details))
        {
            return details;
        }

        return string.Equals(label, fallbackValue, StringComparison.OrdinalIgnoreCase) ? null : fallbackValue;
    }

    private static string ResolveAddressKind(JsonElement data)
    {
        if (!string.IsNullOrWhiteSpace(ReadString(data, "flat")))
        {
            return "flat";
        }

        if (!string.IsNullOrWhiteSpace(ReadString(data, "house")))
        {
            return "house";
        }

        if (!string.IsNullOrWhiteSpace(ReadString(data, "street")))
        {
            return "street";
        }

        if (!string.IsNullOrWhiteSpace(ReadString(data, "city")) || !string.IsNullOrWhiteSpace(ReadString(data, "settlement")))
        {
            return "city";
        }

        return "address";
    }

    private static decimal? ParseNullableDecimal(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        return decimal.TryParse(value, NumberStyles.Any, CultureInfo.InvariantCulture, out var parsed)
            ? parsed
            : null;
    }

    private static string? FirstNonEmpty(params string?[] values) =>
        values.FirstOrDefault(item => !string.IsNullOrWhiteSpace(item))?.Trim();
}

using System.Globalization;
using System.Text.Json;
using DTO;
using Microsoft.Extensions.Options;

namespace ITPlanetaTramplin.Api.Integrations;

internal sealed class YandexGeocoderService
{
    private readonly HttpClient _httpClient;
    private readonly YandexGeocoderOptions _options;

    public YandexGeocoderService(HttpClient httpClient, IOptions<YandexGeocoderOptions> options)
    {
        _httpClient = httpClient;
        _options = options.Value;

        if (_httpClient.BaseAddress is null)
        {
            _httpClient.BaseAddress = new Uri(_options.BaseUrl.TrimEnd('/'));
        }
    }

    public bool IsConfigured => _options.IsConfigured;

    public async Task<List<AddressSuggestionDTO>> SuggestAddressesAsync(
        string query,
        string? city,
        decimal? latitude,
        decimal? longitude,
        int count,
        CancellationToken cancellationToken)
    {
        if (!IsConfigured)
        {
            throw new InvalidOperationException("Интеграция Яндекс Геокодера не настроена.");
        }

        var trimmedQuery = query?.Trim();
        if (string.IsNullOrWhiteSpace(trimmedQuery))
        {
            return [];
        }

        var parameters = new Dictionary<string, string?>
        {
            ["apikey"] = _options.ApiKey,
            ["geocode"] = BuildSearchQuery(trimmedQuery, city),
            ["lang"] = "ru_RU",
            ["format"] = "json",
            ["results"] = Math.Clamp(count, 1, 20).ToString(CultureInfo.InvariantCulture),
        };

        if (latitude.HasValue && longitude.HasValue)
        {
            parameters["ll"] = $"{longitude.Value.ToString(CultureInfo.InvariantCulture)},{latitude.Value.ToString(CultureInfo.InvariantCulture)}";
            parameters["spn"] = "0.45,0.45";
        }

        return await SendRequestAsync(parameters, cancellationToken);
    }

    public async Task<List<AddressSuggestionDTO>> GeolocateAddressesAsync(
        decimal latitude,
        decimal longitude,
        int count,
        CancellationToken cancellationToken)
    {
        if (!IsConfigured)
        {
            throw new InvalidOperationException("Интеграция Яндекс Геокодера не настроена.");
        }

        return await SendRequestAsync(
            new Dictionary<string, string?>
            {
                ["apikey"] = _options.ApiKey,
                ["geocode"] = $"{longitude.ToString(CultureInfo.InvariantCulture)},{latitude.ToString(CultureInfo.InvariantCulture)}",
                ["sco"] = "longlat",
                ["kind"] = "house",
                ["lang"] = "ru_RU",
                ["format"] = "json",
                ["results"] = Math.Clamp(count, 1, 20).ToString(CultureInfo.InvariantCulture),
            },
            cancellationToken);
    }

    private async Task<List<AddressSuggestionDTO>> SendRequestAsync(
        IReadOnlyDictionary<string, string?> parameters,
        CancellationToken cancellationToken)
    {
        using var queryContent = new FormUrlEncodedContent(parameters
            .Where(item => !string.IsNullOrWhiteSpace(item.Value))
            .Select(item => new KeyValuePair<string, string>(item.Key, item.Value!)));

        var queryString = await queryContent.ReadAsStringAsync(cancellationToken);
        using var response = await _httpClient.GetAsync($"/v1/?{queryString}", cancellationToken);
        response.EnsureSuccessStatusCode();

        await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        using var document = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);

        if (!TryGetFeatureMembers(document.RootElement, out var featureMembers))
        {
            return [];
        }

        var items = new List<AddressSuggestionDTO>();
        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var featureMember in featureMembers.EnumerateArray())
        {
            if (!featureMember.TryGetProperty("GeoObject", out var geoObject) || geoObject.ValueKind != JsonValueKind.Object)
            {
                continue;
            }

            var suggestion = MapAddressSuggestion(geoObject);
            if (suggestion is null)
            {
                continue;
            }

            var dedupeKey = string.IsNullOrWhiteSpace(suggestion.UnrestrictedValue)
                ? suggestion.Value
                : suggestion.UnrestrictedValue;

            if (seen.Add(dedupeKey))
            {
                items.Add(suggestion);
            }
        }

        return items;
    }

    private static bool TryGetFeatureMembers(JsonElement root, out JsonElement featureMembers)
    {
        featureMembers = default;

        return TryGetNestedProperty(
                root,
                out featureMembers,
                "response",
                "GeoObjectCollection",
                "featureMember")
            && featureMembers.ValueKind == JsonValueKind.Array;
    }

    private static AddressSuggestionDTO? MapAddressSuggestion(JsonElement geoObject)
    {
        var geoMetadata = TryGetNestedProperty(
            geoObject,
            out var metadata,
            "metaDataProperty",
            "GeocoderMetaData")
            ? metadata
            : default;

        var address = TryGetNestedProperty(geoMetadata, out var addressNode, "Address")
            ? addressNode
            : default;

        var formattedValue = ReadString(address, "formatted")
            ?? ReadString(geoMetadata, "text")
            ?? BuildFallbackValue(ReadString(geoObject, "description"), ReadString(geoObject, "name"));

        if (string.IsNullOrWhiteSpace(formattedValue))
        {
            return null;
        }

        var description = ReadString(geoObject, "description");
        var name = ReadString(geoObject, "name");
        var city = FirstNonEmpty(
            ReadAddressComponent(address, "locality"),
            ReadAddressComponent(address, "province"),
            ReadAddressComponent(address, "area"),
            description);
        var street = ReadAddressComponent(address, "street");
        var house = ReadAddressComponent(address, "house");
        var kind = ResolveKind(ReadString(geoMetadata, "kind"), street, house, city);
        var label = BuildAddressLabel(name, street, house, city, formattedValue);
        var details = BuildAddressDetails(city, description, label, formattedValue);
        var (longitude, latitude) = ReadCoordinates(geoObject);

        return new AddressSuggestionDTO
        {
            Value = formattedValue,
            UnrestrictedValue = formattedValue,
            Label = label,
            Details = details,
            City = city,
            Street = street,
            House = house,
            Kind = kind,
            Latitude = latitude,
            Longitude = longitude,
        };
    }

    private static string BuildSearchQuery(string query, string? city)
    {
        var trimmedQuery = query.Trim();
        var trimmedCity = city?.Trim();

        if (string.IsNullOrWhiteSpace(trimmedCity) ||
            trimmedQuery.Contains(trimmedCity, StringComparison.OrdinalIgnoreCase))
        {
            return trimmedQuery;
        }

        return $"{trimmedCity}, {trimmedQuery}";
    }

    private static string BuildAddressLabel(string? name, string? street, string? house, string? city, string fallbackValue)
    {
        if (!string.IsNullOrWhiteSpace(street) && !string.IsNullOrWhiteSpace(house))
        {
            return $"{street}, д. {house}";
        }

        if (!string.IsNullOrWhiteSpace(street))
        {
            return street;
        }

        if (!string.IsNullOrWhiteSpace(name))
        {
            return name;
        }

        if (!string.IsNullOrWhiteSpace(city))
        {
            return city;
        }

        return fallbackValue;
    }

    private static string? BuildAddressDetails(string? city, string? description, string label, string fallbackValue)
    {
        if (!string.IsNullOrWhiteSpace(description) &&
            !string.Equals(description, label, StringComparison.OrdinalIgnoreCase))
        {
            return description;
        }

        if (!string.IsNullOrWhiteSpace(city) &&
            !string.Equals(city, label, StringComparison.OrdinalIgnoreCase))
        {
            return city;
        }

        return string.Equals(label, fallbackValue, StringComparison.OrdinalIgnoreCase)
            ? null
            : fallbackValue;
    }

    private static string ResolveKind(string? metadataKind, string? street, string? house, string? city)
    {
        if (!string.IsNullOrWhiteSpace(house) ||
            string.Equals(metadataKind, "house", StringComparison.OrdinalIgnoreCase))
        {
            return "house";
        }

        if (!string.IsNullOrWhiteSpace(street) ||
            string.Equals(metadataKind, "street", StringComparison.OrdinalIgnoreCase))
        {
            return "street";
        }

        if (!string.IsNullOrWhiteSpace(city) ||
            string.Equals(metadataKind, "locality", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(metadataKind, "province", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(metadataKind, "district", StringComparison.OrdinalIgnoreCase))
        {
            return "city";
        }

        return "address";
    }

    private static (decimal? Longitude, decimal? Latitude) ReadCoordinates(JsonElement geoObject)
    {
        var position = ReadNestedString(geoObject, "Point", "pos");
        if (string.IsNullOrWhiteSpace(position))
        {
            return (null, null);
        }

        var parts = position.Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        if (parts.Length != 2)
        {
            return (null, null);
        }

        return (ParseNullableDecimal(parts[0]), ParseNullableDecimal(parts[1]));
    }

    private static string? ReadAddressComponent(JsonElement address, params string[] kinds)
    {
        if (address.ValueKind != JsonValueKind.Object ||
            !address.TryGetProperty("Components", out var components) ||
            components.ValueKind != JsonValueKind.Array)
        {
            return null;
        }

        foreach (var component in components.EnumerateArray())
        {
            var kind = ReadString(component, "kind");
            if (string.IsNullOrWhiteSpace(kind))
            {
                continue;
            }

            if (kinds.Any(item => string.Equals(item, kind, StringComparison.OrdinalIgnoreCase)))
            {
                return ReadString(component, "name");
            }
        }

        return null;
    }

    private static string? BuildFallbackValue(string? description, string? name)
    {
        if (string.IsNullOrWhiteSpace(description))
        {
            return string.IsNullOrWhiteSpace(name) ? null : name.Trim();
        }

        if (string.IsNullOrWhiteSpace(name))
        {
            return description.Trim();
        }

        return $"{description.Trim()}, {name.Trim()}";
    }

    private static string? ReadString(JsonElement element, string propertyName)
    {
        if (element.ValueKind != JsonValueKind.Object ||
            !element.TryGetProperty(propertyName, out var property) ||
            property.ValueKind == JsonValueKind.Null)
        {
            return null;
        }

        return property.ValueKind == JsonValueKind.String
            ? property.GetString()
            : property.ToString();
    }

    private static string? ReadNestedString(JsonElement element, params string[] path) =>
        TryGetNestedProperty(element, out var property, path)
            ? property.ValueKind == JsonValueKind.String
                ? property.GetString()
                : property.ToString()
            : null;

    private static bool TryGetNestedProperty(JsonElement element, out JsonElement property, params string[] path)
    {
        property = element;

        foreach (var segment in path)
        {
            if (property.ValueKind != JsonValueKind.Object ||
                !property.TryGetProperty(segment, out property) ||
                property.ValueKind == JsonValueKind.Null)
            {
                property = default;
                return false;
            }
        }

        return true;
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

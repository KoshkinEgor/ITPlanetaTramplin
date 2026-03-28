using DTO;
using ITPlanetaTramplin.Api.Integrations;

namespace ITPlanetaTramplin.Api.Endpoints;

internal static class CommonEndpointRouteBuilderExtensions
{
    public static RouteGroupBuilder MapCommonEndpoints(this RouteGroupBuilder api)
    {
        api.MapGet("/location/address-suggestions", HandleAddressSuggestionsAsync);
        api.MapGet("/location/reverse-geocode", HandleReverseGeocodeAsync);

        return api;
    }

    private static async Task<IResult> HandleAddressSuggestionsAsync(
        string query,
        string? city,
        decimal? latitude,
        decimal? longitude,
        int? count,
        YandexGeocoderService geocoderService,
        CancellationToken cancellationToken,
        ILoggerFactory loggerFactory)
    {
        if (string.IsNullOrWhiteSpace(query))
        {
            return Results.Ok(new AddressLookupResponseDTO());
        }

        var effectiveCount = Math.Clamp(count ?? 8, 1, 10);

        try
        {
            var suggestions = await geocoderService.SuggestAddressesAsync(
                query,
                city,
                latitude,
                longitude,
                effectiveCount,
                cancellationToken);

            var nearbyStreetMatches = await TryLoadNearbyStreetMatchesAsync(
                query,
                suggestions,
                geocoderService,
                Math.Min(5, effectiveCount),
                cancellationToken);

            return Results.Ok(new AddressLookupResponseDTO
            {
                Suggestions = suggestions,
                NearbyStreetMatches = nearbyStreetMatches,
            });
        }
        catch (InvalidOperationException ex)
        {
            return Results.Json(new MessageResponseDTO { Message = ex.Message }, statusCode: StatusCodes.Status503ServiceUnavailable);
        }
        catch (HttpRequestException ex)
        {
            loggerFactory.CreateLogger("CommonEndpoints").LogWarning(ex, "Yandex geocoder suggestions lookup failed.");
            return Results.Json(
                new MessageResponseDTO { Message = "Сервис адресных подсказок временно недоступен." },
                statusCode: StatusCodes.Status503ServiceUnavailable);
        }
    }

    private static async Task<IResult> HandleReverseGeocodeAsync(
        decimal latitude,
        decimal longitude,
        int? count,
        YandexGeocoderService geocoderService,
        CancellationToken cancellationToken,
        ILoggerFactory loggerFactory)
    {
        if (latitude is < -90 or > 90 || longitude is < -180 or > 180)
        {
            return Results.Json(
                new MessageResponseDTO { Message = "Координаты точки заданы некорректно." },
                statusCode: StatusCodes.Status400BadRequest);
        }

        try
        {
            var suggestions = await geocoderService.GeolocateAddressesAsync(
                latitude,
                longitude,
                Math.Clamp(count ?? 6, 1, 10),
                cancellationToken);

            return Results.Ok(new AddressLookupResponseDTO
            {
                Suggestions = suggestions,
            });
        }
        catch (InvalidOperationException ex)
        {
            return Results.Json(new MessageResponseDTO { Message = ex.Message }, statusCode: StatusCodes.Status503ServiceUnavailable);
        }
        catch (HttpRequestException ex)
        {
            loggerFactory.CreateLogger("CommonEndpoints").LogWarning(ex, "Yandex geocoder reverse lookup failed.");
            return Results.Json(
                new MessageResponseDTO { Message = "Сервис адресных подсказок временно недоступен." },
                statusCode: StatusCodes.Status503ServiceUnavailable);
        }
    }

    private static async Task<List<AddressSuggestionDTO>> TryLoadNearbyStreetMatchesAsync(
        string query,
        IReadOnlyList<AddressSuggestionDTO> suggestions,
        YandexGeocoderService geocoderService,
        int count,
        CancellationToken cancellationToken)
    {
        if (count <= 0 || query.Any(char.IsDigit))
        {
            return [];
        }

        var streetSuggestion = suggestions.FirstOrDefault(item =>
            item.Kind == "street" &&
            item.Latitude.HasValue &&
            item.Longitude.HasValue);

        if (streetSuggestion is null || !streetSuggestion.Latitude.HasValue || !streetSuggestion.Longitude.HasValue)
        {
            return [];
        }

        var nearbyAddresses = await geocoderService.GeolocateAddressesAsync(
            streetSuggestion.Latitude.Value,
            streetSuggestion.Longitude.Value,
            Math.Max(count * 2, count),
            cancellationToken);

        return nearbyAddresses
            .Where(item => item.Kind == "house")
            .Where(item => IsSameStreet(item, streetSuggestion))
            .Where(item => !string.Equals(item.UnrestrictedValue, streetSuggestion.UnrestrictedValue, StringComparison.OrdinalIgnoreCase))
            .GroupBy(item => item.UnrestrictedValue, StringComparer.OrdinalIgnoreCase)
            .Select(group => group.First())
            .Take(count)
            .ToList();
    }

    private static bool IsSameStreet(AddressSuggestionDTO candidate, AddressSuggestionDTO streetSuggestion)
    {
        if (!string.IsNullOrWhiteSpace(candidate.StreetFiasId) &&
            !string.IsNullOrWhiteSpace(streetSuggestion.StreetFiasId))
        {
            return string.Equals(candidate.StreetFiasId, streetSuggestion.StreetFiasId, StringComparison.OrdinalIgnoreCase);
        }

        return string.Equals(candidate.Street, streetSuggestion.Street, StringComparison.OrdinalIgnoreCase)
            && string.Equals(candidate.City, streetSuggestion.City, StringComparison.OrdinalIgnoreCase);
    }
}

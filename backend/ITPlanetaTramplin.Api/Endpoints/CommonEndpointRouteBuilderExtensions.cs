using Application.DBContext;
using DTO;
using ITPlanetaTramplin.Api.Auth;
using ITPlanetaTramplin.Api.Domain;
using ITPlanetaTramplin.Api.Infrastructure;
using ITPlanetaTramplin.Api.Integrations;
using Microsoft.EntityFrameworkCore;
using Models;

namespace ITPlanetaTramplin.Api.Endpoints;

internal static class CommonEndpointRouteBuilderExtensions
{
    public static RouteGroupBuilder MapCommonEndpoints(this RouteGroupBuilder api)
    {
        api.MapGet("/professions", HandleProfessionSearchAsync);
        api.MapGet("/education/institutions", HandleInstitutionSearchAsync);
        api.MapGet("/tags", GetPublicTagsAsync);
        api.MapGet("/system/references", GetPublicSystemReferencesAsync);
        api.MapPost("/uploads/images", UploadImageAsync).RequireAuthorization().DisableAntiforgery();
        api.MapGet("/location/address-suggestions", HandleAddressSuggestionsAsync);
        api.MapGet("/location/reverse-geocode", HandleReverseGeocodeAsync);

        return api;
    }

    private static IResult HandleProfessionSearchAsync(string? query, int? count)
    {
        var items = CandidateProfessionCatalog.Search(query, count ?? 12);
        return Results.Ok(new { Items = items });
    }

    private static IResult HandleInstitutionSearchAsync(string? query, int? limit)
    {
        var items = CandidateInstitutionCatalog.Search(query, limit ?? 12);
        return Results.Ok(new { Items = items });
    }

    private static async Task<IResult> GetPublicSystemReferencesAsync(ApplicationDBContext db)
    {
        var items = await SystemReferenceSupport.GetReferenceItemsAsync(db, activeOnly: true);
        return Results.Ok(SystemReferenceSupport.BuildReferencesResponse(items));
    }

    private static async Task<IResult> GetPublicTagsAsync(ApplicationDBContext db, string? query, int? limit)
    {
        var normalizedQuery = string.IsNullOrWhiteSpace(query) ? string.Empty : query.Trim().ToLowerInvariant();
        var effectiveLimit = Math.Clamp(limit ?? 40, 1, 100);

        var tags = await db.Tags
            .AsNoTracking()
            .Where(item => item.IsActive == true && item.MergedIntoTagId == null)
            .Where(item => normalizedQuery == string.Empty || item.Name.ToLower().Contains(normalizedQuery))
            .OrderBy(item => item.Name)
            .Take(effectiveLimit)
            .Select(item => new
            {
                item.Id,
                item.Name,
                Value = item.Name,
                Label = item.Name,
            })
            .ToListAsync();

        return Results.Ok(new { Items = tags });
    }

    private static async Task<IResult> UploadImageAsync(
        HttpContext context,
        IFormFile file,
        UserMediaStorage storage,
        CancellationToken cancellationToken)
    {
        var userId = AuthEndpointSupport.GetCurrentUserId(context);
        if (!userId.HasValue)
        {
            return Results.Unauthorized();
        }

        var validationError = storage.ValidateImage(file);
        if (validationError is not null)
        {
            return Results.Json(new MessageResponseDTO { Message = validationError }, statusCode: StatusCodes.Status400BadRequest);
        }

        var storedFile = await storage.SaveImageAsync(userId.Value, file, cancellationToken);
        // Keep media URLs on the application's public origin. The API can sit behind
        // an HTTPS reverse proxy while its internal request scheme remains HTTP.
        var url = $"{context.Request.PathBase}/uploads/{storedFile.StorageKey}";

        return Results.Ok(new
        {
            Url = url,
            storedFile.StorageKey,
            storedFile.OriginalName,
            storedFile.ContentType,
            storedFile.SizeBytes,
        });
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

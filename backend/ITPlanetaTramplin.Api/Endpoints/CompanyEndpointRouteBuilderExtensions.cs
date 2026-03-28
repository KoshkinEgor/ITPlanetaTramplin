using Application.DBContext;
using DTO;
using ITPlanetaTramplin.Api.Auth;
using ITPlanetaTramplin.Api.Domain;
using ITPlanetaTramplin.Api.Infrastructure;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Models;
using System.Text.Json;

namespace ITPlanetaTramplin.Api.Endpoints;

internal static class CompanyEndpointRouteBuilderExtensions
{
    public static RouteGroupBuilder MapCompanyEndpoints(this RouteGroupBuilder api)
    {
        api.MapGet("/company/me", GetCompanyMeAsync).RequireAuthorization("requireCompanyRole");
        api.MapPut("/company/me", UpdateCompanyMeAsync).RequireAuthorization("requireCompanyRole");
        api.MapPost("/company/me/verification-request", SubmitCompanyVerificationRequestAsync)
            .DisableAntiforgery()
            .RequireAuthorization("requireCompanyRole");
        api.MapGet("/company/me/verification-document", GetCompanyVerificationDocumentAsync).RequireAuthorization("requireCompanyRole");
        api.MapGet("/company/me/opportunities", GetCurrentCompanyOpportunitiesAsync).RequireAuthorization("requireCompanyRole");

        api.MapGet("/companies/{companyId:int}", GetPublicCompanyByIdAsync);
        api.MapGet("/companies/{companyId:int}/opportunities", GetPublicCompanyOpportunitiesByIdAsync);
        api.MapGet("/employer/{employerId:int}/opportunities", GetCompanyOpportunitiesByEmployerIdAsync);

        return api;
    }

    private static async Task<IResult> GetCompanyMeAsync(HttpContext context, ApplicationDBContext db)
    {
        var profile = await GetCurrentCompanyProfileAsync(context, db);
        if (profile is null)
        {
            return Results.Unauthorized();
        }

        return Results.Ok(MapCompanyProfile(profile));
    }

    private static async Task<IResult> UpdateCompanyMeAsync(
        [FromBody] CompanyProfileUpdateDTO request,
        HttpContext context,
        ApplicationDBContext db)
    {
        var profile = await GetCurrentCompanyProfileAsync(context, db);
        if (profile is null)
        {
            return Results.Unauthorized();
        }

        var identityChanged = ApplyCompanyProfileUpdate(profile, request);
        if (identityChanged && CompanyVerificationStatuses.Normalize(profile.VerificationStatus) == CompanyVerificationStatuses.Approved)
        {
            profile.VerificationStatus = CompanyVerificationStatuses.Revision;
        }

        await db.SaveChangesAsync();
        return Results.Ok(MapCompanyProfile(profile));
    }

    private static async Task<IResult> SubmitCompanyVerificationRequestAsync(
        [FromForm] CompanyVerificationRequestDTO request,
        HttpContext context,
        ApplicationDBContext db,
        CompanyVerificationStorage storage,
        CancellationToken cancellationToken)
    {
        var profile = await GetCurrentCompanyProfileAsync(context, db);
        if (profile is null)
        {
            return Results.Unauthorized();
        }

        var normalizedStatus = CompanyVerificationStatuses.Normalize(profile.VerificationStatus);
        var existingVerificationData = TryParseCompanyVerificationData(profile.VerificationData);
        var hasStructuredDocument = !string.IsNullOrWhiteSpace(existingVerificationData?.Document?.StorageKey);

        if (normalizedStatus == CompanyVerificationStatuses.Approved)
        {
            return AuthEndpointSupport.MessageResult("Компания уже подтверждена. Повторная заявка сейчас не требуется.", StatusCodes.Status409Conflict);
        }

        if (normalizedStatus == CompanyVerificationStatuses.Pending && hasStructuredDocument)
        {
            return AuthEndpointSupport.MessageResult("Заявка уже отправлена и ожидает решения модератора.", StatusCodes.Status409Conflict);
        }

        var baseProfileError = ValidateVerificationProfile(profile);
        if (baseProfileError is not null)
        {
            return AuthEndpointSupport.MessageResult(baseProfileError, StatusCodes.Status400BadRequest);
        }

        var contactError = ValidateVerificationRequest(request, storage);
        if (contactError is not null)
        {
            return AuthEndpointSupport.MessageResult(contactError, StatusCodes.Status400BadRequest);
        }

        CompanyVerificationStoredFile storedDocument;
        try
        {
            storedDocument = await storage.SaveAsync(profile.Id, request.Document!, existingVerificationData?.Document?.StorageKey, cancellationToken);
        }
        catch (InvalidOperationException ex)
        {
            return AuthEndpointSupport.MessageResult(ex.Message, StatusCodes.Status400BadRequest);
        }

        profile.VerificationData = JsonSerializer.Serialize(new CompanyVerificationDataDTO
        {
            Snapshot = new CompanyVerificationSnapshotDTO
            {
                CompanyName = profile.CompanyName,
                Inn = profile.Inn,
                LegalAddress = profile.LegalAddress,
            },
            Contact = new CompanyVerificationContactDTO
            {
                Name = request.ContactName!.Trim(),
                Role = request.ContactRole!.Trim(),
                Phone = request.ContactPhone!.Trim(),
                Email = request.ContactEmail!.Trim(),
            },
            Document = new CompanyVerificationDocumentDTO
            {
                OriginalName = storedDocument.OriginalName,
                ContentType = storedDocument.ContentType,
                SizeBytes = storedDocument.SizeBytes,
                StorageKey = storedDocument.StorageKey,
            },
            SubmittedAt = DateTime.UtcNow,
        });
        profile.VerificationMethod = "manual_document";
        profile.VerificationStatus = CompanyVerificationStatuses.Pending;

        await db.SaveChangesAsync(cancellationToken);
        return Results.Ok(MapCompanyProfile(profile));
    }

    private static async Task<IResult> GetCompanyVerificationDocumentAsync(
        HttpContext context,
        ApplicationDBContext db,
        CompanyVerificationStorage storage)
    {
        var profile = await GetCurrentCompanyProfileAsync(context, db);
        if (profile is null)
        {
            return Results.Unauthorized();
        }

        return GetVerificationDocumentResult(profile, storage);
    }

    private static async Task<IResult> GetCurrentCompanyOpportunitiesAsync(HttpContext context, ApplicationDBContext db)
    {
        var profile = await GetCurrentCompanyProfileAsync(context, db);
        if (profile is null)
        {
            return Results.Unauthorized();
        }

        return Results.Ok(await GetCompanyOpportunitiesAsync(db, profile.Id, includeAllStatuses: true));
    }

    private static async Task<IResult> GetPublicCompanyByIdAsync(int companyId, ApplicationDBContext db)
    {
        var profile = await db.EmployerProfiles
            .Include(item => item.User)
            .FirstOrDefaultAsync(item => item.Id == companyId);

        if (profile is null || CompanyVerificationStatuses.Normalize(profile.VerificationStatus) != CompanyVerificationStatuses.Approved)
        {
            return Results.NotFound();
        }

        return Results.Ok(MapCompanyProfile(profile));
    }

    private static async Task<IResult> GetPublicCompanyOpportunitiesByIdAsync(int companyId, ApplicationDBContext db)
    {
        var profile = await db.EmployerProfiles
            .FirstOrDefaultAsync(item => item.Id == companyId);

        if (profile is null || CompanyVerificationStatuses.Normalize(profile.VerificationStatus) != CompanyVerificationStatuses.Approved)
        {
            return Results.NotFound();
        }

        return Results.Ok(await GetCompanyOpportunitiesAsync(db, companyId, includeAllStatuses: false));
    }

    private static async Task<IResult> GetCompanyOpportunitiesByEmployerIdAsync(int employerId, ApplicationDBContext db) =>
        Results.Ok(await GetCompanyOpportunitiesAsync(db, employerId, includeAllStatuses: false));

    private static async Task<EmployerProfile?> GetCurrentCompanyProfileAsync(HttpContext context, ApplicationDBContext db)
    {
        var userId = AuthEndpointSupport.GetCurrentUserId(context);
        if (userId is null)
        {
            return null;
        }

        return await db.EmployerProfiles
            .Include(item => item.User)
            .Include(item => item.Opportunities)
            .FirstOrDefaultAsync(item => item.UserId == userId.Value);
    }

    internal static bool ApplyCompanyProfileUpdate(EmployerProfile profile, CompanyProfileUpdateDTO request)
    {
        var companyNameBefore = NormalizeComparableText(profile.CompanyName);
        var legalAddressBefore = NormalizeComparableText(profile.LegalAddress);

        if (!string.IsNullOrWhiteSpace(request.CompanyName))
        {
            profile.CompanyName = request.CompanyName.Trim();
        }

        if (request.LegalAddress is not null)
        {
            profile.LegalAddress = string.IsNullOrWhiteSpace(request.LegalAddress) ? null : request.LegalAddress.Trim();
        }

        if (request.Description is not null)
        {
            profile.Description = request.Description;
        }

        if (request.ProfileImage is not null)
        {
            profile.ProfileImage = request.ProfileImage;
        }

        if (request.Socials is not null)
        {
            profile.Socials = request.Socials;
        }

        if (request.MediaContent is not null)
        {
            profile.MediaContent = request.MediaContent;
        }

        if (request.HeroMediaJson is not null)
        {
            profile.HeroMediaJson = request.HeroMediaJson;
        }

        if (request.CaseStudiesJson is not null)
        {
            profile.CaseStudiesJson = request.CaseStudiesJson;
        }

        if (request.GalleryJson is not null)
        {
            profile.GalleryJson = request.GalleryJson;
        }

        if (request.VerificationData is not null)
        {
            profile.VerificationData = request.VerificationData;
        }

        if (request.VerificationMethod is not null)
        {
            profile.VerificationMethod = request.VerificationMethod;
        }

        return companyNameBefore != NormalizeComparableText(profile.CompanyName)
            || legalAddressBefore != NormalizeComparableText(profile.LegalAddress);
    }

    internal static CompanyProfileReadDTO MapCompanyProfile(EmployerProfile profile) =>
        new()
        {
            UserId = profile.UserId,
            ProfileId = profile.Id,
            Email = profile.User.Email,
            CompanyName = profile.CompanyName,
            Inn = profile.Inn,
            LegalAddress = profile.LegalAddress,
            Description = profile.Description,
            ProfileImage = profile.ProfileImage,
            Socials = profile.Socials,
            MediaContent = profile.MediaContent,
            HeroMediaJson = profile.HeroMediaJson,
            CaseStudiesJson = profile.CaseStudiesJson,
            GalleryJson = profile.GalleryJson,
            VerificationData = profile.VerificationData,
            VerificationMethod = profile.VerificationMethod,
            VerificationStatus = CompanyVerificationStatuses.Normalize(profile.VerificationStatus),
            VerificationReason = profile.VerificationReason,
        };

    internal static CompanyVerificationDataDTO? TryParseCompanyVerificationData(string? rawValue)
    {
        if (string.IsNullOrWhiteSpace(rawValue))
        {
            return null;
        }

        try
        {
            return JsonSerializer.Deserialize<CompanyVerificationDataDTO>(rawValue);
        }
        catch (JsonException)
        {
            return null;
        }
    }

    internal static IResult GetVerificationDocumentResult(EmployerProfile profile, CompanyVerificationStorage storage)
    {
        var verificationData = TryParseCompanyVerificationData(profile.VerificationData);
        var document = verificationData?.Document;

        if (document is null ||
            string.IsNullOrWhiteSpace(document.StorageKey) ||
            !storage.TryGetFilePath(document.StorageKey, out var fullPath) ||
            string.IsNullOrWhiteSpace(fullPath))
        {
            return Results.NotFound();
        }

        return Results.File(
            fullPath,
            string.IsNullOrWhiteSpace(document.ContentType) ? "application/octet-stream" : document.ContentType,
            string.IsNullOrWhiteSpace(document.OriginalName) ? Path.GetFileName(fullPath) : document.OriginalName);
    }

    private static async Task<List<object>> GetCompanyOpportunitiesAsync(ApplicationDBContext db, int employerId, bool includeAllStatuses) =>
        await db.Opportunities
            .Include(item => item.Employer)
            .Include(item => item.Applications)
            .Include(item => item.Tags)
            .Where(item => item.EmployerId == employerId)
            .Where(item => item.DeletedAt == null)
            .Where(item => includeAllStatuses || item.ModerationStatus == OpportunityModerationStatuses.Approved)
            .Select(item => (object)new
            {
                item.Id,
                item.EmployerId,
                item.Title,
                item.Description,
                item.Longitude,
                item.Latitude,
                item.LocationAddress,
                item.LocationCity,
                item.SalaryFrom,
                item.SalaryTo,
                item.IsPaid,
                item.StipendFrom,
                item.StipendTo,
                item.Duration,
                item.EventStartAt,
                item.RegistrationDeadline,
                item.MeetingFrequency,
                item.SeatsCount,
                item.ExpireAt,
                item.ContactsJson,
                item.MediaContentJson,
                item.EmploymentType,
                CompanyName = item.Employer.CompanyName,
                Tags = item.Tags.Select(tag => tag.Name).ToList(),
                item.OpportunityType,
                item.DeletedAt,
                item.ModerationStatus,
                item.ModerationReason,
                ApplicationsCount = item.Applications.Count,
            })
            .ToListAsync();

    private static string? ValidateVerificationProfile(EmployerProfile profile)
    {
        if (string.IsNullOrWhiteSpace(profile.CompanyName) ||
            string.IsNullOrWhiteSpace(profile.Inn) ||
            string.IsNullOrWhiteSpace(profile.LegalAddress))
        {
            return "Для отправки заявки заполните название компании, ИНН и юридический адрес в профиле.";
        }

        return null;
    }

    private static string? ValidateVerificationRequest(CompanyVerificationRequestDTO request, CompanyVerificationStorage storage)
    {
        if (string.IsNullOrWhiteSpace(request.ContactName) ||
            string.IsNullOrWhiteSpace(request.ContactRole) ||
            string.IsNullOrWhiteSpace(request.ContactPhone) ||
            string.IsNullOrWhiteSpace(request.ContactEmail))
        {
            return "Заполните контактное лицо, должность, телефон и email.";
        }

        if (!request.ContactEmail.Contains('@', StringComparison.Ordinal))
        {
            return "Укажите корректный email для связи.";
        }

        return storage.Validate(request.Document);
    }

    private static string NormalizeComparableText(string? value) =>
        string.IsNullOrWhiteSpace(value) ? string.Empty : value.Trim();
}

using Application.DBContext;
using DTO;
using ITPlanetaTramplin.Api.Auth;
using ITPlanetaTramplin.Api.Domain;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Models;
using System.Text.Json;

namespace ITPlanetaTramplin.Api.Endpoints;

internal static class OpportunityEndpointRouteBuilderExtensions
{
    private const string SaveModeDraft = "draft";
    private const string SaveModeSubmit = "submit";
    private const string SaveModeArchive = "archive";

    public static RouteGroupBuilder MapOpportunityEndpoints(this RouteGroupBuilder api)
    {
        api.MapPost("/opportunities", CreateOpportunityAsync).RequireAuthorization("requireCompanyRole");
        api.MapDelete("/opportunities/{id:int}", DeleteOpportunityAsync).RequireAuthorization("requireCompanyRole");
        api.MapPost("/opportunities/{id:int}/archive", ArchiveOpportunityAsync).RequireAuthorization("requireCompanyRole");
        api.MapPut("/opportunities/{id:int}", UpdateOpportunityByRouteAsync).RequireAuthorization("requireCompanyRole");
        api.MapPut("/opportunities", UpdateOpportunityAsync).RequireAuthorization("requireCompanyRole");
        api.MapGet("/opportunities", GetOpportunitiesAsync);
        api.MapGet("/opportunities/{id:int}", GetOpportunityByIdAsync);
        api.MapPost("/opportunities/{id:int}/applications", CreateOpportunityApplicationByRouteAsync).RequireAuthorization("requireCandidateRole");
        api.MapPost("/opportunities/applications", CreateOpportunityApplicationAsync).RequireAuthorization("requireCandidateRole");
        api.MapGet("/opportunities/{opportunityId:int}/applications", GetOpportunityApplicationsAsync).RequireAuthorization("requireCompanyRole");
        api.MapPut("/opportunities/{opportunityId:int}/applications/{applicationId:int}", UpdateOpportunityApplicationStatusAsync).RequireAuthorization("requireCompanyRole");

        return api;
    }

    private static async Task<IResult> CreateOpportunityAsync(
        [FromBody] OpportunityPostDTO request,
        HttpContext context,
        ApplicationDBContext db)
    {
        var userId = AuthEndpointSupport.GetCurrentUserId(context);
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var employer = await db.EmployerProfiles.FirstOrDefaultAsync(item => item.UserId == userId.Value);
        if (employer is null)
        {
            return Results.NotFound("Профиль работодателя не найден.");
        }

        if (CompanyVerificationStatuses.Normalize(employer.VerificationStatus) != CompanyVerificationStatuses.Approved)
        {
            return AuthEndpointSupport.MessageResult(
                "Компания должна пройти верификацию, прежде чем создавать новые возможности.",
                StatusCodes.Status403Forbidden);
        }

        var normalizedOpportunityType = NormalizeOpportunityType(request.OpportunityType);
        if (!string.IsNullOrWhiteSpace(request.OpportunityType) && normalizedOpportunityType is null)
        {
            return AuthEndpointSupport.MessageResult("Opportunity type is invalid.", StatusCodes.Status400BadRequest);
        }

        var saveMode = ResolveSaveMode(request.SaveMode, request);
        var opportunity = BuildOpportunityFromCreateRequest(employer.Id, request, normalizedOpportunityType, saveMode);
        var validationResult = saveMode == SaveModeSubmit
            ? ValidateOpportunityForSubmit(opportunity)
            : null;
        if (validationResult is not null)
        {
            return validationResult;
        }

        opportunity.Tags = await ResolveOpportunityTagsAsync(db, request.Tags);

        db.Opportunities.Add(opportunity);
        await db.SaveChangesAsync();

        return Results.Created($"/api/opportunities/{opportunity.Id}", opportunity.Id);
    }

    private static async Task<IResult> DeleteOpportunityAsync(
        int id,
        [FromBody] OpportunityDeleteDTO? request,
        HttpContext context,
        ApplicationDBContext db)
    {
        var userId = AuthEndpointSupport.GetCurrentUserId(context);
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var employer = await db.EmployerProfiles.FirstOrDefaultAsync(item => item.UserId == userId.Value);
        if (employer is null)
        {
            return Results.NotFound("Профиль работодателя не найден.");
        }

        var opportunityId = request?.Id > 0 ? request.Id : id;
        var opportunity = await db.Opportunities
            .Include(item => item.Applications)
            .Include(item => item.Recommendations)
            .Include(item => item.Tags)
            .FirstOrDefaultAsync(item => item.Id == opportunityId && item.EmployerId == employer.Id);
        if (opportunity is null)
        {
            return Results.NotFound("Возможность не найдена или доступ запрещен.");
        }

        if (opportunity.Applications.Count > 0)
        {
            return Results.Conflict(new MessageResponseDTO
            {
                Message = "Нельзя удалить возможность, пока по ней есть отклики.",
            });
        }

        opportunity.Tags.Clear();
        db.Recommendations.RemoveRange(opportunity.Recommendations);
        db.Opportunities.Remove(opportunity);
        await db.SaveChangesAsync();
        return Results.Ok(new { Id = opportunityId, Deleted = true });
    }

    private static async Task<IResult> ArchiveOpportunityAsync(
        int id,
        HttpContext context,
        ApplicationDBContext db)
    {
        var userId = AuthEndpointSupport.GetCurrentUserId(context);
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var employer = await db.EmployerProfiles.FirstOrDefaultAsync(item => item.UserId == userId.Value);
        if (employer is null)
        {
            return Results.NotFound("Профиль работодателя не найден.");
        }

        var opportunity = await db.Opportunities.FirstOrDefaultAsync(item => item.Id == id && item.EmployerId == employer.Id);
        if (opportunity is null)
        {
            return Results.NotFound("Возможность не найдена или доступ запрещен.");
        }

        if (GetEffectiveModerationStatus(opportunity) != OpportunityModerationStatuses.Approved)
        {
            return Results.Conflict(new MessageResponseDTO
            {
                Message = "Архивировать можно только опубликованную возможность.",
            });
        }

        opportunity.ModerationStatus = OpportunityModerationStatuses.Archived;
        await db.SaveChangesAsync();

        return Results.Ok(new
        {
            opportunity.Id,
            ModerationStatus = opportunity.ModerationStatus,
        });
    }

    private static async Task<IResult> UpdateOpportunityByRouteAsync(
        int id,
        [FromBody] OpportunityUpdateDTO request,
        HttpContext context,
        ApplicationDBContext db)
    {
        request.Id = id;
        return await UpdateOpportunityAsync(request, context, db);
    }

    private static async Task<IResult> UpdateOpportunityAsync(
        [FromBody] OpportunityUpdateDTO request,
        HttpContext context,
        ApplicationDBContext db)
    {
        var userId = AuthEndpointSupport.GetCurrentUserId(context);
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var employer = await db.EmployerProfiles.FirstOrDefaultAsync(item => item.UserId == userId.Value);
        if (employer is null)
        {
            return Results.NotFound("Профиль работодателя не найден.");
        }

        var opportunity = await db.Opportunities
            .Include(item => item.Applications)
            .Include(item => item.Tags)
            .FirstOrDefaultAsync(item => item.Id == request.Id && item.EmployerId == employer.Id);
        if (opportunity is null)
        {
            return Results.NotFound("Возможность не найдена или доступ запрещен.");
        }

        var normalizedOpportunityType = NormalizeOpportunityType(request.OpportunityType);
        if (!string.IsNullOrWhiteSpace(request.OpportunityType) && normalizedOpportunityType is null)
        {
            return AuthEndpointSupport.MessageResult("Opportunity type is invalid.", StatusCodes.Status400BadRequest);
        }

        if (normalizedOpportunityType is not null &&
            normalizedOpportunityType != opportunity.OpportunityType &&
            opportunity.Applications.Count > 0)
        {
            return Results.Conflict(new MessageResponseDTO
            {
                Message = "Нельзя изменить тип возможности, пока по ней есть отклики.",
            });
        }

        var saveMode = ResolveSaveMode(request.SaveMode, opportunity, request);
        ApplyOpportunityUpdate(opportunity, request, allowTypedFields: true, normalizedOpportunityType);

        var validationResult = saveMode == SaveModeSubmit
            ? ValidateOpportunityForSubmit(opportunity)
            : null;
        if (validationResult is not null)
        {
            return validationResult;
        }

        if (saveMode == SaveModeArchive)
        {
            if (GetEffectiveModerationStatus(opportunity) != OpportunityModerationStatuses.Approved)
            {
                return Results.Conflict(new MessageResponseDTO
                {
                    Message = "Архивировать можно только опубликованную возможность.",
                });
            }

            opportunity.ModerationStatus = OpportunityModerationStatuses.Archived;
        }
        else
        {
            opportunity.ModerationStatus = saveMode == SaveModeSubmit
                ? OpportunityModerationStatuses.Pending
                : OpportunityModerationStatuses.Draft;
        }

        opportunity.ModerationReason = null;

        if (request.Tags is not null)
        {
            opportunity.Tags = await ResolveOpportunityTagsAsync(db, request.Tags);
        }

        await db.SaveChangesAsync();
        return Results.Ok();
    }

    private static async Task<IResult> GetOpportunitiesAsync(ApplicationDBContext db)
    {
        var opportunities = await db.Opportunities
            .Include(item => item.Employer)
            .Include(item => item.Tags)
            .Where(item => item.DeletedAt == null)
            .ToListAsync();

        var response = opportunities
            .Where(item => GetEffectiveModerationStatus(item) == OpportunityModerationStatuses.Approved)
            .Select(item => new
            {
                item.Id,
                EmployerId = item.EmployerId,
                item.Title,
                item.Description,
                item.Longitude,
                item.Latitude,
                item.LocationAddress,
                item.LocationCity,
                item.ExpireAt,
                item.PublishAt,
                item.EmploymentType,
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
                CompanyName = item.Employer.CompanyName,
                Tags = item.Tags.Select(tag => tag.Name).ToList(),
                item.OpportunityType,
                ModerationStatus = GetEffectiveModerationStatus(item),
            })
            .ToList();

        return Results.Ok(response);
    }

    private static async Task<IResult> GetOpportunityByIdAsync(int id, HttpContext context, ApplicationDBContext db)
    {
        var opportunity = await db.Opportunities
            .Include(item => item.Employer)
            .Include(item => item.Tags)
            .FirstOrDefaultAsync(item => item.Id == id);

        if (opportunity is null)
        {
            return Results.NotFound();
        }

        var currentUserId = AuthEndpointSupport.GetCurrentUserId(context);
        var currentRole = PublicRoles.Normalize(context.User.FindFirst("http://schemas.microsoft.com/ws/2008/06/identity/claims/role")?.Value);
        var isOwner = currentUserId is not null && currentUserId == opportunity.Employer.UserId;
        var canViewHidden = currentRole == PublicRoles.Moderator || isOwner;
        var normalizedStatus = GetEffectiveModerationStatus(opportunity);

        if (!canViewHidden &&
            (opportunity.DeletedAt != null || normalizedStatus != OpportunityModerationStatuses.Approved))
        {
            return Results.NotFound();
        }

        var hasApplications = await db.Applications.AnyAsync(item => item.OpportunityId == opportunity.Id);
        var viewer = BuildViewerCapabilities(isOwner, normalizedStatus, hasApplications);
        return Results.Ok(BuildOpportunityDetailResponse(opportunity, viewer));
    }

    private static async Task<IResult> CreateOpportunityApplicationByRouteAsync(
        int id,
        HttpContext context,
        ApplicationDBContext db) =>
        await CreateOpportunityApplicationCoreAsync(
            new OpportunityApplicationDTO { opportunityId = id },
            context,
            db);

    private static async Task<IResult> CreateOpportunityApplicationAsync(
        [FromBody] OpportunityApplicationDTO request,
        HttpContext context,
        ApplicationDBContext db) =>
        await CreateOpportunityApplicationCoreAsync(request, context, db);

    private static async Task<IResult> CreateOpportunityApplicationCoreAsync(
        OpportunityApplicationDTO request,
        HttpContext context,
        ApplicationDBContext db)
    {
        var userId = AuthEndpointSupport.GetCurrentUserId(context);
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var applicant = await db.ApplicantProfiles
            .Include(item => item.User)
            .Include(item => item.ApplicantEducations)
            .FirstOrDefaultAsync(item => item.UserId == userId.Value);
        var opportunity = await db.Opportunities.FirstOrDefaultAsync(item =>
            item.Id == request.opportunityId &&
            item.DeletedAt == null);

        if (applicant is null || opportunity is null || GetEffectiveModerationStatus(opportunity) != OpportunityModerationStatuses.Approved)
        {
            return Results.NotFound();
        }

        if (applicant.User.IsVerified != true)
        {
            return AuthEndpointSupport.MessageResult(
                "Подтвердите аккаунт полностью, чтобы отправлять отклики на возможности.",
                StatusCodes.Status403Forbidden);
        }

        if (!CandidateOnboardingSupport.IsMandatoryProfileComplete(applicant))
        {
            return AuthEndpointSupport.MessageResult(
                "Заполните обязательные поля профиля кандидата, чтобы отправлять отклики на возможности.",
                StatusCodes.Status403Forbidden);
        }

        var alreadyExists = await db.Applications.AnyAsync(item => item.ApplicantId == applicant.Id && item.OpportunityId == opportunity.Id);
        if (alreadyExists)
        {
            return Results.Conflict(new MessageResponseDTO { Message = "Отклик уже отправлен." });
        }

        db.Applications.Add(new OpportunityApplication
        {
            OpportunityId = opportunity.Id,
            ApplicantId = applicant.Id,
            Status = OpportunityApplicationStatuses.Submitted,
        });

        await db.SaveChangesAsync();

        var createdApplication = await db.Applications
            .Include(item => item.Opportunity)
            .ThenInclude(item => item.Employer)
            .FirstAsync(item => item.OpportunityId == opportunity.Id && item.ApplicantId == applicant.Id);

        return Results.Ok(OpportunityApplicationMapping.ToCandidateSummary(createdApplication));
    }

    private static async Task<IResult> GetOpportunityApplicationsAsync(int opportunityId, HttpContext context, ApplicationDBContext db)
    {
        var userId = AuthEndpointSupport.GetCurrentUserId(context);
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var employer = await db.EmployerProfiles.FirstOrDefaultAsync(item => item.UserId == userId.Value);
        if (employer is null)
        {
            return Results.NotFound();
        }

        var ownsOpportunity = await db.Opportunities.AnyAsync(item => item.Id == opportunityId && item.EmployerId == employer.Id);
        if (!ownsOpportunity)
        {
            return Results.NotFound();
        }

        var applications = await db.Applications
            .Include(item => item.Applicant)
            .ThenInclude(item => item.User)
            .Where(item => item.OpportunityId == opportunityId)
            .Select(item => new
            {
                item.Id,
                item.OpportunityId,
                item.ApplicantId,
                item.AppliedAt,
                item.Status,
                item.EmployerNote,
                CandidateUserId = item.Applicant.UserId,
                CandidateEmail = item.Applicant.User.Email,
                CandidateName = ((item.Applicant.Name ?? string.Empty) + " " + (item.Applicant.Surname ?? string.Empty) + " " + (item.Applicant.Thirdname ?? string.Empty)).Trim(),
                CandidateDescription = item.Applicant.Description,
                CandidateSkills = item.Applicant.Skills,
            })
            .OrderByDescending(item => item.AppliedAt)
            .ToListAsync();

        return Results.Ok(applications);
    }

    private static async Task<IResult> UpdateOpportunityApplicationStatusAsync(
        int opportunityId,
        int applicationId,
        [FromBody] OpportunityApplicationStatusUpdateDTO request,
        HttpContext context,
        ApplicationDBContext db)
    {
        var userId = AuthEndpointSupport.GetCurrentUserId(context);
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var employer = await db.EmployerProfiles.FirstOrDefaultAsync(item => item.UserId == userId.Value);
        if (employer is null)
        {
            return Results.NotFound();
        }

        var application = await db.Applications
            .Include(item => item.Opportunity)
            .Include(item => item.Applicant)
            .ThenInclude(item => item.User)
            .FirstOrDefaultAsync(item => item.Id == applicationId && item.OpportunityId == opportunityId);

        if (application is null || application.Opportunity.EmployerId != employer.Id)
        {
            return Results.NotFound();
        }

        if (!OpportunityApplicationStatuses.IsKnown(request.Status))
        {
            return AuthEndpointSupport.MessageResult("Укажите корректный статус отклика.", StatusCodes.Status400BadRequest);
        }

        var normalizedStatus = OpportunityApplicationStatuses.Normalize(request.Status);
        application.Status = normalizedStatus;
        application.EmployerNote = string.IsNullOrWhiteSpace(request.EmployerNote) ? null : request.EmployerNote.Trim();

        await db.SaveChangesAsync();

        return Results.Ok(new
        {
            application.Id,
            application.OpportunityId,
            application.ApplicantId,
            application.AppliedAt,
            Status = normalizedStatus,
            application.EmployerNote,
            CandidateUserId = application.Applicant.UserId,
            CandidateEmail = application.Applicant.User.Email,
            CandidateName = ((application.Applicant.Name ?? string.Empty) + " " + (application.Applicant.Surname ?? string.Empty) + " " + (application.Applicant.Thirdname ?? string.Empty)).Trim(),
        });
    }

    internal static async Task<IResult?> ApplyOpportunityUpdateAsync(
        ApplicationDBContext db,
        Opportunity opportunity,
        OpportunityUpdateDTO request,
        bool resetModerationStatus,
        bool allowTypedFields = true)
    {
        var normalizedOpportunityType = NormalizeOpportunityType(request.OpportunityType);
        if (!string.IsNullOrWhiteSpace(request.OpportunityType) && normalizedOpportunityType is null)
        {
            return AuthEndpointSupport.MessageResult("Opportunity type is invalid.", StatusCodes.Status400BadRequest);
        }

        ApplyOpportunityUpdate(opportunity, request, allowTypedFields, normalizedOpportunityType);

        if (request.Tags is not null)
        {
            opportunity.Tags = await ResolveOpportunityTagsAsync(db, request.Tags);
        }

        if (resetModerationStatus)
        {
            opportunity.ModerationStatus = OpportunityModerationStatuses.Pending;
            opportunity.ModerationReason = null;
        }

        return null;
    }

    internal static string? NormalizeOpportunityType(string? value) =>
        OpportunityTypes.Normalize(value);

    internal static string NormalizeEmploymentType(string? value) =>
        string.IsNullOrWhiteSpace(value) ? "unspecified" : value.Trim();

    internal static string? NormalizeOptionalText(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    internal static string NormalizeRequiredText(string? value) =>
        string.IsNullOrWhiteSpace(value) ? string.Empty : value.Trim();

    internal static string? NormalizeContactsJson(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        try
        {
            using var document = JsonDocument.Parse(value);
            var normalizedContacts = new List<object>();

            if (document.RootElement.ValueKind == JsonValueKind.Array)
            {
                foreach (var item in document.RootElement.EnumerateArray())
                {
                    var normalizedContact = NormalizeContactElement(item);
                    if (normalizedContact is not null)
                    {
                        normalizedContacts.Add(normalizedContact);
                    }
                }
            }
            else if (document.RootElement.ValueKind == JsonValueKind.Object)
            {
                foreach (var property in document.RootElement.EnumerateObject())
                {
                    if (property.Value.ValueKind != JsonValueKind.String)
                    {
                        continue;
                    }

                    var normalizedValue = property.Value.GetString()?.Trim();
                    if (string.IsNullOrWhiteSpace(normalizedValue))
                    {
                        continue;
                    }

                    normalizedContacts.Add(new
                    {
                        type = DetectLegacyContactType(property.Name),
                        value = NormalizeLegacyContactValue(property.Name, normalizedValue),
                    });
                }
            }

            return normalizedContacts.Count == 0 ? null : JsonSerializer.Serialize(normalizedContacts);
        }
        catch (JsonException)
        {
            return null;
        }
    }

    internal static string GetEffectiveModerationStatus(Opportunity opportunity)
    {
        var normalizedStatus = OpportunityModerationStatuses.Normalize(opportunity.ModerationStatus);
        if (normalizedStatus != OpportunityModerationStatuses.Approved)
        {
            return normalizedStatus;
        }

        var validationClone = CloneOpportunityForValidation(opportunity);
        return ValidateOpportunityForSubmit(validationClone) is null
            ? normalizedStatus
            : OpportunityModerationStatuses.Draft;
    }

    private static Opportunity BuildOpportunityFromCreateRequest(
        int employerId,
        OpportunityPostDTO request,
        string? normalizedOpportunityType,
        string saveMode)
    {
        var opportunity = new Opportunity
        {
            EmployerId = employerId,
            Title = NormalizeRequiredText(request.Title),
            Description = NormalizeRequiredText(request.Description),
            OpportunityType = normalizedOpportunityType ?? OpportunityTypes.Vacancy,
            EmploymentType = NormalizeEmploymentType(request.EmploymentType),
            LocationAddress = NormalizeOptionalText(request.LocationAddress),
            LocationCity = NormalizeOptionalText(request.LocationCity),
            Latitude = request.Latitude,
            Longitude = request.Longitude,
            PublishAt = DateOnly.FromDateTime(DateTime.UtcNow),
            ExpireAt = request.ExpireAt.HasValue
                ? DateOnly.FromDateTime(DateTimeOffset.FromUnixTimeSeconds(request.ExpireAt.Value).UtcDateTime)
                : null,
            ModerationStatus = saveMode == SaveModeSubmit
                ? OpportunityModerationStatuses.Pending
                : OpportunityModerationStatuses.Draft,
            ModerationReason = null,
            ContactsJson = NormalizeContactsJson(request.ContactsJson),
            MediaContentJson = NormalizeMediaContentJson(request.MediaContentJson),
        };

        ApplyOpportunityTypedFields(opportunity, request);
        return opportunity;
    }

    private static void ApplyOpportunityUpdate(
        Opportunity opportunity,
        OpportunityUpdateDTO request,
        bool allowTypedFields,
        string? normalizedOpportunityType)
    {
        if (request.Title is not null)
        {
            opportunity.Title = NormalizeRequiredText(request.Title);
        }

        if (request.Description is not null)
        {
            opportunity.Description = NormalizeRequiredText(request.Description);
        }

        if (normalizedOpportunityType is not null)
        {
            opportunity.OpportunityType = normalizedOpportunityType;
        }

        if (request.EmploymentType is not null)
        {
            opportunity.EmploymentType = NormalizeEmploymentType(request.EmploymentType);
        }

        opportunity.LocationAddress = NormalizeOptionalText(request.LocationAddress);
        opportunity.LocationCity = NormalizeOptionalText(request.LocationCity);
        opportunity.Latitude = request.Latitude;
        opportunity.Longitude = request.Longitude;
        opportunity.ExpireAt = request.ExpireAt.HasValue
            ? DateOnly.FromDateTime(DateTimeOffset.FromUnixTimeSeconds(request.ExpireAt.Value).UtcDateTime)
            : null;
        opportunity.ContactsJson = NormalizeContactsJson(request.ContactsJson);
        opportunity.MediaContentJson = NormalizeMediaContentJson(request.MediaContentJson);

        if (allowTypedFields)
        {
            ApplyOpportunityTypedFields(opportunity, request);
        }
    }

    private static void ApplyOpportunityTypedFields(Opportunity opportunity, OpportunityPostDTO request)
    {
        opportunity.SalaryFrom = request.SalaryFrom;
        opportunity.SalaryTo = request.SalaryTo;
        opportunity.IsPaid = request.IsPaid;
        opportunity.StipendFrom = request.StipendFrom;
        opportunity.StipendTo = request.StipendTo;
        opportunity.Duration = NormalizeOptionalText(request.Duration);
        opportunity.EventStartAt = request.EventStartAt.HasValue
            ? DateOnly.FromDateTime(DateTimeOffset.FromUnixTimeSeconds(request.EventStartAt.Value).UtcDateTime)
            : null;
        opportunity.RegistrationDeadline = request.RegistrationDeadline.HasValue
            ? DateOnly.FromDateTime(DateTimeOffset.FromUnixTimeSeconds(request.RegistrationDeadline.Value).UtcDateTime)
            : null;
        opportunity.MeetingFrequency = NormalizeOptionalText(request.MeetingFrequency);
        opportunity.SeatsCount = request.SeatsCount;
    }

    private static void ApplyOpportunityTypedFields(Opportunity opportunity, OpportunityUpdateDTO request)
    {
        opportunity.SalaryFrom = request.SalaryFrom;
        opportunity.SalaryTo = request.SalaryTo;
        opportunity.IsPaid = request.IsPaid;
        opportunity.StipendFrom = request.StipendFrom;
        opportunity.StipendTo = request.StipendTo;
        opportunity.Duration = NormalizeOptionalText(request.Duration);
        opportunity.EventStartAt = request.EventStartAt.HasValue
            ? DateOnly.FromDateTime(DateTimeOffset.FromUnixTimeSeconds(request.EventStartAt.Value).UtcDateTime)
            : null;
        opportunity.RegistrationDeadline = request.RegistrationDeadline.HasValue
            ? DateOnly.FromDateTime(DateTimeOffset.FromUnixTimeSeconds(request.RegistrationDeadline.Value).UtcDateTime)
            : null;
        opportunity.MeetingFrequency = NormalizeOptionalText(request.MeetingFrequency);
        opportunity.SeatsCount = request.SeatsCount;
    }

    private static string ResolveSaveMode(string? saveMode, OpportunityPostDTO request)
    {
        var normalizedSaveMode = NormalizeSaveMode(saveMode);
        if (normalizedSaveMode is not null)
        {
            return normalizedSaveMode;
        }

        var normalizedOpportunityType = NormalizeOpportunityType(request.OpportunityType);
        if (!string.IsNullOrWhiteSpace(request.OpportunityType) && normalizedOpportunityType is null)
        {
            return SaveModeDraft;
        }

        var validationOpportunity = BuildOpportunityFromCreateRequest(0, request, normalizedOpportunityType, SaveModeDraft);
        return ValidateOpportunityForSubmit(validationOpportunity) is null ? SaveModeSubmit : SaveModeDraft;
    }

    private static string ResolveSaveMode(string? saveMode, Opportunity currentOpportunity, OpportunityUpdateDTO request)
    {
        var normalizedSaveMode = NormalizeSaveMode(saveMode);
        if (normalizedSaveMode is not null)
        {
            return normalizedSaveMode;
        }

        var validationOpportunity = CloneOpportunityForValidation(currentOpportunity);
        ApplyOpportunityUpdate(validationOpportunity, request, allowTypedFields: true, NormalizeOpportunityType(request.OpportunityType));
        return ValidateOpportunityForSubmit(validationOpportunity) is null ? SaveModeSubmit : SaveModeDraft;
    }

    private static string? NormalizeSaveMode(string? value) =>
        value?.Trim().ToLowerInvariant() switch
        {
            SaveModeDraft => SaveModeDraft,
            SaveModeSubmit => SaveModeSubmit,
            SaveModeArchive => SaveModeArchive,
            _ => null,
        };

    private static IResult? ValidateOpportunityForSubmit(Opportunity opportunity)
    {
        if (string.IsNullOrWhiteSpace(opportunity.Title))
        {
            return AuthEndpointSupport.MessageResult("Укажите название возможности.", StatusCodes.Status400BadRequest);
        }

        if (string.IsNullOrWhiteSpace(opportunity.Description))
        {
            return AuthEndpointSupport.MessageResult("Укажите описание возможности.", StatusCodes.Status400BadRequest);
        }

        if (!OpportunityTypes.IsKnown(opportunity.OpportunityType))
        {
            return AuthEndpointSupport.MessageResult("Opportunity type is invalid.", StatusCodes.Status400BadRequest);
        }

        if (string.IsNullOrWhiteSpace(opportunity.EmploymentType) ||
            string.Equals(opportunity.EmploymentType, "unspecified", StringComparison.OrdinalIgnoreCase))
        {
            return AuthEndpointSupport.MessageResult("Укажите формат занятости.", StatusCodes.Status400BadRequest);
        }

        if (string.IsNullOrWhiteSpace(opportunity.ContactsJson))
        {
            return AuthEndpointSupport.MessageResult("Укажите хотя бы один контакт.", StatusCodes.Status400BadRequest);
        }

        if (opportunity.OpportunityType == OpportunityTypes.Vacancy)
        {
            if (!opportunity.SalaryFrom.HasValue || !opportunity.SalaryTo.HasValue)
            {
                return AuthEndpointSupport.MessageResult("Для вакансии укажите диапазон зарплаты.", StatusCodes.Status400BadRequest);
            }

            if (opportunity.SalaryFrom > opportunity.SalaryTo)
            {
                return AuthEndpointSupport.MessageResult("Минимальная зарплата не может быть больше максимальной.", StatusCodes.Status400BadRequest);
            }
        }

        if (opportunity.OpportunityType == OpportunityTypes.Internship)
        {
            if (!opportunity.IsPaid.HasValue)
            {
                return AuthEndpointSupport.MessageResult("Для стажировки укажите, является ли она оплачиваемой.", StatusCodes.Status400BadRequest);
            }

            if (string.IsNullOrWhiteSpace(opportunity.Duration))
            {
                return AuthEndpointSupport.MessageResult("Для стажировки укажите длительность.", StatusCodes.Status400BadRequest);
            }

            if (opportunity.IsPaid == true)
            {
                if (!opportunity.StipendFrom.HasValue || !opportunity.StipendTo.HasValue)
                {
                    return AuthEndpointSupport.MessageResult("Для оплачиваемой стажировки укажите диапазон стипендии.", StatusCodes.Status400BadRequest);
                }

                if (opportunity.StipendFrom > opportunity.StipendTo)
                {
                    return AuthEndpointSupport.MessageResult("Минимальная стипендия не может быть больше максимальной.", StatusCodes.Status400BadRequest);
                }
            }
        }

        if (opportunity.OpportunityType == OpportunityTypes.Event)
        {
            if (!opportunity.EventStartAt.HasValue || !opportunity.RegistrationDeadline.HasValue)
            {
                return AuthEndpointSupport.MessageResult("Для мероприятия укажите дату события и дедлайн регистрации.", StatusCodes.Status400BadRequest);
            }

            if (opportunity.RegistrationDeadline > opportunity.EventStartAt)
            {
                return AuthEndpointSupport.MessageResult("Дедлайн регистрации не может быть позже даты события.", StatusCodes.Status400BadRequest);
            }
        }

        if (opportunity.OpportunityType == OpportunityTypes.Mentoring)
        {
            if (string.IsNullOrWhiteSpace(opportunity.Duration))
            {
                return AuthEndpointSupport.MessageResult("Для менторинга укажите длительность.", StatusCodes.Status400BadRequest);
            }

            if (string.IsNullOrWhiteSpace(opportunity.MeetingFrequency))
            {
                return AuthEndpointSupport.MessageResult("Для менторинга укажите частоту встреч.", StatusCodes.Status400BadRequest);
            }

            if (!opportunity.SeatsCount.HasValue || opportunity.SeatsCount <= 0)
            {
                return AuthEndpointSupport.MessageResult("Для менторинга укажите количество мест.", StatusCodes.Status400BadRequest);
            }
        }

        if (!IsRemoteFormat(opportunity.EmploymentType) && string.IsNullOrWhiteSpace(opportunity.LocationCity))
        {
            return AuthEndpointSupport.MessageResult("Укажите город для офлайн или гибридной возможности.", StatusCodes.Status400BadRequest);
        }

        if (opportunity.OpportunityType == OpportunityTypes.Event &&
            !IsRemoteFormat(opportunity.EmploymentType) &&
            string.IsNullOrWhiteSpace(opportunity.LocationAddress))
        {
            return AuthEndpointSupport.MessageResult("Укажите адрес для офлайн или гибридного мероприятия.", StatusCodes.Status400BadRequest);
        }

        return null;
    }

    private static bool IsRemoteFormat(string? employmentType) =>
        !string.IsNullOrWhiteSpace(employmentType) &&
        (employmentType.Contains("remote", StringComparison.OrdinalIgnoreCase) ||
         employmentType.Contains("online", StringComparison.OrdinalIgnoreCase));

    private static OpportunityGetDTO BuildOpportunityDetailResponse(Opportunity opportunity, OpportunityViewerCapabilitiesDTO viewer) =>
        new()
        {
            Id = opportunity.Id,
            EmployerId = opportunity.EmployerId,
            Title = opportunity.Title,
            Description = opportunity.Description,
            LocationAddress = opportunity.LocationAddress,
            LocationCity = opportunity.LocationCity,
            Latitude = opportunity.Latitude,
            Longitude = opportunity.Longitude,
            PublishAt = opportunity.PublishAt,
            ExpireAt = opportunity.ExpireAt,
            OpportunityType = opportunity.OpportunityType,
            EmploymentType = opportunity.EmploymentType,
            ModerationStatus = GetEffectiveModerationStatus(opportunity),
            ModerationReason = opportunity.ModerationReason,
            SalaryFrom = opportunity.SalaryFrom,
            SalaryTo = opportunity.SalaryTo,
            IsPaid = opportunity.IsPaid,
            StipendFrom = opportunity.StipendFrom,
            StipendTo = opportunity.StipendTo,
            Duration = opportunity.Duration,
            EventStartAt = opportunity.EventStartAt,
            RegistrationDeadline = opportunity.RegistrationDeadline,
            MeetingFrequency = opportunity.MeetingFrequency,
            SeatsCount = opportunity.SeatsCount,
            ContactsJson = opportunity.ContactsJson,
            MediaContentJson = opportunity.MediaContentJson,
            CompanyName = opportunity.Employer.CompanyName,
            CompanyDescription = opportunity.Employer.Description,
            CompanyLegalAddress = opportunity.Employer.LegalAddress,
            CompanySocials = opportunity.Employer.Socials,
            Viewer = viewer,
            Tags = opportunity.Tags.Select(tag => tag.Name).ToList(),
        };

    private static Opportunity CloneOpportunityForValidation(Opportunity source) =>
        new()
        {
            Id = source.Id,
            EmployerId = source.EmployerId,
            Title = source.Title,
            Description = source.Description,
            LocationAddress = source.LocationAddress,
            LocationCity = source.LocationCity,
            Latitude = source.Latitude,
            Longitude = source.Longitude,
            OpportunityType = source.OpportunityType,
            EmploymentType = source.EmploymentType,
            ModerationStatus = source.ModerationStatus,
            ModerationReason = source.ModerationReason,
            PublishAt = source.PublishAt,
            ExpireAt = source.ExpireAt,
            ContactsJson = source.ContactsJson,
            MediaContentJson = source.MediaContentJson,
            SalaryFrom = source.SalaryFrom,
            SalaryTo = source.SalaryTo,
            IsPaid = source.IsPaid,
            StipendFrom = source.StipendFrom,
            StipendTo = source.StipendTo,
            Duration = source.Duration,
            EventStartAt = source.EventStartAt,
            RegistrationDeadline = source.RegistrationDeadline,
            MeetingFrequency = source.MeetingFrequency,
            SeatsCount = source.SeatsCount,
        };

    private static OpportunityViewerCapabilitiesDTO BuildViewerCapabilities(bool isOwner, string normalizedStatus, bool hasApplications) =>
        new()
        {
            IsOwner = isOwner,
            CanEdit = isOwner,
            CanDelete = isOwner && !hasApplications,
            CanSaveDraft = isOwner && normalizedStatus is OpportunityModerationStatuses.Draft or OpportunityModerationStatuses.Pending or OpportunityModerationStatuses.Revision or OpportunityModerationStatuses.Rejected or OpportunityModerationStatuses.Archived or OpportunityModerationStatuses.Approved,
            CanSubmit = isOwner && normalizedStatus is OpportunityModerationStatuses.Draft or OpportunityModerationStatuses.Revision or OpportunityModerationStatuses.Rejected or OpportunityModerationStatuses.Archived or OpportunityModerationStatuses.Approved,
            CanArchive = isOwner && normalizedStatus == OpportunityModerationStatuses.Approved,
            CanViewPublicVersion = isOwner,
            CanViewResponses = isOwner,
        };

    internal static async Task<List<Tag>> ResolveOpportunityTagsAsync(ApplicationDBContext db, IEnumerable<string>? requestTags)
    {
        var normalizedNames = (requestTags ?? [])
            .Select(item => item?.Trim())
            .Where(item => !string.IsNullOrWhiteSpace(item))
            .Distinct(StringComparer.Ordinal)
            .Cast<string>()
            .ToList();

        if (normalizedNames.Count == 0)
        {
            return [];
        }

        var existingTags = await db.Tags
            .Where(item => normalizedNames.Contains(item.Name))
            .ToListAsync();

        var tagsByName = existingTags.ToDictionary(item => item.Name, StringComparer.Ordinal);
        var resolvedTags = new List<Tag>(normalizedNames.Count);

        foreach (var tagName in normalizedNames)
        {
            if (!tagsByName.TryGetValue(tagName, out var tag))
            {
                tag = new Tag
                {
                    Name = tagName,
                    IsActive = true,
                };

                db.Tags.Add(tag);
                tagsByName[tagName] = tag;
            }

            resolvedTags.Add(tag);
        }

        return resolvedTags;
    }

    private static object? NormalizeContactElement(JsonElement item)
    {
        if (item.ValueKind != JsonValueKind.Object)
        {
            return null;
        }

        var type = item.TryGetProperty("type", out var typeValue) && typeValue.ValueKind == JsonValueKind.String
            ? NormalizeContactType(typeValue.GetString())
            : "link";

        var value = item.TryGetProperty("value", out var rawValue) && rawValue.ValueKind == JsonValueKind.String
            ? rawValue.GetString()?.Trim()
            : null;

        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        return new
        {
            type,
            value,
        };
    }

    private static string NormalizeContactType(string? value)
    {
        var normalized = value?.Trim().ToLowerInvariant();
        return normalized switch
        {
            "phone" => "phone",
            "email" => "email",
            _ => "link",
        };
    }

    private static string DetectLegacyContactType(string key)
    {
        var normalizedKey = key.Trim().ToLowerInvariant();
        if (normalizedKey.Contains("mail"))
        {
            return "email";
        }

        if (normalizedKey.Contains("phone") || normalizedKey.Contains("tel"))
        {
            return "phone";
        }

        return "link";
    }

    private static string NormalizeLegacyContactValue(string key, string value)
    {
        var normalizedKey = key.Trim().ToLowerInvariant();
        if (normalizedKey.Contains("telegram") && !value.StartsWith("http", StringComparison.OrdinalIgnoreCase))
        {
            return $"https://t.me/{value.TrimStart('@')}";
        }

        return value;
    }

    internal static string? NormalizeMediaContentJson(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        try
        {
            JsonDocument.Parse(value);
        }
        catch (JsonException exception)
        {
            throw new BadHttpRequestException("Поле mediaContentJson должно содержать валидный JSON.", exception);
        }

        return value;
    }
}

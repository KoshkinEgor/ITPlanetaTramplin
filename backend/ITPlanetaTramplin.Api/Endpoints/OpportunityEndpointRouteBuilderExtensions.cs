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
    public static RouteGroupBuilder MapOpportunityEndpoints(this RouteGroupBuilder api)
    {
        api.MapPost("/opportunities", CreateOpportunityAsync).RequireAuthorization("requireCompanyRole");
        api.MapDelete("/opportunities/{id:int}", DeleteOpportunityAsync).RequireAuthorization("requireCompanyRole");
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

        var opportunity = new Opportunity
        {
            Title = request.Title,
            Description = request.Description ?? string.Empty,
            LocationAddress = request.LocationAddress,
            LocationCity = request.LocationCity,
            Latitude = request.Latitude,
            Longitude = request.Longitude,
            ExpireAt = request.ExpireAt.HasValue
                ? DateOnly.FromDateTime(DateTimeOffset.FromUnixTimeSeconds(request.ExpireAt.Value).UtcDateTime)
                : null,
            EmployerId = employer.Id,
            OpportunityType = request.OpportunityType,
            EmploymentType = NormalizeEmploymentType(request.EmploymentType),
            ModerationStatus = OpportunityModerationStatuses.Pending,
            ContactsJson = NormalizeContactsJson(request.ContactsJson),
        };

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

        opportunity.Tags.Clear();
        db.Applications.RemoveRange(opportunity.Applications);
        db.Recommendations.RemoveRange(opportunity.Recommendations);
        db.Opportunities.Remove(opportunity);
        await db.SaveChangesAsync();
        return Results.Ok(new { Id = opportunityId, Deleted = true });
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
            .Include(item => item.Tags)
            .FirstOrDefaultAsync(item => item.Id == request.Id && item.EmployerId == employer.Id);
        if (opportunity is null)
        {
            return Results.NotFound("Возможность не найдена или доступ запрещен.");
        }

        if (request.Title is not null)
        {
            opportunity.Title = request.Title;
        }

        if (request.Description is not null)
        {
            opportunity.Description = request.Description;
        }

        if (request.OpportunityType is not null)
        {
            opportunity.OpportunityType = request.OpportunityType;
        }

        if (request.EmploymentType is not null)
        {
            opportunity.EmploymentType = NormalizeEmploymentType(request.EmploymentType);
        }

        if (request.LocationAddress is not null)
        {
            opportunity.LocationAddress = request.LocationAddress;
        }

        if (request.LocationCity is not null)
        {
            opportunity.LocationCity = request.LocationCity;
        }

        if (request.Latitude.HasValue)
        {
            opportunity.Latitude = request.Latitude.Value;
        }

        if (request.Longitude.HasValue)
        {
            opportunity.Longitude = request.Longitude.Value;
        }

        if (request.ExpireAt.HasValue)
        {
            opportunity.ExpireAt = DateOnly.FromDateTime(DateTimeOffset.FromUnixTimeSeconds(request.ExpireAt.Value).UtcDateTime);
        }

        if (request.ContactsJson is not null)
        {
            opportunity.ContactsJson = NormalizeContactsJson(request.ContactsJson);
        }

        if (request.MediaContentJson is not null)
        {
            opportunity.MediaContentJson = request.MediaContentJson;
        }

        if (request.Tags is not null)
        {
            opportunity.Tags = await ResolveOpportunityTagsAsync(db, request.Tags);
        }

        opportunity.ModerationStatus = OpportunityModerationStatuses.Pending;

        await db.SaveChangesAsync();
        return Results.Ok();
    }

    private static async Task<IResult> GetOpportunitiesAsync(ApplicationDBContext db)
    {
        var opportunities = await db.Opportunities
            .Include(item => item.Employer)
            .Include(item => item.Tags)
            .Where(item => item.DeletedAt == null && item.ModerationStatus == OpportunityModerationStatuses.Approved)
            .Select(item => new
            {
                item.Id,
                item.Title,
                item.Description,
                item.Longitude,
                item.Latitude,
                item.LocationAddress,
                item.LocationCity,
                item.ExpireAt,
                item.EmploymentType,
                CompanyName = item.Employer.CompanyName,
                Tags = item.Tags.Select(tag => tag.Name).ToList(),
                item.OpportunityType,
                ModerationStatus = item.ModerationStatus,
            })
            .ToListAsync();

        return Results.Ok(opportunities);
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
        var canViewHidden =
            currentRole == PublicRoles.Moderator ||
            (currentRole == PublicRoles.Company && currentUserId == opportunity.Employer.UserId);

        if (!canViewHidden &&
            (opportunity.DeletedAt != null || OpportunityModerationStatuses.Normalize(opportunity.ModerationStatus) != OpportunityModerationStatuses.Approved))
        {
            return Results.NotFound();
        }

        return Results.Ok(new
        {
            opportunity.Id,
            opportunity.Title,
            opportunity.Description,
            opportunity.LocationAddress,
            opportunity.LocationCity,
            opportunity.Latitude,
            opportunity.Longitude,
            opportunity.EmploymentType,
            opportunity.OpportunityType,
            opportunity.PublishAt,
            opportunity.ExpireAt,
            opportunity.ContactsJson,
            opportunity.MediaContentJson,
            opportunity.DeletedAt,
            CompanyName = opportunity.Employer.CompanyName,
            EmployerId = opportunity.EmployerId,
            ModerationStatus = OpportunityModerationStatuses.Normalize(opportunity.ModerationStatus),
            Tags = opportunity.Tags.Select(tag => tag.Name).ToList(),
        });
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
            .FirstOrDefaultAsync(item => item.UserId == userId.Value);
        var opportunity = await db.Opportunities.FirstOrDefaultAsync(item =>
            item.Id == request.opportunityId &&
            item.DeletedAt == null &&
            item.ModerationStatus == OpportunityModerationStatuses.Approved);

        if (applicant is null || opportunity is null)
        {
            return Results.NotFound();
        }

        if (applicant.User.IsVerified != true)
        {
            return AuthEndpointSupport.MessageResult(
                "Подтвердите аккаунт полностью, чтобы отправлять отклики на возможности.",
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

    private static string NormalizeEmploymentType(string? value) =>
        string.IsNullOrWhiteSpace(value) ? "unspecified" : value.Trim();

    private static string? NormalizeContactsJson(string? value)
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
                        type = DetectLegacyContactType(property.Name, normalizedValue),
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

    private static async Task<List<Tag>> ResolveOpportunityTagsAsync(ApplicationDBContext db, IEnumerable<string>? requestTags)
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

    private static string DetectLegacyContactType(string key, string value)
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
}

using System.Text.Json;
using Application.DBContext;
using DTO;
using ITPlanetaTramplin.Api.Auth;
using ITPlanetaTramplin.Api.Domain;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Models;

namespace ITPlanetaTramplin.Api.Endpoints;

internal static partial class CandidateEndpointRouteBuilderExtensions
{
    public static RouteGroupBuilder MapCandidateEndpoints(this RouteGroupBuilder api)
    {
        api.MapGet("/candidate/me", GetCandidateMeAsync).RequireAuthorization("requireCandidateRole");
        api.MapPut("/candidate/me", UpdateCandidateMeAsync).RequireAuthorization("requireCandidateRole");
        api.MapGet("/candidate/me/education", GetCurrentCandidateEducationAsync).RequireAuthorization("requireCandidateRole");
        api.MapPost("/candidate/me/education", CreateCandidateEducationAsync).RequireAuthorization("requireCandidateRole");
        api.MapPut("/candidate/me/education/{educationId:int}", UpdateCandidateEducationByRouteAsync).RequireAuthorization("requireCandidateRole");
        api.MapDelete("/candidate/me/education/{educationId:int}", DeleteCandidateEducationAsync).RequireAuthorization("requireCandidateRole");
        api.MapGet("/candidate/me/achievements", GetCurrentCandidateAchievementsAsync).RequireAuthorization("requireCandidateRole");
        api.MapPost("/candidate/me/achievements", CreateCandidateAchievementAsync).RequireAuthorization("requireCandidateRole");
        api.MapPut("/candidate/me/achievements/{achievementId:int}", UpdateCandidateAchievementByRouteAsync).RequireAuthorization("requireCandidateRole");
        api.MapDelete("/candidate/me/achievements/{achievementId:int}", DeleteCandidateAchievementAsync).RequireAuthorization("requireCandidateRole");
        api.MapGet("/candidate/me/contacts", GetCurrentCandidateContactsAsync).RequireAuthorization("requireCandidateRole");
        api.MapPost("/candidate/me/contacts", CreateCandidateContactAsync).RequireAuthorization("requireCandidateRole");
        api.MapDelete("/candidate/me/contacts/{contactId:int}", DeleteCandidateContactAsync).RequireAuthorization("requireCandidateRole");
        api.MapGet("/candidate/me/recommendations", GetCurrentCandidateRecommendationsAsync).RequireAuthorization("requireCandidateRole");
        api.MapPost("/candidate/me/recommendations", CreateCandidateRecommendationAsync).RequireAuthorization("requireCandidateRole");
        api.MapGet("/candidate/me/projects", GetCurrentCandidateProjectsAsync).RequireAuthorization("requireCandidateRole");
        api.MapPost("/candidate/me/projects", CreateCandidateProjectAsync).RequireAuthorization("requireCandidateRole");
        api.MapPut("/candidate/me/projects/{projectId:int}", UpdateCandidateProjectByRouteAsync).RequireAuthorization("requireCandidateRole");
        api.MapDelete("/candidate/me/projects/{projectId:int}", DeleteCandidateProjectAsync).RequireAuthorization("requireCandidateRole");
        api.MapGet("/candidate/me/applications", GetCurrentCandidateApplicationsAsync).RequireAuthorization("requireCandidateRole");

        api.MapGet("/applicant", GetLegacyCandidateProfileAsync).RequireAuthorization("requireCandidateRole");
        api.MapPost("/applicant/education", CreateCandidateEducationAsync).RequireAuthorization("requireCandidateRole");
        api.MapGet("/applicant/{applicantId:int}/education", GetCandidateEducationByApplicantIdAsync).RequireAuthorization("requireCandidateRole");
        api.MapPut("/applicant/education", UpdateCandidateEducationAsync).RequireAuthorization("requireCandidateRole");
        api.MapDelete("/applicant/education/{educationId:int}", DeleteCandidateEducationAsync).RequireAuthorization("requireCandidateRole");
        api.MapPost("/applicant/achievement", CreateCandidateAchievementAsync).RequireAuthorization("requireCandidateRole");
        api.MapGet("/applicant/{applicantId:int}/achievement", GetCandidateAchievementsByApplicantIdAsync).RequireAuthorization("requireCandidateRole");
        api.MapPut("/applicant/achievement", UpdateCandidateAchievementAsync).RequireAuthorization("requireCandidateRole");
        api.MapDelete("/applicant/achievement/{achievementId:int}", DeleteCandidateAchievementAsync).RequireAuthorization("requireCandidateRole");
        api.MapPost("/contact", CreateCandidateContactAsync).RequireAuthorization("requireCandidateRole");
        api.MapDelete("/contact/{contactId:int}", DeleteCandidateContactAsync).RequireAuthorization("requireCandidateRole");
        api.MapGet("/applicant/{userId:int}/contact", GetCandidateContactsByUserIdAsync).RequireAuthorization("requireCandidateRole");
        api.MapPost("/recommendation", CreateCandidateRecommendationAsync).RequireAuthorization("requireCandidateRole");
        api.MapGet("/recommendation", GetCurrentCandidateRecommendationsAsync).RequireAuthorization("requireCandidateRole");

        return api;
    }

    private static async Task<IResult> GetCandidateMeAsync(HttpContext context, ApplicationDBContext db)
    {
        var profile = await GetCurrentCandidateProfileAsync(context, db);
        if (profile is null)
        {
            return Results.Unauthorized();
        }

        return Results.Ok(MapCandidateProfile(profile));
    }

    private static async Task<IResult> UpdateCandidateMeAsync(
        [FromBody] CandidateProfileUpdateDTO request,
        HttpContext context,
        ApplicationDBContext db)
    {
        var profile = await GetCurrentCandidateProfileAsync(context, db);
        if (profile is null)
        {
            return Results.Unauthorized();
        }

        if (!string.IsNullOrWhiteSpace(request.Name))
        {
            profile.Name = request.Name.Trim();
        }

        if (request.Surname is not null)
        {
            profile.Surname = request.Surname.Trim();
        }

        if (request.Thirdname is not null)
        {
            profile.Thirdname = string.IsNullOrWhiteSpace(request.Thirdname) ? null : request.Thirdname.Trim();
        }

        if (request.Description is not null)
        {
            profile.Description = request.Description;
        }

        if (request.Skills is not null)
        {
            profile.Skills = request.Skills;
        }

        if (request.Links is not null)
        {
            profile.Links = JsonSerializer.Serialize(request.Links);
        }

        await db.SaveChangesAsync();
        return Results.Ok(MapCandidateProfile(profile));
    }

    private static async Task<IResult> GetCurrentCandidateEducationAsync(HttpContext context, ApplicationDBContext db)
    {
        var profile = await GetCurrentCandidateProfileAsync(context, db);
        if (profile is null)
        {
            return Results.Unauthorized();
        }

        return Results.Ok(await GetCandidateEducationsAsync(db, profile.Id));
    }

    private static async Task<IResult> CreateCandidateEducationAsync(
        [FromBody] ApplicantEducationCreateDTO request,
        HttpContext context,
        ApplicationDBContext db)
    {
        var profile = await GetCurrentCandidateProfileAsync(context, db);
        if (profile is null)
        {
            return Results.Unauthorized();
        }

        var education = new ApplicantEducation
        {
            ApplicantId = profile.Id,
            InstitutionName = request.InstitutionName,
            Faculty = request.Faculty,
            Specialization = request.Specialization,
            StartYear = request.StartYear,
            GraduationYear = request.GraduationYear,
            IsCompleted = request.IsCompleted,
            Description = request.Description,
        };

        db.ApplicantEducations.Add(education);
        await db.SaveChangesAsync();

        return Results.Created($"/api/candidate/me/education/{education.Id}", education.Id);
    }

    private static async Task<IResult> UpdateCandidateEducationByRouteAsync(
        int educationId,
        [FromBody] ApplicantEducationUpdateDTO request,
        HttpContext context,
        ApplicationDBContext db)
    {
        request.Id = educationId;
        return await UpdateCandidateEducationAsync(request, context, db);
    }

    private static async Task<IResult> UpdateCandidateEducationAsync(
        [FromBody] ApplicantEducationUpdateDTO request,
        HttpContext context,
        ApplicationDBContext db)
    {
        var profile = await GetCurrentCandidateProfileAsync(context, db);
        if (profile is null)
        {
            return Results.Unauthorized();
        }

        var education = await db.ApplicantEducations
            .FirstOrDefaultAsync(item => item.Id == request.Id && item.ApplicantId == profile.Id);

        if (education is null)
        {
            return Results.NotFound();
        }

        if (request.InstitutionName is not null)
        {
            education.InstitutionName = request.InstitutionName;
        }

        if (request.Faculty is not null)
        {
            education.Faculty = request.Faculty;
        }

        if (request.Specialization is not null)
        {
            education.Specialization = request.Specialization;
        }

        if (request.StartYear.HasValue)
        {
            education.StartYear = request.StartYear;
        }

        if (request.GraduationYear.HasValue)
        {
            education.GraduationYear = request.GraduationYear;
        }

        if (request.IsCompleted.HasValue)
        {
            education.IsCompleted = request.IsCompleted;
        }

        if (request.Description is not null)
        {
            education.Description = request.Description;
        }

        if (request.Attachments is not null)
        {
            education.Attachments = request.Attachments;
        }

        await db.SaveChangesAsync();

        return Results.Ok(new ApplicantEducationReadDTO
        {
            Id = education.Id,
            InstitutionName = education.InstitutionName,
            Faculty = education.Faculty,
            Specialization = education.Specialization,
            StartYear = education.StartYear,
            GraduationYear = education.GraduationYear,
            IsCompleted = education.IsCompleted,
            Description = education.Description,
            Attachments = education.Attachments,
        });
    }

    private static async Task<IResult> DeleteCandidateEducationAsync(int educationId, HttpContext context, ApplicationDBContext db)
    {
        var profile = await GetCurrentCandidateProfileAsync(context, db);
        if (profile is null)
        {
            return Results.Unauthorized();
        }

        var education = await db.ApplicantEducations
            .FirstOrDefaultAsync(item => item.Id == educationId && item.ApplicantId == profile.Id);

        if (education is null)
        {
            return Results.NotFound();
        }

        db.ApplicantEducations.Remove(education);
        await db.SaveChangesAsync();
        return Results.Ok();
    }

    private static async Task<IResult> GetCurrentCandidateAchievementsAsync(HttpContext context, ApplicationDBContext db)
    {
        var profile = await GetCurrentCandidateProfileAsync(context, db);
        if (profile is null)
        {
            return Results.Unauthorized();
        }

        return Results.Ok(await GetCandidateAchievementsAsync(db, profile.Id));
    }

    private static async Task<IResult> CreateCandidateAchievementAsync(
        [FromBody] ApplicantAchievementCreateDTO request,
        HttpContext context,
        ApplicationDBContext db)
    {
        var profile = await GetCurrentCandidateProfileAsync(context, db);
        if (profile is null)
        {
            return Results.Unauthorized();
        }

        var achievement = new ApplicantAchievement
        {
            ApplicantId = profile.Id,
            Description = request.Description,
            Title = request.Title,
            Location = request.Location,
            ObtainDate = request.ObtainDate.HasValue
                ? DateOnly.FromDateTime(DateTimeOffset.FromUnixTimeSeconds(request.ObtainDate.Value).UtcDateTime)
                : null,
        };

        db.ApplicantAchievements.Add(achievement);
        await db.SaveChangesAsync();
        return Results.Created($"/api/candidate/me/achievements/{achievement.Id}", achievement.Id);
    }

    private static async Task<IResult> UpdateCandidateAchievementByRouteAsync(
        int achievementId,
        [FromBody] ApplicantAchievementUpdateDTO request,
        HttpContext context,
        ApplicationDBContext db)
    {
        request.Id = achievementId;
        return await UpdateCandidateAchievementAsync(request, context, db);
    }

    private static async Task<IResult> UpdateCandidateAchievementAsync(
        [FromBody] ApplicantAchievementUpdateDTO request,
        HttpContext context,
        ApplicationDBContext db)
    {
        var profile = await GetCurrentCandidateProfileAsync(context, db);
        if (profile is null)
        {
            return Results.Unauthorized();
        }

        var achievement = await db.ApplicantAchievements
            .FirstOrDefaultAsync(item => item.Id == request.Id && item.ApplicantId == profile.Id);

        if (achievement is null)
        {
            return Results.NotFound();
        }

        if (request.Title is not null)
        {
            achievement.Title = request.Title;
        }

        if (request.Location is not null)
        {
            achievement.Location = request.Location;
        }

        if (request.Description is not null)
        {
            achievement.Description = request.Description;
        }

        if (request.ObtainDate.HasValue)
        {
            achievement.ObtainDate = DateOnly.FromDateTime(DateTimeOffset.FromUnixTimeSeconds(request.ObtainDate.Value).UtcDateTime);
        }

        if (request.Attachments is not null)
        {
            achievement.Attachments = request.Attachments;
        }

        await db.SaveChangesAsync();

        return Results.Ok(new ApplicantAchievementReadDTO
        {
            Id = achievement.Id,
            ApplicantId = achievement.ApplicantId,
            Title = achievement.Title,
            Location = achievement.Location,
            ObtainDate = achievement.ObtainDate,
            Description = achievement.Description,
            Attachments = achievement.Attachments,
        });
    }

    private static async Task<IResult> DeleteCandidateAchievementAsync(int achievementId, HttpContext context, ApplicationDBContext db)
    {
        var profile = await GetCurrentCandidateProfileAsync(context, db);
        if (profile is null)
        {
            return Results.Unauthorized();
        }

        var achievement = await db.ApplicantAchievements
            .FirstOrDefaultAsync(item => item.Id == achievementId && item.ApplicantId == profile.Id);

        if (achievement is null)
        {
            return Results.NotFound();
        }

        db.ApplicantAchievements.Remove(achievement);
        await db.SaveChangesAsync();
        return Results.Ok();
    }

    private static async Task<IResult> GetCurrentCandidateContactsAsync(HttpContext context, ApplicationDBContext db)
    {
        var userId = AuthEndpointSupport.GetCurrentUserId(context);
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        return Results.Ok(await GetCandidateContactsAsync(db, userId.Value));
    }

    private static async Task<IResult> CreateCandidateContactAsync(
        [FromBody] ContactCreateDTO request,
        HttpContext context,
        ApplicationDBContext db)
    {
        var userId = AuthEndpointSupport.GetCurrentUserId(context);
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        if (userId.Value == request.UserId)
        {
            return Results.BadRequest();
        }

        var applicant = await db.ApplicantProfiles.Include(item => item.User).FirstOrDefaultAsync(item => item.UserId == userId.Value);
        var contactApplicant = await db.ApplicantProfiles.Include(item => item.User).FirstOrDefaultAsync(item => item.UserId == request.UserId);

        if (applicant is null || contactApplicant is null)
        {
            return Results.NotFound();
        }

        var alreadyExists = await db.Contacts.AnyAsync(item => item.UserId == applicant.UserId && item.ContactProfileId == contactApplicant.UserId);
        if (alreadyExists)
        {
            return Results.Ok();
        }

        db.Contacts.Add(new Contact
        {
            User = applicant.User,
            ContactProfile = contactApplicant.User,
        });

        await db.SaveChangesAsync();
        return Results.Ok();
    }

    private static async Task<IResult> DeleteCandidateContactAsync(int contactId, HttpContext context, ApplicationDBContext db)
    {
        var userId = AuthEndpointSupport.GetCurrentUserId(context);
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var contact = await db.Contacts.FirstOrDefaultAsync(item => item.UserId == userId.Value && item.ContactProfileId == contactId);
        if (contact is null)
        {
            return Results.NotFound();
        }

        db.Contacts.Remove(contact);
        await db.SaveChangesAsync();
        return Results.Ok();
    }

    private static async Task<IResult> GetCurrentCandidateRecommendationsAsync(HttpContext context, ApplicationDBContext db)
    {
        var profile = await GetCurrentCandidateProfileAsync(context, db);
        if (profile is null)
        {
            return Results.Unauthorized();
        }

        return Results.Ok(await db.Recommendations
            .Include(item => item.Recommender)
            .Include(item => item.Opportunity)
            .Where(item => item.CandidateId == profile.Id)
            .Select(item => new
            {
                RecommenderId = item.RecommenderId,
                OpportunityId = item.OpportunityId,
                item.Message,
                item.CreatedAt,
            })
            .ToListAsync());
    }

    private static async Task<IResult> CreateCandidateRecommendationAsync(
        [FromBody] RecommendationCreateDTO request,
        HttpContext context,
        ApplicationDBContext db)
    {
        var userId = AuthEndpointSupport.GetCurrentUserId(context);
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var recommender = await db.ApplicantProfiles.FirstOrDefaultAsync(item => item.UserId == userId.Value);
        var candidate = await db.ApplicantProfiles.FirstOrDefaultAsync(item => item.UserId == request.CandidateId);
        var opportunity = await db.Opportunities.FirstOrDefaultAsync(item => item.Id == request.OpportunityId);

        if (recommender is null || candidate is null || opportunity is null)
        {
            return Results.NotFound();
        }

        db.Recommendations.Add(new Recommendation
        {
            Recommender = recommender,
            Candidate = candidate,
            Opportunity = opportunity,
            Message = request.Message,
        });

        await db.SaveChangesAsync();
        return Results.Ok();
    }

    private static async Task<IResult> GetLegacyCandidateProfileAsync(HttpContext context, ApplicationDBContext db)
    {
        var profile = await GetCurrentCandidateProfileAsync(context, db);
        if (profile is null)
        {
            return Results.Unauthorized();
        }

        return Results.Ok(new[]
        {
            new
            {
                profile.Name,
                profile.Surname,
                profile.Thirdname,
                Educations = profile.ApplicantEducations.Select(item => new { item.InstitutionName, item.GraduationYear }),
                profile.Description,
                profile.Skills,
            },
        });
    }

    private static async Task<IResult> GetCandidateEducationByApplicantIdAsync(int applicantId, HttpContext context, ApplicationDBContext db)
    {
        var profile = await GetCurrentCandidateProfileAsync(context, db);
        if (profile is null)
        {
            return Results.Unauthorized();
        }

        return profile.Id != applicantId
            ? Results.NotFound()
            : Results.Ok(await GetCandidateEducationsAsync(db, applicantId));
    }

    private static async Task<IResult> GetCandidateAchievementsByApplicantIdAsync(int applicantId, HttpContext context, ApplicationDBContext db)
    {
        var profile = await GetCurrentCandidateProfileAsync(context, db);
        if (profile is null)
        {
            return Results.Unauthorized();
        }

        return profile.Id != applicantId
            ? Results.NotFound()
            : Results.Ok(await GetCandidateAchievementsAsync(db, applicantId));
    }

    private static async Task<IResult> GetCandidateContactsByUserIdAsync(int userId, HttpContext context, ApplicationDBContext db)
    {
        var currentUserId = AuthEndpointSupport.GetCurrentUserId(context);
        if (currentUserId is null)
        {
            return Results.Unauthorized();
        }

        return currentUserId.Value != userId
            ? Results.NotFound()
            : Results.Ok(await GetCandidateContactsAsync(db, userId));
    }

    private static async Task<ApplicantProfile?> GetCurrentCandidateProfileAsync(HttpContext context, ApplicationDBContext db)
    {
        var userId = AuthEndpointSupport.GetCurrentUserId(context);
        if (userId is null)
        {
            return null;
        }

        return await db.ApplicantProfiles
            .Include(item => item.User)
            .Include(item => item.ApplicantEducations)
            .Include(item => item.ApplicantAchievements)
            .FirstOrDefaultAsync(item => item.UserId == userId.Value);
    }

    private static CandidateProfileReadDTO MapCandidateProfile(ApplicantProfile profile) =>
        new()
        {
            UserId = profile.UserId,
            ProfileId = profile.Id,
            Email = profile.User.Email,
            Name = profile.Name,
            Surname = profile.Surname,
            Thirdname = profile.Thirdname,
            Description = profile.Description,
            Skills = profile.Skills,
            Links = AuthEndpointSupport.TryParseJsonValue(profile.Links),
        };

    private static async Task<List<object>> GetCandidateEducationsAsync(ApplicationDBContext db, int applicantId) =>
        await db.ApplicantEducations
            .Where(item => item.ApplicantId == applicantId)
            .Select(item => (object)new
            {
                item.Id,
                item.InstitutionName,
                item.Faculty,
                item.Specialization,
                item.StartYear,
                item.GraduationYear,
                item.IsCompleted,
                item.Description,
                item.Attachments,
            })
            .ToListAsync();

    private static async Task<List<object>> GetCandidateAchievementsAsync(ApplicationDBContext db, int applicantId) =>
        await db.ApplicantAchievements
            .Where(item => item.ApplicantId == applicantId)
            .Select(item => (object)new
            {
                item.Id,
                item.ObtainDate,
                item.Location,
                item.Title,
                item.Description,
                item.Attachments,
            })
            .ToListAsync();

    private static async Task<List<object>> GetCandidateContactsAsync(ApplicationDBContext db, int userId) =>
        await db.Contacts
            .Include(item => item.ContactProfile)
            .ThenInclude(item => item.ApplicantProfile)
            .Where(item => item.UserId == userId)
            .Select(item => (object)new
            {
                item.ContactProfileId,
                item.CreatedAt,
                Email = item.ContactProfile.Email,
                Name = item.ContactProfile.ApplicantProfile != null
                    ? ((item.ContactProfile.ApplicantProfile.Name ?? string.Empty) + " "
                        + (item.ContactProfile.ApplicantProfile.Surname ?? string.Empty) + " "
                        + (item.ContactProfile.ApplicantProfile.Thirdname ?? string.Empty)).Trim()
                    : item.ContactProfile.Email,
                Skills = item.ContactProfile.ApplicantProfile != null
                    ? item.ContactProfile.ApplicantProfile.Skills
                    : null,
            })
            .ToListAsync();
}

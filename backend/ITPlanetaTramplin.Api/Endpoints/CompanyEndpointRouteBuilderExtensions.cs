using Application.DBContext;
using DTO;
using ITPlanetaTramplin.Api.Auth;
using ITPlanetaTramplin.Api.Domain;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Models;

namespace ITPlanetaTramplin.Api.Endpoints;

internal static class CompanyEndpointRouteBuilderExtensions
{
    public static RouteGroupBuilder MapCompanyEndpoints(this RouteGroupBuilder api)
    {
        api.MapGet("/company/me", GetCompanyMeAsync).RequireAuthorization("requireCompanyRole");
        api.MapPut("/company/me", UpdateCompanyMeAsync).RequireAuthorization("requireCompanyRole");
        api.MapGet("/company/me/opportunities", GetCurrentCompanyOpportunitiesAsync).RequireAuthorization("requireCompanyRole");

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

        if (request.VerificationData is not null)
        {
            profile.VerificationData = request.VerificationData;
        }

        if (request.VerificationMethod is not null)
        {
            profile.VerificationMethod = request.VerificationMethod;
        }

        profile.VerificationStatus = CompanyVerificationStatuses.Pending;

        await db.SaveChangesAsync();
        return Results.Ok(MapCompanyProfile(profile));
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

    private static CompanyProfileReadDTO MapCompanyProfile(EmployerProfile profile) =>
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
            VerificationData = profile.VerificationData,
            VerificationMethod = profile.VerificationMethod,
            VerificationStatus = CompanyVerificationStatuses.Normalize(profile.VerificationStatus),
        };

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
                item.Title,
                item.Description,
                item.Longitude,
                item.Latitude,
                item.LocationAddress,
                item.LocationCity,
                item.ExpireAt,
                item.ContactsJson,
                item.EmploymentType,
                CompanyName = item.Employer.CompanyName,
                Tags = item.Tags.Select(tag => tag.Name).ToList(),
                item.OpportunityType,
                item.DeletedAt,
                item.ModerationStatus,
                ApplicationsCount = item.Applications.Count,
            })
            .ToListAsync();
}

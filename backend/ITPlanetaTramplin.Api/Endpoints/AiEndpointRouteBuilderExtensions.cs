using Application.DBContext;
using DTO;
using ITPlanetaTramplin.Api.Auth;
using ITPlanetaTramplin.Api.Domain;
using ITPlanetaTramplin.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ITPlanetaTramplin.Api.Endpoints;

internal static class AiEndpointRouteBuilderExtensions
{
    public static RouteGroupBuilder MapAiEndpoints(this RouteGroupBuilder api)
    {
        api.MapGet("/candidate/me/ai-career-recommendations", GetCurrentCandidateAiCareerRecommendationsAsync)
            .RequireAuthorization("requireCandidateRole");
        api.MapPost("/candidate/me/resume-analysis", AnalyzeCurrentCandidateResumeAsync)
            .RequireAuthorization("requireCandidateRole");
        api.MapPost("/candidate/me/opportunities/{opportunityId:int}/resume-fit", AnalyzeCurrentCandidateOpportunityFitAsync)
            .RequireAuthorization("requireCandidateRole");
        api.MapPost("/opportunities/ai-tag-suggestions", SuggestOpportunityTagsAsync)
            .RequireAuthorization("requireCompanyRole");

        return api;
    }

    private static async Task<IResult> GetCurrentCandidateAiCareerRecommendationsAsync(
        HttpContext context,
        ApplicationDBContext db,
        IAiCareerService aiCareerService,
        CancellationToken cancellationToken,
        [FromQuery] bool forceRefresh = false,
        [FromQuery] bool isUpdate = false)
    {
        var profile = await GetCurrentCandidateProfileAsync(context, db, cancellationToken);
        if (profile is null)
        {
            return Results.Unauthorized();
        }

        var education = await db.ApplicantEducations
            .Where(item => item.ApplicantId == profile.Id)
            .ToListAsync(cancellationToken);
        var achievements = await db.ApplicantAchievements
            .Where(item => item.ApplicantId == profile.Id)
            .ToListAsync(cancellationToken);
        var projects = await db.CandidateProjects
            .Where(item => item.ApplicantId == profile.Id)
            .ToListAsync(cancellationToken);
        var applications = await db.Applications
            .Include(item => item.Opportunity)
            .Where(item => item.ApplicantId == profile.Id)
            .ToListAsync(cancellationToken);
        var opportunities = await db.Opportunities
            .Include(item => item.Tags)
            .Where(item => item.DeletedAt == null && item.ModerationStatus == OpportunityModerationStatuses.Approved)
            .Take(60)
            .ToListAsync(cancellationToken);

        var response = await aiCareerService.BuildCareerRecommendationsAsync(
            profile,
            education,
            achievements,
            projects,
            applications,
            opportunities,
            forceRefresh,
            isUpdate,
            cancellationToken);

        return Results.Ok(response);
    }

    private static async Task<IResult> AnalyzeCurrentCandidateResumeAsync(
        HttpContext context,
        ApplicationDBContext db,
        IAiCareerService aiCareerService,
        CancellationToken cancellationToken)
    {
        var profile = await GetCurrentCandidateProfileAsync(context, db, cancellationToken);
        if (profile is null)
        {
            return Results.Unauthorized();
        }

        var education = await db.ApplicantEducations
            .Where(item => item.ApplicantId == profile.Id)
            .ToListAsync(cancellationToken);
        var achievements = await db.ApplicantAchievements
            .Where(item => item.ApplicantId == profile.Id)
            .ToListAsync(cancellationToken);
        var projects = await db.CandidateProjects
            .Where(item => item.ApplicantId == profile.Id)
            .ToListAsync(cancellationToken);

        var response = await aiCareerService.AnalyzeResumeAsync(profile, education, achievements, projects, cancellationToken);
        return Results.Ok(response);
    }

    private static async Task<IResult> AnalyzeCurrentCandidateOpportunityFitAsync(
        int opportunityId,
        HttpContext context,
        ApplicationDBContext db,
        IAiCareerService aiCareerService,
        CancellationToken cancellationToken)
    {
        var profile = await GetCurrentCandidateProfileAsync(context, db, cancellationToken);
        if (profile is null)
        {
            return Results.Unauthorized();
        }

        var opportunity = await db.Opportunities
            .Include(item => item.Tags)
            .FirstOrDefaultAsync(
                item => item.Id == opportunityId &&
                    item.DeletedAt == null &&
                    item.ModerationStatus == OpportunityModerationStatuses.Approved,
                cancellationToken);

        if (opportunity is null)
        {
            return Results.NotFound(new { message = "Возможность не найдена." });
        }

        var education = await db.ApplicantEducations
            .Where(item => item.ApplicantId == profile.Id)
            .ToListAsync(cancellationToken);
        var achievements = await db.ApplicantAchievements
            .Where(item => item.ApplicantId == profile.Id)
            .ToListAsync(cancellationToken);
        var projects = await db.CandidateProjects
            .Where(item => item.ApplicantId == profile.Id)
            .ToListAsync(cancellationToken);

        var response = await aiCareerService.AnalyzeOpportunityFitAsync(
            profile,
            education,
            achievements,
            projects,
            opportunity,
            cancellationToken);

        return Results.Ok(response);
    }

    private static async Task<IResult> SuggestOpportunityTagsAsync(
        [FromBody] AiOpportunityTagSuggestionRequestDTO request,
        ApplicationDBContext db,
        IAiCareerService aiCareerService,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Title) && string.IsNullOrWhiteSpace(request.Description))
        {
            return Results.BadRequest(new { message = "Заполните название или описание для AI-подбора тегов." });
        }

        var activeTags = await db.Tags
            .Where(item => item.IsActive == true && item.MergedIntoTagId == null)
            .OrderBy(item => item.Name)
            .Select(item => item.Name)
            .ToListAsync(cancellationToken);

        var response = await aiCareerService.SuggestOpportunityTagsAsync(request, activeTags, cancellationToken);
        return Results.Ok(response);
    }

    private static async Task<Models.ApplicantProfile?> GetCurrentCandidateProfileAsync(
        HttpContext context,
        ApplicationDBContext db,
        CancellationToken cancellationToken)
    {
        var userId = AuthEndpointSupport.GetCurrentUserId(context);
        if (userId is null)
        {
            return null;
        }

        return await db.ApplicantProfiles.FirstOrDefaultAsync(item => item.UserId == userId.Value, cancellationToken);
    }
}

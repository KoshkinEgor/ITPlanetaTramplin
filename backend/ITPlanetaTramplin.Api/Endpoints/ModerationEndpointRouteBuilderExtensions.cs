using Application.DBContext;
using ITPlanetaTramplin.Api.Auth;
using ITPlanetaTramplin.Api.Domain;
using DTO;
using Microsoft.EntityFrameworkCore;

namespace ITPlanetaTramplin.Api.Endpoints;

internal static class ModerationEndpointRouteBuilderExtensions
{
    public static RouteGroupBuilder MapModerationEndpoints(this RouteGroupBuilder api)
    {
        api.MapGet("/moderation/dashboard", GetModerationDashboardAsync).RequireAuthorization("requireModeratorRole");
        api.MapGet("/moderation/companies", GetModerationCompaniesAsync).RequireAuthorization("requireModeratorRole");
        api.MapGet("/moderation/opportunities", GetModerationOpportunitiesAsync).RequireAuthorization("requireModeratorRole");
        api.MapGet("/moderation/users", GetModerationUsersAsync).RequireAuthorization("requireModeratorRole");
        api.MapPost("/moderation/companies/{id:int}/decision", ApplyCompanyDecisionAsync).RequireAuthorization("requireModeratorRole");
        api.MapPost("/moderation/opportunities/{id:int}/decision", ApplyOpportunityDecisionAsync).RequireAuthorization("requireModeratorRole");

        return api;
    }

    private static async Task<IResult> GetModerationDashboardAsync(ApplicationDBContext db)
    {
        var totalUsers = await db.Users.CountAsync(item => item.DeletedAt == null);
        var totalCompanies = await db.EmployerProfiles.CountAsync();
        var totalOpportunities = await db.Opportunities.CountAsync(item => item.DeletedAt == null);
        var companiesPending = await db.EmployerProfiles.CountAsync(item => item.VerificationStatus == CompanyVerificationStatuses.Pending);
        var opportunitiesPending = await db.Opportunities.CountAsync(item => item.DeletedAt == null && item.ModerationStatus == OpportunityModerationStatuses.Pending);

        return Results.Ok(new
        {
            TotalUsers = totalUsers,
            TotalCandidates = await db.ApplicantProfiles.CountAsync(),
            TotalCompanies = totalCompanies,
            TotalModerators = await db.CuratorProfiles.CountAsync(),
            TotalOpportunities = totalOpportunities,
            CompaniesPending = companiesPending,
            OpportunitiesPending = opportunitiesPending,
        });
    }

    private static async Task<IResult> GetModerationCompaniesAsync(ApplicationDBContext db)
    {
        var companies = await db.EmployerProfiles
            .Include(item => item.User)
            .Include(item => item.Opportunities)
            .Select(item => new
            {
                item.Id,
                item.UserId,
                item.CompanyName,
                item.Inn,
                item.LegalAddress,
                item.Description,
                item.VerificationStatus,
                item.VerificationMethod,
                item.VerificationData,
                item.User.Email,
                item.User.PreVerify,
                item.User.IsVerified,
                item.User.CreatedAt,
                OpportunitiesCount = item.Opportunities.Count,
            })
            .ToListAsync();

        return Results.Ok(companies);
    }

    private static async Task<IResult> GetModerationOpportunitiesAsync(ApplicationDBContext db)
    {
        var opportunities = await db.Opportunities
            .Include(item => item.Employer)
            .ThenInclude(item => item.User)
            .Select(item => new
            {
                item.Id,
                item.Title,
                item.OpportunityType,
                item.LocationAddress,
                item.LocationCity,
                item.PublishAt,
                item.ExpireAt,
                item.DeletedAt,
                item.ModerationStatus,
                EmployerId = item.EmployerId,
                CompanyName = item.Employer.CompanyName,
                EmployerEmail = item.Employer.User.Email,
            })
            .ToListAsync();

        return Results.Ok(opportunities);
    }

    private static async Task<IResult> GetModerationUsersAsync(ApplicationDBContext db)
    {
        var users = await db.Users
            .Include(item => item.ApplicantProfile)
            .Include(item => item.EmployerProfile)
            .Include(item => item.CuratorProfile)
            .Where(item => item.DeletedAt == null)
            .ToListAsync();

        var response = users
            .Select(item =>
            {
                var role = AuthEndpointSupport.GetPublicRole(item) ?? string.Empty;

                return new
                {
                    item.Id,
                    item.Email,
                    item.PreVerify,
                    item.IsVerified,
                    item.CreatedAt,
                    Role = role,
                    DisplayName = AuthEndpointSupport.BuildDisplayName(item, role),
                };
            })
            .ToList();

        return Results.Ok(response);
    }

    private static async Task<IResult> ApplyCompanyDecisionAsync(int id, ModerationDecisionDTO request, ApplicationDBContext db)
    {
        var company = await db.EmployerProfiles.FirstOrDefaultAsync(item => item.Id == id);
        if (company is null)
        {
            return Results.NotFound();
        }

        if (!CompanyVerificationStatuses.IsKnown(request.Status))
        {
            return AuthEndpointSupport.MessageResult("Укажите корректный статус модерации компании.", StatusCodes.Status400BadRequest);
        }

        var normalizedStatus = CompanyVerificationStatuses.Normalize(request.Status);
        company.VerificationStatus = normalizedStatus;
        await db.SaveChangesAsync();

        return Results.Ok(new
        {
            company.Id,
            VerificationStatus = normalizedStatus,
        });
    }

    private static async Task<IResult> ApplyOpportunityDecisionAsync(int id, ModerationDecisionDTO request, ApplicationDBContext db)
    {
        var opportunity = await db.Opportunities.FirstOrDefaultAsync(item => item.Id == id);
        if (opportunity is null)
        {
            return Results.NotFound();
        }

        if (!OpportunityModerationStatuses.IsKnown(request.Status))
        {
            return AuthEndpointSupport.MessageResult("Укажите корректный статус модерации возможности.", StatusCodes.Status400BadRequest);
        }

        var normalizedStatus = OpportunityModerationStatuses.Normalize(request.Status);
        opportunity.ModerationStatus = normalizedStatus;
        await db.SaveChangesAsync();

        return Results.Ok(new
        {
            opportunity.Id,
            ModerationStatus = normalizedStatus,
        });
    }
}

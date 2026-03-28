using Application.DBContext;
using DTO;
using ITPlanetaTramplin.Api.Auth;
using ITPlanetaTramplin.Api.Domain;
using ITPlanetaTramplin.Api.Infrastructure;
using ITPlanetaTramplin.Api.Integrations;
using Microsoft.EntityFrameworkCore;
using Models;

namespace ITPlanetaTramplin.Api.Endpoints;

internal static class ModerationEndpointRouteBuilderExtensions
{
    public static RouteGroupBuilder MapModerationEndpoints(this RouteGroupBuilder api)
    {
        api.MapGet("/moderation/dashboard", GetModerationDashboardAsync).RequireAuthorization("requireModeratorRole");
        api.MapGet("/moderation/companies", GetModerationCompaniesAsync).RequireAuthorization("requireModeratorRole");
        api.MapGet("/moderation/companies/{id:int}", GetModerationCompanyByIdAsync).RequireAuthorization("requireModeratorRole");
        api.MapGet("/moderation/companies/{id:int}/verification-document", GetModerationCompanyVerificationDocumentAsync).RequireAuthorization("requireModeratorRole");
        api.MapPut("/moderation/companies/{id:int}", UpdateModerationCompanyByIdAsync).RequireAuthorization("requireModeratorRole");
        api.MapPost("/moderation/companies/{id:int}/decision", ApplyCompanyDecisionAsync).RequireAuthorization("requireModeratorRole");
        api.MapGet("/moderation/opportunities", GetModerationOpportunitiesAsync).RequireAuthorization("requireModeratorRole");
        api.MapGet("/moderation/opportunities/{id:int}", GetModerationOpportunityByIdAsync).RequireAuthorization("requireModeratorRole");
        api.MapPut("/moderation/opportunities/{id:int}", UpdateModerationOpportunityByIdAsync).RequireAuthorization("requireModeratorRole");
        api.MapPost("/moderation/opportunities/{id:int}/decision", ApplyOpportunityDecisionAsync).RequireAuthorization("requireModeratorRole");
        api.MapGet("/moderation/users", GetModerationUsersAsync).RequireAuthorization("requireModeratorRole");
        api.MapGet("/moderation/users/{id:int}", GetModerationUserByIdAsync).RequireAuthorization("requireModeratorRole");
        api.MapPut("/moderation/users/{id:int}", UpdateModerationUserByIdAsync).RequireAuthorization("requireModeratorRole");
        api.MapPost("/moderation/users/{id:int}/decision", ApplyCandidateDecisionAsync).RequireAuthorization("requireModeratorRole");
        api.MapGet("/moderation/moderator-invitations", GetModeratorInvitationsAsync).RequireAuthorization("requireModeratorRole");
        api.MapPost("/moderation/moderator-invitations", CreateModeratorInvitationAsync).RequireAuthorization("requireModeratorRole");

        return api;
    }

    private static async Task<IResult> GetModerationDashboardAsync(ApplicationDBContext db)
    {
        var totalUsers = await db.Users.CountAsync(item => item.DeletedAt == null);
        var totalCompanies = await db.EmployerProfiles.CountAsync();
        var totalOpportunities = await db.Opportunities.CountAsync(item => item.DeletedAt == null);
        var companiesPending = await db.EmployerProfiles.CountAsync(item => item.VerificationStatus == CompanyVerificationStatuses.Pending);
        var opportunitiesPending = await db.Opportunities.CountAsync(item => item.DeletedAt == null && item.ModerationStatus == OpportunityModerationStatuses.Pending);
        var candidatesPending = await db.ApplicantProfiles.CountAsync(item => CandidateModerationStatuses.Normalize(item.ModerationStatus) == CandidateModerationStatuses.Pending);

        return Results.Ok(new
        {
            TotalUsers = totalUsers,
            TotalCandidates = await db.ApplicantProfiles.CountAsync(),
            TotalCompanies = totalCompanies,
            TotalModerators = await db.CuratorProfiles.CountAsync(),
            TotalOpportunities = totalOpportunities,
            CompaniesPending = companiesPending,
            OpportunitiesPending = opportunitiesPending,
            CandidatesPending = candidatesPending,
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
                VerificationStatus = CompanyVerificationStatuses.Normalize(item.VerificationStatus),
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

    private static async Task<IResult> GetModerationCompanyByIdAsync(int id, ApplicationDBContext db)
    {
        var profile = await db.EmployerProfiles
            .Include(item => item.User)
            .FirstOrDefaultAsync(item => item.Id == id);
        if (profile is null)
        {
            return Results.NotFound();
        }

        return Results.Ok(CompanyEndpointRouteBuilderExtensions.MapCompanyProfile(profile));
    }

    private static async Task<IResult> UpdateModerationCompanyByIdAsync(int id, CompanyProfileUpdateDTO request, ApplicationDBContext db)
    {
        var profile = await db.EmployerProfiles
            .Include(item => item.User)
            .FirstOrDefaultAsync(item => item.Id == id);
        if (profile is null)
        {
            return Results.NotFound();
        }

        CompanyEndpointRouteBuilderExtensions.ApplyCompanyProfileUpdate(profile, request);
        await db.SaveChangesAsync();
        return Results.Ok(CompanyEndpointRouteBuilderExtensions.MapCompanyProfile(profile));
    }

    private static async Task<IResult> GetModerationCompanyVerificationDocumentAsync(
        int id,
        ApplicationDBContext db,
        CompanyVerificationStorage storage)
    {
        var profile = await db.EmployerProfiles
            .FirstOrDefaultAsync(item => item.Id == id);
        if (profile is null)
        {
            return Results.NotFound();
        }

        return CompanyEndpointRouteBuilderExtensions.GetVerificationDocumentResult(profile, storage);
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
                item.PublishAt,
                item.ExpireAt,
                item.DeletedAt,
                ModerationStatus = OpportunityModerationStatuses.Normalize(item.ModerationStatus),
                item.ModerationReason,
                EmployerId = item.EmployerId,
                CompanyName = item.Employer.CompanyName,
                EmployerEmail = item.Employer.User.Email,
            })
            .ToListAsync();

        return Results.Ok(opportunities);
    }

    private static async Task<IResult> GetModerationOpportunityByIdAsync(int id, ApplicationDBContext db)
    {
        var opportunity = await db.Opportunities
            .Include(item => item.Employer)
            .Include(item => item.Tags)
            .FirstOrDefaultAsync(item => item.Id == id);
        if (opportunity is null)
        {
            return Results.NotFound();
        }

        return Results.Ok(BuildModerationOpportunityResponse(opportunity));
    }

    private static async Task<IResult> UpdateModerationOpportunityByIdAsync(int id, OpportunityUpdateDTO request, ApplicationDBContext db)
    {
        var opportunity = await db.Opportunities
            .Include(item => item.Employer)
            .Include(item => item.Tags)
            .FirstOrDefaultAsync(item => item.Id == id);
        if (opportunity is null)
        {
            return Results.NotFound();
        }

        var validationResult = await OpportunityEndpointRouteBuilderExtensions.ApplyOpportunityUpdateAsync(
            db,
            opportunity,
            request,
            resetModerationStatus: false,
            allowTypedFields: false);

        if (validationResult is not null)
        {
            return validationResult;
        }

        await db.SaveChangesAsync();
        return Results.Ok(BuildModerationOpportunityResponse(opportunity));
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
                    CandidateModerationStatus = item.ApplicantProfile is null
                        ? null
                        : CandidateModerationStatuses.Normalize(item.ApplicantProfile.ModerationStatus),
                    CompanyVerificationStatus = item.EmployerProfile is null
                        ? null
                        : CompanyVerificationStatuses.Normalize(item.EmployerProfile.VerificationStatus),
                    IsAdministrator = item.CuratorProfile?.IsAdministrator == true,
                };
            })
            .ToList();

        return Results.Ok(response);
    }

    private static async Task<IResult> GetModerationUserByIdAsync(int id, ApplicationDBContext db)
    {
        var profile = await db.ApplicantProfiles
            .Include(item => item.User)
            .FirstOrDefaultAsync(item => item.UserId == id);
        if (profile is null)
        {
            return Results.NotFound();
        }

        return Results.Ok(CandidateEndpointRouteBuilderExtensions.MapCandidateProfile(profile));
    }

    private static async Task<IResult> UpdateModerationUserByIdAsync(int id, CandidateProfileUpdateDTO request, ApplicationDBContext db)
    {
        var profile = await db.ApplicantProfiles
            .Include(item => item.User)
            .FirstOrDefaultAsync(item => item.UserId == id);
        if (profile is null)
        {
            return Results.NotFound();
        }

        CandidateEndpointRouteBuilderExtensions.ApplyCandidateProfileUpdate(profile, request);
        await db.SaveChangesAsync();
        return Results.Ok(CandidateEndpointRouteBuilderExtensions.MapCandidateProfile(profile));
    }

    private static async Task<IResult> ApplyCandidateDecisionAsync(int id, ModerationDecisionDTO request, ApplicationDBContext db)
    {
        var profile = await db.ApplicantProfiles
            .Include(item => item.User)
            .FirstOrDefaultAsync(item => item.UserId == id);
        if (profile is null)
        {
            return Results.NotFound();
        }

        if (!CandidateModerationStatuses.IsKnown(request.Status))
        {
            return AuthEndpointSupport.MessageResult("Укажите корректный статус модерации кандидата.", StatusCodes.Status400BadRequest);
        }

        var normalizedStatus = CandidateModerationStatuses.Normalize(request.Status);
        profile.ModerationStatus = normalizedStatus;
        await db.SaveChangesAsync();

        return Results.Ok(new
        {
            profile.UserId,
            ModerationStatus = normalizedStatus,
        });
    }

    private static async Task<IResult> GetModeratorInvitationsAsync(ApplicationDBContext db)
    {
        var invitations = await db.ModeratorInvitations
            .OrderByDescending(item => item.CreatedAt)
            .Select(item => new
            {
                item.Id,
                item.Email,
                item.Name,
                item.Surname,
                item.Thirdname,
                item.CreatedAt,
                item.ExpiresAt,
                item.AcceptedAt,
                item.RevokedAt,
                InvitedByUserId = item.InvitedByUserId,
                InvitedByName = item.InvitedByUser.CuratorProfile != null ? item.InvitedByUser.CuratorProfile.Name : null,
                InvitedBySurname = item.InvitedByUser.CuratorProfile != null ? item.InvitedByUser.CuratorProfile.Surname : null,
                InvitedByThirdname = item.InvitedByUser.CuratorProfile != null ? item.InvitedByUser.CuratorProfile.Thirdname : null,
                AcceptedUserId = item.AcceptedUserId,
                AcceptedName = item.AcceptedUser != null && item.AcceptedUser.CuratorProfile != null ? item.AcceptedUser.CuratorProfile.Name : null,
                AcceptedSurname = item.AcceptedUser != null && item.AcceptedUser.CuratorProfile != null ? item.AcceptedUser.CuratorProfile.Surname : null,
                AcceptedThirdname = item.AcceptedUser != null && item.AcceptedUser.CuratorProfile != null ? item.AcceptedUser.CuratorProfile.Thirdname : null,
            })
            .ToListAsync();

        var response = invitations
            .Select(item => new
            {
                item.Id,
                item.Email,
                item.Name,
                item.Surname,
                item.Thirdname,
                item.CreatedAt,
                item.ExpiresAt,
                item.AcceptedAt,
                item.RevokedAt,
                item.InvitedByUserId,
                InvitedByDisplayName = BuildModeratorDisplayName(item.InvitedByName, item.InvitedBySurname, item.InvitedByThirdname),
                item.AcceptedUserId,
                AcceptedDisplayName = BuildModeratorDisplayName(item.AcceptedName, item.AcceptedSurname, item.AcceptedThirdname),
            })
            .ToList();

        return Results.Ok(response);
    }

    private static async Task<IResult> CreateModeratorInvitationAsync(
        ModeratorInvitationCreateDTO request,
        HttpContext context,
        ApplicationDBContext db,
        ModeratorInvitationService invitationService,
        SmtpEmailSender emailSender,
        CancellationToken cancellationToken,
        ILoggerFactory loggerFactory)
    {
        var currentUserId = AuthEndpointSupport.GetCurrentUserId(context);
        if (currentUserId is null)
        {
            return Results.Unauthorized();
        }

        var currentModerator = await db.Users
            .Include(item => item.CuratorProfile)
            .FirstOrDefaultAsync(item => item.Id == currentUserId.Value && item.DeletedAt == null, cancellationToken);

        if (currentModerator?.CuratorProfile is null)
        {
            return Results.Unauthorized();
        }

        if (!currentModerator.CuratorProfile.IsAdministrator)
        {
            return AuthEndpointSupport.MessageResult("Only administrator can invite moderators.", StatusCodes.Status403Forbidden);
        }

        if (!AuthSupport.IsValidEmail(request.Email))
        {
            return AuthEndpointSupport.MessageResult("Введите корректный email модератора.", StatusCodes.Status400BadRequest);
        }

        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return AuthEndpointSupport.MessageResult("Укажите имя модератора.", StatusCodes.Status400BadRequest);
        }

        if (string.IsNullOrWhiteSpace(request.Surname))
        {
            return AuthEndpointSupport.MessageResult("Укажите фамилию модератора.", StatusCodes.Status400BadRequest);
        }

        var normalizedEmail = AuthSupport.NormalizeEmail(request.Email);
        var now = DateTime.UtcNow;

        if (await db.Users.AnyAsync(item => item.DeletedAt == null && item.Email.ToLower() == normalizedEmail, cancellationToken))
        {
            return AuthEndpointSupport.MessageResult("Пользователь с таким email уже существует.", StatusCodes.Status409Conflict);
        }

        var hasActiveInvitation = await db.ModeratorInvitations.AnyAsync(
            item => item.Email.ToLower() == normalizedEmail
                && item.AcceptedAt == null
                && item.RevokedAt == null
                && item.ExpiresAt > now,
            cancellationToken);

        if (hasActiveInvitation)
        {
            return AuthEndpointSupport.MessageResult("Для этого email уже есть активное приглашение.", StatusCodes.Status409Conflict);
        }

        var invitation = new ModeratorInvitation
        {
            Email = normalizedEmail,
            Name = request.Name.Trim(),
            Surname = request.Surname.Trim(),
            Thirdname = string.IsNullOrWhiteSpace(request.Thirdname) ? null : request.Thirdname.Trim(),
            InvitedByUserId = currentUserId.Value,
        };

        var issue = invitationService.IssueToken(invitation);
        db.ModeratorInvitations.Add(invitation);
        await db.SaveChangesAsync(cancellationToken);

        var invitationUrl = BuildModeratorInvitationUrl(context, invitationService, issue.Token);
        var payload = new ModeratorInvitationResultDTO
        {
            InvitationId = invitation.Id,
            Email = invitation.Email,
            ExpiresAtUtc = issue.ExpiresAtUtc,
            Message = "Приглашение модератору создано и отправлено на email.",
        };

        try
        {
            var dispatchResult = await emailSender.SendAsync(
                invitation.Email,
                "Приглашение в кабинет модератора Tramplin",
                BuildModeratorInvitationEmailPlainTextBody(invitation, invitationUrl, issue.ExpiresAtUtc),
                BuildModeratorInvitationEmailHtmlBody(invitation, invitationUrl, issue.ExpiresAtUtc),
                cancellationToken);

            if (dispatchResult.Mode == EmailDispatchMode.LoggedToConsole)
            {
                payload.DebugToken = issue.Token;
                payload.InvitationUrl = invitationUrl;
            }
        }
        catch (Exception ex)
        {
            loggerFactory.CreateLogger("ModerationEndpoints").LogError(ex, "Failed to send moderator invitation to {Email}.", invitation.Email);
            payload.EmailDeliveryFailed = true;
            payload.InvitationUrl = invitationUrl;
            payload.DebugToken = issue.Token;
            payload.Message = "Приглашение создано, но письмо отправить не удалось. Скопируйте ссылку вручную.";
        }

        return Results.Created($"/api/moderation/moderator-invitations/{invitation.Id}", payload);
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
        company.VerificationReason = normalizedStatus is CompanyVerificationStatuses.Revision or CompanyVerificationStatuses.Rejected
            ? string.IsNullOrWhiteSpace(request.Reason) ? null : request.Reason.Trim()
            : null;
        await db.SaveChangesAsync();

        return Results.Ok(new
        {
            company.Id,
            VerificationStatus = normalizedStatus,
            company.VerificationReason,
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
        opportunity.ModerationReason = normalizedStatus is OpportunityModerationStatuses.Revision or OpportunityModerationStatuses.Rejected
            ? string.IsNullOrWhiteSpace(request.Reason) ? null : request.Reason.Trim()
            : null;
        await db.SaveChangesAsync();

        return Results.Ok(new
        {
            opportunity.Id,
            ModerationStatus = normalizedStatus,
            opportunity.ModerationReason,
        });
    }

    private static object BuildModerationOpportunityResponse(Opportunity opportunity) =>
        new
        {
            opportunity.Id,
            opportunity.EmployerId,
            CompanyName = opportunity.Employer.CompanyName,
            opportunity.Title,
            opportunity.Description,
            opportunity.LocationAddress,
            opportunity.LocationCity,
            opportunity.Latitude,
            opportunity.Longitude,
            opportunity.EmploymentType,
            opportunity.OpportunityType,
            opportunity.SalaryFrom,
            opportunity.SalaryTo,
            opportunity.IsPaid,
            opportunity.StipendFrom,
            opportunity.StipendTo,
            opportunity.Duration,
            opportunity.EventStartAt,
            opportunity.RegistrationDeadline,
            opportunity.MeetingFrequency,
            opportunity.SeatsCount,
            opportunity.PublishAt,
            opportunity.ExpireAt,
            opportunity.ContactsJson,
            opportunity.MediaContentJson,
            opportunity.DeletedAt,
            ModerationStatus = OpportunityModerationStatuses.Normalize(opportunity.ModerationStatus),
            opportunity.ModerationReason,
            Tags = opportunity.Tags.Select(tag => tag.Name).ToList(),
        };

    private static string BuildModeratorInvitationUrl(HttpContext context, ModeratorInvitationService invitationService, string token) =>
        $"{invitationService.ResolveFrontendBaseUrl(context)}/auth/moderator-invite?token={Uri.EscapeDataString(token)}";

    private static string? BuildModeratorDisplayName(string? name, string? surname, string? thirdname)
    {
        var parts = new[] { name, surname, thirdname }
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .Select(value => value!.Trim())
            .ToArray();

        return parts.Length > 0 ? string.Join(" ", parts) : null;
    }

    private static string BuildModeratorInvitationEmailPlainTextBody(ModeratorInvitation invitation, string invitationUrl, DateTime expiresAtUtc) =>
        $"""
        Вас пригласили в кабинет модератора Tramplin.

        Перейдите по ссылке, чтобы принять приглашение и задать пароль:
        {invitationUrl}

        Ссылка действует до {expiresAtUtc:yyyy-MM-dd HH:mm} UTC.

        Если вы не ожидали это приглашение, просто проигнорируйте письмо.
        """;

    private static string BuildModeratorInvitationEmailHtmlBody(ModeratorInvitation invitation, string invitationUrl, DateTime expiresAtUtc) =>
        $"""
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.5; color: #1f2937;">
            <h2 style="margin-bottom: 16px;">Приглашение в кабинет модератора</h2>
            <p>Здравствуйте, {invitation.Name} {invitation.Surname}.</p>
            <p>Вас пригласили в кабинет модератора Tramplin.</p>
            <p style="margin: 24px 0;">
              <a href="{invitationUrl}" style="display: inline-block; padding: 12px 20px; border-radius: 999px; background: #2f80ff; color: #ffffff; text-decoration: none; font-weight: 700;">
                Принять приглашение
              </a>
            </p>
            <p>Если кнопка не открывается, используйте ссылку:</p>
            <p><a href="{invitationUrl}">{invitationUrl}</a></p>
            <p>Ссылка действует до <strong>{expiresAtUtc:yyyy-MM-dd HH:mm} UTC</strong>.</p>
            <p>Если вы не ожидали это приглашение, просто проигнорируйте письмо.</p>
          </body>
        </html>
        """;
}

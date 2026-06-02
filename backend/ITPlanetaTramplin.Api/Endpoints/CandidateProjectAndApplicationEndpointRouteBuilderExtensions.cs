using Application.DBContext;
using DTO;
using ITPlanetaTramplin.Api.Auth;
using ITPlanetaTramplin.Api.Domain;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Models;
using System.Text.Json;

namespace ITPlanetaTramplin.Api.Endpoints;

internal static partial class CandidateEndpointRouteBuilderExtensions
{
    private sealed class CandidateProjectInput
    {
        public string Title { get; init; } = string.Empty;
        public string ProjectType { get; init; } = string.Empty;
        public string ShortDescription { get; init; } = string.Empty;
        public string? Organization { get; init; }
        public string Role { get; init; } = string.Empty;
        public int? TeamSize { get; set; }
        public DateOnly StartDate { get; init; }
        public DateOnly? EndDate { get; init; }
        public bool IsOngoing { get; init; }
        public string Problem { get; init; } = string.Empty;
        public string Contribution { get; init; } = string.Empty;
        public string Result { get; init; } = string.Empty;
        public string? Metrics { get; init; }
        public string? LessonsLearned { get; init; }
        public List<string> Tags { get; init; } = [];
        public string? CoverImageUrl { get; init; }
        public List<CandidateProjectParticipantInput> Participants { get; init; } = [];
        public string? DemoUrl { get; init; }
        public string? RepositoryUrl { get; init; }
        public string? DesignUrl { get; init; }
        public string? CaseStudyUrl { get; init; }
        public bool ShowInPortfolio { get; init; }
    }

    private sealed class CandidateProjectParticipantInput
    {
        public string Name { get; init; } = string.Empty;
        public string? Role { get; init; }
        public int? UserId { get; init; }
    }

    private static async Task<IResult> GetCurrentCandidateProjectsAsync(HttpContext context, ApplicationDBContext db)
    {
        var profile = await GetCurrentCandidateProfileAsync(context, db);
        if (profile is null)
        {
            return Results.Unauthorized();
        }

        var allProjects = await db.CandidateProjects
            .Include(item => item.Applicant)
            .OrderByDescending(item => item.UpdatedAt ?? item.CreatedAt)
            .ToListAsync();

        var filteredProjects = allProjects
            .Where(project => project.ApplicantId == profile.Id || 
                ParseCandidateProjectParticipants(project.ParticipantsJson).Any(p => p.UserId == profile.UserId))
            .Select(project => MapCandidateProject(project))
            .ToList();

        return Results.Ok(filteredProjects);
    }

    private static async Task<IResult> CreateCandidateProjectAsync(
        [FromBody] CandidateProjectCreateDTO request,
        HttpContext context,
        ApplicationDBContext db)
    {
        var profile = await GetCurrentCandidateProfileAsync(context, db);
        if (profile is null)
        {
            return Results.Unauthorized();
        }

        if (!TryNormalizeCandidateProjectInput(request, out var normalizedProject, out var validationError))
        {
            return AuthEndpointSupport.MessageResult(validationError, StatusCodes.Status400BadRequest);
        }

        var privacyError = await ValidateParticipantsPrivacyAsync(db, profile.UserId, request.Participants);
        if (privacyError != null)
        {
            return AuthEndpointSupport.MessageResult(privacyError, StatusCodes.Status400BadRequest);
        }

        var ownerName = $"{profile.Name} {profile.Surname}".Trim();
        normalizedProject.Participants.RemoveAll(p => p.UserId == profile.UserId || p.Name.Equals(ownerName, StringComparison.OrdinalIgnoreCase));
        normalizedProject.Participants.Add(new CandidateProjectParticipantInput
        {
            Name = ownerName,
            Role = normalizedProject.Role,
            UserId = profile.UserId
        });
        normalizedProject.TeamSize = normalizedProject.Participants.Count;

        var project = new CandidateProject
        {
            ApplicantId = profile.Id,
        };

        ApplyCandidateProject(project, normalizedProject);
        project.Tags = await ResolveActiveSkillsAndQueueInactiveAsync(db, normalizedProject.Tags);

        db.CandidateProjects.Add(project);
        await db.SaveChangesAsync();

        return Results.Created($"/api/candidate/me/projects/{project.Id}", MapCandidateProject(project));
    }

    private static async Task<IResult> UpdateCandidateProjectByRouteAsync(
        int projectId,
        [FromBody] CandidateProjectUpdateDTO request,
        HttpContext context,
        ApplicationDBContext db)
    {
        var profile = await GetCurrentCandidateProfileAsync(context, db);
        if (profile is null)
        {
            return Results.Unauthorized();
        }

        var project = await db.CandidateProjects.FirstOrDefaultAsync(item => item.Id == projectId);
        if (project is null)
        {
            return Results.NotFound();
        }

        var isOwner = project.ApplicantId == profile.Id;
        var isParticipant = ParseCandidateProjectParticipants(project.ParticipantsJson).Any(p => p.UserId == profile.UserId);

        if (!isOwner && !isParticipant)
        {
            return Results.Forbid();
        }

        var mergedRequest = new CandidateProjectCreateDTO
        {
            Title = request.Title ?? project.Title,
            ProjectType = request.ProjectType ?? project.ProjectType,
            ShortDescription = request.ShortDescription ?? project.ShortDescription,
            Organization = request.Organization ?? project.Organization,
            Role = request.Role ?? project.Role,
            TeamSize = request.TeamSize ?? project.TeamSize,
            StartDate = request.StartDate ?? project.StartDate.ToString("yyyy-MM-dd"),
            EndDate = request.EndDate ?? project.EndDate?.ToString("yyyy-MM-dd"),
            IsOngoing = request.IsOngoing ?? project.IsOngoing,
            Problem = request.Problem ?? project.Problem,
            Contribution = request.Contribution ?? project.Contribution,
            Result = request.Result ?? project.Result,
            Metrics = request.Metrics ?? project.Metrics,
            LessonsLearned = request.LessonsLearned ?? project.LessonsLearned,
            Tags = request.Tags ?? project.Tags,
            CoverImageUrl = request.CoverImageUrl ?? project.CoverImageUrl,
            Participants = request.Participants ?? ParseCandidateProjectParticipants(project.ParticipantsJson),
            DemoUrl = request.DemoUrl ?? project.DemoUrl,
            RepositoryUrl = request.RepositoryUrl ?? project.RepositoryUrl,
            DesignUrl = request.DesignUrl ?? project.DesignUrl,
            CaseStudyUrl = request.CaseStudyUrl ?? project.CaseStudyUrl,
            ShowInPortfolio = request.ShowInPortfolio ?? project.ShowInPortfolio,
        };

        if (!TryNormalizeCandidateProjectInput(mergedRequest, out var normalizedProject, out var validationError))
        {
            return AuthEndpointSupport.MessageResult(validationError, StatusCodes.Status400BadRequest);
        }

        var privacyError = await ValidateParticipantsPrivacyAsync(db, profile.UserId, mergedRequest.Participants);
        if (privacyError != null)
        {
            return AuthEndpointSupport.MessageResult(privacyError, StatusCodes.Status400BadRequest);
        }

        var ownerName = $"{profile.Name} {profile.Surname}".Trim();
        normalizedProject.Participants.RemoveAll(p => p.UserId == profile.UserId || p.Name.Equals(ownerName, StringComparison.OrdinalIgnoreCase));
        normalizedProject.Participants.Add(new CandidateProjectParticipantInput
        {
            Name = ownerName,
            Role = normalizedProject.Role,
            UserId = profile.UserId
        });
        normalizedProject.TeamSize = normalizedProject.Participants.Count;

        ApplyCandidateProject(project, normalizedProject);
        project.Tags = await ResolveActiveSkillsAndQueueInactiveAsync(db, normalizedProject.Tags);
        await db.SaveChangesAsync();

        return Results.Ok(MapCandidateProject(project));
    }

    private static async Task<IResult> DeleteCandidateProjectAsync(
        int projectId,
        HttpContext context,
        ApplicationDBContext db)
    {
        var profile = await GetCurrentCandidateProfileAsync(context, db);
        if (profile is null)
        {
            return Results.Unauthorized();
        }

        var project = await db.CandidateProjects.FirstOrDefaultAsync(item => item.Id == projectId && item.ApplicantId == profile.Id);
        if (project is null)
        {
            return Results.NotFound();
        }

        db.CandidateProjects.Remove(project);
        await db.SaveChangesAsync();
        return Results.Ok();
    }

    private static async Task<IResult> GetCurrentCandidateApplicationsAsync(HttpContext context, ApplicationDBContext db)
    {
        var profile = await GetCurrentCandidateProfileAsync(context, db);
        if (profile is null)
        {
            return Results.Unauthorized();
        }

        var applications = await db.Applications
            .Include(item => item.Opportunity)
            .ThenInclude(item => item.Employer)
            .Include(item => item.Opportunity)
            .ThenInclude(item => item.Tags)
            .Where(item => item.ApplicantId == profile.Id)
            .OrderByDescending(item => item.AppliedAt)
            .ToListAsync();

        var result = new List<OpportunityApplicationSummaryDTO>(applications.Count);
        foreach (var application in applications)
        {
            var summary = OpportunityApplicationMapping.ToCandidateSummary(application);
            summary.AllowPeerVisibility = application.AllowPeerVisibility;
            summary.OpportunityTags = application.Opportunity.Tags.Select(tag => tag.Name).ToList();
            summary.SocialContextPreview = await BuildApplicationSocialContextPreviewAsync(db, profile, application.Opportunity);
            result.Add(summary);
        }

        return Results.Ok(result);
    }

    private static Task<IResult> WithdrawCurrentCandidateApplicationAsync(
        int applicationId,
        HttpContext context,
        ApplicationDBContext db) =>
        UpdateCurrentCandidateApplicationAsync(
            applicationId,
            new[] { OpportunityApplicationStatuses.Submitted, OpportunityApplicationStatuses.Reviewing, OpportunityApplicationStatuses.Invited },
            OpportunityApplicationStatuses.Withdrawn,
            "Отменить или отклонить можно только отправленный, рассматриваемый или приглашённый отклик.",
            context,
            db);

    private static Task<IResult> ConfirmCurrentCandidateApplicationAsync(
        int applicationId,
        HttpContext context,
        ApplicationDBContext db) =>
        UpdateCurrentCandidateApplicationAsync(
            applicationId,
            new[] { OpportunityApplicationStatuses.Invited },
            OpportunityApplicationStatuses.Accepted,
            "Подтвердить можно только отклик со статусом приглашения.",
            context,
            db);

    private static async Task<IResult> UpdateCurrentCandidateApplicationAsync(
        int applicationId,
        IReadOnlyCollection<string> allowedCurrentStatuses,
        string nextStatus,
        string validationMessage,
        HttpContext context,
        ApplicationDBContext db)
    {
        var profile = await GetCurrentCandidateProfileAsync(context, db);
        if (profile is null)
        {
            return Results.Unauthorized();
        }

        var application = await db.Applications
            .Include(item => item.Opportunity)
            .ThenInclude(item => item.Employer)
            .Include(item => item.Opportunity)
            .ThenInclude(item => item.Tags)
            .FirstOrDefaultAsync(item => item.Id == applicationId && item.ApplicantId == profile.Id);

        if (application is null)
        {
            return Results.NotFound();
        }

        var normalizedCurrentStatus = OpportunityApplicationStatuses.Normalize(application.Status);
        if (!allowedCurrentStatuses.Contains(normalizedCurrentStatus))
        {
            return AuthEndpointSupport.MessageResult(validationMessage, StatusCodes.Status400BadRequest);
        }

        if (nextStatus == OpportunityApplicationStatuses.Accepted &&
            application.Opportunity.OpportunityType == "mentoring")
        {
            var acceptedCount = await db.Applications.CountAsync(item => item.OpportunityId == application.OpportunityId && item.Status == OpportunityApplicationStatuses.Accepted);
            if (application.Opportunity.SeatsCount.HasValue && acceptedCount >= application.Opportunity.SeatsCount.Value)
            {
                return AuthEndpointSupport.MessageResult("Не удалось принять приглашение: все свободные места на программу уже заняты.", StatusCodes.Status400BadRequest);
            }
        }

        application.Status = nextStatus;
        NotificationEndpointRouteBuilderExtensions.CreateNotification(
            db,
            application.Opportunity.Employer.UserId,
            "application.candidate_updated",
            "Кандидат обновил отклик",
            BuildCandidateApplicationChangeMessage(application.Opportunity.Title, nextStatus),
            "/company/dashboard/responses",
            actorUserId: profile.UserId,
            opportunityId: application.OpportunityId,
            applicationId: application.Id);
        await db.SaveChangesAsync();

        return Results.Ok(OpportunityApplicationMapping.ToCandidateSummary(application));
    }

    private static string BuildCandidateApplicationChangeMessage(string opportunityTitle, string status) =>
        status switch
        {
            OpportunityApplicationStatuses.Withdrawn => $"Кандидат отменил отклик на «{opportunityTitle}».",
            OpportunityApplicationStatuses.Accepted => $"Кандидат подтвердил приглашение по «{opportunityTitle}».",
            _ => $"Кандидат обновил отклик на «{opportunityTitle}».",
        };

    private static void ApplyCandidateProject(CandidateProject project, CandidateProjectInput normalizedProject)
    {
        project.Title = normalizedProject.Title;
        project.ProjectType = normalizedProject.ProjectType;
        project.ShortDescription = normalizedProject.ShortDescription;
        project.Organization = normalizedProject.Organization;
        project.Role = normalizedProject.Role;
        project.TeamSize = normalizedProject.TeamSize;
        project.StartDate = normalizedProject.StartDate;
        project.EndDate = normalizedProject.EndDate;
        project.IsOngoing = normalizedProject.IsOngoing;
        project.Problem = normalizedProject.Problem;
        project.Contribution = normalizedProject.Contribution;
        project.Result = normalizedProject.Result;
        project.Metrics = normalizedProject.Metrics;
        project.LessonsLearned = normalizedProject.LessonsLearned;
        project.Tags = normalizedProject.Tags;
        project.CoverImageUrl = normalizedProject.CoverImageUrl;
        project.ParticipantsJson = SerializeCandidateProjectParticipants(normalizedProject.Participants);
        project.DemoUrl = normalizedProject.DemoUrl;
        project.RepositoryUrl = normalizedProject.RepositoryUrl;
        project.DesignUrl = normalizedProject.DesignUrl;
        project.CaseStudyUrl = normalizedProject.CaseStudyUrl;
        project.ShowInPortfolio = normalizedProject.ShowInPortfolio;
        project.UpdatedAt = DateTime.UtcNow;
    }

    private static CandidateProjectReadDTO MapCandidateProject(CandidateProject project) =>
        new()
        {
            Id = project.Id,
            ApplicantId = project.ApplicantId,
            ApplicantUserId = project.Applicant?.UserId,
            Title = project.Title,
            ProjectType = project.ProjectType,
            ShortDescription = project.ShortDescription,
            Organization = project.Organization,
            Role = project.Role,
            TeamSize = project.TeamSize,
            StartDate = project.StartDate.ToString("yyyy-MM-dd"),
            EndDate = project.EndDate?.ToString("yyyy-MM-dd"),
            IsOngoing = project.IsOngoing,
            Problem = project.Problem,
            Contribution = project.Contribution,
            Result = project.Result,
            Metrics = project.Metrics,
            LessonsLearned = project.LessonsLearned,
            Tags = project.Tags,
            CoverImageUrl = project.CoverImageUrl,
            Participants = ParseCandidateProjectParticipants(project.ParticipantsJson),
            DemoUrl = project.DemoUrl,
            RepositoryUrl = project.RepositoryUrl,
            DesignUrl = project.DesignUrl,
            CaseStudyUrl = project.CaseStudyUrl,
            ShowInPortfolio = project.ShowInPortfolio,
            CreatedAt = project.CreatedAt,
            UpdatedAt = project.UpdatedAt,
        };

    private static bool TryNormalizeCandidateProjectInput(
        CandidateProjectCreateDTO request,
        out CandidateProjectInput normalizedProject,
        out string validationError)
    {
        normalizedProject = new CandidateProjectInput();
        validationError = string.Empty;

        var title = NormalizeRequiredText(request.Title);
        if (title is null)
        {
            validationError = "Введите название проекта.";
            return false;
        }

        var projectType = NormalizeRequiredText(request.ProjectType);
        if (projectType is null)
        {
            validationError = "Выберите тип проекта.";
            return false;
        }

        var shortDescription = NormalizeRequiredText(request.ShortDescription);
        if (shortDescription is null)
        {
            validationError = "Добавьте краткое описание проекта.";
            return false;
        }

        var role = NormalizeRequiredText(request.Role);
        if (role is null)
        {
            validationError = "Укажите вашу роль в проекте.";
            return false;
        }

        var problem = NormalizeRequiredText(request.Problem);
        if (problem is null)
        {
            validationError = "Опишите задачу проекта.";
            return false;
        }

        var contribution = NormalizeRequiredText(request.Contribution);
        if (contribution is null)
        {
            validationError = "Опишите ваш вклад в проект.";
            return false;
        }

        var result = NormalizeRequiredText(request.Result);
        if (result is null)
        {
            validationError = "Опишите итог проекта.";
            return false;
        }

        if (!TryParseProjectDate(request.StartDate, out var startDate))
        {
            validationError = "Укажите корректную дату начала проекта.";
            return false;
        }

        DateOnly? endDate = null;
        if (!request.IsOngoing)
        {
            if (!TryParseProjectDate(request.EndDate, out var parsedEndDate))
            {
                validationError = "Укажите корректную дату завершения проекта.";
                return false;
            }

            endDate = parsedEndDate;
            if (endDate < startDate)
            {
                validationError = "Дата завершения проекта не может быть раньше даты начала.";
                return false;
            }
        }

        if (request.TeamSize.HasValue && request.TeamSize <= 0)
        {
            validationError = "Размер команды должен быть положительным числом.";
            return false;
        }

        if (!TryNormalizeCoverImage(request.CoverImageUrl, out var coverImageUrl) ||
            !TryNormalizeProjectLink(request.DemoUrl, out var demoUrl) ||
            !TryNormalizeProjectLink(request.RepositoryUrl, out var repositoryUrl) ||
            !TryNormalizeProjectLink(request.DesignUrl, out var designUrl) ||
            !TryNormalizeProjectLink(request.CaseStudyUrl, out var caseStudyUrl))
        {
            validationError = "Ссылки проекта должны начинаться с http:// или https://, а изображение может быть ссылкой или загруженным файлом.";
            return false;
        }

        var tags = request.Tags?
            .Select(item => item?.Trim())
            .Where(item => !string.IsNullOrWhiteSpace(item))
            .Select(item => item!)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList() ?? [];

        if (tags.Count == 0)
        {
            validationError = "Добавьте хотя бы один тег проекта.";
            return false;
        }

        var participants = new List<CandidateProjectParticipantInput>();
        if (request.Participants is not null)
        {
            foreach (var participant in request.Participants)
            {
                var participantName = NormalizeRequiredText(participant?.Name);
                if (participantName is null)
                {
                    validationError = "У каждого участника проекта должно быть имя.";
                    return false;
                }

                participants.Add(new CandidateProjectParticipantInput
                {
                    Name = participantName,
                    Role = NormalizeOptionalText(participant?.Role),
                    UserId = participant?.UserId,
                });
            }
        }

        participants = participants
            .GroupBy(item => $"{item.Name}\u001f{item.Role}\u001f{item.UserId}", StringComparer.OrdinalIgnoreCase)
            .Select(group => group.First())
            .ToList();

        if (request.TeamSize.HasValue && participants.Count > request.TeamSize.Value)
        {
            validationError = "Количество участников не может быть больше размера команды.";
            return false;
        }

        normalizedProject = new CandidateProjectInput
        {
            Title = title,
            ProjectType = projectType,
            ShortDescription = shortDescription,
            Organization = NormalizeOptionalText(request.Organization),
            Role = role,
            TeamSize = request.TeamSize,
            StartDate = startDate,
            EndDate = request.IsOngoing ? null : endDate,
            IsOngoing = request.IsOngoing,
            Problem = problem,
            Contribution = contribution,
            Result = result,
            Metrics = NormalizeOptionalText(request.Metrics),
            LessonsLearned = NormalizeOptionalText(request.LessonsLearned),
            Tags = tags,
            CoverImageUrl = coverImageUrl,
            Participants = participants,
            DemoUrl = demoUrl,
            RepositoryUrl = repositoryUrl,
            DesignUrl = designUrl,
            CaseStudyUrl = caseStudyUrl,
            ShowInPortfolio = request.ShowInPortfolio,
        };

        return true;
    }

    private static string? NormalizeRequiredText(string? value)
    {
        var normalized = NormalizeOptionalText(value);
        return string.IsNullOrWhiteSpace(normalized) ? null : normalized;
    }

    private static string? NormalizeOptionalText(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static bool TryNormalizeProjectLink(string? value, out string? normalizedUrl)
    {
        normalizedUrl = NormalizeOptionalText(value);
        if (normalizedUrl is null)
        {
            return true;
        }

        return Uri.TryCreate(normalizedUrl, UriKind.Absolute, out var uri)
            && (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps);
    }

    private static bool TryNormalizeCoverImage(string? value, out string? normalizedCoverImage)
    {
        normalizedCoverImage = NormalizeOptionalText(value);
        if (normalizedCoverImage is null)
        {
            return true;
        }

        if (TryNormalizeProjectLink(normalizedCoverImage, out var normalizedLink))
        {
            normalizedCoverImage = normalizedLink;
            return true;
        }

        return IsSupportedImageDataUrl(normalizedCoverImage);
    }

    private static bool IsSupportedImageDataUrl(string value)
    {
        if (!value.StartsWith("data:image/", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        var separatorIndex = value.IndexOf(',', StringComparison.Ordinal);
        if (separatorIndex <= 0)
        {
            return false;
        }

        var metadata = value[..separatorIndex];
        var payload = value[(separatorIndex + 1)..];
        return metadata.Contains(";base64", StringComparison.OrdinalIgnoreCase) && !string.IsNullOrWhiteSpace(payload);
    }

    private static string? SerializeCandidateProjectParticipants(IReadOnlyCollection<CandidateProjectParticipantInput> participants)
    {
        if (participants.Count == 0)
        {
            return "[]";
        }

        return JsonSerializer.Serialize(
            participants.Select(item => new CandidateProjectParticipantDTO
            {
                Name = item.Name,
                Role = item.Role,
                UserId = item.UserId,
            }));
    }

    private static List<CandidateProjectParticipantDTO> ParseCandidateProjectParticipants(string? participantsJson)
    {
        if (string.IsNullOrWhiteSpace(participantsJson))
        {
            return [];
        }

        try
        {
            return JsonSerializer.Deserialize<List<CandidateProjectParticipantDTO>>(participantsJson) ?? [];
        }
        catch (JsonException)
        {
            return [];
        }
    }

    private static bool TryParseProjectDate(string? value, out DateOnly parsedDate)
    {
        if (DateOnly.TryParse(value, out parsedDate))
        {
            return true;
        }

        if (!string.IsNullOrWhiteSpace(value) &&
            DateTime.TryParse($"{value.Trim()}-01", out var parsedDateTime))
        {
            parsedDate = DateOnly.FromDateTime(parsedDateTime);
            return true;
        }

        parsedDate = default;
        return false;
    }

    private static async Task<string?> ValidateParticipantsPrivacyAsync(
        ApplicationDBContext db,
        int currentUserId,
        List<CandidateProjectParticipantDTO>? participants)
    {
        if (participants == null || participants.Count == 0)
        {
            return null;
        }

        foreach (var participant in participants)
        {
            if (participant.UserId.HasValue && participant.UserId.Value != currentUserId)
            {
                var targetUserId = participant.UserId.Value;
                var targetProfile = await db.ApplicantProfiles
                    .FirstOrDefaultAsync(item => item.UserId == targetUserId);

                if (targetProfile == null)
                {
                    continue;
                }

                var links = ParseJsonObject(targetProfile.Links);
                var preferences = GetObjectNode(links, "preferences");
                var permission = preferences?["projectAdditionPermission"]?.GetValue<string?>()?.Trim().ToLowerInvariant();
                if (string.IsNullOrEmpty(permission))
                {
                    permission = "everyone";
                }

                if (permission == "nobody")
                {
                    return $"Пользователь {participant.Name} запретил добавлять себя в проекты.";
                }

                if (permission == "contacts")
                {
                    var isFriendOrContact = await db.Contacts.AnyAsync(item => item.UserId == targetUserId && item.ContactProfileId == currentUserId)
                        || await db.Contacts.AnyAsync(item => item.UserId == currentUserId && item.ContactProfileId == targetUserId)
                        || await db.FriendRequests.AnyAsync(item =>
                            ((item.SenderUserId == currentUserId && item.RecipientUserId == targetUserId)
                             || (item.SenderUserId == targetUserId && item.RecipientUserId == currentUserId))
                            && item.Status == FriendRequestStatuses.Accepted);

                    if (!isFriendOrContact)
                    {
                        return $"Пользователь {participant.Name} разрешает добавлять себя в проекты только контактам и друзьям.";
                    }
                }
            }
        }

        return null;
    }
}

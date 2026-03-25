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
    private sealed class CandidateProjectInput
    {
        public string Title { get; init; } = string.Empty;
        public string ProjectType { get; init; } = string.Empty;
        public string ShortDescription { get; init; } = string.Empty;
        public string? Organization { get; init; }
        public string Role { get; init; } = string.Empty;
        public int? TeamSize { get; init; }
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
        public string? DemoUrl { get; init; }
        public string? RepositoryUrl { get; init; }
        public string? DesignUrl { get; init; }
        public string? CaseStudyUrl { get; init; }
        public bool ShowInPortfolio { get; init; }
    }

    private static async Task<IResult> GetCurrentCandidateProjectsAsync(HttpContext context, ApplicationDBContext db)
    {
        var profile = await GetCurrentCandidateProfileAsync(context, db);
        if (profile is null)
        {
            return Results.Unauthorized();
        }

        var projects = await db.CandidateProjects
            .Where(item => item.ApplicantId == profile.Id)
            .OrderByDescending(item => item.UpdatedAt ?? item.CreatedAt)
            .Select(item => MapCandidateProject(item))
            .ToListAsync();

        return Results.Ok(projects);
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

        var project = new CandidateProject
        {
            ApplicantId = profile.Id,
        };

        ApplyCandidateProject(project, normalizedProject);

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

        var project = await db.CandidateProjects.FirstOrDefaultAsync(item => item.Id == projectId && item.ApplicantId == profile.Id);
        if (project is null)
        {
            return Results.NotFound();
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

        ApplyCandidateProject(project, normalizedProject);
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
            .Where(item => item.ApplicantId == profile.Id)
            .OrderByDescending(item => item.AppliedAt)
            .Select(item => new
            {
                item.Id,
                item.OpportunityId,
                item.Status,
                item.EmployerNote,
                item.AppliedAt,
                OpportunityTitle = item.Opportunity.Title,
                OpportunityType = item.Opportunity.OpportunityType,
                CompanyName = item.Opportunity.Employer.CompanyName,
                item.Opportunity.LocationCity,
                OpportunityDeleted = item.Opportunity.DeletedAt != null,
                ModerationStatus = item.Opportunity.ModerationStatus,
            })
            .ToListAsync();

        return Results.Ok(applications);
    }

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

        if (!TryNormalizeUrl(request.CoverImageUrl, out var coverImageUrl) ||
            !TryNormalizeUrl(request.DemoUrl, out var demoUrl) ||
            !TryNormalizeUrl(request.RepositoryUrl, out var repositoryUrl) ||
            !TryNormalizeUrl(request.DesignUrl, out var designUrl) ||
            !TryNormalizeUrl(request.CaseStudyUrl, out var caseStudyUrl))
        {
            validationError = "Ссылки проекта должны начинаться с http:// или https://.";
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

    private static bool TryNormalizeUrl(string? value, out string? normalizedUrl)
    {
        normalizedUrl = NormalizeOptionalText(value);
        if (normalizedUrl is null)
        {
            return true;
        }

        return Uri.TryCreate(normalizedUrl, UriKind.Absolute, out var uri)
            && (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps);
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
}

using System.Diagnostics;
using System.Text.Json;
using Application.DBContext;
using DTO;
using ITPlanetaTramplin.Api.Domain;
using Microsoft.EntityFrameworkCore;
using Models;

namespace ITPlanetaTramplin.Api.Services;

public interface IAiCareerJobService
{
    Task<AiCareerRecommendationResponseDTO> GetOverviewAsync(int applicantId, CancellationToken cancellationToken);

    Task<AiCareerJobResponseDTO> QueueAsync(int applicantId, string reason, CancellationToken cancellationToken);

    Task<AiCareerJobResponseDTO?> GetJobAsync(Guid jobId, int applicantId, CancellationToken cancellationToken);

    Task<bool> ProcessNextStepAsync(CancellationToken cancellationToken);
}

public sealed class AiCareerJobService : IAiCareerJobService
{
    public const string ProfileStep = "profile";
    public const string CareerStep = "career";
    public const string OpportunitiesStep = "opportunities";

    private static readonly string[] StepNames = [ProfileStep, CareerStep, OpportunitiesStep];
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private readonly ApplicationDBContext _db;
    private readonly IAiCareerStepGenerator _generator;
    private readonly ILogger<AiCareerJobService> _logger;

    public AiCareerJobService(
        ApplicationDBContext db,
        IAiCareerStepGenerator generator,
        ILogger<AiCareerJobService> logger)
    {
        _db = db;
        _generator = generator;
        _logger = logger;
    }

    public async Task<AiCareerRecommendationResponseDTO> GetOverviewAsync(
        int applicantId,
        CancellationToken cancellationToken)
    {
        var data = await LoadDataAsync(applicantId, cancellationToken);
        if (data is null)
        {
            return CreateFallback([], "Профиль кандидата не найден.", "unavailable");
        }

        var caches = await _db.AiCareerCaches
            .Where(item => item.ApplicantId == applicantId &&
                (item.Scope == ProfileStep ||
                 item.Scope == CareerStep ||
                 item.Scope == OpportunitiesStep ||
                 item.Scope == "legacy"))
            .ToListAsync(cancellationToken);
        var latestJob = await _db.AiCareerJobs
            .Include(item => item.Steps)
            .Where(item => item.ApplicantId == applicantId)
            .OrderByDescending(item => item.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);
        var currentSignature = AiCareerSignature.Build(
            data.Profile,
            data.Education,
            data.Achievements,
            data.Projects,
            data.Applications);

        var profileCache = caches.FirstOrDefault(item => item.Scope == ProfileStep);
        var careerCache = caches.FirstOrDefault(item => item.Scope == CareerStep);
        var opportunitiesCache = caches.FirstOrDefault(item => item.Scope == OpportunitiesStep);
        var legacyCache = caches.FirstOrDefault(item => item.Scope == "legacy");
        var profilePart = Deserialize<AiCareerProfilePartDTO>(profileCache?.PayloadJson);
        var careerPart = Deserialize<AiCareerRoutePartDTO>(careerCache?.PayloadJson);
        var opportunitiesPart = Deserialize<AiCareerOpportunityPartDTO>(opportunitiesCache?.PayloadJson);

        if (profilePart is null && careerPart is null && opportunitiesPart is null && legacyCache is not null)
        {
            var legacy = Deserialize<AiCareerRecommendationResponseDTO>(legacyCache.PayloadJson);
            if (legacy is not null)
            {
                legacy.Generation = latestJob is null ? null : MapGeneration(latestJob);
                legacy.PartialFailures = MapFailures(latestJob);
                legacy.IsStale = legacyCache.Signature != currentSignature;
                legacy.Status = legacy.IsStale ? "stale" : legacy.Status;
                legacy.RefreshReason = legacy.IsStale ? "profile_or_applications_changed" : "cache_hit";
                return legacy;
            }
        }

        var response = CreateFallback(
            data.Opportunities.Select(item => item.Id).Take(4),
            "ИИ-анализ ещё не сформирован. Запустите генерацию обзора.",
            "unavailable");
        var successfulParts = 0;
        var signatures = new List<string>();

        if (profilePart is not null)
        {
            successfulParts++;
            signatures.Add(profileCache!.Signature);
            response.Summary = profilePart.Summary;
            response.ProfileAssessment = profilePart.ProfileAssessment;
            response.PortfolioAssessment = profilePart.PortfolioAssessment;
        }

        if (careerPart is not null)
        {
            successfulParts++;
            signatures.Add(careerCache!.Signature);
            response.NextActions = careerPart.NextActions;
            response.MissingSkills = careerPart.MissingSkills;
            response.CareerPlan = careerPart.CareerPlan;
            response.SalaryInsight = careerPart.SalaryInsight;
            response.SkillGaps = careerPart.SkillGaps;
            response.EventInsight = careerPart.EventInsight;
            response.RecommendedCourses = careerPart.RecommendedCourses;
        }

        if (opportunitiesPart is not null)
        {
            successfulParts++;
            signatures.Add(opportunitiesCache!.Signature);
            response.Sections = opportunitiesPart.Sections;
            response.Items = opportunitiesPart.Items;
        }

        response.Generation = latestJob is null ? null : MapGeneration(latestJob);
        response.PartialFailures = MapFailures(latestJob);
        response.GeneratedAt = caches
            .Where(item => item.Scope is ProfileStep or CareerStep or OpportunitiesStep)
            .Select(item => (DateTime?)item.CreatedAt)
            .Max();
        response.Signature = signatures.FirstOrDefault() ?? currentSignature;
        response.IsStale = signatures.Any(signature => signature != currentSignature);

        if (successfulParts > 0)
        {
            response.Source = "ai";
            response.IsFallback = false;
            response.Status = response.IsStale
                ? "stale"
                : successfulParts == StepNames.Length && response.PartialFailures.Count == 0
                    ? "fresh"
                    : "partial";
            response.RefreshReason = response.IsStale
                ? "profile_or_applications_changed"
                : latestJob?.Reason ?? "cache_hit";
            response.ErrorMessage = response.PartialFailures.Count > 0
                ? "Часть AI-разбора временно недоступна."
                : null;
        }
        else
        {
            response.RefreshReason = "no_cache";
        }

        return response;
    }

    public async Task<AiCareerJobResponseDTO> QueueAsync(
        int applicantId,
        string reason,
        CancellationToken cancellationToken)
    {
        var active = await _db.AiCareerJobs
            .Include(item => item.Steps)
            .Where(item => item.ApplicantId == applicantId &&
                (item.Status == "queued" || item.Status == "running"))
            .OrderByDescending(item => item.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);
        if (active is not null)
        {
            return MapJob(active);
        }

        var data = await LoadDataAsync(applicantId, cancellationToken)
            ?? throw new InvalidOperationException("Candidate profile was not found.");
        var now = DateTime.UtcNow;
        var job = new AiCareerJob
        {
            Id = Guid.NewGuid(),
            ApplicantId = applicantId,
            Status = "queued",
            Reason = NormalizeReason(reason),
            Signature = AiCareerSignature.Build(
                data.Profile,
                data.Education,
                data.Achievements,
                data.Projects,
                data.Applications),
            CreatedAt = now,
            Steps = StepNames.Select(step => new AiCareerJobStep
            {
                Step = step,
                Status = "queued",
                AvailableAt = now,
            }).ToList(),
        };
        _db.AiCareerJobs.Add(job);

        try
        {
            await _db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException)
        {
            _db.ChangeTracker.Clear();
            active = await _db.AiCareerJobs
                .Include(item => item.Steps)
                .Where(item => item.ApplicantId == applicantId &&
                    (item.Status == "queued" || item.Status == "running"))
                .OrderByDescending(item => item.CreatedAt)
                .FirstAsync(cancellationToken);
            return MapJob(active);
        }

        return MapJob(job);
    }

    public async Task<AiCareerJobResponseDTO?> GetJobAsync(
        Guid jobId,
        int applicantId,
        CancellationToken cancellationToken)
    {
        var job = await _db.AiCareerJobs
            .Include(item => item.Steps)
            .FirstOrDefaultAsync(
                item => item.Id == jobId && item.ApplicantId == applicantId,
                cancellationToken);
        return job is null ? null : MapJob(job);
    }

    public async Task<bool> ProcessNextStepAsync(CancellationToken cancellationToken)
    {
        var step = await ClaimStepAsync(cancellationToken);
        if (step is null)
        {
            return false;
        }

        var stopwatch = Stopwatch.StartNew();
        var data = await LoadDataAsync(step.Job.ApplicantId, cancellationToken);
        if (data is null)
        {
            await CompleteFailureAsync(step, "candidate_not_found", false, cancellationToken);
            return true;
        }

        string? payload = null;
        string? errorCode = null;
        var retryable = false;
        int? httpStatus = null;
        var responseLength = 0;

        try
        {
            switch (step.Step)
            {
                case ProfileStep:
                {
                    var result = await _generator.GenerateProfileAsync(
                        data.Profile,
                        data.Education,
                        data.Achievements,
                        data.Projects,
                        cancellationToken);
                    payload = result.IsSuccess ? JsonSerializer.Serialize(result.Value, JsonOptions) : null;
                    errorCode = result.ErrorCode;
                    retryable = result.IsRetryable;
                    httpStatus = result.HttpStatus;
                    responseLength = result.ResponseLength;
                    break;
                }
                case CareerStep:
                {
                    var result = await _generator.GenerateCareerAsync(
                        data.Profile,
                        data.Education,
                        data.Achievements,
                        data.Projects,
                        data.Applications,
                        cancellationToken);
                    payload = result.IsSuccess ? JsonSerializer.Serialize(result.Value, JsonOptions) : null;
                    errorCode = result.ErrorCode;
                    retryable = result.IsRetryable;
                    httpStatus = result.HttpStatus;
                    responseLength = result.ResponseLength;
                    break;
                }
                case OpportunitiesStep:
                {
                    var result = await _generator.GenerateOpportunitiesAsync(
                        data.Profile,
                        data.Projects,
                        data.Opportunities,
                        cancellationToken);
                    payload = result.IsSuccess ? JsonSerializer.Serialize(result.Value, JsonOptions) : null;
                    errorCode = result.ErrorCode;
                    retryable = result.IsRetryable;
                    httpStatus = result.HttpStatus;
                    responseLength = result.ResponseLength;
                    break;
                }
                default:
                    errorCode = "unknown_step";
                    break;
            }
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "AI career job step crashed. jobId={JobId}, step={Step}", step.JobId, step.Step);
            errorCode = "internal_error";
            retryable = true;
        }

        if (payload is not null)
        {
            await CompleteSuccessAsync(step, payload, cancellationToken);
        }
        else
        {
            await CompleteFailureAsync(step, errorCode ?? "unknown_error", retryable, cancellationToken);
        }

        _logger.LogInformation(
            "AI career job step completed. jobId={JobId}, step={Step}, attempt={Attempt}, durationMs={DurationMs}, responseLength={ResponseLength}, httpStatus={HttpStatus}, errorCode={ErrorCode}",
            step.JobId,
            step.Step,
            step.AttemptCount,
            stopwatch.ElapsedMilliseconds,
            responseLength,
            httpStatus,
            errorCode);
        return true;
    }

    private async Task<AiCareerJobStep?> ClaimStepAsync(CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        if (!_db.Database.IsRelational())
        {
            var inMemoryStep = await _db.AiCareerJobSteps
                .Include(item => item.Job)
                .Where(item =>
                    (item.Status == "queued" && item.AvailableAt <= now) ||
                    (item.Status == "running" && item.LeaseUntil < now))
                .OrderBy(item => item.AvailableAt)
                .ThenBy(item => item.Id)
                .FirstOrDefaultAsync(cancellationToken);
            if (inMemoryStep is null)
            {
                return null;
            }

            MarkClaimed(inMemoryStep, now);
            await _db.SaveChangesAsync(cancellationToken);
            return inMemoryStep;
        }

        var connection = _db.Database.GetDbConnection();
        if (connection.State != System.Data.ConnectionState.Open)
        {
            await connection.OpenAsync(cancellationToken);
        }

        int? claimedId = null;
        await using (var command = connection.CreateCommand())
        {
            command.CommandText = """
                UPDATE ai_career_job_steps
                SET status = 'running', attempt_count = attempt_count + 1, started_at = COALESCE(started_at, @now), lease_until = @leaseUntil, error_code = NULL, error_message = NULL
                WHERE id = (
                    SELECT id
                    FROM ai_career_job_steps
                    WHERE (status = 'queued' AND available_at <= @now)
                       OR (status = 'running' AND lease_until < @now)
                    ORDER BY available_at, id
                    FOR UPDATE SKIP LOCKED
                    LIMIT 1
                )
                RETURNING id;
                """;
            var nowParam = command.CreateParameter();
            nowParam.ParameterName = "@now";
            nowParam.Value = now;
            command.Parameters.Add(nowParam);

            var leaseParam = command.CreateParameter();
            leaseParam.ParameterName = "@leaseUntil";
            leaseParam.Value = now.AddMinutes(3);
            command.Parameters.Add(leaseParam);

            var result = await command.ExecuteScalarAsync(cancellationToken);
            if (result != null && result != DBNull.Value)
            {
                claimedId = (int)result;
            }
        }

        if (claimedId is null)
        {
            return null;
        }

        var step = await _db.AiCareerJobSteps
            .FirstAsync(item => item.Id == claimedId.Value, cancellationToken);

        await _db.Entry(step)
            .Reference(item => item.Job)
            .LoadAsync(cancellationToken);

        step.Job.Status = "running";
        step.Job.StartedAt ??= now;
        await _db.SaveChangesAsync(cancellationToken);

        return step;
    }

    private static void MarkClaimed(AiCareerJobStep step, DateTime now)
    {
        step.Status = "running";
        step.AttemptCount++;
        step.StartedAt ??= now;
        step.LeaseUntil = now.AddMinutes(3);
        step.ErrorCode = null;
        step.ErrorMessage = null;
        step.Job.Status = "running";
        step.Job.StartedAt ??= now;
    }

    private async Task CompleteSuccessAsync(
        AiCareerJobStep step,
        string payload,
        CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        var cache = await _db.AiCareerCaches
            .FirstOrDefaultAsync(
                item => item.ApplicantId == step.Job.ApplicantId && item.Scope == step.Step,
                cancellationToken);
        if (cache is null)
        {
            cache = new AiCareerCache
            {
                ApplicantId = step.Job.ApplicantId,
                Scope = step.Step,
            };
            _db.AiCareerCaches.Add(cache);
        }

        cache.Signature = step.Job.Signature;
        cache.PayloadJson = payload;
        cache.CreatedAt = now;
        cache.ExpiresAt = now.AddDays(30);
        cache.LastServedAt = now;
        step.Status = "succeeded";
        step.CompletedAt = now;
        step.LeaseUntil = null;
        step.ErrorCode = null;
        step.ErrorMessage = null;
        await _db.SaveChangesAsync(cancellationToken);
        await FinalizeJobAsync(step.JobId, cancellationToken);
    }

    private async Task CompleteFailureAsync(
        AiCareerJobStep step,
        string errorCode,
        bool retryable,
        CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        step.ErrorCode = errorCode;
        step.ErrorMessage = GetUserErrorMessage(step.Step);
        step.LeaseUntil = null;

        if (retryable && step.AttemptCount < 3)
        {
            step.Status = "queued";
            step.AvailableAt = now.AddSeconds(step.AttemptCount == 1 ? 2 : 10);
        }
        else
        {
            step.Status = "failed";
            step.CompletedAt = now;
        }

        await _db.SaveChangesAsync(cancellationToken);
        await FinalizeJobAsync(step.JobId, cancellationToken);
    }

    private async Task FinalizeJobAsync(Guid jobId, CancellationToken cancellationToken)
    {
        var job = await _db.AiCareerJobs
            .Include(item => item.Steps)
            .FirstAsync(item => item.Id == jobId, cancellationToken);
        if (job.Steps.Any(item => item.Status is "queued" or "running"))
        {
            return;
        }

        var succeeded = job.Steps.Count(item => item.Status == "succeeded");
        job.Status = succeeded == job.Steps.Count
            ? "succeeded"
            : succeeded > 0
                ? "partial"
                : "failed";
        job.CompletedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);
    }

    private async Task<CandidateData?> LoadDataAsync(int applicantId, CancellationToken cancellationToken)
    {
        var profile = await _db.ApplicantProfiles.FirstOrDefaultAsync(item => item.Id == applicantId, cancellationToken);
        if (profile is null)
        {
            return null;
        }

        var education = await _db.ApplicantEducations
            .Where(item => item.ApplicantId == applicantId)
            .ToListAsync(cancellationToken);
        var achievements = await _db.ApplicantAchievements
            .Where(item => item.ApplicantId == applicantId)
            .ToListAsync(cancellationToken);
        var projects = await _db.CandidateProjects
            .Where(item => item.ApplicantId == applicantId)
            .ToListAsync(cancellationToken);
        var applications = await _db.Applications
            .Include(item => item.Opportunity)
            .Where(item => item.ApplicantId == applicantId)
            .ToListAsync(cancellationToken);
        var opportunities = await _db.Opportunities
            .Include(item => item.Tags)
            .Where(item => item.DeletedAt == null &&
                item.ModerationStatus == OpportunityModerationStatuses.Approved)
            .Take(60)
            .ToListAsync(cancellationToken);
        return new(profile, education, achievements, projects, applications, opportunities);
    }

    private static AiCareerRecommendationResponseDTO CreateFallback(
        IEnumerable<int> opportunityIds,
        string summary,
        string status)
    {
        var items = opportunityIds.Select((id, index) => new AiCareerRecommendationItemDTO
        {
            OpportunityId = id,
            MatchPercent = Math.Max(65, 82 - index * 4),
            Reason = "Автоматический подбор по текущим навыкам.",
            NextStep = "Сравните требования возможности с резюме.",
        }).ToList();
        return new AiCareerRecommendationResponseDTO
        {
            Source = "system",
            Status = status,
            Summary = summary,
            IsFallback = true,
            NextActions = ["Обновить описание резюме", "Добавить подтверждённые навыки", "Проверить подходящие возможности"],
            CareerPlan =
            [
                new() { Day = "День 1", Action = "Обновить описание резюме", Outcome = "Профиль станет понятнее работодателю" },
                new() { Day = "День 2", Action = "Добавить навыки и проекты", Outcome = "Подбор станет точнее" },
                new() { Day = "День 3", Action = "Изучить рекомендованные возможности", Outcome = "Появится список для отклика" },
            ],
            Items = items,
            Sections = items.Count == 0
                ? []
                : [new() { Type = "fallback", Title = "Подбор по навыкам", Items = items }],
            ProfileAssessment = new()
            {
                Score = 0,
                Summary = "AI-оценка профиля ещё не сформирована.",
            },
            PortfolioAssessment = new()
            {
                Score = 0,
                Summary = "AI-оценка портфолио ещё не сформирована.",
            },
            SalaryInsight = new(),
            SkillGaps = [],
        };
    }

    private static AiCareerGenerationDTO MapGeneration(AiCareerJob job) => new()
    {
        JobId = job.Id,
        Status = job.Status,
        Reason = job.Reason,
        CompletedSteps = job.Steps.Count(item => item.Status is "succeeded" or "failed"),
        TotalSteps = StepNames.Length,
        StartedAt = job.StartedAt,
        CompletedAt = job.CompletedAt,
        Steps = job.Steps.OrderBy(item => Array.IndexOf(StepNames, item.Step)).Select(MapStep).ToList(),
    };

    private static AiCareerJobResponseDTO MapJob(AiCareerJob job) => new()
    {
        JobId = job.Id,
        Status = job.Status,
        Reason = job.Reason,
        CreatedAt = job.CreatedAt,
        StartedAt = job.StartedAt,
        CompletedAt = job.CompletedAt,
        Steps = job.Steps.OrderBy(item => Array.IndexOf(StepNames, item.Step)).Select(MapStep).ToList(),
    };

    private static AiCareerJobStepDTO MapStep(AiCareerJobStep step) => new()
    {
        Step = step.Step,
        Status = step.Status,
        Attempts = step.AttemptCount,
        ErrorCode = step.ErrorCode,
    };

    private static List<AiCareerPartialFailureDTO> MapFailures(AiCareerJob? job) =>
        job?.Steps
            .Where(item => item.Status == "failed")
            .Select(item => new AiCareerPartialFailureDTO
            {
                Step = item.Step,
                ErrorCode = item.ErrorCode ?? "unknown_error",
                Message = item.ErrorMessage ?? GetUserErrorMessage(item.Step),
            })
            .ToList() ?? [];

    private static T? Deserialize<T>(string? payload)
    {
        if (string.IsNullOrWhiteSpace(payload))
        {
            return default;
        }

        try
        {
            return JsonSerializer.Deserialize<T>(payload, JsonOptions);
        }
        catch (JsonException)
        {
            return default;
        }
    }

    private static string NormalizeReason(string? reason) =>
        reason?.Trim().ToLowerInvariant() switch
        {
            "application_changed" => "application_changed",
            "profile_changed" => "profile_changed",
            _ => "manual",
        };

    private static string GetUserErrorMessage(string step) => step switch
    {
        ProfileStep => "Не удалось обновить оценку профиля и портфолио.",
        CareerStep => "Не удалось обновить карьерный маршрут.",
        OpportunitiesStep => "Не удалось обновить AI-подбор возможностей.",
        _ => "Не удалось обновить часть AI-разбора.",
    };

    private sealed record CandidateData(
        ApplicantProfile Profile,
        List<ApplicantEducation> Education,
        List<ApplicantAchievement> Achievements,
        List<CandidateProject> Projects,
        List<OpportunityApplication> Applications,
        List<Opportunity> Opportunities);
}

public sealed class AiCareerJobWorker : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<AiCareerJobWorker> _logger;

    public AiCareerJobWorker(IServiceScopeFactory scopeFactory, ILogger<AiCareerJobWorker> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var service = scope.ServiceProvider.GetRequiredService<IAiCareerJobService>();
                var processed = await service.ProcessNextStepAsync(stoppingToken);
                if (!processed)
                {
                    await Task.Delay(TimeSpan.FromSeconds(1), stoppingToken);
                }
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                if (stoppingToken.IsCancellationRequested)
                {
                    break;
                }

                _logger.LogError(ex, "AI career job worker iteration failed.");
                try
                {
                    await Task.Delay(TimeSpan.FromSeconds(2), stoppingToken);
                }
                catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
                {
                    break;
                }
            }
        }
    }
}

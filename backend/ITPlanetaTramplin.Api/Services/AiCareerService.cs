using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Application.DBContext;
using DTO;
using ITPlanetaTramplin.Api.Integrations;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Models;

namespace ITPlanetaTramplin.Api.Services;

public interface IAiCareerService
{
    Task<AiCareerRecommendationResponseDTO> BuildCareerRecommendationsAsync(
        ApplicantProfile profile,
        IReadOnlyCollection<ApplicantEducation> education,
        IReadOnlyCollection<ApplicantAchievement> achievements,
        IReadOnlyCollection<CandidateProject> projects,
        IReadOnlyCollection<OpportunityApplication> applications,
        IReadOnlyCollection<Opportunity> opportunities,
        bool forceRefresh = false,
        bool isUpdate = false,
        CancellationToken cancellationToken = default);

    Task<AiResumeAnalysisResponseDTO> AnalyzeResumeAsync(
        ApplicantProfile profile,
        IReadOnlyCollection<ApplicantEducation> education,
        IReadOnlyCollection<ApplicantAchievement> achievements,
        IReadOnlyCollection<CandidateProject> projects,
        CancellationToken cancellationToken = default);

    Task<AiOpportunityFitResponseDTO> AnalyzeOpportunityFitAsync(
        ApplicantProfile profile,
        IReadOnlyCollection<ApplicantEducation> education,
        IReadOnlyCollection<ApplicantAchievement> achievements,
        IReadOnlyCollection<CandidateProject> projects,
        Opportunity opportunity,
        CancellationToken cancellationToken = default);

    Task<AiOpportunityTagSuggestionResponseDTO> SuggestOpportunityTagsAsync(
        AiOpportunityTagSuggestionRequestDTO draft,
        IReadOnlyCollection<string> activeTags,
        CancellationToken cancellationToken = default);
}

public sealed class AiCareerService : IAiCareerService
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        PropertyNameCaseInsensitive = true,
        AllowTrailingCommas = true,
        ReadCommentHandling = JsonCommentHandling.Skip,
        NumberHandling = System.Text.Json.Serialization.JsonNumberHandling.AllowReadingFromString,
    };

    private readonly IGigaChatClient _client;
    private readonly IMemoryCache _cache;
    private readonly ApplicationDBContext _db;
    private readonly ILogger<AiCareerService> _logger;
    private readonly StepikService _stepikService;

    public AiCareerService(
        IGigaChatClient client,
        IMemoryCache cache,
        ApplicationDBContext db,
        ILogger<AiCareerService> logger,
        StepikService stepikService)
    {
        _client = client;
        _cache = cache;
        _db = db;
        _logger = logger;
        _stepikService = stepikService;
    }

    public async Task<AiCareerRecommendationResponseDTO> BuildCareerRecommendationsAsync(
        ApplicantProfile profile,
        IReadOnlyCollection<ApplicantEducation> education,
        IReadOnlyCollection<ApplicantAchievement> achievements,
        IReadOnlyCollection<CandidateProject> projects,
        IReadOnlyCollection<OpportunityApplication> applications,
        IReadOnlyCollection<Opportunity> opportunities,
        bool forceRefresh = false,
        bool isUpdate = false,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("[AI-DIAG] BuildCareerRecommendationsAsync called. forceRefresh={ForceRefresh}, isUpdate={IsUpdate}, profileId={ProfileId}, description={HasDesc}, skills={SkillCount}, opportunities={OpCount}",
            forceRefresh, isUpdate, profile.Id,
            !string.IsNullOrWhiteSpace(profile.Description),
            profile.Skills?.Count ?? 0,
            opportunities.Count);

        if (string.IsNullOrWhiteSpace(profile.Description) && (profile.Skills == null || profile.Skills.Count == 0))
        {
            _logger.LogWarning("[AI-DIAG] FALLBACK: incomplete_profile (no description AND no skills)");
            var fallbackResponse = CreateCareerFallback("Заполните описание профиля или ключевые навыки, чтобы ИИ мог составить персональные карьерные рекомендации.", [], true);
            fallbackResponse.Signature = BuildDataSignature(profile, education, achievements, projects, applications);
            fallbackResponse.IsStale = false;
            fallbackResponse.RefreshReason = "incomplete_profile";
            fallbackResponse.GeneratedAt = DateTime.UtcNow;
            return fallbackResponse;
        }

        var signature = BuildDataSignature(profile, education, achievements, projects, applications);
        var applicationsSignature = BuildApplicationsSignature(applications);

        var cacheEntry = await _db.AiCareerCaches
            .FirstOrDefaultAsync(c => c.ApplicantId == profile.Id && c.Scope == "career", cancellationToken);

        if (cacheEntry != null)
        {
            var isSignatureMatch = cacheEntry.Signature == signature;

            if (isSignatureMatch)
            {
                var cachedDto = TryDeserialize<AiCareerRecommendationResponseDTO>(cacheEntry.PayloadJson);
                if (cachedDto != null)
                {
                    cachedDto.IsStale = false;
                    cachedDto.Signature = signature;
                    cachedDto.RefreshReason = "cache_hit";
                    cachedDto.GeneratedAt = cacheEntry.CreatedAt;

                    cacheEntry.LastServedAt = DateTime.UtcNow;
                    await _db.SaveChangesAsync(cancellationToken);

                    return cachedDto;
                }
            }
            else
            {
                if (!forceRefresh)
                {
                    var cachedDto = TryDeserialize<AiCareerRecommendationResponseDTO>(cacheEntry.PayloadJson);
                    if (cachedDto != null && cachedDto.ApplicationsSignature == applicationsSignature)
                    {
                        cachedDto.IsStale = true;
                        cachedDto.Status = "stale";
                        cachedDto.Signature = signature;
                        cachedDto.RefreshReason = "profile_or_applications_changed";
                        cachedDto.GeneratedAt = cacheEntry.CreatedAt;

                        return cachedDto;
                    }

                    if (cachedDto != null && cachedDto.ApplicationsSignature != applicationsSignature)
                    {
                        forceRefresh = true;
                    }
                }
            }
        }

        if (!forceRefresh)
        {
            _logger.LogWarning("[AI-DIAG] FALLBACK: no_cache (forceRefresh=false, no cache entry matched)");
            var fallback = CreateCareerFallback("ИИ-анализ ещё не сформирован. Нажмите «Сформировать разбор», чтобы запустить.", [], true);
            fallback.IsStale = true;
            fallback.Signature = signature;
            fallback.RefreshReason = "no_cache";
            fallback.GeneratedAt = null;
            return fallback;
        }

        var candidates = SelectRelevantOpportunities(profile, projects, opportunities, 10);
        _logger.LogInformation("[AI-DIAG] Calling GigaChat. candidates={CandidateCount}", candidates.Count);

        var importantApplication = applications
            .Where(app => IsImportantStatus(app.Status))
            .OrderByDescending(app => app.AppliedAt)
            .FirstOrDefault();

        var importantAppPayload = importantApplication != null ? new
        {
            Status = importantApplication.Status,
            OpportunityTitle = importantApplication.Opportunity.Title
        } : null;

        AiCareerRecommendationResponseDTO? parsed = null;
        var allowedIds = candidates.Select(item => item.Id).ToHashSet();

        for (int attempt = 1; attempt <= 2; attempt++)
        {
            var completion = await _client.CompleteJsonAsync(
                "You are a Russian career AI. Return JSON only. No markdown. Explain cautiously. CRITICAL: Ensure the JSON structure is strictly valid with correctly balanced braces. Do not truncate the output.",
                JsonSerializer.Serialize(new
                {
                    task = "Match candidate with opportunities. Russian language. Use only the exact id values from the opportunities list as opportunityId in the response. Reason/NextStep/Summary: max 100 chars. " +
                           "Analyze profile, portfolio, salary, skill gaps, and latest application status changes if provided. " +
                           "Return JSON: {\"summary\":\"str\",\"nextActions\":[\"str\"],\"missingSkills\":[\"str\"],\"careerPlan\":[{\"day\":\"str\",\"action\":\"str\",\"outcome\":\"str\"}],\"sections\":[{\"type\":\"str\",\"title\":\"str\",\"items\":[{\"opportunityId\":1,\"matchPercent\":80,\"reason\":\"str\",\"matchedSkills\":[\"str\"],\"missingSkills\":[\"str\"],\"nextStep\":\"str\"}]}],\"profileAssessment\":{\"score\":75,\"summary\":\"str\",\"strengths\":[\"str\"],\"improvements\":[\"str\"]},\"portfolioAssessment\":{\"score\":60,\"summary\":\"str\",\"strengths\":[\"str\"],\"improvements\":[\"str\"]},\"salaryInsight\":{\"currentLevel\":\"str\",\"nextLevel\":\"str\",\"summary\":\"str\",\"ranges\":[{\"label\":\"str\",\"range\":\"str\"}]},\"skillGaps\":[{\"skill\":\"str\",\"reason\":\"str\",\"priority\":\"high/medium/low\"}],\"eventInsight\":{\"status\":\"str\",\"opportunityTitle\":\"str\",\"insight\":\"str\",\"recommendedActions\":[\"str\"]}}",
                    candidate = BuildCandidatePayload(profile, education, achievements, projects, applications),
                    opportunities = candidates,
                    importantEvent = importantAppPayload,
                    limits = new { sections = 2, itemsPerSection = 3, totalItems = 5, nextActions = 3, missingSkills = 3, careerPlan = 2 },
                }, JsonOptions),
                cancellationToken);
            var json = completion.Content;

            _logger.LogInformation(
                "[AI-DIAG] GigaChat response. attempt={Attempt}, success={Success}, responseLength={ResponseLength}, errorCode={ErrorCode}",
                attempt,
                completion.IsSuccess,
                json?.Length ?? 0,
                completion.ErrorCode);

            parsed = TryDeserialize<AiCareerRecommendationResponseDTO>(json);
            if (parsed != null)
            {
                _logger.LogInformation("[AI-DIAG] Parsed OK. sections={Sections}, items={Items}, careerPlan={CareerPlan}",
                    parsed.Sections?.Count ?? 0,
                    parsed.Items?.Count ?? 0,
                    parsed.CareerPlan?.Count ?? 0);

                parsed.Sections = NormalizeSections(parsed.Sections ?? [], candidates, allowedIds);
                parsed.Items = NormalizeRecommendationItems(
                    (parsed.Sections ?? []).SelectMany(section => section.Items ?? []).Concat(parsed.Items ?? []),
                    allowedIds,
                    10);

                _logger.LogInformation("[AI-DIAG] After normalization. items={Items}, candidates={CandidateCount}",
                    parsed.Items.Count, candidates.Count);

                var hasStandaloneAnalysis =
                    !string.IsNullOrWhiteSpace(parsed.Summary) ||
                    (parsed.NextActions?.Count ?? 0) > 0 ||
                    (parsed.CareerPlan?.Count ?? 0) > 0 ||
                    parsed.ProfileAssessment is not null;
                if ((candidates.Count == 0 && hasStandaloneAnalysis) || parsed.Items.Count > 0)
                {
                    _logger.LogInformation("[AI-DIAG] GigaChat response ACCEPTED on attempt {Attempt}", attempt);
                    break;
                }

                _logger.LogWarning("[AI-DIAG] Items filtered to 0 by NormalizeRecommendationItems. allowedIds={AllowedIds}",
                    string.Join(",", allowedIds));
                parsed = null;
            }
            else
            {
                _logger.LogWarning("[AI-DIAG] TryDeserialize returned null for GigaChat response on attempt {Attempt}", attempt);
                if (attempt < 2)
                {
                    await Task.Delay(2000, cancellationToken); // Wait before retrying
                }
            }
            _logger.LogWarning("GigaChat career recommendations returned empty, invalid JSON, or no valid opportunity matches on attempt {Attempt}.", attempt);
        }

        if (parsed is null)
        {
            _logger.LogWarning("GigaChat career recommendations failed after all retry attempts.");
            if (isUpdate && cacheEntry != null)
            {
                var cachedDto = TryDeserialize<AiCareerRecommendationResponseDTO>(cacheEntry.PayloadJson);
                if (cachedDto != null)
                {
                    cachedDto.IsStale = true;
                    cachedDto.Status = "stale";
                    cachedDto.Signature = signature;
                    cachedDto.RefreshReason = "profile_or_applications_changed";
                    cachedDto.GeneratedAt = cacheEntry.CreatedAt;
                    cachedDto.ErrorMessage = "Системные ошибки при обновлении AI-рекомендаций. Отображаются последние кэшированные данные.";
                    return cachedDto;
                }
            }

            var fallback = CreateCareerFallback("ИИ-анализ готовится. Ниже показан автоматический подбор на основе ключевых навыков вашего профиля.", candidates.Select(item => item.Id).Take(4), true);
            fallback.Signature = signature;
            fallback.IsStale = false;
            fallback.RefreshReason = "fallback";
            fallback.GeneratedAt = DateTime.UtcNow;
            fallback.Source = "system";
            fallback.Status = "unavailable";
            fallback.ErrorMessage = "системные AI-рекомендации временно недоступны.";
            return fallback;
        }

        parsed.NextActions = CleanList(parsed.NextActions ?? [], 4);
        parsed.MissingSkills = CleanList(parsed.MissingSkills ?? [], 8);
        parsed.CareerPlan = NormalizeCareerPlan(parsed.CareerPlan ?? []);
        parsed.IsFallback = false;
        parsed.Signature = signature;
        parsed.ApplicationsSignature = applicationsSignature;
        parsed.IsStale = false;
        parsed.RefreshReason = cacheEntry == null ? "new_analysis" : "profile_or_applications_changed";
        parsed.GeneratedAt = DateTime.UtcNow;

        // Populate Stepik courses
        var searchQueries = new List<string>();
        if (profile.Skills != null)
        {
            searchQueries.AddRange(profile.Skills);
        }
        if (parsed.MissingSkills != null)
        {
            searchQueries.AddRange(parsed.MissingSkills);
        }
        if (parsed.SkillGaps != null)
        {
            searchQueries.AddRange(parsed.SkillGaps.Select(g => g.Skill));
        }

        var uniqueQueries = searchQueries
            .Where(s => !string.IsNullOrWhiteSpace(s))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Take(5)
            .ToList();

        var recommendedCourses = new List<AiCourseDTO>();
        foreach (var query in uniqueQueries)
        {
            try
            {
                var courses = await _stepikService.SearchCoursesAsync(query, cancellationToken);
                if (courses != null)
                {
                    recommendedCourses.AddRange(courses);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching Stepik courses for query: {Query}", query);
            }
        }

        parsed.RecommendedCourses = recommendedCourses
            .GroupBy(c => c.Id)
            .Select(g => g.First())
            .Take(6)
            .ToList();

        parsed.Source = "ai";
        parsed.Status = "fresh";

        if (parsed.Sections.Count == 0 && parsed.Items.Count > 0)
        {
            parsed.Sections = BuildSectionsFromItems(parsed.Items, candidates);
        }

        var finalResponse = parsed.Items.Count > 0 || parsed.CareerPlan.Count > 0
            ? parsed
            : CreateCareerFallback("ИИ-анализ готовится. Ниже показан автоматический подбор на основе ключевых навыков вашего профиля.", candidates.Select(item => item.Id).Take(4), true);

        finalResponse.Signature = signature;
        finalResponse.IsStale = false;
        finalResponse.GeneratedAt = DateTime.UtcNow;

        if (!finalResponse.IsFallback)
        {
            if (cacheEntry == null)
            {
                cacheEntry = new AiCareerCache
                {
                    ApplicantId = profile.Id,
                    Scope = "career",
                    Signature = signature,
                    PayloadJson = JsonSerializer.Serialize(finalResponse, JsonOptions),
                    CreatedAt = DateTime.UtcNow,
                    ExpiresAt = DateTime.UtcNow.AddDays(30),
                    LastServedAt = DateTime.UtcNow
                };
                _db.AiCareerCaches.Add(cacheEntry);
            }
            else
            {
                cacheEntry.Signature = signature;
                cacheEntry.PayloadJson = JsonSerializer.Serialize(finalResponse, JsonOptions);
                cacheEntry.CreatedAt = DateTime.UtcNow;
                cacheEntry.ExpiresAt = DateTime.UtcNow.AddDays(30);
                cacheEntry.LastServedAt = DateTime.UtcNow;
                _db.AiCareerCaches.Update(cacheEntry);
            }
            await _db.SaveChangesAsync(cancellationToken);
        }

        return finalResponse;
    }

    public async Task<AiResumeAnalysisResponseDTO> AnalyzeResumeAsync(
        ApplicantProfile profile,
        IReadOnlyCollection<ApplicantEducation> education,
        IReadOnlyCollection<ApplicantAchievement> achievements,
        IReadOnlyCollection<CandidateProject> projects,
        CancellationToken cancellationToken = default)
    {
        var completion = await _client.CompleteJsonAsync(
            "You are a resume reviewer. Return JSON only. No markdown.",
            JsonSerializer.Serialize(new
            {
                task = "Analyze candidate resume. Russian language. Keep values short (max 120 chars). Return JSON: {\"score\":75,\"summary\":\"str\",\"strengths\":[\"str\"],\"issues\":[\"str\"],\"suggestedSkills\":[\"str\"],\"improvedDescription\":\"str\",\"nextActions\":[\"str\"]}",
                candidate = BuildCandidatePayload(profile, education, achievements, projects, []),
                limits = new { strengths = 4, issues = 4, suggestedSkills = 8, nextActions = 4 },
            }, JsonOptions),
            cancellationToken);
        var json = completion.Content;

        var parsed = TryDeserialize<AiResumeAnalysisResponseDTO>(json);
        if (parsed is null)
        {
            _logger.LogWarning("GigaChat resume analysis returned empty or invalid JSON.");
            return CreateResumeFallback(profile);
        }

        parsed.Score = Math.Clamp(parsed.Score, 0, 100);
        parsed.Strengths = CleanList(parsed.Strengths, 4);
        parsed.Issues = CleanList(parsed.Issues, 4);
        parsed.SuggestedSkills = CleanList(parsed.SuggestedSkills, 8);
        parsed.NextActions = CleanList(parsed.NextActions, 4);
        parsed.IsFallback = false;
        return parsed;
    }

    public async Task<AiOpportunityFitResponseDTO> AnalyzeOpportunityFitAsync(
        ApplicantProfile profile,
        IReadOnlyCollection<ApplicantEducation> education,
        IReadOnlyCollection<ApplicantAchievement> achievements,
        IReadOnlyCollection<CandidateProject> projects,
        Opportunity opportunity,
        CancellationToken cancellationToken = default)
    {
        var opportunityPayload = BuildOpportunityPayload(opportunity);
        var completion = await _client.CompleteJsonAsync(
            "You compare a candidate resume with an opportunity. Return JSON only. No markdown.",
            JsonSerializer.Serialize(new
            {
                task = "Check fit. Russian language. Reason/RecommendedDescription: max 120 chars. Return JSON: {\"score\":75,\"reason\":\"str\",\"matchedSkills\":[\"str\"],\"missingSkills\":[\"str\"],\"recommendedDescription\":\"str\",\"nextActions\":[\"str\"]}",
                candidate = BuildCandidatePayload(profile, education, achievements, projects, []),
                opportunity = opportunityPayload,
                limits = new { matchedSkills = 6, missingSkills = 6, nextActions = 4 },
            }, JsonOptions),
            cancellationToken);
        var json = completion.Content;

        var parsed = TryDeserialize<AiOpportunityFitResponseDTO>(json);
        if (parsed is null)
        {
            _logger.LogWarning("GigaChat opportunity fit analysis returned empty or invalid JSON.");
            return CreateOpportunityFitFallback(profile, opportunity);
        }

        parsed.Score = Math.Clamp(parsed.Score, 0, 100);
        parsed.MatchedSkills = CleanList(parsed.MatchedSkills, 6);
        parsed.MissingSkills = CleanList(parsed.MissingSkills, 6);
        parsed.NextActions = CleanList(parsed.NextActions, 4);
        parsed.IsFallback = false;
        return parsed;
    }

    public async Task<AiOpportunityTagSuggestionResponseDTO> SuggestOpportunityTagsAsync(
        AiOpportunityTagSuggestionRequestDTO draft,
        IReadOnlyCollection<string> activeTags,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(draft.Title) && string.IsNullOrWhiteSpace(draft.Description))
        {
            return new AiOpportunityTagSuggestionResponseDTO
            {
                IsFallback = true,
                Reason = "Заполните название или описание перед AI-подбором тегов.",
            };
        }

        var completion = await _client.CompleteJsonAsync(
            "You suggest tags for Russian job, internship, event, and mentoring posts. Return only valid JSON in Russian when explaining.",
            JsonSerializer.Serialize(new
            {
                task = "Suggest up to 10 tags. Prefer existing activeTags when possible. Also suggest what to clarify in the publication. All explanations must be in Russian. Return JSON: {\"tags\":[\"existing active tag\"],\"pendingTags\":[\"new tag\"],\"improvementTips\":[\"string\"],\"reason\":\"string\"}.",
                draft,
                activeTags = activeTags.Take(120),
            }, JsonOptions),
            cancellationToken);
        var json = completion.Content;

        var parsed = TryDeserialize<AiOpportunityTagSuggestionResponseDTO>(json);
        if (parsed is null)
        {
            _logger.LogWarning("GigaChat tag suggestions returned empty or invalid JSON.");
            return CreateTagFallback(draft, activeTags);
        }

        var activeSet = activeTags.ToHashSet(StringComparer.OrdinalIgnoreCase);
        var all = CleanList((parsed.Tags ?? []).Concat(parsed.PendingTags ?? []), 10);
        parsed.Tags = all.Where(activeSet.Contains).Take(10).ToList();
        parsed.PendingTags = all.Where(tag => !activeSet.Contains(tag)).Take(10 - parsed.Tags.Count).ToList();
        parsed.ImprovementTips = CleanList(parsed.ImprovementTips ?? [], 4);
        parsed.IsFallback = false;
        return parsed;
    }

    private static object BuildCandidatePayload(
        ApplicantProfile profile,
        IReadOnlyCollection<ApplicantEducation> education,
        IReadOnlyCollection<ApplicantAchievement> achievements,
        IReadOnlyCollection<CandidateProject> projects,
        IReadOnlyCollection<OpportunityApplication> applications)
    {
        return new
        {
            profile.Name,
            profile.Surname,
            Description = TruncateText(profile.Description, 800),
            Skills = profile.Skills ?? [],
            Education = education.Select(item => new { item.InstitutionName, item.Faculty, item.Specialization, item.EducationLevel, Description = TruncateText(item.Description, 300) }),
            Achievements = achievements.Select(item => new { item.Title, Description = TruncateText(item.Description, 300), item.Location }),
            Projects = projects.Select(item => new { item.Title, ShortDescription = TruncateText(item.ShortDescription, 300), item.Tags }),
            Applications = applications.Select(item => new { item.Status, OpportunityTitle = item.Opportunity.Title }).Take(8),
        };
    }

    private static object BuildOpportunityPayload(Opportunity item)
    {
        return new
        {
            item.Id,
            item.Title,
            Description = TruncateText(item.Description, 500),
            item.OpportunityType,
            item.EmploymentType,
            item.ExperienceLevel,
            item.Schedule,
            item.LocationCity,
            Tags = item.Tags.Where(tag => tag.IsActive == true).Select(tag => tag.Name).Take(10).ToList(),
        };
    }

    private static AiCareerRecommendationResponseDTO CreateCareerFallback(string summary, IEnumerable<int> opportunityIds, bool isFallback)
    {
        var items = opportunityIds.Select((id, index) => new AiCareerRecommendationItemDTO
        {
            OpportunityId = id,
            MatchPercent = Math.Max(65, 82 - index * 4),
            Reason = "Эта возможность может подойти по текущим навыкам и карьерному направлению.",
            MatchedSkills = [],
            MissingSkills = [],
            NextStep = "Откройте возможность и сравните требования с резюме.",
        }).ToList();

        return new AiCareerRecommendationResponseDTO
        {
            Summary = summary,
            NextActions = ["Обновить описание резюме", "Добавить недостающие навыки", "Посмотреть рекомендованные возможности"],
            MissingSkills = [],
            CareerPlan =
            [
                new() { Day = "День 1", Action = "Обновить краткое описание в резюме", Outcome = "Профиль понятнее для работодателя" },
                new() { Day = "День 2", Action = "Добавить 2-3 подтвержденных навыка", Outcome = "Рекомендации станут точнее" },
                new() { Day = "День 3", Action = "Открыть рекомендованные возможности", Outcome = "Появится короткий список для отклика" },
            ],
            Sections = items.Count > 0
                ? [new AiCareerRecommendationSectionDTO { Type = "fallback", Title = "Подбор по навыкам", Items = items }]
                : [],
            Items = items,
            IsFallback = isFallback,
            ProfileAssessment = new AiProfileAssessmentDTO
            {
                Score = 72,
                Summary = "Базовая оценка профиля. Заполните все разделы резюме для точного анализа.",
                Strengths = ["Ключевые разделы заполнены"],
                Improvements = ["Добавить больше проектов с описанием задач"]
            },
            PortfolioAssessment = new AiPortfolioAssessmentDTO
            {
                Score = 65,
                Summary = "Рекомендуется добавить хотя бы один проект с указанием вашей роли и результатов.",
                Strengths = ["Базовый профиль настроен"],
                Improvements = ["Опишите командный вклад и технологии"]
            },
            SalaryInsight = new AiSalaryInsightDTO
            {
                CurrentLevel = "Junior",
                NextLevel = "Middle",
                Summary = "Средний уровень зарплат по рынку.",
                Ranges = [new AiSalaryRangeDTO { Label = "Россия", Range = "45-75 тыс. ₽" }]
            },
            SkillGaps =
            [
                new() { Skill = "Профессиональные навыки", Reason = "Сравните ключевые требования в интересных вакансиях", Priority = "high" }
            ],
            EventInsight = null
        };
    }

    private static AiResumeAnalysisResponseDTO CreateResumeFallback(ApplicantProfile profile)
    {
        return new AiResumeAnalysisResponseDTO
        {
            Score = string.IsNullOrWhiteSpace(profile.Description) ? 55 : 72,
            Summary = "AI-анализ временно недоступен. Сейчас показана базовая проверка заполненности резюме.",
            Strengths = CleanList(profile.Skills ?? [], 4),
            Issues = string.IsNullOrWhiteSpace(profile.Description)
                ? ["Добавьте короткое профессиональное описание.", "Опишите проекты и измеримые результаты."]
                : ["Добавьте больше измеримых результатов.", "Адаптируйте описание под целевую роль."],
            SuggestedSkills = [],
            ImprovedDescription = profile.Description ?? "",
            NextActions = ["Добавить результаты проектов", "Проверить релевантность навыков", "Сохранить изменения профиля"],
            IsFallback = true,
        };
    }

    private static AiOpportunityTagSuggestionResponseDTO CreateTagFallback(AiOpportunityTagSuggestionRequestDTO draft, IReadOnlyCollection<string> activeTags)
    {
        var text = $"{draft.Title} {draft.Description}".ToLowerInvariant();
        var matched = activeTags
            .Where(tag => text.Contains(tag.ToLowerInvariant()))
            .Take(10)
            .ToList();

        return new AiOpportunityTagSuggestionResponseDTO
        {
            Tags = matched,
            PendingTags = matched.Count == 0 ? ["Карьера", "Junior"] : [],
            ImprovementTips = ["Уточните ключевые задачи", "Добавьте требования к опыту и формату работы"],
            Reason = "AI-подбор тегов временно недоступен. Базовые теги выбраны по тексту публикации.",
            IsFallback = true,
        };
    }

    private static AiOpportunityFitResponseDTO CreateOpportunityFitFallback(ApplicantProfile profile, Opportunity opportunity)
    {
        var candidateSkills = CleanList(profile.Skills ?? [], 8);
        var opportunityTags = CleanList(opportunity.Tags.Where(tag => tag.IsActive == true).Select(tag => tag.Name), 8);
        var matched = candidateSkills
            .Where(skill => opportunityTags.Any(tag => IsTextMatch(skill, tag)))
            .Take(6)
            .ToList();

        var missing = opportunityTags
            .Where(tag => !matched.Any(skill => IsTextMatch(skill, tag)))
            .Take(6)
            .ToList();

        return new AiOpportunityFitResponseDTO
        {
            Score = Math.Clamp(60 + matched.Count * 7 - missing.Count * 2, 40, 88),
            Reason = "GigaChat временно недоступен. Показана базовая проверка совпадения навыков с выбранной возможностью.",
            MatchedSkills = matched,
            MissingSkills = missing,
            RecommendedDescription = profile.Description ?? "",
            NextActions = ["Сравнить требования с резюме", "Добавить релевантные проекты", "Уточнить описание под выбранную возможность"],
            IsFallback = true,
        };
    }

    private static List<OpportunityCandidate> SelectRelevantOpportunities(
        ApplicantProfile profile,
        IReadOnlyCollection<CandidateProject> projects,
        IReadOnlyCollection<Opportunity> opportunities,
        int limit)
    {
        return opportunities
            .Select(item => new { Item = item, Score = ScoreOpportunity(profile, projects, item) })
            .OrderByDescending(item => item.Score)
            .ThenByDescending(item => item.Item.PublishAt)
            .Take(limit)
            .Select(item => new OpportunityCandidate
            {
                Id = item.Item.Id,
                Title = item.Item.Title,
                Description = TruncateText(item.Item.Description, 500),
                OpportunityType = item.Item.OpportunityType,
                EmploymentType = item.Item.EmploymentType,
                ExperienceLevel = item.Item.ExperienceLevel,
                Schedule = item.Item.Schedule,
                LocationCity = item.Item.LocationCity,
                Tags = item.Item.Tags.Where(tag => tag.IsActive == true).Select(tag => tag.Name).Take(10).ToList(),
            })
            .ToList();
    }

    private static int ScoreOpportunity(ApplicantProfile profile, IReadOnlyCollection<CandidateProject> projects, Opportunity opportunity)
    {
        var candidateTerms = CleanList((profile.Skills ?? []).Concat(projects.SelectMany(item => item.Tags ?? [])), 40);
        var opportunityTerms = CleanList(
            opportunity.Tags.Where(tag => tag.IsActive == true).Select(tag => tag.Name)
                .Concat([opportunity.Title, opportunity.Description, opportunity.ExperienceLevel ?? "", opportunity.Schedule ?? ""]),
            80);
        var score = 0;

        foreach (var skill in candidateTerms)
        {
            if (opportunityTerms.Any(term => IsTextMatch(skill, term)))
            {
                score += 8;
            }
        }

        var description = $"{profile.Description} {string.Join(' ', candidateTerms)}";
        if (!string.IsNullOrWhiteSpace(profile.Description) && IsTextMatch(profile.Description, opportunity.Title))
        {
            score += 10;
        }

        if (IsTextMatch(description, opportunity.OpportunityType))
        {
            score += 4;
        }

        return score;
    }

    private static string SanitizeSectionTitle(string? title, string type)
    {
        if (string.IsNullOrWhiteSpace(title))
        {
            return GetSectionTitle(type);
        }

        var trimmed = title.Trim();
        if (trimmed.Contains("Центрация", StringComparison.OrdinalIgnoreCase))
        {
            return GetSectionTitle(type);
        }

        return trimmed;
    }

    private static List<AiCareerRecommendationSectionDTO> NormalizeSections(
        IEnumerable<AiCareerRecommendationSectionDTO>? sections,
        IReadOnlyCollection<OpportunityCandidate> candidates,
        HashSet<int> allowedIds)
    {
        return (sections ?? [])
            .Select(section =>
            {
                var type = NormalizeSectionType(section.Type);
                return new AiCareerRecommendationSectionDTO
                {
                    Type = type,
                    Title = SanitizeSectionTitle(section.Title, type),
                    Items = NormalizeRecommendationItems(section.Items, allowedIds, 4),
                };
            })
            .Where(section => section.Items.Count > 0)
            .GroupBy(section => section.Type, StringComparer.OrdinalIgnoreCase)
            .Select(group => new AiCareerRecommendationSectionDTO
            {
                Type = group.Key,
                Title = group.First().Title,
                Items = NormalizeRecommendationItems(group.SelectMany(section => section.Items), allowedIds, 4),
            })
            .OrderBy(section => GetSectionOrder(section.Type))
            .Take(5)
            .ToList();
    }

    private static List<AiCareerRecommendationItemDTO> NormalizeRecommendationItems(
        IEnumerable<AiCareerRecommendationItemDTO>? items,
        HashSet<int> allowedIds,
        int limit)
    {
        return (items ?? [])
            .Where(item => allowedIds.Contains(item.OpportunityId))
            .GroupBy(item => item.OpportunityId)
            .Select(group => group.First())
            .Take(limit)
            .Select(item =>
            {
                item.MatchPercent = Math.Clamp(item.MatchPercent, 0, 99);
                item.MatchedSkills = CleanList(item.MatchedSkills, 6);
                item.MissingSkills = CleanList(item.MissingSkills, 6);
                item.Reason = item.Reason?.Trim() ?? "";
                item.NextStep = item.NextStep?.Trim() ?? "";
                return item;
            })
            .ToList();
    }

    private static List<AiCareerRecommendationSectionDTO> BuildSectionsFromItems(
        IEnumerable<AiCareerRecommendationItemDTO> items,
        IReadOnlyCollection<OpportunityCandidate> candidates)
    {
        var typesById = candidates.ToDictionary(item => item.Id, item => NormalizeSectionType(item.OpportunityType));

        return items
            .GroupBy(item => typesById.TryGetValue(item.OpportunityId, out var type) ? type : "other")
            .Select(group => new AiCareerRecommendationSectionDTO
            {
                Type = group.Key,
                Title = GetSectionTitle(group.Key),
                Items = group.Take(4).ToList(),
            })
            .OrderBy(section => GetSectionOrder(section.Type))
            .ToList();
    }

    private static List<AiCareerPlanStepDTO> NormalizeCareerPlan(IEnumerable<AiCareerPlanStepDTO>? steps)
    {
        return (steps ?? [])
            .Select(step => new AiCareerPlanStepDTO
            {
                Day = step.Day?.Trim() ?? "",
                Action = step.Action?.Trim() ?? "",
                Outcome = step.Outcome?.Trim() ?? "",
            })
            .Where(step => !string.IsNullOrWhiteSpace(step.Action))
            .Take(3)
            .ToList();
    }

    private static string NormalizeSectionType(string? value)
    {
        var normalized = (value ?? "").Trim().ToLowerInvariant();
        return normalized switch
        {
            "vacancy" or "job" => "vacancy",
            "internship" => "internship",
            "event" => "event",
            "mentoring" or "mentor" => "mentoring",
            "course" or "courses" => "course",
            "fallback" => "fallback",
            _ => "other",
        };
    }

    private static string GetSectionTitle(string type)
    {
        return NormalizeSectionType(type) switch
        {
            "vacancy" => "Вакансии",
            "internship" => "Стажировки",
            "event" => "Мероприятия",
            "mentoring" => "Менторство",
            "course" => "Курсы",
            "fallback" => "Подбор по навыкам",
            _ => "Другие возможности",
        };
    }

    private static int GetSectionOrder(string type)
    {
        return NormalizeSectionType(type) switch
        {
            "vacancy" => 10,
            "internship" => 20,
            "event" => 30,
            "mentoring" => 40,
            "course" => 50,
            _ => 90,
        };
    }

    private static bool IsTextMatch(string? left, string? right)
    {
        var normalizedLeft = NormalizeSearchText(left);
        var normalizedRight = NormalizeSearchText(right);

        return normalizedLeft.Length > 1 &&
            normalizedRight.Length > 1 &&
            (normalizedLeft.Contains(normalizedRight, StringComparison.OrdinalIgnoreCase) ||
                normalizedRight.Contains(normalizedLeft, StringComparison.OrdinalIgnoreCase));
    }

    private static string NormalizeSearchText(string? value)
    {
        return new string((value ?? "")
            .Trim()
            .ToLowerInvariant()
            .Replace('ё', 'е')
            .Where(char.IsLetterOrDigit)
            .ToArray());
    }

    private static T? TryDeserialize<T>(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return default;
        }

        var cleaned = json.Trim();

        // Strip markdown code block wrappers if present
        if (cleaned.StartsWith("```"))
        {
            var lines = cleaned.Split('\n', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);
            if (lines.Length > 2)
            {
                var contentLines = lines.Skip(1);
                if (lines.Last() == "```")
                {
                    contentLines = contentLines.Take(lines.Length - 2);
                }
                cleaned = string.Join("\n", contentLines);
            }
            cleaned = cleaned.Trim();
        }

        // GigaChat sometimes returns JSON with non-breaking spaces (U+00A0),
        // zero-width spaces, and other invisible Unicode whitespace characters
        // that System.Text.Json cannot parse. Replace them with regular spaces.
        cleaned = SanitizeJsonWhitespace(cleaned);

        var start = cleaned.IndexOf('{');
        var end = cleaned.LastIndexOf('}');
        if (start < 0 || end <= start)
        {
            return default;
        }

        try
        {
            return JsonSerializer.Deserialize<T>(cleaned[start..(end + 1)], JsonOptions);
        }
        catch (JsonException)
        {
            return default;
        }
    }

    private static string SanitizeJsonWhitespace(string input)
    {
        if (string.IsNullOrEmpty(input))
        {
            return input;
        }

        return input
            .Replace("\u00A0", " ")   // Non-breaking space
            .Replace("\u200B", "")    // Zero-width space
            .Replace("\u200C", "")    // Zero-width non-joiner
            .Replace("\u200D", "")    // Zero-width joiner
            .Replace("\uFEFF", "");   // Byte order mark
    }

    private static List<string> CleanList(IEnumerable<string>? values, int limit)
    {
        return (values ?? [])
            .Select(value => value?.Trim())
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Take(limit)
            .ToList()!;
    }

    private static string TruncateText(string? value, int maxLength)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return string.Empty;
        }

        var trimmed = value.Trim();
        return trimmed.Length <= maxLength ? trimmed : trimmed[..maxLength] + "...";
    }

    private static bool IsImportantStatus(string? status)
    {
        var normalized = status?.Trim().ToLowerInvariant();
        return normalized is "invited" or "rejected" or "accepted" or "withdrawn" or "submitted" or "reviewing";
    }

    private static string BuildApplicationsSignature(IReadOnlyCollection<OpportunityApplication> applications)
    {
        var sb = new StringBuilder();
        var importantApps = applications
            .Where(app => IsImportantStatus(app.Status))
            .OrderBy(app => app.Id);
        foreach (var app in importantApps)
        {
            sb.Append(app.Id).Append('_')
              .Append(app.Status).Append(';');
        }
        return sb.ToString();
    }

    private static string BuildDataSignature(
        ApplicantProfile profile,
        IReadOnlyCollection<ApplicantEducation> education,
        IReadOnlyCollection<ApplicantAchievement> achievements,
        IReadOnlyCollection<CandidateProject> projects,
        IReadOnlyCollection<OpportunityApplication> applications)
    {
        var sb = new StringBuilder();

        sb.Append(profile.Id).Append('_')
          .Append(profile.Name).Append('_')
          .Append(profile.Surname).Append('_')
          .Append(profile.Description ?? string.Empty).Append('_');
        if (profile.Skills != null)
        {
            foreach (var skill in profile.Skills.OrderBy(s => s))
            {
                sb.Append(skill).Append(',');
            }
        }
        sb.Append(profile.Links ?? string.Empty).Append('_');
        sb.Append("||");

        foreach (var edu in education.OrderBy(e => e.Id))
        {
            sb.Append(edu.Id).Append('_')
              .Append(edu.InstitutionName).Append('_')
              .Append(edu.Faculty ?? string.Empty).Append('_')
              .Append(edu.Specialization ?? string.Empty).Append('_')
              .Append(edu.StartYear).Append('_')
              .Append(edu.GraduationYear).Append(';');
        }
        sb.Append("||");

        foreach (var ach in achievements.OrderBy(a => a.Id))
        {
            sb.Append(ach.Id).Append('_')
              .Append(ach.Title).Append('_')
              .Append(ach.Description ?? string.Empty).Append(';');
        }
        sb.Append("||");

        foreach (var proj in projects.OrderBy(p => p.Id))
        {
            sb.Append(proj.Id).Append('_')
              .Append(proj.Title).Append('_')
              .Append(proj.Role ?? string.Empty).Append('_')
              .Append(proj.ShortDescription ?? string.Empty).Append('_');
            if (proj.Tags != null)
            {
                foreach (var tag in proj.Tags.OrderBy(t => t))
                {
                    sb.Append(tag).Append(',');
                }
            }
            sb.Append(';');
        }
        sb.Append("||");

        var importantApps = applications
            .Where(app => IsImportantStatus(app.Status))
            .OrderBy(app => app.Id);
        foreach (var app in importantApps)
        {
            sb.Append(app.Id).Append('_')
              .Append(app.Status).Append(';');
        }

        var inputBytes = Encoding.UTF8.GetBytes(sb.ToString());
        var hashBytes = MD5.HashData(inputBytes);
        return Convert.ToHexString(hashBytes);
    }

    private sealed class OpportunityCandidate
    {
        public int Id { get; init; }

        public int OpportunityId => Id;

        public string Title { get; init; } = string.Empty;

        public string Description { get; init; } = string.Empty;

        public string OpportunityType { get; init; } = string.Empty;

        public string EmploymentType { get; init; } = string.Empty;

        public string? ExperienceLevel { get; init; }

        public string? Schedule { get; init; }

        public string? LocationCity { get; init; }

        public List<string> Tags { get; init; } = [];
    }
}

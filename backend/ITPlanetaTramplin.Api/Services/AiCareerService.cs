using System.Text.Json;
using DTO;
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
    };

    private readonly IGigaChatClient _client;
    private readonly ILogger<AiCareerService> _logger;

    public AiCareerService(IGigaChatClient client, ILogger<AiCareerService> logger)
    {
        _client = client;
        _logger = logger;
    }

    public async Task<AiCareerRecommendationResponseDTO> BuildCareerRecommendationsAsync(
        ApplicantProfile profile,
        IReadOnlyCollection<ApplicantEducation> education,
        IReadOnlyCollection<ApplicantAchievement> achievements,
        IReadOnlyCollection<CandidateProject> projects,
        IReadOnlyCollection<OpportunityApplication> applications,
        IReadOnlyCollection<Opportunity> opportunities,
        CancellationToken cancellationToken = default)
    {
        var candidates = SelectRelevantOpportunities(profile, projects, opportunities, 20);

        if (candidates.Count == 0)
        {
            return CreateCareerFallback("AI пока не нашел активные возможности для профиля. Базовые рекомендации остаются доступными.", [], true);
        }

        var json = await _client.CompleteJsonAsync(
            "You are a career recommendation service for a Russian platform. Return only valid JSON in Russian. Do not use markdown.",
            JsonSerializer.Serialize(new
            {
                task = "Recommend career focus and grouped opportunities for a Russian career platform. All string values must be in Russian. Explain cautiously: use 'может подойти', 'рекомендуем', 'стоит добавить'. Never guarantee hiring. Return JSON only in this shape: {\"summary\":\"string\",\"nextActions\":[\"string\"],\"missingSkills\":[\"string\"],\"careerPlan\":[{\"day\":\"День 1\",\"action\":\"string\",\"outcome\":\"string\"}],\"sections\":[{\"type\":\"vacancy\",\"title\":\"Вакансии\",\"items\":[{\"opportunityId\":1,\"matchPercent\":80,\"reason\":\"string\",\"matchedSkills\":[\"string\"],\"missingSkills\":[\"string\"],\"nextStep\":\"string\"}]}],\"items\":[{\"opportunityId\":1,\"matchPercent\":80,\"reason\":\"string\",\"matchedSkills\":[\"string\"],\"missingSkills\":[\"string\"],\"nextStep\":\"string\"}]}",
                candidate = BuildCandidatePayload(profile, education, achievements, projects, applications),
                opportunities = candidates,
                limits = new { sections = 5, itemsPerSection = 4, totalItems = 12, nextActions = 4, missingSkills = 8, careerPlan = 7 },
            }, JsonOptions),
            cancellationToken);

        var parsed = TryDeserialize<AiCareerRecommendationResponseDTO>(json);
        if (parsed is null)
        {
            _logger.LogWarning("GigaChat career recommendations returned empty or invalid JSON.");
            return CreateCareerFallback("ИИ-анализ готовится. Ниже показан автоматический подбор на основе ключевых навыков вашего профиля.", candidates.Select(item => item.Id).Take(4), true);
        }

        var allowedIds = candidates.Select(item => item.Id).ToHashSet();
        parsed.Sections = NormalizeSections(parsed.Sections ?? [], candidates, allowedIds);
        parsed.Items = NormalizeRecommendationItems(
            (parsed.Sections ?? []).SelectMany(section => section.Items ?? []).Concat(parsed.Items ?? []),
            allowedIds,
            12);
        parsed.NextActions = CleanList(parsed.NextActions ?? [], 4);
        parsed.MissingSkills = CleanList(parsed.MissingSkills ?? [], 8);
        parsed.CareerPlan = NormalizeCareerPlan(parsed.CareerPlan ?? []);
        parsed.IsFallback = false;

        if (parsed.Sections.Count == 0 && parsed.Items.Count > 0)
        {
            parsed.Sections = BuildSectionsFromItems(parsed.Items, candidates);
        }

        return parsed.Items.Count > 0 || parsed.CareerPlan.Count > 0
            ? parsed
            : CreateCareerFallback("ИИ-анализ готовится. Ниже показан автоматический подбор на основе ключевых навыков вашего профиля.", candidates.Select(item => item.Id).Take(4), true);
    }

    public async Task<AiResumeAnalysisResponseDTO> AnalyzeResumeAsync(
        ApplicantProfile profile,
        IReadOnlyCollection<ApplicantEducation> education,
        IReadOnlyCollection<ApplicantAchievement> achievements,
        IReadOnlyCollection<CandidateProject> projects,
        CancellationToken cancellationToken = default)
    {
        var json = await _client.CompleteJsonAsync(
            "You are a resume review assistant for a Russian career platform. Return only valid JSON in Russian. Do not use markdown.",
            JsonSerializer.Serialize(new
            {
                task = "Analyze the resume. All string values must be in Russian. Return JSON: {\"score\":75,\"summary\":\"string\",\"strengths\":[\"string\"],\"issues\":[\"string\"],\"suggestedSkills\":[\"string\"],\"improvedDescription\":\"string\",\"nextActions\":[\"string\"]}. Keep lists short and practical.",
                candidate = BuildCandidatePayload(profile, education, achievements, projects, []),
                limits = new { strengths = 4, issues = 4, suggestedSkills = 8, nextActions = 4 },
            }, JsonOptions),
            cancellationToken);

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
        var json = await _client.CompleteJsonAsync(
            "You compare a Russian candidate resume with one career opportunity. Return only valid JSON in Russian. Do not use markdown.",
            JsonSerializer.Serialize(new
            {
                task = "Check whether the resume may fit the selected opportunity. All string values must be in Russian. Do not guarantee success. Return JSON: {\"score\":75,\"reason\":\"string\",\"matchedSkills\":[\"string\"],\"missingSkills\":[\"string\"],\"recommendedDescription\":\"string\",\"nextActions\":[\"string\"]}.",
                candidate = BuildCandidatePayload(profile, education, achievements, projects, []),
                opportunity = opportunityPayload,
                limits = new { matchedSkills = 6, missingSkills = 6, nextActions = 4 },
            }, JsonOptions),
            cancellationToken);

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

        var json = await _client.CompleteJsonAsync(
            "You suggest tags for Russian job, internship, event, and mentoring posts. Return only valid JSON in Russian when explaining.",
            JsonSerializer.Serialize(new
            {
                task = "Suggest up to 10 tags. Prefer existing activeTags when possible. Also suggest what to clarify in the publication. All explanations must be in Russian. Return JSON: {\"tags\":[\"existing active tag\"],\"pendingTags\":[\"new tag\"],\"improvementTips\":[\"string\"],\"reason\":\"string\"}.",
                draft,
                activeTags = activeTags.Take(120),
            }, JsonOptions),
            cancellationToken);

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
            profile.Description,
            Skills = profile.Skills ?? [],
            Education = education.Select(item => new { item.InstitutionName, item.Faculty, item.Specialization, item.EducationLevel, item.Description }),
            Achievements = achievements.Select(item => new { item.Title, item.Description, item.Location }),
            Projects = projects.Select(item => new { item.Title, item.ShortDescription, item.Tags }),
            Applications = applications.Select(item => new { item.Status, OpportunityTitle = item.Opportunity.Title }).Take(8),
        };
    }

    private static object BuildOpportunityPayload(Opportunity item)
    {
        return new
        {
            item.Id,
            item.Title,
            item.Description,
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
                Description = item.Item.Description,
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
            .Take(7)
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

    private static List<string> CleanList(IEnumerable<string>? values, int limit)
    {
        return (values ?? [])
            .Select(value => value?.Trim())
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Take(limit)
            .ToList()!;
    }

    private sealed class OpportunityCandidate
    {
        public int Id { get; init; }

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

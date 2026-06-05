using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using DTO;
using ITPlanetaTramplin.Api.Integrations;
using Models;

namespace ITPlanetaTramplin.Api.Services;

public sealed record AiCareerStepResult<T>(
    bool IsSuccess,
    T? Value,
    string? ErrorCode,
    bool IsRetryable,
    int? HttpStatus = null,
    int ResponseLength = 0)
{
    public static AiCareerStepResult<T> Success(
        T value,
        int? httpStatus = null,
        int responseLength = 0) =>
        new(true, value, null, false, httpStatus, responseLength);

    public static AiCareerStepResult<T> Failure(
        string errorCode,
        bool isRetryable,
        int? httpStatus = null,
        int responseLength = 0) =>
        new(false, default, errorCode, isRetryable, httpStatus, responseLength);
}

public interface IAiCareerStepGenerator
{
    Task<AiCareerStepResult<AiCareerProfilePartDTO>> GenerateProfileAsync(
        ApplicantProfile profile,
        IReadOnlyCollection<ApplicantEducation> education,
        IReadOnlyCollection<ApplicantAchievement> achievements,
        IReadOnlyCollection<CandidateProject> projects,
        CancellationToken cancellationToken);

    Task<AiCareerStepResult<AiCareerRoutePartDTO>> GenerateCareerAsync(
        ApplicantProfile profile,
        IReadOnlyCollection<ApplicantEducation> education,
        IReadOnlyCollection<ApplicantAchievement> achievements,
        IReadOnlyCollection<CandidateProject> projects,
        IReadOnlyCollection<OpportunityApplication> applications,
        CancellationToken cancellationToken);

    Task<AiCareerStepResult<AiCareerOpportunityPartDTO>> GenerateOpportunitiesAsync(
        ApplicantProfile profile,
        IReadOnlyCollection<CandidateProject> projects,
        IReadOnlyCollection<Opportunity> opportunities,
        CancellationToken cancellationToken);
}

public sealed class AiCareerStepGenerator : IAiCareerStepGenerator
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        PropertyNameCaseInsensitive = true,
        AllowTrailingCommas = true,
        ReadCommentHandling = JsonCommentHandling.Skip,
        NumberHandling = System.Text.Json.Serialization.JsonNumberHandling.AllowReadingFromString,
    };

    private readonly IGigaChatClient _client;
    private readonly StepikService _stepikService;

    public AiCareerStepGenerator(IGigaChatClient client, StepikService stepikService)
    {
        _client = client;
        _stepikService = stepikService;
    }

    public async Task<AiCareerStepResult<AiCareerProfilePartDTO>> GenerateProfileAsync(
        ApplicantProfile profile,
        IReadOnlyCollection<ApplicantEducation> education,
        IReadOnlyCollection<ApplicantAchievement> achievements,
        IReadOnlyCollection<CandidateProject> projects,
        CancellationToken cancellationToken)
    {
        var completion = await _client.CompleteJsonAsync(
            "You are a Russian career profile reviewer. Return valid JSON only.",
            JsonSerializer.Serialize(new
            {
                task = "Assess the candidate profile and portfolio. Keep text concise and cautious. " +
                    "Return JSON: {\"summary\":\"str\",\"profileAssessment\":{\"score\":75,\"summary\":\"str\",\"strengths\":[\"str\"],\"improvements\":[\"str\"]},\"portfolioAssessment\":{\"score\":60,\"summary\":\"str\",\"strengths\":[\"str\"],\"improvements\":[\"str\"]}}",
                candidate = BuildCandidatePayload(profile, education, achievements, projects, []),
                limits = new { strengths = 3, improvements = 3 },
            }, JsonOptions),
            cancellationToken);

        if (!completion.IsSuccess)
        {
            return AiCareerStepResult<AiCareerProfilePartDTO>.Failure(
                completion.ErrorCode ?? "provider_error",
                completion.IsRetryable,
                completion.HttpStatus,
                completion.ResponseLength);
        }

        var parsed = AiCareerJson.TryDeserialize<AiCareerProfilePartDTO>(completion.Content);
        if (parsed is null ||
            string.IsNullOrWhiteSpace(parsed.Summary) ||
            parsed.ProfileAssessment is null ||
            parsed.PortfolioAssessment is null)
        {
            return AiCareerStepResult<AiCareerProfilePartDTO>.Failure(
                "invalid_profile_json",
                true,
                completion.HttpStatus,
                completion.ResponseLength);
        }

        NormalizeAssessment(parsed.ProfileAssessment);
        NormalizeAssessment(parsed.PortfolioAssessment);
        parsed.Summary = Truncate(parsed.Summary, 500);
        return AiCareerStepResult<AiCareerProfilePartDTO>.Success(
            parsed,
            completion.HttpStatus,
            completion.ResponseLength);
    }

    public async Task<AiCareerStepResult<AiCareerRoutePartDTO>> GenerateCareerAsync(
        ApplicantProfile profile,
        IReadOnlyCollection<ApplicantEducation> education,
        IReadOnlyCollection<ApplicantAchievement> achievements,
        IReadOnlyCollection<CandidateProject> projects,
        IReadOnlyCollection<OpportunityApplication> applications,
        CancellationToken cancellationToken)
    {
        var importantApplication = applications
            .Where(item => AiCareerSignature.IsImportantStatus(item.Status))
            .OrderByDescending(item => item.AppliedAt)
            .FirstOrDefault();
        var eventPayload = importantApplication is null
            ? null
            : new
            {
                importantApplication.Status,
                OpportunityTitle = importantApplication.Opportunity?.Title ?? string.Empty,
            };

        var completion = await _client.CompleteJsonAsync(
            "You are a Russian career strategist. Return valid JSON only.",
            JsonSerializer.Serialize(new
            {
                task = "Create practical career actions, skill gaps, salary direction and react to the latest application event. " +
                    "Return JSON: {\"nextActions\":[\"str\"],\"missingSkills\":[\"str\"],\"careerPlan\":[{\"day\":\"str\",\"action\":\"str\",\"outcome\":\"str\"}],\"salaryInsight\":{\"currentLevel\":\"str\",\"nextLevel\":\"str\",\"summary\":\"str\",\"ranges\":[{\"label\":\"str\",\"range\":\"str\"}]},\"skillGaps\":[{\"skill\":\"str\",\"reason\":\"str\",\"priority\":\"high/medium/low\"}],\"eventInsight\":{\"status\":\"str\",\"opportunityTitle\":\"str\",\"insight\":\"str\",\"recommendedActions\":[\"str\"]}}",
                candidate = BuildCandidatePayload(profile, education, achievements, projects, applications),
                importantEvent = eventPayload,
                limits = new { nextActions = 3, missingSkills = 5, careerPlan = 3, skillGaps = 5 },
            }, JsonOptions),
            cancellationToken);

        if (!completion.IsSuccess)
        {
            return AiCareerStepResult<AiCareerRoutePartDTO>.Failure(
                completion.ErrorCode ?? "provider_error",
                completion.IsRetryable,
                completion.HttpStatus,
                completion.ResponseLength);
        }

        var parsed = AiCareerJson.TryDeserialize<AiCareerRoutePartDTO>(completion.Content);
        if (parsed is null || ((parsed.NextActions?.Count ?? 0) == 0 && (parsed.CareerPlan?.Count ?? 0) == 0))
        {
            return AiCareerStepResult<AiCareerRoutePartDTO>.Failure(
                "invalid_career_json",
                true,
                completion.HttpStatus,
                completion.ResponseLength);
        }

        parsed.NextActions = CleanList(parsed.NextActions, 4);
        parsed.MissingSkills = CleanList(parsed.MissingSkills, 8);
        parsed.CareerPlan = (parsed.CareerPlan ?? [])
            .Where(item => !string.IsNullOrWhiteSpace(item.Action))
            .Select(item => new AiCareerPlanStepDTO
            {
                Day = Truncate(item.Day, 80),
                Action = Truncate(item.Action, 240),
                Outcome = Truncate(item.Outcome, 240),
            })
            .Take(3)
            .ToList();
        parsed.SkillGaps = (parsed.SkillGaps ?? [])
            .Where(item => !string.IsNullOrWhiteSpace(item.Skill))
            .Take(8)
            .ToList();
        if (parsed.EventInsight is not null)
        {
            parsed.EventInsight.RecommendedActions = CleanList(parsed.EventInsight.RecommendedActions, 4);
        }

        parsed.RecommendedCourses = await LoadCoursesAsync(
            (profile.Skills ?? [])
                .Concat(parsed.MissingSkills)
                .Concat(parsed.SkillGaps.Select(item => item.Skill)),
            cancellationToken);

        return AiCareerStepResult<AiCareerRoutePartDTO>.Success(
            parsed,
            completion.HttpStatus,
            completion.ResponseLength);
    }

    public async Task<AiCareerStepResult<AiCareerOpportunityPartDTO>> GenerateOpportunitiesAsync(
        ApplicantProfile profile,
        IReadOnlyCollection<CandidateProject> projects,
        IReadOnlyCollection<Opportunity> opportunities,
        CancellationToken cancellationToken)
    {
        var candidates = SelectCandidates(profile, projects, opportunities, 10);
        if (candidates.Count == 0)
        {
            return AiCareerStepResult<AiCareerOpportunityPartDTO>.Success(new());
        }

        var completion = await _client.CompleteJsonAsync(
            "You match a candidate with opportunities. Return valid JSON only and use only supplied opportunityId values.",
            JsonSerializer.Serialize(new
            {
                task = "Rank the supplied opportunities. Return JSON: {\"sections\":[{\"type\":\"vacancy/internship/event/mentoring/other\",\"title\":\"str\",\"items\":[{\"opportunityId\":1,\"matchPercent\":80,\"reason\":\"str\",\"matchedSkills\":[\"str\"],\"missingSkills\":[\"str\"],\"nextStep\":\"str\"}]}]}",
                candidate = new
                {
                    Description = Truncate(profile.Description, 600),
                    Skills = profile.Skills ?? [],
                    Projects = projects.Select(item => new
                    {
                        item.Title,
                        Description = Truncate(item.ShortDescription, 240),
                        item.Tags,
                    }),
                },
                opportunities = candidates,
                limits = new { sections = 4, itemsPerSection = 3, totalItems = 6 },
            }, JsonOptions),
            cancellationToken);

        if (!completion.IsSuccess)
        {
            return AiCareerStepResult<AiCareerOpportunityPartDTO>.Failure(
                completion.ErrorCode ?? "provider_error",
                completion.IsRetryable,
                completion.HttpStatus,
                completion.ResponseLength);
        }

        var parsed = AiCareerJson.TryDeserialize<AiCareerOpportunityPartDTO>(completion.Content);
        if (parsed is null)
        {
            return AiCareerStepResult<AiCareerOpportunityPartDTO>.Failure(
                "invalid_opportunities_json",
                true,
                completion.HttpStatus,
                completion.ResponseLength);
        }

        var allowedIds = candidates.Select(item => item.Id).ToHashSet();
        var items = (parsed.Sections ?? [])
            .SelectMany(section => section.Items ?? [])
            .Concat(parsed.Items ?? [])
            .Where(item => allowedIds.Contains(item.OpportunityId))
            .GroupBy(item => item.OpportunityId)
            .Select(group => group.First())
            .Take(10)
            .ToList();
        foreach (var item in items)
        {
            item.MatchPercent = Math.Clamp(item.MatchPercent, 0, 99);
            item.Reason = Truncate(item.Reason, 300);
            item.NextStep = Truncate(item.NextStep, 300);
            item.MatchedSkills = CleanList(item.MatchedSkills, 6);
            item.MissingSkills = CleanList(item.MissingSkills, 6);
        }

        if (items.Count == 0)
        {
            return AiCareerStepResult<AiCareerOpportunityPartDTO>.Failure(
                "invalid_opportunity_ids",
                true,
                completion.HttpStatus,
                completion.ResponseLength);
        }

        var types = candidates.ToDictionary(item => item.Id, item => NormalizeType(item.OpportunityType));
        parsed.Items = items;
        parsed.Sections = items
            .GroupBy(item => types.GetValueOrDefault(item.OpportunityId, "other"))
            .Select(group => new AiCareerRecommendationSectionDTO
            {
                Type = group.Key,
                Title = GetSectionTitle(group.Key),
                Items = group.Take(4).ToList(),
            })
            .ToList();
        return AiCareerStepResult<AiCareerOpportunityPartDTO>.Success(
            parsed,
            completion.HttpStatus,
            completion.ResponseLength);
    }

    private async Task<List<AiCourseDTO>> LoadCoursesAsync(
        IEnumerable<string> queries,
        CancellationToken cancellationToken)
    {
        var result = new List<AiCourseDTO>();
        foreach (var query in CleanList(queries, 5))
        {
            try
            {
                result.AddRange(await _stepikService.SearchCoursesAsync(query, cancellationToken) ?? []);
            }
            catch
            {
                // Course enrichment must not fail the AI job.
            }
        }

        return result.GroupBy(item => item.Id).Select(group => group.First()).Take(6).ToList();
    }

    private static object BuildCandidatePayload(
        ApplicantProfile profile,
        IReadOnlyCollection<ApplicantEducation> education,
        IReadOnlyCollection<ApplicantAchievement> achievements,
        IReadOnlyCollection<CandidateProject> projects,
        IReadOnlyCollection<OpportunityApplication> applications) =>
        new
        {
            profile.Name,
            profile.Surname,
            Description = Truncate(profile.Description, 800),
            Skills = profile.Skills ?? [],
            Education = education.Select(item => new
            {
                item.InstitutionName,
                item.Faculty,
                item.Specialization,
                item.EducationLevel,
                Description = Truncate(item.Description, 240),
            }),
            Achievements = achievements.Select(item => new
            {
                item.Title,
                Description = Truncate(item.Description, 240),
            }),
            Projects = projects.Select(item => new
            {
                item.Title,
                Description = Truncate(item.ShortDescription, 240),
                item.Role,
                item.Tags,
            }),
            Applications = applications
                .Where(item => AiCareerSignature.IsImportantStatus(item.Status))
                .Select(item => new
                {
                    item.Status,
                    OpportunityTitle = item.Opportunity?.Title ?? string.Empty,
                })
                .Take(8),
        };

    private static List<OpportunityCandidate> SelectCandidates(
        ApplicantProfile profile,
        IReadOnlyCollection<CandidateProject> projects,
        IReadOnlyCollection<Opportunity> opportunities,
        int limit)
    {
        var terms = CleanList((profile.Skills ?? []).Concat(projects.SelectMany(item => item.Tags ?? [])), 40);
        return opportunities
            .Select(item => new
            {
                Item = item,
                Score = terms.Count(term =>
                    item.Tags.Any(tag => TextMatches(term, tag.Name)) ||
                    TextMatches(term, item.Title) ||
                    TextMatches(term, item.Description)),
            })
            .OrderByDescending(item => item.Score)
            .ThenByDescending(item => item.Item.PublishAt)
            .Take(limit)
            .Select(item => new OpportunityCandidate
            {
                Id = item.Item.Id,
                Title = item.Item.Title,
                Description = Truncate(item.Item.Description, 400),
                OpportunityType = item.Item.OpportunityType,
                Tags = item.Item.Tags.Where(tag => tag.IsActive == true).Select(tag => tag.Name).Take(10).ToList(),
            })
            .ToList();
    }

    private static void NormalizeAssessment(AiProfileAssessmentDTO assessment)
    {
        assessment.Score = Math.Clamp(assessment.Score, 0, 100);
        assessment.Summary = Truncate(assessment.Summary, 400);
        assessment.Strengths = CleanList(assessment.Strengths, 4);
        assessment.Improvements = CleanList(assessment.Improvements, 4);
    }

    private static void NormalizeAssessment(AiPortfolioAssessmentDTO assessment)
    {
        assessment.Score = Math.Clamp(assessment.Score, 0, 100);
        assessment.Summary = Truncate(assessment.Summary, 400);
        assessment.Strengths = CleanList(assessment.Strengths, 4);
        assessment.Improvements = CleanList(assessment.Improvements, 4);
    }

    private static List<string> CleanList(IEnumerable<string>? values, int limit) =>
        (values ?? [])
            .Select(value => value?.Trim())
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Take(limit)
            .Select(value => value!)
            .ToList();

    private static string Truncate(string? value, int length)
    {
        var trimmed = value?.Trim() ?? string.Empty;
        return trimmed.Length <= length ? trimmed : trimmed[..length];
    }

    private static bool TextMatches(string? left, string? right)
    {
        var a = NormalizeText(left);
        var b = NormalizeText(right);
        return a.Length > 1 && b.Length > 1 &&
            (a.Contains(b, StringComparison.OrdinalIgnoreCase) ||
             b.Contains(a, StringComparison.OrdinalIgnoreCase));
    }

    private static string NormalizeText(string? value) =>
        new((value ?? string.Empty).ToLowerInvariant().Replace('ё', 'е').Where(char.IsLetterOrDigit).ToArray());

    private static string NormalizeType(string? value) =>
        (value ?? string.Empty).Trim().ToLowerInvariant() switch
        {
            "vacancy" or "job" => "vacancy",
            "internship" => "internship",
            "event" => "event",
            "mentoring" or "mentor" => "mentoring",
            _ => "other",
        };

    private static string GetSectionTitle(string type) => type switch
    {
        "vacancy" => "Вакансии",
        "internship" => "Стажировки",
        "event" => "Мероприятия",
        "mentoring" => "Менторство",
        _ => "Другие возможности",
    };

    private sealed class OpportunityCandidate
    {
        public int Id { get; init; }
        public string Title { get; init; } = string.Empty;
        public string Description { get; init; } = string.Empty;
        public string OpportunityType { get; init; } = string.Empty;
        public List<string> Tags { get; init; } = [];
    }
}

internal static class AiCareerJson
{
    private static readonly JsonSerializerOptions Options = new(JsonSerializerDefaults.Web)
    {
        PropertyNameCaseInsensitive = true,
        AllowTrailingCommas = true,
        ReadCommentHandling = JsonCommentHandling.Skip,
        NumberHandling = System.Text.Json.Serialization.JsonNumberHandling.AllowReadingFromString,
    };

    public static T? TryDeserialize<T>(string? content)
    {
        if (string.IsNullOrWhiteSpace(content))
        {
            return default;
        }

        var cleaned = content.Trim()
            .Replace("\u00A0", " ")
            .Replace("\u200B", "")
            .Replace("\u200C", "")
            .Replace("\u200D", "")
            .Replace("\uFEFF", "");
        var start = cleaned.IndexOf('{');
        var end = cleaned.LastIndexOf('}');
        if (start < 0 || end <= start)
        {
            return default;
        }

        try
        {
            return JsonSerializer.Deserialize<T>(cleaned[start..(end + 1)], Options);
        }
        catch (JsonException)
        {
            return default;
        }
    }
}

internal static class AiCareerSignature
{
    public static bool IsImportantStatus(string? status) =>
        status?.Trim().ToLowerInvariant() is
            "invited" or "rejected" or "accepted" or "withdrawn" or "submitted" or "reviewing";

    public static string Build(
        ApplicantProfile profile,
        IReadOnlyCollection<ApplicantEducation> education,
        IReadOnlyCollection<ApplicantAchievement> achievements,
        IReadOnlyCollection<CandidateProject> projects,
        IReadOnlyCollection<OpportunityApplication> applications)
    {
        var payload = JsonSerializer.Serialize(new
        {
            profile.Id,
            profile.Name,
            profile.Surname,
            profile.Description,
            Skills = (profile.Skills ?? []).OrderBy(item => item),
            profile.Links,
            Education = education.OrderBy(item => item.Id).Select(item => new
            {
                item.Id,
                item.InstitutionName,
                item.Faculty,
                item.Specialization,
                item.StartYear,
                item.GraduationYear,
            }),
            Achievements = achievements.OrderBy(item => item.Id).Select(item => new
            {
                item.Id,
                item.Title,
                item.Description,
            }),
            Projects = projects.OrderBy(item => item.Id).Select(item => new
            {
                item.Id,
                item.Title,
                item.Role,
                item.ShortDescription,
                Tags = (item.Tags ?? []).OrderBy(tag => tag),
            }),
            Applications = applications
                .Where(item => IsImportantStatus(item.Status))
                .OrderBy(item => item.Id)
                .Select(item => new { item.Id, item.Status }),
        });
        return Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(payload)));
    }
}

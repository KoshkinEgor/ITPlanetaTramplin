using System.Net.Http.Json;
using System.Text.Json.Serialization;
using DTO;
using Microsoft.Extensions.Logging;

namespace ITPlanetaTramplin.Api.Integrations;

public sealed class StepikService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<StepikService> _logger;

    public StepikService(HttpClient httpClient, ILogger<StepikService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;

        if (_httpClient.BaseAddress is null)
        {
            _httpClient.BaseAddress = new Uri("https://stepik.org/");
        }
    }

    public async Task<List<AiCourseDTO>> SearchCoursesAsync(string query, CancellationToken cancellationToken)
    {
        var trimmed = query?.Trim();
        if (string.IsNullOrWhiteSpace(trimmed))
        {
            return [];
        }

        try
        {
            var response = await _httpClient.GetFromJsonAsync<StepikResponse>(
                $"/api/courses?search={Uri.EscapeDataString(trimmed)}&page=1",
                cancellationToken);

            if (response?.Courses is null || response.Courses.Count == 0)
            {
                return [];
            }

            return response.Courses
                .Select(course => new
                {
                    Course = course,
                    Relevance = CalculateRelevance(course, trimmed),
                })
                .Where(item => item.Relevance > 0)
                .OrderByDescending(item => item.Relevance)
                .ThenByDescending(item => item.Course.Rating)
                .Select(item => new AiCourseDTO
                {
                    Id = $"stepik-{item.Course.Id}",
                    Title = item.Course.Title,
                    Provider = "Stepik",
                    Href = !string.IsNullOrWhiteSpace(item.Course.CanonicalUrl)
                        ? item.Course.CanonicalUrl
                        : $"https://stepik.org/course/{item.Course.Id}",
                    Price = item.Course.IsFree ? "Бесплатно" : "Платный курс",
                    Meta = $"По тегу: {trimmed} · Рейтинг: {(item.Course.Rating > 0 ? item.Course.Rating.ToString("F1", System.Globalization.CultureInfo.InvariantCulture) : "—")} · Онлайн"
                })
                .Take(6)
                .ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to fetch courses from Stepik for query: {Query}", trimmed);
            return [];
        }
    }

    private static int CalculateRelevance(StepikCourseItem course, string query)
    {
        var normalizedQuery = Normalize(query);
        if (normalizedQuery.Length == 0)
        {
            return 0;
        }

        var normalizedTitle = Normalize(course.Title);
        var normalizedSummary = Normalize(course.Summary);
        var score = 0;

        if (normalizedTitle.Contains(normalizedQuery, StringComparison.Ordinal))
        {
            score += 4;
        }

        if (normalizedSummary.Contains(normalizedQuery, StringComparison.Ordinal))
        {
            score += 2;
        }

        foreach (var token in normalizedQuery.Split(' ', StringSplitOptions.RemoveEmptyEntries))
        {
            if (normalizedTitle.Contains(token, StringComparison.Ordinal))
            {
                score += 2;
            }
            else if (normalizedSummary.Contains(token, StringComparison.Ordinal))
            {
                score += 1;
            }
        }

        return score;
    }

    private static string Normalize(string? value)
    {
        return string.Join(
            ' ',
            (value ?? string.Empty)
                .Trim()
                .ToLowerInvariant()
                .Replace('ё', 'е')
                .Split(' ', StringSplitOptions.RemoveEmptyEntries));
    }

    private sealed class StepikResponse
    {
        [JsonPropertyName("courses")]
        public List<StepikCourseItem> Courses { get; set; } = [];
    }

    private sealed class StepikCourseItem
    {
        [JsonPropertyName("id")]
        public int Id { get; set; }

        [JsonPropertyName("title")]
        public string Title { get; set; } = string.Empty;

        [JsonPropertyName("summary")]
        public string Summary { get; set; } = string.Empty;

        [JsonPropertyName("canonical_url")]
        public string CanonicalUrl { get; set; } = string.Empty;

        [JsonPropertyName("is_free")]
        public bool IsFree { get; set; }

        [JsonPropertyName("rating")]
        public double Rating { get; set; }
    }
}

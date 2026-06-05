using System.Text.Json;
using Application.DBContext;
using ITPlanetaTramplin.Api.Domain;
using ITPlanetaTramplin.Api.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging.Abstractions;
using Models;
using Xunit;
using ITPlanetaTramplin.Api.Integrations;

namespace ITPlanetaTramplin.Api.Tests;

public sealed class AiCareerServiceTests
{
    [Fact]
    public async Task BuildCareerRecommendationsAsync_ReturnsPersistentCache_ForSameSignature()
    {
        await using var db = CreateDb();
        using var memoryCache = new MemoryCache(new MemoryCacheOptions());
        var client = new FakeGigaChatClient();
        var service = CreateService(client, memoryCache, db);
        var profile = CreateProfile();
        var opportunity = CreateOpportunity(1, "Frontend стажировка");

        var first = await service.BuildCareerRecommendationsAsync(
            profile,
            [CreateEducation(profile.Id)],
            [],
            [CreateProject(profile.Id)],
            [],
            [opportunity],
            forceRefresh: true,
            cancellationToken: CancellationToken.None);

        memoryCache.Compact(1);

        var second = await service.BuildCareerRecommendationsAsync(
            profile,
            [CreateEducation(profile.Id)],
            [],
            [CreateProject(profile.Id)],
            [],
            [opportunity],
            forceRefresh: false,
            cancellationToken: CancellationToken.None);

        Assert.Equal(1, client.CallCount);
        Assert.Equal(first.Signature, second.Signature);
        Assert.False(second.IsStale);
        Assert.Equal("cache_hit", second.RefreshReason);
    }

    [Fact]
    public async Task BuildCareerRecommendationsAsync_FormAnalysis_ReturnsCache_WhenCacheExists()
    {
        await using var db = CreateDb();
        using var memoryCache = new MemoryCache(new MemoryCacheOptions());
        var client = new FakeGigaChatClient();
        var service = CreateService(client, memoryCache, db);
        var profile = CreateProfile();
        var opportunity = CreateOpportunity(1, "Frontend стажировка");

        var first = await service.BuildCareerRecommendationsAsync(
            profile,
            [CreateEducation(profile.Id)],
            [],
            [CreateProject(profile.Id)],
            [],
            [opportunity],
            forceRefresh: true,
            isUpdate: false,
            cancellationToken: CancellationToken.None);

        var second = await service.BuildCareerRecommendationsAsync(
            profile,
            [CreateEducation(profile.Id)],
            [],
            [CreateProject(profile.Id)],
            [],
            [opportunity],
            forceRefresh: true,
            isUpdate: false,
            cancellationToken: CancellationToken.None);

        Assert.Equal(1, client.CallCount);
        Assert.Equal(first.Signature, second.Signature);
        Assert.False(second.IsStale);
        Assert.Equal("cache_hit", second.RefreshReason);
    }

    [Fact]
    public async Task BuildCareerRecommendationsAsync_UpdateAnalysis_ReturnsCache_WhenSignatureMatches()
    {
        await using var db = CreateDb();
        using var memoryCache = new MemoryCache(new MemoryCacheOptions());
        var client = new FakeGigaChatClient();
        var service = CreateService(client, memoryCache, db);
        var profile = CreateProfile();
        var opportunity = CreateOpportunity(1, "Frontend стажировка");

        var first = await service.BuildCareerRecommendationsAsync(
            profile,
            [CreateEducation(profile.Id)],
            [],
            [CreateProject(profile.Id)],
            [],
            [opportunity],
            forceRefresh: true,
            isUpdate: false,
            cancellationToken: CancellationToken.None);

        var second = await service.BuildCareerRecommendationsAsync(
            profile,
            [CreateEducation(profile.Id)],
            [],
            [CreateProject(profile.Id)],
            [],
            [opportunity],
            forceRefresh: true,
            isUpdate: true,
            cancellationToken: CancellationToken.None);

        Assert.Equal(1, client.CallCount);
        Assert.Equal(first.Signature, second.Signature);
        Assert.False(second.IsStale);
        Assert.Equal("cache_hit", second.RefreshReason);
    }

    [Fact]
    public async Task BuildCareerRecommendationsAsync_UpdateAnalysis_BypassesCache_WhenSignatureDiffers()
    {
        await using var db = CreateDb();
        using var memoryCache = new MemoryCache(new MemoryCacheOptions());
        var client = new FakeGigaChatClient();
        var service = CreateService(client, memoryCache, db);
        var profile = CreateProfile();
        var opportunity = CreateOpportunity(1, "Frontend стажировка");

        var first = await service.BuildCareerRecommendationsAsync(
            profile,
            [CreateEducation(profile.Id)],
            [],
            [CreateProject(profile.Id)],
            [],
            [opportunity],
            forceRefresh: true,
            isUpdate: false,
            cancellationToken: CancellationToken.None);

        profile.Description = "Updated profile description";

        var second = await service.BuildCareerRecommendationsAsync(
            profile,
            [CreateEducation(profile.Id)],
            [],
            [CreateProject(profile.Id)],
            [],
            [opportunity],
            forceRefresh: true,
            isUpdate: true,
            cancellationToken: CancellationToken.None);

        Assert.Equal(2, client.CallCount);
        Assert.NotEqual(first.Signature, second.Signature);
        Assert.False(second.IsStale);
        Assert.Equal("profile_or_applications_changed", second.RefreshReason);
    }

    [Fact]
    public async Task BuildCareerRecommendationsAsync_InvalidatesCache_WhenImportantApplicationStatusChanges()
    {
        await using var db = CreateDb();
        using var memoryCache = new MemoryCache(new MemoryCacheOptions());
        var client = new FakeGigaChatClient();
        var service = CreateService(client, memoryCache, db);
        var profile = CreateProfile();
        var opportunity = CreateOpportunity(1, "Frontend стажировка");

        var first = await service.BuildCareerRecommendationsAsync(
            profile,
            [CreateEducation(profile.Id)],
            [],
            [CreateProject(profile.Id)],
            [],
            [opportunity],
            forceRefresh: true,
            isUpdate: false,
            cancellationToken: CancellationToken.None);

        var second = await service.BuildCareerRecommendationsAsync(
            profile,
            [CreateEducation(profile.Id)],
            [],
            [CreateProject(profile.Id)],
            [CreateApplication(profile.Id, opportunity, OpportunityApplicationStatuses.Invited)],
            [opportunity],
            forceRefresh: true,
            isUpdate: true,
            cancellationToken: CancellationToken.None);

        Assert.Equal(2, client.CallCount);
        Assert.NotEqual(first.Signature, second.Signature);
        Assert.False(second.IsStale);
        Assert.Equal("profile_or_applications_changed", second.RefreshReason);
    }

    [Fact]
    public async Task BuildCareerRecommendationsAsync_RegeneratesAutomatically_WhenNewApplicationIsSubmitted()
    {
        await using var db = CreateDb();
        using var memoryCache = new MemoryCache(new MemoryCacheOptions());
        var client = new FakeGigaChatClient();
        var service = CreateService(client, memoryCache, db);
        var profile = CreateProfile();
        var opportunity = CreateOpportunity(1, "Frontend стажировка");

        var first = await service.BuildCareerRecommendationsAsync(
            profile,
            [],
            [],
            [],
            [],
            [opportunity],
            forceRefresh: true,
            cancellationToken: CancellationToken.None);

        var second = await service.BuildCareerRecommendationsAsync(
            profile,
            [],
            [],
            [],
            [CreateApplication(profile.Id, opportunity, OpportunityApplicationStatuses.Submitted)],
            [opportunity],
            forceRefresh: false,
            cancellationToken: CancellationToken.None);

        Assert.Equal(2, client.CallCount);
        Assert.NotEqual(first.Signature, second.Signature);
        Assert.Equal("ai", second.Source);
        Assert.Equal("fresh", second.Status);
        Assert.Equal("profile_or_applications_changed", second.RefreshReason);
    }

    [Fact]
    public async Task BuildCareerRecommendationsAsync_DoesNotInvalidateCache_WhenOnlyOpportunitiesChange()
    {
        await using var db = CreateDb();
        using var memoryCache = new MemoryCache(new MemoryCacheOptions());
        var client = new FakeGigaChatClient();
        var service = CreateService(client, memoryCache, db);
        var profile = CreateProfile();
        var firstOpportunity = CreateOpportunity(1, "Frontend стажировка");
        var secondOpportunity = CreateOpportunity(2, "React интенсив");

        var first = await service.BuildCareerRecommendationsAsync(
            profile,
            [CreateEducation(profile.Id)],
            [],
            [CreateProject(profile.Id)],
            [],
            [firstOpportunity],
            forceRefresh: true,
            cancellationToken: CancellationToken.None);

        memoryCache.Compact(1);

        var second = await service.BuildCareerRecommendationsAsync(
            profile,
            [CreateEducation(profile.Id)],
            [],
            [CreateProject(profile.Id)],
            [],
            [firstOpportunity, secondOpportunity],
            forceRefresh: false,
            cancellationToken: CancellationToken.None);

        Assert.Equal(1, client.CallCount);
        Assert.Equal(first.Signature, second.Signature);
        Assert.Equal("cache_hit", second.RefreshReason);
    }

    [Fact]
    public async Task BuildCareerRecommendationsAsync_ReturnsSameSignature_RegardlessOfInputOrder()
    {
        await using var db = CreateDb();
        using var memoryCache = new MemoryCache(new MemoryCacheOptions());
        var client = new FakeGigaChatClient();
        var service = CreateService(client, memoryCache, db);
        var profile = CreateProfile();
        var opportunity = CreateOpportunity(1, "Frontend стажировка");

        var edu1 = CreateEducation(profile.Id);
        edu1.Id = 31;
        edu1.InstitutionName = "Вуз 1";
        
        var edu2 = CreateEducation(profile.Id);
        edu2.Id = 32;
        edu2.InstitutionName = "Вуз 2";

        var proj1 = CreateProject(profile.Id);
        proj1.Id = 41;
        proj1.Title = "Проект 1";

        var proj2 = CreateProject(profile.Id);
        proj2.Id = 42;
        proj2.Title = "Проект 2";

        var first = await service.BuildCareerRecommendationsAsync(
            profile,
            [edu1, edu2],
            [],
            [proj1, proj2],
            [],
            [opportunity],
            forceRefresh: true,
            cancellationToken: CancellationToken.None);

        memoryCache.Compact(1);

        var second = await service.BuildCareerRecommendationsAsync(
            profile,
            [edu2, edu1],
            [],
            [proj2, proj1],
            [],
            [opportunity],
            forceRefresh: false,
            cancellationToken: CancellationToken.None);

        Assert.Equal(1, client.CallCount);
        Assert.Equal(first.Signature, second.Signature);
        Assert.Equal("cache_hit", second.RefreshReason);
    }

    [Fact]
    public async Task BuildCareerRecommendationsAsync_IncludesStepikCourses()
    {
        await using var db = CreateDb();
        using var memoryCache = new MemoryCache(new MemoryCacheOptions());
        var client = new FakeGigaChatClient();
        var service = CreateService(client, memoryCache, db);
        var profile = CreateProfile();
        var opportunity = CreateOpportunity(1, "Frontend стажировка");

        var response = await service.BuildCareerRecommendationsAsync(
            profile,
            [CreateEducation(profile.Id)],
            [],
            [CreateProject(profile.Id)],
            [],
            [opportunity],
            forceRefresh: true,
            cancellationToken: CancellationToken.None);

        Assert.NotNull(response.RecommendedCourses);
        Assert.True(response.RecommendedCourses.Count >= 2);
        Assert.All(response.RecommendedCourses, course => Assert.Equal("Stepik", course.Provider));
        Assert.Contains(response.RecommendedCourses, course => course.Title.Contains("React", StringComparison.OrdinalIgnoreCase));
        Assert.Contains(response.RecommendedCourses, course => course.Title.Contains("TypeScript", StringComparison.OrdinalIgnoreCase));
        Assert.All(response.RecommendedCourses, course => Assert.Contains("По тегу:", course.Meta));
    }

    [Fact]
    public async Task BuildCareerRecommendationsAsync_BuildsAiPlan_WhenNoOpportunitiesExist()
    {
        await using var db = CreateDb();
        using var memoryCache = new MemoryCache(new MemoryCacheOptions());
        var client = new FakeGigaChatClient();
        var service = CreateService(client, memoryCache, db);
        var profile = CreateProfile();

        var response = await service.BuildCareerRecommendationsAsync(
            profile,
            [CreateEducation(profile.Id)],
            [],
            [CreateProject(profile.Id)],
            [],
            [],
            forceRefresh: true,
            cancellationToken: CancellationToken.None);

        Assert.Equal(1, client.CallCount);
        Assert.Equal("ai", response.Source);
        Assert.Equal("fresh", response.Status);
        Assert.False(response.IsFallback);
        Assert.NotEmpty(response.CareerPlan);
    }

    [Fact]
    public async Task BuildCareerRecommendationsAsync_Retries_WhenFirstResponseIsInvalid()
    {
        await using var db = CreateDb();
        using var memoryCache = new MemoryCache(new MemoryCacheOptions());
        var client = new FakeGigaChatClient("not-json");
        var service = CreateService(client, memoryCache, db);
        var profile = CreateProfile();

        var response = await service.BuildCareerRecommendationsAsync(
            profile,
            [CreateEducation(profile.Id)],
            [],
            [CreateProject(profile.Id)],
            [],
            [],
            forceRefresh: true,
            cancellationToken: CancellationToken.None);

        Assert.Equal(2, client.CallCount);
        Assert.Equal("ai", response.Source);
        Assert.Equal("fresh", response.Status);
        Assert.NotEmpty(response.CareerPlan);
    }

    [Fact]
    public async Task BuildCareerRecommendationsAsync_Retries_WhenPlanHasNoValidOpportunityRecommendations()
    {
        await using var db = CreateDb();
        using var memoryCache = new MemoryCache(new MemoryCacheOptions());
        var planWithoutRecommendations = JsonSerializer.Serialize(new
        {
            summary = "План без возможностей",
            careerPlan = new[]
            {
                new { day = "Следующий шаг", action = "Обнови портфолио", outcome = "Профиль станет сильнее" },
            },
        });
        var client = new FakeGigaChatClient(planWithoutRecommendations);
        var service = CreateService(client, memoryCache, db);
        var profile = CreateProfile();
        var opportunity = CreateOpportunity(1, "React internship");

        var response = await service.BuildCareerRecommendationsAsync(
            profile,
            [CreateEducation(profile.Id)],
            [],
            [CreateProject(profile.Id)],
            [],
            [opportunity],
            forceRefresh: true,
            cancellationToken: CancellationToken.None);

        Assert.Equal(2, client.CallCount);
        Assert.Equal("ai", response.Source);
        Assert.InRange(response.CareerPlan.Count, 1, 3);
        Assert.Contains(response.Items, item => item.OpportunityId == opportunity.Id);
    }

    [Fact]
    public async Task BuildCareerRecommendationsAsync_ReturnsExplicitSystemFallback_AfterTwoInvalidResponses()
    {
        await using var db = CreateDb();
        using var memoryCache = new MemoryCache(new MemoryCacheOptions());
        var client = new FakeGigaChatClient("not-json", "{}");
        var service = CreateService(client, memoryCache, db);
        var profile = CreateProfile();

        var response = await service.BuildCareerRecommendationsAsync(
            profile,
            [CreateEducation(profile.Id)],
            [],
            [CreateProject(profile.Id)],
            [],
            [],
            forceRefresh: true,
            cancellationToken: CancellationToken.None);

        Assert.Equal(2, client.CallCount);
        Assert.Equal("system", response.Source);
        Assert.Equal("unavailable", response.Status);
        Assert.True(response.IsFallback);
        Assert.Contains("системные", response.ErrorMessage, StringComparison.OrdinalIgnoreCase);
        Assert.Empty(await db.AiCareerCaches.ToListAsync());
    }

    [Fact]
    public async Task BuildCareerRecommendationsAsync_ReturnsStaleAiCache_WhenRefreshFails()
    {
        await using var db = CreateDb();
        using var memoryCache = new MemoryCache(new MemoryCacheOptions());
        var client = new FakeGigaChatClient();
        var service = CreateService(client, memoryCache, db);
        var profile = CreateProfile();

        var first = await service.BuildCareerRecommendationsAsync(
            profile,
            [CreateEducation(profile.Id)],
            [],
            [CreateProject(profile.Id)],
            [],
            [],
            forceRefresh: true,
            cancellationToken: CancellationToken.None);

        profile.Description = "Changed profile";
        client.EnqueueResponse("not-json");
        client.EnqueueResponse("{}");

        var second = await service.BuildCareerRecommendationsAsync(
            profile,
            [CreateEducation(profile.Id)],
            [],
            [CreateProject(profile.Id)],
            [],
            [],
            forceRefresh: true,
            isUpdate: true,
            cancellationToken: CancellationToken.None);

        Assert.Equal("ai", second.Source);
        Assert.Equal("stale", second.Status);
        Assert.True(second.IsStale);
        Assert.Equal(first.Summary, second.Summary);
        Assert.Contains("системные", second.ErrorMessage, StringComparison.OrdinalIgnoreCase);
        Assert.Single(await db.AiCareerCaches.ToListAsync());
    }

    [Fact]
    public async Task BuildCareerRecommendationsAsync_InvalidatesCache_WhenAchievementChanges()
    {
        await using var db = CreateDb();
        using var memoryCache = new MemoryCache(new MemoryCacheOptions());
        var client = new FakeGigaChatClient();
        var service = CreateService(client, memoryCache, db);
        var profile = CreateProfile();
        var achievement = new ApplicantAchievement
        {
            Id = 70,
            ApplicantId = profile.Id,
            Title = "Хакатон",
            Description = "Финалист",
            Location = "Москва",
        };

        var first = await service.BuildCareerRecommendationsAsync(
            profile,
            [],
            [achievement],
            [],
            [],
            [],
            forceRefresh: true,
            cancellationToken: CancellationToken.None);

        achievement.Description = "Победитель";

        var second = await service.BuildCareerRecommendationsAsync(
            profile,
            [],
            [achievement],
            [],
            [],
            [],
            forceRefresh: true,
            isUpdate: true,
            cancellationToken: CancellationToken.None);

        Assert.Equal(2, client.CallCount);
        Assert.NotEqual(first.Signature, second.Signature);
    }

    [Fact]
    public async Task BuildCareerRecommendationsAsync_KeepsAiPlan_WhenStepikFails()
    {
        await using var db = CreateDb();
        using var memoryCache = new MemoryCache(new MemoryCacheOptions());
        var client = new FakeGigaChatClient();
        var service = CreateService(client, memoryCache, db, new ThrowingStepikMessageHandler());
        var profile = CreateProfile();

        var response = await service.BuildCareerRecommendationsAsync(
            profile,
            [],
            [],
            [],
            [],
            [],
            forceRefresh: true,
            cancellationToken: CancellationToken.None);

        Assert.Equal("ai", response.Source);
        Assert.Equal("fresh", response.Status);
        Assert.NotEmpty(response.CareerPlan);
        Assert.Empty(response.RecommendedCourses);
    }

    private static AiCareerService CreateService(
        FakeGigaChatClient client,
        IMemoryCache cache,
        ApplicationDBContext db,
        HttpMessageHandler? stepikHandler = null)
    {
        var httpClient = new HttpClient(stepikHandler ?? new FakeStepikMessageHandler());
        var stepikService = new StepikService(httpClient, NullLogger<StepikService>.Instance);
        return new AiCareerService(client, cache, db, NullLogger<AiCareerService>.Instance, stepikService);
    }

    private sealed class FakeStepikMessageHandler : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            Assert.Contains("search=", request.RequestUri?.Query);
            Assert.DoesNotContain("query=", request.RequestUri?.Query);

            var parsedQuery = Microsoft.AspNetCore.WebUtilities.QueryHelpers.ParseQuery(request.RequestUri?.Query ?? string.Empty);
            var query = parsedQuery.TryGetValue("search", out var searchValue) ? searchValue.ToString() : "React";
            var id = query.ToLowerInvariant() switch
            {
                "typescript" => 12346,
                "javascript" => 12347,
                _ => 12345,
            };
            var response = new
            {
                courses = new[]
                {
                    new
                    {
                        id,
                        title = $"Тестовый курс по {query} со Stepik",
                        summary = $"Описание курса по {query}",
                        canonical_url = $"https://stepik.org/course/{id}",
                        is_free = true,
                        rating = 4.75
                    }
                }
            };

            var httpResponse = new HttpResponseMessage(System.Net.HttpStatusCode.OK)
            {
                Content = new StringContent(JsonSerializer.Serialize(response), System.Text.Encoding.UTF8, "application/json")
            };

            return Task.FromResult(httpResponse);
        }
    }

    private sealed class ThrowingStepikMessageHandler : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            throw new HttpRequestException("Stepik unavailable");
        }
    }

    private static ApplicationDBContext CreateDb()
    {
        var options = new DbContextOptionsBuilder<ApplicationDBContext>()
            .UseInMemoryDatabase($"ai-career-cache-{Guid.NewGuid():N}")
            .Options;

        return new ApplicationDBContext(options);
    }

    private static ApplicantProfile CreateProfile()
    {
        return new ApplicantProfile
        {
            Id = 10,
            UserId = 20,
            Name = "Анна",
            Surname = "Иванова",
            Description = "Frontend кандидат с React проектами",
            Skills = ["React", "JavaScript"],
            Links = JsonSerializer.Serialize(new
            {
                onboarding = new
                {
                    profession = "Frontend разработчик",
                    city = "Москва",
                    goal = "Найти стажировку",
                },
            }),
        };
    }

    private static ApplicantEducation CreateEducation(int applicantId)
    {
        return new ApplicantEducation
        {
            Id = 30,
            ApplicantId = applicantId,
            InstitutionName = "Университет",
            Faculty = "ИТ",
            Specialization = "Прикладная информатика",
            StartYear = 2022,
            GraduationYear = 2026,
        };
    }

    private static CandidateProject CreateProject(int applicantId)
    {
        return new CandidateProject
        {
            Id = 40,
            ApplicantId = applicantId,
            Title = "Career dashboard",
            ProjectType = "web",
            ShortDescription = "React интерфейс для карьерных рекомендаций",
            Role = "Frontend developer",
            StartDate = new DateOnly(2026, 1, 1),
            Problem = "Помочь кандидатам выбирать возможности",
            Contribution = "Собрала UI и фильтрацию",
            Result = "Демо готово",
            Tags = ["React", "TypeScript"],
            ShowInPortfolio = true,
        };
    }

    private static Opportunity CreateOpportunity(int id, string title)
    {
        return new Opportunity
        {
            Id = id,
            EmployerId = 1,
            Title = title,
            Description = "React и TypeScript для junior кандидатов",
            OpportunityType = "internship",
            EmploymentType = "remote",
            ModerationStatus = "approved",
            PublishAt = DateOnly.FromDateTime(DateTime.UtcNow.Date),
            LocationCity = "Москва",
            IsPaid = true,
            StipendFrom = 30000,
            StipendTo = 50000,
            Duration = "2 месяца",
            Tags = { new Tag { Id = id, Name = "React", IsActive = true } },
        };
    }

    private static OpportunityApplication CreateApplication(int applicantId, Opportunity opportunity, string status)
    {
        return new OpportunityApplication
        {
            Id = 50,
            ApplicantId = applicantId,
            OpportunityId = opportunity.Id,
            Opportunity = opportunity,
            Status = status,
            AppliedAt = DateTime.UtcNow,
        };
    }

    private sealed class FakeGigaChatClient : IGigaChatClient
    {
        private readonly Queue<string?> _responses;

        public FakeGigaChatClient(params string?[] responses)
        {
            _responses = new Queue<string?>(responses);
        }

        public int CallCount { get; private set; }

        public void EnqueueResponse(string? response)
        {
            _responses.Enqueue(response);
        }

        public Task<GigaChatCompletionResult> CompleteJsonAsync(
            string systemPrompt,
            string userPrompt,
            CancellationToken cancellationToken = default)
        {
            CallCount++;

            if (_responses.Count > 0)
            {
                var queued = _responses.Dequeue();
                return Task.FromResult(queued is null
                    ? GigaChatCompletionResult.Failure("test_failure", true)
                    : GigaChatCompletionResult.Success(queued));
            }

            var response = new
            {
                summary = $"AI разбор {CallCount}",
                nextActions = new[] { "Обновить портфолио", "Подготовить рассказ о роли" },
                profileAssessment = new
                {
                    score = 78,
                    summary = "Профиль понятен работодателю.",
                    strengths = new[] { "Есть React" },
                    improvements = new[] { "Добавить метрики" },
                },
                portfolioAssessment = new
                {
                    score = 66,
                    summary = "Портфолио можно усилить результатами.",
                    strengths = new[] { "Есть проект" },
                    improvements = new[] { "Показать командный вклад" },
                },
                salaryInsight = new
                {
                    currentLevel = "Junior frontend",
                    nextLevel = "Middle frontend",
                    summary = "Ориентир зависит от качества проектов.",
                    ranges = new[] { new { label = "Москва", range = "90-140 тыс. ₽" } },
                },
                skillGaps = new[] { new { skill = "TypeScript", reason = "Часто нужен для frontend", priority = "high" } },
                careerPlan = new[] { new { day = "День 1", action = "Обновить портфолио", outcome = "Кейс стал понятнее" } },
                sections = new[]
                {
                    new
                    {
                        type = "internship",
                        title = "Стажировки",
                        items = new[] { new { opportunityId = 1, matchPercent = 88, reason = "Совпадает по React", nextStep = "Откликнуться" } },
                    },
                },
            };

            return Task.FromResult(GigaChatCompletionResult.Success(JsonSerializer.Serialize(response)));
        }
    }

}

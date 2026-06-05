using System.Text.Json;
using Application.DBContext;
using DTO;
using ITPlanetaTramplin.Api.Integrations;
using ITPlanetaTramplin.Api.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Models;
using Xunit;

namespace ITPlanetaTramplin.Api.Tests;

public sealed class AiCareerJobServiceTests
{
    [Fact]
    public async Task QueueAsync_ReturnsExistingActiveJob()
    {
        await using var db = CreateDb();
        var profile = await SeedProfileAsync(db);
        var service = CreateService(db, new FakeStepGenerator());

        var first = await service.QueueAsync(profile.Id, "manual", CancellationToken.None);
        var second = await service.QueueAsync(profile.Id, "profile_changed", CancellationToken.None);

        Assert.Equal(first.JobId, second.JobId);
        Assert.Equal(3, first.Steps.Count);
        Assert.Single(await db.AiCareerJobs.ToListAsync());
    }

    [Fact]
    public async Task ProcessNextStepAsync_CompletesThreeIndependentSteps()
    {
        await using var db = CreateDb();
        var profile = await SeedProfileAsync(db);
        var service = CreateService(db, new FakeStepGenerator());
        var job = await service.QueueAsync(profile.Id, "manual", CancellationToken.None);

        Assert.True(await service.ProcessNextStepAsync(CancellationToken.None));
        Assert.True(await service.ProcessNextStepAsync(CancellationToken.None));
        Assert.True(await service.ProcessNextStepAsync(CancellationToken.None));

        var completed = await service.GetJobAsync(job.JobId, profile.Id, CancellationToken.None);
        var overview = await service.GetOverviewAsync(profile.Id, CancellationToken.None);
        Assert.Equal("succeeded", completed!.Status);
        Assert.All(completed.Steps, step => Assert.Equal("succeeded", step.Status));
        Assert.Equal("fresh", overview.Status);
        Assert.Equal("ai", overview.Source);
        Assert.Equal(3, await db.AiCareerCaches.CountAsync());
    }

    [Fact]
    public async Task ProcessNextStepAsync_PublishesPartialResult_WhenOneStepFails()
    {
        await using var db = CreateDb();
        var profile = await SeedProfileAsync(db);
        var generator = new FakeStepGenerator
        {
            OpportunitiesResult = AiCareerStepResult<AiCareerOpportunityPartDTO>.Failure(
                "invalid_opportunity_ids",
                false),
        };
        var service = CreateService(db, generator);
        var job = await service.QueueAsync(profile.Id, "manual", CancellationToken.None);

        await service.ProcessNextStepAsync(CancellationToken.None);
        await service.ProcessNextStepAsync(CancellationToken.None);
        await service.ProcessNextStepAsync(CancellationToken.None);

        var completed = await service.GetJobAsync(job.JobId, profile.Id, CancellationToken.None);
        var overview = await service.GetOverviewAsync(profile.Id, CancellationToken.None);
        Assert.Equal("partial", completed!.Status);
        Assert.Equal("partial", overview.Status);
        Assert.Contains(overview.PartialFailures, item => item.Step == AiCareerJobService.OpportunitiesStep);
        Assert.Equal("AI-профиль готов", overview.Summary);
    }

    [Fact]
    public async Task ProcessNextStepAsync_RetriesRetryableFailure()
    {
        await using var db = CreateDb();
        var profile = await SeedProfileAsync(db);
        var generator = new FakeStepGenerator
        {
            ProfileResults = new Queue<AiCareerStepResult<AiCareerProfilePartDTO>>(
            [
                AiCareerStepResult<AiCareerProfilePartDTO>.Failure("timeout", true),
                FakeStepGenerator.SuccessfulProfileResult(),
            ]),
        };
        var service = CreateService(db, generator);
        await service.QueueAsync(profile.Id, "manual", CancellationToken.None);

        await service.ProcessNextStepAsync(CancellationToken.None);
        var profileStep = await db.AiCareerJobSteps.SingleAsync(item => item.Step == AiCareerJobService.ProfileStep);
        Assert.Equal("queued", profileStep.Status);
        Assert.Equal(1, profileStep.AttemptCount);

        profileStep.AvailableAt = DateTime.UtcNow.AddSeconds(-1);
        await db.SaveChangesAsync();
        await service.ProcessNextStepAsync(CancellationToken.None);

        Assert.Equal("succeeded", profileStep.Status);
        Assert.Equal(2, profileStep.AttemptCount);
    }

    [Fact]
    public async Task ProcessNextStepAsync_RecoversExpiredLease()
    {
        await using var db = CreateDb();
        var profile = await SeedProfileAsync(db);
        var service = CreateService(db, new FakeStepGenerator());
        await service.QueueAsync(profile.Id, "manual", CancellationToken.None);
        var step = await db.AiCareerJobSteps
            .Include(item => item.Job)
            .SingleAsync(item => item.Step == AiCareerJobService.ProfileStep);
        step.Status = "running";
        step.AttemptCount = 1;
        step.LeaseUntil = DateTime.UtcNow.AddMinutes(-1);
        step.Job.Status = "running";
        await db.SaveChangesAsync();

        await service.ProcessNextStepAsync(CancellationToken.None);

        Assert.Equal("succeeded", step.Status);
        Assert.Equal(2, step.AttemptCount);
    }

    [Fact]
    public async Task OpportunityGenerator_RejectsUnknownOpportunityIds()
    {
        var client = new StaticGigaChatClient(JsonSerializer.Serialize(new
        {
            sections = new[]
            {
                new
                {
                    type = "vacancy",
                    title = "Вакансии",
                    items = new[] { new { opportunityId = 999, matchPercent = 90, reason = "test" } },
                },
            },
        }));
        var stepik = new StepikService(new HttpClient(new EmptyHttpHandler()), NullLogger<StepikService>.Instance);
        var generator = new AiCareerStepGenerator(client, stepik);
        var profile = CreateProfile();
        var opportunity = new Opportunity
        {
            Id = 1,
            EmployerId = 1,
            Title = "React internship",
            Description = "React",
            OpportunityType = "internship",
            EmploymentType = "remote",
            ModerationStatus = "approved",
            PublishAt = DateOnly.FromDateTime(DateTime.UtcNow),
            Tags = { new Tag { Id = 1, Name = "React", IsActive = true } },
        };

        var result = await generator.GenerateOpportunitiesAsync(
            profile,
            [],
            [opportunity],
            CancellationToken.None);

        Assert.False(result.IsSuccess);
        Assert.Equal("invalid_opportunity_ids", result.ErrorCode);
    }

    private static AiCareerJobService CreateService(ApplicationDBContext db, IAiCareerStepGenerator generator) =>
        new(db, generator, NullLogger<AiCareerJobService>.Instance);

    private static ApplicationDBContext CreateDb()
    {
        var options = new DbContextOptionsBuilder<ApplicationDBContext>()
            .UseInMemoryDatabase($"ai-career-jobs-{Guid.NewGuid():N}")
            .Options;
        return new ApplicationDBContext(options);
    }

    private static async Task<ApplicantProfile> SeedProfileAsync(ApplicationDBContext db)
    {
        var profile = CreateProfile();
        db.ApplicantProfiles.Add(profile);
        await db.SaveChangesAsync();
        return profile;
    }

    private static ApplicantProfile CreateProfile() => new()
    {
        Id = 10,
        UserId = 20,
        Name = "Анна",
        Surname = "Иванова",
        Description = "Frontend developer",
        Skills = ["React", "TypeScript"],
    };

    private sealed class FakeStepGenerator : IAiCareerStepGenerator
    {
        public Queue<AiCareerStepResult<AiCareerProfilePartDTO>> ProfileResults { get; init; } = new();

        public AiCareerStepResult<AiCareerOpportunityPartDTO> OpportunitiesResult { get; init; } =
            AiCareerStepResult<AiCareerOpportunityPartDTO>.Success(new()
            {
                Items = [new() { OpportunityId = 1, MatchPercent = 85, Reason = "React" }],
            });

        public static AiCareerStepResult<AiCareerProfilePartDTO> SuccessfulProfileResult() =>
            AiCareerStepResult<AiCareerProfilePartDTO>.Success(new()
            {
                Summary = "AI-профиль готов",
                ProfileAssessment = new() { Score = 80, Summary = "Хороший профиль" },
                PortfolioAssessment = new() { Score = 70, Summary = "Есть проекты" },
            });

        public Task<AiCareerStepResult<AiCareerProfilePartDTO>> GenerateProfileAsync(
            ApplicantProfile profile,
            IReadOnlyCollection<ApplicantEducation> education,
            IReadOnlyCollection<ApplicantAchievement> achievements,
            IReadOnlyCollection<CandidateProject> projects,
            CancellationToken cancellationToken) =>
            Task.FromResult(ProfileResults.Count > 0 ? ProfileResults.Dequeue() : SuccessfulProfileResult());

        public Task<AiCareerStepResult<AiCareerRoutePartDTO>> GenerateCareerAsync(
            ApplicantProfile profile,
            IReadOnlyCollection<ApplicantEducation> education,
            IReadOnlyCollection<ApplicantAchievement> achievements,
            IReadOnlyCollection<CandidateProject> projects,
            IReadOnlyCollection<OpportunityApplication> applications,
            CancellationToken cancellationToken) =>
            Task.FromResult(AiCareerStepResult<AiCareerRoutePartDTO>.Success(new()
            {
                NextActions = ["Обновить портфолио"],
                CareerPlan = [new() { Day = "День 1", Action = "Добавить проект", Outcome = "Профиль сильнее" }],
            }));

        public Task<AiCareerStepResult<AiCareerOpportunityPartDTO>> GenerateOpportunitiesAsync(
            ApplicantProfile profile,
            IReadOnlyCollection<CandidateProject> projects,
            IReadOnlyCollection<Opportunity> opportunities,
            CancellationToken cancellationToken) =>
            Task.FromResult(OpportunitiesResult);
    }

    private sealed class StaticGigaChatClient : IGigaChatClient
    {
        private readonly string _content;

        public StaticGigaChatClient(string content)
        {
            _content = content;
        }

        public Task<GigaChatCompletionResult> CompleteJsonAsync(
            string systemPrompt,
            string userPrompt,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(GigaChatCompletionResult.Success(_content));
    }

    private sealed class EmptyHttpHandler : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken) =>
            Task.FromResult(new HttpResponseMessage(System.Net.HttpStatusCode.OK)
            {
                Content = new StringContent("{\"courses\":[]}"),
            });
    }
}

using Application.DBContext;
using DTO;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Models;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Xunit;

namespace ITPlanetaTramplin.Api.Tests;

public class CandidateApplicationLifecycleTests
{
    [Fact]
    public async Task ApplyToOpportunity_ReturnsSummary_AndAppearsInCandidateList()
    {
        await using var factory = new TestApplicationFactory();
        using var client = factory.CreateClient();

        var opportunityId = await CreateApprovedOpportunityAsync(factory, client, $"summary-{Guid.NewGuid():N}");
        await client.PostAsync("/api/auth/logout", null);

        var candidate = await RegisterAndConfirmCandidateAsync(client, $"summary-{Guid.NewGuid():N}@tramplin.local");
        await LoginAsCandidateAsync(client, candidate.Email);
        await CompleteMandatoryCandidateProfileAsync(factory, candidate.Email);

        var applyResponse = await client.PostAsJsonAsync($"/api/opportunities/{opportunityId}/applications", new { });
        Assert.Equal(HttpStatusCode.OK, applyResponse.StatusCode);

        var summary = await applyResponse.Content.ReadFromJsonAsync<OpportunityApplicationSummaryDTO>();
        Assert.NotNull(summary);
        Assert.Equal(opportunityId, summary!.OpportunityId);
        Assert.Equal("submitted", summary.Status);

        var listResponse = await client.GetAsync("/api/candidate/me/applications");
        Assert.Equal(HttpStatusCode.OK, listResponse.StatusCode);

        var applications = await listResponse.Content.ReadFromJsonAsync<List<OpportunityApplicationSummaryDTO>>();
        Assert.NotNull(applications);
        Assert.Contains(applications!, item => item.Id == summary.Id && item.Status == "submitted");
    }

    [Fact]
    public async Task ApplyToOpportunity_ReturnsForbidden_WhenMandatoryOnboardingIsIncomplete()
    {
        await using var factory = new TestApplicationFactory();
        using var client = factory.CreateClient();

        var opportunityId = await CreateApprovedOpportunityAsync(factory, client, $"incomplete-{Guid.NewGuid():N}");
        await client.PostAsync("/api/auth/logout", null);

        var candidate = await RegisterAndConfirmCandidateAsync(client, $"incomplete-{Guid.NewGuid():N}@tramplin.local");
        await LoginAsCandidateAsync(client, candidate.Email);

        var applyResponse = await client.PostAsJsonAsync($"/api/opportunities/{opportunityId}/applications", new { });
        Assert.Equal(HttpStatusCode.Forbidden, applyResponse.StatusCode);

        var payload = await applyResponse.Content.ReadFromJsonAsync<MessageResponseDTO>();
        Assert.NotNull(payload);
        Assert.Contains("обязательные поля профиля", payload!.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task CandidateCanWithdrawOwnSubmittedApplication()
    {
        await using var factory = new TestApplicationFactory();
        using var client = factory.CreateClient();

        var opportunityId = await CreateApprovedOpportunityAsync(factory, client, $"withdraw-{Guid.NewGuid():N}");
        await client.PostAsync("/api/auth/logout", null);

        var candidate = await RegisterAndConfirmCandidateAsync(client, $"withdraw-{Guid.NewGuid():N}@tramplin.local");
        await LoginAsCandidateAsync(client, candidate.Email);
        await CompleteMandatoryCandidateProfileAsync(factory, candidate.Email);

        var applySummary = await ApplyToOpportunityAsync(client, opportunityId);

        var withdrawResponse = await client.PostAsync($"/api/candidate/me/applications/{applySummary.Id}/withdraw", null);
        Assert.Equal(HttpStatusCode.OK, withdrawResponse.StatusCode);

        var withdrawnSummary = await withdrawResponse.Content.ReadFromJsonAsync<OpportunityApplicationSummaryDTO>();
        Assert.NotNull(withdrawnSummary);
        Assert.Equal("withdrawn", withdrawnSummary!.Status);
    }

    [Fact]
    public async Task CandidateCanConfirmInvitedApplication()
    {
        await using var factory = new TestApplicationFactory();
        using var client = factory.CreateClient();

        var opportunityId = await CreateApprovedOpportunityAsync(factory, client, $"confirm-{Guid.NewGuid():N}");
        await client.PostAsync("/api/auth/logout", null);

        var candidate = await RegisterAndConfirmCandidateAsync(client, $"confirm-{Guid.NewGuid():N}@tramplin.local");
        await LoginAsCandidateAsync(client, candidate.Email);
        await CompleteMandatoryCandidateProfileAsync(factory, candidate.Email);

        var applySummary = await ApplyToOpportunityAsync(client, opportunityId);

        await client.PostAsync("/api/auth/logout", null);
        await LoginAsCompanyAsync(client);

        var inviteResponse = await client.PutAsJsonAsync($"/api/opportunities/{opportunityId}/applications/{applySummary.Id}", new
        {
            status = "invited",
            employerNote = "Приходите на следующий этап.",
        });
        Assert.Equal(HttpStatusCode.OK, inviteResponse.StatusCode);

        await client.PostAsync("/api/auth/logout", null);
        await LoginAsCandidateAsync(client, candidate.Email);

        var confirmResponse = await client.PostAsync($"/api/candidate/me/applications/{applySummary.Id}/confirm", null);
        Assert.Equal(HttpStatusCode.OK, confirmResponse.StatusCode);

        var confirmedSummary = await confirmResponse.Content.ReadFromJsonAsync<OpportunityApplicationSummaryDTO>();
        Assert.NotNull(confirmedSummary);
        Assert.Equal("accepted", confirmedSummary!.Status);
    }

    [Fact]
    public async Task CandidateCannotConfirmNonInvitedApplication()
    {
        await using var factory = new TestApplicationFactory();
        using var client = factory.CreateClient();

        var opportunityId = await CreateApprovedOpportunityAsync(factory, client, $"invalid-{Guid.NewGuid():N}");
        await client.PostAsync("/api/auth/logout", null);

        var candidate = await RegisterAndConfirmCandidateAsync(client, $"invalid-{Guid.NewGuid():N}@tramplin.local");
        await LoginAsCandidateAsync(client, candidate.Email);
        await CompleteMandatoryCandidateProfileAsync(factory, candidate.Email);

        var applySummary = await ApplyToOpportunityAsync(client, opportunityId);

        var confirmResponse = await client.PostAsync($"/api/candidate/me/applications/{applySummary.Id}/confirm", null);
        Assert.Equal(HttpStatusCode.BadRequest, confirmResponse.StatusCode);

        var error = await confirmResponse.Content.ReadFromJsonAsync<MessageResponseDTO>();
        Assert.NotNull(error);
        Assert.Contains("Подтвердить можно", error!.Message);
    }

    [Fact]
    public async Task CandidateCannotWithdrawAnotherCandidatesApplication()
    {
        await using var factory = new TestApplicationFactory();
        using var client = factory.CreateClient();

        var opportunityId = await CreateApprovedOpportunityAsync(factory, client, $"foreign-{Guid.NewGuid():N}");
        await client.PostAsync("/api/auth/logout", null);

        var firstCandidate = await RegisterAndConfirmCandidateAsync(client, $"foreign-a-{Guid.NewGuid():N}@tramplin.local");
        await LoginAsCandidateAsync(client, firstCandidate.Email);
        await CompleteMandatoryCandidateProfileAsync(factory, firstCandidate.Email);
        var applySummary = await ApplyToOpportunityAsync(client, opportunityId);

        await client.PostAsync("/api/auth/logout", null);

        var secondCandidate = await RegisterAndConfirmCandidateAsync(client, $"foreign-b-{Guid.NewGuid():N}@tramplin.local");
        await LoginAsCandidateAsync(client, secondCandidate.Email);

        var withdrawResponse = await client.PostAsync($"/api/candidate/me/applications/{applySummary.Id}/withdraw", null);
        Assert.Equal(HttpStatusCode.NotFound, withdrawResponse.StatusCode);
    }

    private static async Task<int> CreateApprovedOpportunityAsync(TestApplicationFactory factory, HttpClient client, string title)
    {
        await LoginAsCompanyAsync(client);

        var createResponse = await client.PostAsJsonAsync("/api/opportunities", new
        {
            title,
            description = "Created from lifecycle test",
            opportunityType = "vacancy",
            employmentType = "online",
            contactsJson = """{"email":"lifecycle@test.local"}""",
            salaryFrom = 90000m,
            salaryTo = 140000m,
            saveMode = "submit",
        });

        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);

        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDBContext>();
        var opportunity = await db.Opportunities.SingleAsync(item => item.Title == title);
        opportunity.ModerationStatus = "approved";
        await db.SaveChangesAsync();

        return opportunity.Id;
    }

    private static async Task<OpportunityApplicationSummaryDTO> ApplyToOpportunityAsync(HttpClient client, int opportunityId)
    {
        var response = await client.PostAsJsonAsync($"/api/opportunities/{opportunityId}/applications", new { });
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var summary = await response.Content.ReadFromJsonAsync<OpportunityApplicationSummaryDTO>();
        Assert.NotNull(summary);
        return summary!;
    }

    private static async Task<PendingEmailVerificationDTO> RegisterAndConfirmCandidateAsync(HttpClient client, string email)
    {
        var registrationResponse = await client.PostAsJsonAsync("/api/auth/register/candidate", new
        {
            email,
            password = "Password1",
            name = "Test",
            surname = "Candidate",
            thirdname = "User",
        });
        Assert.Equal(HttpStatusCode.Created, registrationResponse.StatusCode);

        var payload = await registrationResponse.Content.ReadFromJsonAsync<PendingEmailVerificationDTO>();
        Assert.NotNull(payload);

        var confirmResponse = await client.PostAsJsonAsync("/api/auth/confirm-email", new
        {
            email = payload!.Email,
            role = payload.Role,
            code = payload.DebugCode,
        });
        Assert.Equal(HttpStatusCode.OK, confirmResponse.StatusCode);

        return payload;
    }

    private static async Task CompleteMandatoryCandidateProfileAsync(TestApplicationFactory factory, string email)
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDBContext>();
        var user = await db.Users
            .Include(item => item.ApplicantProfile)
            .ThenInclude(item => item.ApplicantEducations)
            .SingleAsync(item => item.Email == email);

        var profile = Assert.IsType<ApplicantProfile>(user.ApplicantProfile);
        profile.Skills = ["UX", "Figma"];
        profile.Links = JsonSerializer.Serialize(new
        {
            onboarding = new
            {
                profession = "UX/UI-дизайнер",
                gender = "female",
                birthDate = "2002-04-12",
                phone = "+79990000000",
                city = "Москва",
                citizenship = "Россия",
                noExperience = true,
                goal = "Получить первую стажировку в продуктовой команде",
            },
        });

        if (profile.ApplicantEducations.Count == 0)
        {
            profile.ApplicantEducations.Add(new ApplicantEducation
            {
                InstitutionName = "Test University",
                Faculty = "Design",
                Specialization = "Interface Design",
                GraduationYear = 2027,
                IsCompleted = false,
            });
        }

        await db.SaveChangesAsync();
    }

    private static async Task LoginAsCandidateAsync(HttpClient client, string email)
    {
        var loginResponse = await client.PostAsJsonAsync("/api/auth/login", new
        {
            role = "candidate",
            login = email,
            password = "Password1",
        });

        Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);
    }

    private static async Task LoginAsCompanyAsync(HttpClient client)
    {
        var loginResponse = await client.PostAsJsonAsync("/api/auth/login", new
        {
            role = "company",
            login = "7707083893",
            password = "Demo1234",
        });

        Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);
    }
}

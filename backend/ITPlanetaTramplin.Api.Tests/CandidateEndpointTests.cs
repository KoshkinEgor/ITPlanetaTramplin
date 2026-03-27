using Application.DBContext;
using DTO;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System.Net;
using System.Net.Http.Json;
using Xunit;

namespace ITPlanetaTramplin.Api.Tests;

public class CandidateEndpointTests
{
    [Fact]
    public async Task CandidateProjectEndpoints_PersistUploadedCoverAndParticipants()
    {
        await using var factory = new TestApplicationFactory();
        using var client = factory.CreateClient();

        var candidate = await RegisterAndConfirmCandidateAsync(client, "candidate-projects@tramplin.local");
        await client.PostAsync("/api/auth/logout", null);

        var loginResponse = await client.PostAsJsonAsync("/api/auth/login", new
        {
            role = "candidate",
            login = candidate.Email,
            password = "Password1",
        });
        Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);

        var createResponse = await client.PostAsJsonAsync("/api/candidate/me/projects", new
        {
            title = "Платформа командной аналитики",
            projectType = "Проект",
            shortDescription = "Сервис для совместной работы над аналитическими отчетами.",
            organization = "Трамплин Lab",
            role = "Fullstack developer",
            teamSize = 3,
            startDate = "2025-09",
            endDate = "2026-02",
            isOngoing = false,
            problem = "Команде нужен был единый интерфейс для аналитики и визуализации данных.",
            contribution = "Разработал фронтенд, API и сборку отчетов.",
            result = "Команда сократила время подготовки отчетов и получила единый рабочий процесс.",
            tags = new[] { "React", "ASP.NET Core" },
            coverImageUrl = "data:image/png;base64,ZmFrZQ==",
            participants = new[]
            {
                new { name = "Анна Петрова", role = "Product designer" },
                new { name = "Илья Смирнов", role = "Backend developer" },
            },
            showInPortfolio = true,
        });
        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);

        var createdProject = await createResponse.Content.ReadFromJsonAsync<CandidateProjectReadDTO>();
        Assert.NotNull(createdProject);
        Assert.Equal("data:image/png;base64,ZmFrZQ==", createdProject!.CoverImageUrl);
        Assert.NotNull(createdProject.Participants);
        Assert.Collection(
            createdProject.Participants!,
            participant =>
            {
                Assert.Equal("Анна Петрова", participant.Name);
                Assert.Equal("Product designer", participant.Role);
            },
            participant =>
            {
                Assert.Equal("Илья Смирнов", participant.Name);
                Assert.Equal("Backend developer", participant.Role);
            });

        var listResponse = await client.GetAsync("/api/candidate/me/projects");
        Assert.Equal(HttpStatusCode.OK, listResponse.StatusCode);

        var projects = await listResponse.Content.ReadFromJsonAsync<List<CandidateProjectReadDTO>>();
        Assert.NotNull(projects);
        Assert.Single(projects!);
        Assert.Equal("Платформа командной аналитики", projects[0].Title);
        Assert.Equal("data:image/png;base64,ZmFrZQ==", projects[0].CoverImageUrl);
        Assert.NotNull(projects[0].Participants);
        Assert.Equal(2, projects[0].Participants!.Count);
    }

    [Fact]
    public async Task LegacyApplicantEndpoints_RequireCandidateRole_AndCurrentCandidateOwnership()
    {
        await using var factory = new TestApplicationFactory();
        using var client = factory.CreateClient();

        var guestResponse = await client.GetAsync("/api/applicant/1/education");
        Assert.Equal(HttpStatusCode.Unauthorized, guestResponse.StatusCode);

        var companyLoginResponse = await client.PostAsJsonAsync("/api/auth/login", new
        {
            role = "company",
            login = "7707083893",
            password = "Demo1234",
        });
        Assert.Equal(HttpStatusCode.OK, companyLoginResponse.StatusCode);

        var companyResponse = await client.GetAsync("/api/applicant/1/education");
        Assert.Equal(HttpStatusCode.Forbidden, companyResponse.StatusCode);

        await client.PostAsync("/api/auth/logout", null);

        var firstCandidate = await RegisterAndConfirmCandidateAsync(client, "candidate-one@tramplin.local");
        var secondCandidate = await RegisterAndConfirmCandidateAsync(client, "candidate-two@tramplin.local");

        await client.PostAsync("/api/auth/logout", null);

        var firstLoginResponse = await client.PostAsJsonAsync("/api/auth/login", new
        {
            role = "candidate",
            login = firstCandidate.Email,
            password = "Password1",
        });
        Assert.Equal(HttpStatusCode.OK, firstLoginResponse.StatusCode);

        int firstApplicantId;
        int secondApplicantId;
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDBContext>();
            firstApplicantId = db.ApplicantProfiles
                .Include(item => item.User)
                .Single(item => item.User.Email == firstCandidate.Email)
                .Id;
            secondApplicantId = db.ApplicantProfiles
                .Include(item => item.User)
                .Single(item => item.User.Email == secondCandidate.Email)
                .Id;
        }

        var ownEducationResponse = await client.GetAsync($"/api/applicant/{firstApplicantId}/education");
        Assert.Equal(HttpStatusCode.OK, ownEducationResponse.StatusCode);

        var otherEducationResponse = await client.GetAsync($"/api/applicant/{secondApplicantId}/education");
        Assert.Equal(HttpStatusCode.NotFound, otherEducationResponse.StatusCode);

        var otherAchievementResponse = await client.GetAsync($"/api/applicant/{secondApplicantId}/achievement");
        Assert.Equal(HttpStatusCode.NotFound, otherAchievementResponse.StatusCode);

        var otherContactsResponse = await client.GetAsync("/api/applicant/999999/contact");
        Assert.Equal(HttpStatusCode.NotFound, otherContactsResponse.StatusCode);
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
}

using Application.DBContext;
using DTO;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Xunit;

namespace ITPlanetaTramplin.Api.Tests;

public class ModerationEndpointTests
{
    [Fact]
    public async Task ModeratorInvitation_RequiresAdministratorModerator()
    {
        await using var factory = new TestApplicationFactory();
        using var client = factory.CreateClient();

        await LoginAsModeratorAsync(client, "demo-curator@tramplin.local", "Curator1234");

        var forbiddenResponse = await client.PostAsJsonAsync("/api/moderation/moderator-invitations", new
        {
            email = "forbidden-moderator@tramplin.local",
            name = "Ivan",
            surname = "Petrov",
        });

        Assert.Equal(HttpStatusCode.Forbidden, forbiddenResponse.StatusCode);

        await client.PostAsync("/api/auth/logout", null);
        await LoginAsModeratorAsync(client, "administrator@tramplin.local", "Administrator1234");

        var createdResponse = await client.PostAsJsonAsync("/api/moderation/moderator-invitations", new
        {
            email = $"moderator-{Guid.NewGuid():N}@tramplin.local",
            name = "Ivan",
            surname = "Petrov",
        });

        Assert.Equal(HttpStatusCode.Created, createdResponse.StatusCode);

        var payload = await createdResponse.Content.ReadFromJsonAsync<ModeratorInvitationResultDTO>();
        Assert.NotNull(payload);
        Assert.False(string.IsNullOrWhiteSpace(payload!.Email));
    }

    [Fact]
    public async Task CandidateModerationEndpoints_SupportDetailUpdateAndDecision()
    {
        await using var factory = new TestApplicationFactory();
        using var client = factory.CreateClient();
        await LoginAsModeratorAsync(client, "administrator@tramplin.local", "Administrator1234");

        int userId;
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDBContext>();
            userId = await db.Users
                .Where(item => item.Email == "anna.petrova@tramplin.local")
                .Select(item => item.Id)
                .SingleAsync();
        }

        var detailResponse = await client.GetAsync($"/api/moderation/users/{userId}");
        Assert.Equal(HttpStatusCode.OK, detailResponse.StatusCode);

        var detailPayload = await detailResponse.Content.ReadFromJsonAsync<CandidateProfileReadDTO>();
        Assert.NotNull(detailPayload);
        Assert.Equal("approved", detailPayload!.ModerationStatus);

        var updateResponse = await client.PutAsJsonAsync($"/api/moderation/users/{userId}", new
        {
            description = "Updated by moderator",
            skills = new[] { "React", "Mentoring" },
            links = new
            {
                portfolio = "https://updated.tramplin.local",
                preferences = new { visibility = "private" },
            },
        });

        Assert.Equal(HttpStatusCode.OK, updateResponse.StatusCode);

        var decisionResponse = await client.PostAsJsonAsync($"/api/moderation/users/{userId}/decision", new
        {
            status = "revision",
        });

        Assert.Equal(HttpStatusCode.OK, decisionResponse.StatusCode);

        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDBContext>();
            var profile = await db.ApplicantProfiles.SingleAsync(item => item.UserId == userId);

            Assert.Equal("Updated by moderator", profile.Description);
            Assert.Equal(["React", "Mentoring"], profile.Skills);
            Assert.Equal("revision", profile.ModerationStatus);
            Assert.Contains("private", profile.Links ?? string.Empty, StringComparison.Ordinal);
        }
    }

    [Fact]
    public async Task CompanyModerationEndpoints_SupportDetailUpdateAndDecisionWithoutResettingStatus()
    {
        await using var factory = new TestApplicationFactory();
        using var client = factory.CreateClient();
        await LoginAsModeratorAsync(client, "administrator@tramplin.local", "Administrator1234");

        int companyId;
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDBContext>();
            companyId = await db.EmployerProfiles
                .Where(item => item.Inn == "7707083893")
                .Select(item => item.Id)
                .SingleAsync();
        }

        var detailResponse = await client.GetAsync($"/api/moderation/companies/{companyId}");
        Assert.Equal(HttpStatusCode.OK, detailResponse.StatusCode);

        var detailPayload = await detailResponse.Content.ReadFromJsonAsync<CompanyProfileReadDTO>();
        Assert.NotNull(detailPayload);
        Assert.Equal("approved", detailPayload!.VerificationStatus);

        var updateResponse = await client.PutAsJsonAsync($"/api/moderation/companies/{companyId}", new
        {
            description = "Updated by moderator",
            verificationMethod = "manual-review",
        });

        Assert.Equal(HttpStatusCode.OK, updateResponse.StatusCode);

        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDBContext>();
            var profile = await db.EmployerProfiles.SingleAsync(item => item.Id == companyId);

            Assert.Equal("Updated by moderator", profile.Description);
            Assert.Equal("manual-review", profile.VerificationMethod);
            Assert.Equal("approved", profile.VerificationStatus);
        }

        var decisionResponse = await client.PostAsJsonAsync($"/api/moderation/companies/{companyId}/decision", new
        {
            status = "revision",
            reason = "Update legal address formatting",
        });

        Assert.Equal(HttpStatusCode.OK, decisionResponse.StatusCode);

        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDBContext>();
            var profile = await db.EmployerProfiles.SingleAsync(item => item.Id == companyId);
            Assert.Equal("revision", profile.VerificationStatus);
            Assert.Equal("Update legal address formatting", profile.VerificationReason);
        }
    }

    [Fact]
    public async Task ModeratorCanDownloadCompanyVerificationDocument()
    {
        await using var factory = new TestApplicationFactory();
        using var client = factory.CreateClient();

        int companyId;
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDBContext>();
            var profile = await db.EmployerProfiles.SingleAsync(item => item.Inn == "7707083893");
            profile.VerificationStatus = "revision";
            profile.VerificationData = null;
            profile.VerificationMethod = null;
            await db.SaveChangesAsync();
            companyId = profile.Id;
        }

        var companyLogin = await client.PostAsJsonAsync("/api/auth/login", new
        {
            role = "company",
            login = "7707083893",
            password = "Demo1234",
        });
        Assert.Equal(HttpStatusCode.OK, companyLogin.StatusCode);

        using (var formData = new MultipartFormDataContent())
        {
            formData.Add(new StringContent("Ирина Смирнова", Encoding.UTF8), "contactName");
            formData.Add(new StringContent("HR Lead", Encoding.UTF8), "contactRole");
            formData.Add(new StringContent("+7 999 000-00-00", Encoding.UTF8), "contactPhone");
            formData.Add(new StringContent("hr@tramplin.local", Encoding.UTF8), "contactEmail");

            var documentContent = new ByteArrayContent("%PDF-1.4 moderator".Select(static item => (byte)item).ToArray());
            documentContent.Headers.ContentType = new MediaTypeHeaderValue("application/pdf");
            formData.Add(documentContent, "document", "moderator-egrul.pdf");

            var submitResponse = await client.PostAsync("/api/company/me/verification-request", formData);
            Assert.Equal(HttpStatusCode.OK, submitResponse.StatusCode);
        }

        await client.PostAsync("/api/auth/logout", null);
        await LoginAsModeratorAsync(client, "administrator@tramplin.local", "Administrator1234");

        var downloadResponse = await client.GetAsync($"/api/moderation/companies/{companyId}/verification-document");
        Assert.Equal(HttpStatusCode.OK, downloadResponse.StatusCode);
        Assert.Equal("application/pdf", downloadResponse.Content.Headers.ContentType?.MediaType);
        Assert.Equal("%PDF-1.4 moderator", await downloadResponse.Content.ReadAsStringAsync());
    }

    [Fact]
    public async Task OpportunityModerationEndpoints_SupportDetailUpdateAndDecisionAndValidateType()
    {
        await using var factory = new TestApplicationFactory();
        using var client = factory.CreateClient();
        await LoginAsModeratorAsync(client, "administrator@tramplin.local", "Administrator1234");

        int opportunityId;
        decimal? originalSalaryFrom;
        string? originalDuration;
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDBContext>();
            var opportunity = await db.Opportunities
                .Where(item => item.Title.Contains("frontend", StringComparison.OrdinalIgnoreCase))
                .FirstAsync();

            opportunityId = opportunity.Id;
            originalSalaryFrom = opportunity.SalaryFrom;
            originalDuration = opportunity.Duration;
        }

        var detailResponse = await client.GetAsync($"/api/moderation/opportunities/{opportunityId}");
        Assert.Equal(HttpStatusCode.OK, detailResponse.StatusCode);

        using (var detailPayload = JsonDocument.Parse(await detailResponse.Content.ReadAsStringAsync()))
        {
            Assert.True(detailPayload.RootElement.TryGetProperty("employerId", out var employerIdElement));
            Assert.True(employerIdElement.GetInt32() > 0);
        }

        var invalidUpdateResponse = await client.PutAsJsonAsync($"/api/moderation/opportunities/{opportunityId}", new
        {
            opportunityType = "unknown-type",
        });

        Assert.Equal(HttpStatusCode.BadRequest, invalidUpdateResponse.StatusCode);

        var validUpdateResponse = await client.PutAsJsonAsync($"/api/moderation/opportunities/{opportunityId}", new
        {
            description = "Updated by moderator",
            opportunityType = "mentoring",
            employmentType = "remote",
            salaryFrom = 99999m,
            duration = "Should not change",
            seatsCount = 99,
        });

        Assert.Equal(HttpStatusCode.OK, validUpdateResponse.StatusCode);

        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDBContext>();
            var opportunity = await db.Opportunities.SingleAsync(item => item.Id == opportunityId);

            Assert.Equal("Updated by moderator", opportunity.Description);
            Assert.Equal("mentoring", opportunity.OpportunityType);
            Assert.Equal("remote", opportunity.EmploymentType);
            Assert.Equal(originalSalaryFrom, opportunity.SalaryFrom);
            Assert.Equal(originalDuration, opportunity.Duration);
            Assert.Equal("approved", opportunity.ModerationStatus);
        }

        var decisionResponse = await client.PostAsJsonAsync($"/api/moderation/opportunities/{opportunityId}/decision", new
        {
            status = "revision",
            reason = "Need a clearer summary",
        });

        Assert.Equal(HttpStatusCode.OK, decisionResponse.StatusCode);

        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDBContext>();
            var opportunity = await db.Opportunities.SingleAsync(item => item.Id == opportunityId);
            Assert.Equal("revision", opportunity.ModerationStatus);
            Assert.Equal("Need a clearer summary", opportunity.ModerationReason);
        }
    }

    private static async Task LoginAsModeratorAsync(HttpClient client, string login, string password)
    {
        var response = await client.PostAsJsonAsync("/api/auth/login", new
        {
            role = "moderator",
            login,
            password,
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }
}

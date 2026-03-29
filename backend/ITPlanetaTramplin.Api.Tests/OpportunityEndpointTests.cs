using Application.DBContext;
using DTO;
using ITPlanetaTramplin.Api.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Models;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Xunit;

namespace ITPlanetaTramplin.Api.Tests;

public class OpportunityEndpointTests
{
    [Fact]
    public async Task CreateAndUpdateOpportunity_PersistsEmploymentTypeFromRequest()
    {
        await using var factory = new TestApplicationFactory();
        using var client = factory.CreateClient();

        var loginResponse = await client.PostAsJsonAsync("/api/auth/login", new
        {
            role = "company",
            login = "7707083893",
            password = "Demo1234",
        });

        Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);

        var createResponse = await client.PostAsJsonAsync("/api/opportunities", new
        {
            title = "Backend opportunity",
            description = "Created from test",
            opportunityType = "internship",
            employmentType = "part-time",
        });

        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);

        int opportunityId;
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDBContext>();
            var opportunity = await db.Opportunities.SingleAsync(item => item.Title == "Backend opportunity");
            opportunityId = opportunity.Id;
            Assert.Equal("part-time", opportunity.EmploymentType);
        }

        var updateResponse = await client.PutAsJsonAsync($"/api/opportunities/{opportunityId}", new
        {
            employmentType = "remote",
        });

        Assert.Equal(HttpStatusCode.OK, updateResponse.StatusCode);

        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDBContext>();
            var opportunity = await db.Opportunities.SingleAsync(item => item.Id == opportunityId);
        Assert.Equal("remote", opportunity.EmploymentType);
        }
    }

    [Fact]
    public async Task CreateOpportunity_SaveModeControlsDraftAndSubmitStates()
    {
        await using var factory = new TestApplicationFactory();
        using var client = factory.CreateClient();

        var loginResponse = await client.PostAsJsonAsync("/api/auth/login", new
        {
            role = "company",
            login = "7707083893",
            password = "Demo1234",
        });

        Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);

        var draftResponse = await client.PostAsJsonAsync("/api/opportunities", new
        {
            description = "Draft opportunity",
            opportunityType = "vacancy",
            saveMode = "draft",
        });

        Assert.Equal(HttpStatusCode.Created, draftResponse.StatusCode);

        var submitResponse = await client.PostAsJsonAsync("/api/opportunities", new
        {
            title = "Submitted opportunity",
            description = "Submitted from test",
            opportunityType = "vacancy",
            employmentType = "office",
            locationCity = "Москва",
            contactsJson = """{"email":"jobs@test.local"}""",
            salaryFrom = 100000m,
            salaryTo = 150000m,
            saveMode = "submit",
        });

        Assert.Equal(HttpStatusCode.Created, submitResponse.StatusCode);

        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDBContext>();

            var draftOpportunity = await db.Opportunities.SingleAsync(item => item.Description == "Draft opportunity");
            Assert.Equal(OpportunityModerationStatuses.Draft, draftOpportunity.ModerationStatus);
            Assert.Null(draftOpportunity.SalaryFrom);
            Assert.Null(draftOpportunity.SalaryTo);

            var submitOpportunity = await db.Opportunities.SingleAsync(item => item.Title == "Submitted opportunity");
            Assert.Equal(OpportunityModerationStatuses.Pending, submitOpportunity.ModerationStatus);
            Assert.Equal(100000m, submitOpportunity.SalaryFrom);
            Assert.Equal(150000m, submitOpportunity.SalaryTo);
        }
    }

    [Fact]
    public async Task DeleteAndTypeChange_AreBlockedWhenApplicationsExist()
    {
        await using var factory = new TestApplicationFactory();
        using var client = factory.CreateClient();

        await client.PostAsJsonAsync("/api/auth/login", new
        {
            role = "company",
            login = "7707083893",
            password = "Demo1234",
        });

        var createResponse = await client.PostAsJsonAsync("/api/opportunities", new
        {
            title = "Application protected opportunity",
            description = "Submitted from test",
            opportunityType = "vacancy",
            employmentType = "office",
            locationCity = "Москва",
            contactsJson = """{"email":"apply@test.local"}""",
            salaryFrom = 100000m,
            salaryTo = 150000m,
            saveMode = "submit",
        });

        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);

        int opportunityId;
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDBContext>();
            var opportunity = await db.Opportunities.SingleAsync(item => item.Title == "Application protected opportunity");
            opportunity.ModerationStatus = OpportunityModerationStatuses.Approved;
            var applicantUserId = await db.Users
                .Where(item => item.Email == "anna.petrova@tramplin.local")
                .Select(item => item.Id)
                .SingleAsync();
            var applicant = await db.ApplicantProfiles.SingleAsync(item => item.UserId == applicantUserId);

            db.Applications.Add(new OpportunityApplication
            {
                OpportunityId = opportunity.Id,
                ApplicantId = applicant.Id,
                Status = OpportunityApplicationStatuses.Submitted,
            });

            await db.SaveChangesAsync();
            opportunityId = opportunity.Id;
        }

        var typeChangeResponse = await client.PutAsJsonAsync($"/api/opportunities/{opportunityId}", new
        {
            opportunityType = "mentoring",
            saveMode = "submit",
        });

        Assert.Equal(HttpStatusCode.Conflict, typeChangeResponse.StatusCode);

        var deleteResponse = await client.DeleteAsync($"/api/opportunities/{opportunityId}");
        Assert.Equal(HttpStatusCode.Conflict, deleteResponse.StatusCode);
    }

    [Fact]
    public async Task ArchiveOpportunity_MovesOpportunityToArchivedAndRemovesFromPublicFeed()
    {
        await using var factory = new TestApplicationFactory();
        using var client = factory.CreateClient();

        await client.PostAsJsonAsync("/api/auth/login", new
        {
            role = "company",
            login = "7707083893",
            password = "Demo1234",
        });

        var createResponse = await client.PostAsJsonAsync("/api/opportunities", new
        {
            title = "Archive me",
            description = "Submitted from test",
            opportunityType = "vacancy",
            employmentType = "office",
            locationCity = "Москва",
            contactsJson = """{"email":"archive@test.local"}""",
            salaryFrom = 120000m,
            salaryTo = 180000m,
            saveMode = "submit",
        });

        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);

        int opportunityId;
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDBContext>();
            var opportunity = await db.Opportunities.SingleAsync(item => item.Title == "Archive me");
            opportunity.ModerationStatus = OpportunityModerationStatuses.Approved;
            await db.SaveChangesAsync();
            opportunityId = opportunity.Id;
        }

        var archiveResponse = await client.PostAsync($"/api/opportunities/{opportunityId}/archive", null);
        Assert.Equal(HttpStatusCode.OK, archiveResponse.StatusCode);

        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDBContext>();
            var opportunity = await db.Opportunities.SingleAsync(item => item.Id == opportunityId);
            Assert.Equal(OpportunityModerationStatuses.Archived, opportunity.ModerationStatus);
        }

        var publicResponse = await client.GetAsync("/api/opportunities");
        Assert.Equal(HttpStatusCode.OK, publicResponse.StatusCode);

        using var payload = JsonDocument.Parse(await publicResponse.Content.ReadAsStringAsync());
        Assert.DoesNotContain(payload.RootElement.EnumerateArray(), item => item.GetProperty("title").GetString() == "Archive me");
    }

    [Fact]
    public async Task OpportunityDetail_ReturnsViewerCapabilitiesAndModerationReasonForOwner()
    {
        await using var factory = new TestApplicationFactory();
        using var client = factory.CreateClient();

        await client.PostAsJsonAsync("/api/auth/login", new
        {
            role = "company",
            login = "7707083893",
            password = "Demo1234",
        });

        var createResponse = await client.PostAsJsonAsync("/api/opportunities", new
        {
            title = "Owner detail opportunity",
            description = "Submitted from test",
            opportunityType = "vacancy",
            employmentType = "office",
            locationCity = "Москва",
            contactsJson = """{"email":"owner@test.local"}""",
            salaryFrom = 110000m,
            salaryTo = 160000m,
            saveMode = "submit",
        });

        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);

        int opportunityId;
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDBContext>();
            var opportunity = await db.Opportunities.SingleAsync(item => item.Title == "Owner detail opportunity");
            opportunity.ModerationStatus = OpportunityModerationStatuses.Revision;
            opportunity.ModerationReason = "Need clearer salary range";
            await db.SaveChangesAsync();
            opportunityId = opportunity.Id;
        }

        var detailResponse = await client.GetAsync($"/api/opportunities/{opportunityId}");
        Assert.Equal(HttpStatusCode.OK, detailResponse.StatusCode);

        using var payload = JsonDocument.Parse(await detailResponse.Content.ReadAsStringAsync());
        var root = payload.RootElement;

        Assert.Equal("Need clearer salary range", root.GetProperty("moderationReason").GetString());
        var viewer = root.GetProperty("viewer");
        Assert.True(viewer.GetProperty("isOwner").GetBoolean());
        Assert.True(viewer.GetProperty("canEdit").GetBoolean());
        Assert.True(viewer.GetProperty("canSaveDraft").GetBoolean());
        Assert.True(viewer.GetProperty("canSubmit").GetBoolean());
        Assert.True(viewer.GetProperty("canDelete").GetBoolean());
        Assert.False(viewer.GetProperty("canArchive").GetBoolean());
        Assert.True(viewer.GetProperty("canViewPublicVersion").GetBoolean());
    }

    [Fact]
    public async Task ApplyToOpportunity_RequiresFullAccountVerification()
    {
        await using var factory = new TestApplicationFactory();
        using var client = factory.CreateClient();

        var companyLoginResponse = await client.PostAsJsonAsync("/api/auth/login", new
        {
            role = "company",
            login = "7707083893",
            password = "Demo1234",
        });

        Assert.Equal(HttpStatusCode.OK, companyLoginResponse.StatusCode);

        var createResponse = await client.PostAsJsonAsync("/api/opportunities", new
        {
            title = "Verification required opportunity",
            description = "Created from test",
            opportunityType = "internship",
            employmentType = "part-time",
            locationCity = "Москва",
            contactsJson = """{"email":"verification@test.local"}""",
            isPaid = false,
            duration = "3 months",
            saveMode = "submit",
        });

        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);

        int opportunityId;
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDBContext>();
            var opportunity = await db.Opportunities.SingleAsync(item => item.Title == "Verification required opportunity");
            opportunity.ModerationStatus = "approved";
            await db.SaveChangesAsync();
            opportunityId = opportunity.Id;
        }

        await client.PostAsync("/api/auth/logout", null);

        var registrationResponse = await client.PostAsJsonAsync("/api/auth/register/candidate", new
        {
            email = "apply-unverified@tramplin.local",
            password = "Password1",
            name = "Apply",
            surname = "Candidate",
            thirdname = "User",
        });

        Assert.Equal(HttpStatusCode.Created, registrationResponse.StatusCode);

        var registrationPayload = await registrationResponse.Content.ReadFromJsonAsync<PendingEmailVerificationDTO>();
        Assert.NotNull(registrationPayload);

        var confirmResponse = await client.PostAsJsonAsync("/api/auth/confirm-email", new
        {
            email = registrationPayload!.Email,
            role = registrationPayload.Role,
            code = registrationPayload.DebugCode,
        });

        Assert.Equal(HttpStatusCode.OK, confirmResponse.StatusCode);

        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDBContext>();
            var user = await db.Users.SingleAsync(item => item.Email == registrationPayload.Email);
            user.IsVerified = false;
            await db.SaveChangesAsync();
        }

        var applyResponse = await client.PostAsJsonAsync($"/api/opportunities/{opportunityId}/applications", new { });
        Assert.Equal(HttpStatusCode.Forbidden, applyResponse.StatusCode);

        var applyError = await applyResponse.Content.ReadFromJsonAsync<MessageResponseDTO>();
        Assert.NotNull(applyError);
        Assert.Contains("Подтвердите аккаунт", applyError!.Message);
    }

    [Fact]
    public async Task CreateAndUpdateOpportunity_PersistsCoordinatesFromRequest()
    {
        await using var factory = new TestApplicationFactory();
        using var client = factory.CreateClient();

        var loginResponse = await client.PostAsJsonAsync("/api/auth/login", new
        {
            role = "company",
            login = "7707083893",
            password = "Demo1234",
        });

        Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);

        var createResponse = await client.PostAsJsonAsync("/api/opportunities", new
        {
            title = "Coordinate opportunity",
            description = "Created from test",
            opportunityType = "vacancy",
            employmentType = "office",
            latitude = 56.123456m,
            longitude = 47.654321m,
        });

        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);

        int opportunityId;
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDBContext>();
            var opportunity = await db.Opportunities.SingleAsync(item => item.Title == "Coordinate opportunity");
            opportunityId = opportunity.Id;
            Assert.Equal(56.123456m, opportunity.Latitude);
            Assert.Equal(47.654321m, opportunity.Longitude);
        }

        var updateResponse = await client.PutAsJsonAsync($"/api/opportunities/{opportunityId}", new
        {
            latitude = 56.111111m,
            longitude = 47.222222m,
        });

        Assert.Equal(HttpStatusCode.OK, updateResponse.StatusCode);

        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDBContext>();
            var opportunity = await db.Opportunities.SingleAsync(item => item.Id == opportunityId);
            Assert.Equal(56.111111m, opportunity.Latitude);
            Assert.Equal(47.222222m, opportunity.Longitude);
        }
    }

    [Fact]
    public async Task CreateAndUpdateOpportunity_PersistsRichCardFieldsAndAllowsClearingOptionalValues()
    {
        await using var factory = new TestApplicationFactory();
        using var client = factory.CreateClient();

        var loginResponse = await client.PostAsJsonAsync("/api/auth/login", new
        {
            role = "company",
            login = "7707083893",
            password = "Demo1234",
        });

        Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);

        var expireAt = new DateTimeOffset(2026, 4, 15, 0, 0, 0, TimeSpan.Zero).ToUnixTimeSeconds();
        var createResponse = await client.PostAsJsonAsync("/api/opportunities", new
        {
            title = "Rich opportunity",
            description = "Полная карточка возможности",
            locationCity = "Москва",
            locationAddress = "Тестовая улица, 1",
            opportunityType = "vacancy",
            employmentType = "hybrid",
            latitude = 56.123456m,
            longitude = 47.654321m,
            expireAt,
            contactsJson = """{"email":"jobs@test.local","telegram":"@tramplin_company"}""",
            mediaContentJson = """[{"title":"Программа","url":"https://example.com/program"}]""",
            tags = new[] { "React", "Testing" },
        });

        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);

        int opportunityId;
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDBContext>();
            var opportunity = await db.Opportunities.SingleAsync(item => item.Title == "Rich opportunity");
            opportunityId = opportunity.Id;

            using var contactsPayload = JsonDocument.Parse(opportunity.ContactsJson!);
            using var mediaPayload = JsonDocument.Parse(opportunity.MediaContentJson!);

            Assert.Equal("Москва", opportunity.LocationCity);
            Assert.Equal("Тестовая улица, 1", opportunity.LocationAddress);
            Assert.Equal(56.123456m, opportunity.Latitude);
            Assert.Equal(47.654321m, opportunity.Longitude);
            Assert.Equal(2, contactsPayload.RootElement.GetArrayLength());
            var contactValues = contactsPayload.RootElement.EnumerateArray()
                .Select(item => item.GetProperty("value").GetString())
                .OfType<string>()
                .ToArray();
            Assert.Contains("jobs@test.local", contactValues);
            Assert.Contains("https://t.me/tramplin_company", contactValues);
            Assert.Equal("Программа", mediaPayload.RootElement[0].GetProperty("title").GetString());
            Assert.Equal("https://example.com/program", mediaPayload.RootElement[0].GetProperty("url").GetString());
            Assert.Equal(DateOnly.FromDateTime(DateTimeOffset.FromUnixTimeSeconds(expireAt).UtcDateTime), opportunity.ExpireAt);
        }

        var updateResponse = await client.PutAsJsonAsync($"/api/opportunities/{opportunityId}", new
        {
            title = "Rich opportunity updated",
            description = "Карточка обновлена",
            opportunityType = "vacancy",
            employmentType = "remote",
            locationCity = (string?)null,
            locationAddress = (string?)null,
            latitude = (decimal?)null,
            longitude = (decimal?)null,
            expireAt = (long?)null,
            contactsJson = (string?)null,
            mediaContentJson = "[]",
            tags = new[] { "React" },
        });

        Assert.Equal(HttpStatusCode.OK, updateResponse.StatusCode);

        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDBContext>();
            var opportunity = await db.Opportunities.Include(item => item.Tags).SingleAsync(item => item.Id == opportunityId);

            Assert.Equal("Rich opportunity updated", opportunity.Title);
            Assert.Equal("Карточка обновлена", opportunity.Description);
            Assert.Equal("remote", opportunity.EmploymentType);
            Assert.Null(opportunity.LocationCity);
            Assert.Null(opportunity.LocationAddress);
            Assert.Null(opportunity.Latitude);
            Assert.Null(opportunity.Longitude);
            Assert.Null(opportunity.ExpireAt);
            Assert.Null(opportunity.ContactsJson);
            Assert.Equal("[]", opportunity.MediaContentJson);
            Assert.Equal(["React"], opportunity.Tags.Select(item => item.Name).ToArray());
        }
    }

    [Fact]
    public async Task GetOpportunityById_ReturnsCompanyProfileAndStoredCardFields()
    {
        await using var factory = new TestApplicationFactory();
        using var client = factory.CreateClient();

        var loginResponse = await client.PostAsJsonAsync("/api/auth/login", new
        {
            role = "company",
            login = "7707083893",
            password = "Demo1234",
        });

        Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);

        var createResponse = await client.PostAsJsonAsync("/api/opportunities", new
        {
            title = "Opportunity detail payload",
            description = "Описание для проверки деталей",
            locationCity = "Казань",
            locationAddress = "Улица теста, 2",
            opportunityType = "internship",
            employmentType = "office",
            contactsJson = """{"email":"detail@test.local"}""",
            mediaContentJson = """[{"title":"Презентация","url":"https://example.com/deck"}]""",
            tags = new[] { "Analytics" },
        });

        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);

        int opportunityId;
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDBContext>();
            opportunityId = await db.Opportunities
                .Where(item => item.Title == "Opportunity detail payload")
                .Select(item => item.Id)
                .SingleAsync();
        }

        var detailResponse = await client.GetAsync($"/api/opportunities/{opportunityId}");
        Assert.Equal(HttpStatusCode.OK, detailResponse.StatusCode);

        using var payload = JsonDocument.Parse(await detailResponse.Content.ReadAsStringAsync());
        var root = payload.RootElement;

        Assert.Equal(opportunityId, root.GetProperty("id").GetInt32());
        Assert.Equal("Описание для проверки деталей", root.GetProperty("description").GetString());
        Assert.Equal("Казань", root.GetProperty("locationCity").GetString());
        Assert.Equal("Улица теста, 2", root.GetProperty("locationAddress").GetString());
        Assert.Equal("office", root.GetProperty("employmentType").GetString());

        using var contactsPayload = JsonDocument.Parse(root.GetProperty("contactsJson").GetString()!);
        using var mediaPayload = JsonDocument.Parse(root.GetProperty("mediaContentJson").GetString()!);

        Assert.Equal("email", contactsPayload.RootElement[0].GetProperty("type").GetString());
        Assert.Equal("detail@test.local", contactsPayload.RootElement[0].GetProperty("value").GetString());
        Assert.Equal("Презентация", mediaPayload.RootElement[0].GetProperty("title").GetString());
        Assert.Equal("https://example.com/deck", mediaPayload.RootElement[0].GetProperty("url").GetString());
        Assert.False(string.IsNullOrWhiteSpace(root.GetProperty("companyName").GetString()));
        Assert.False(string.IsNullOrWhiteSpace(root.GetProperty("companyDescription").GetString()));
        Assert.False(string.IsNullOrWhiteSpace(root.GetProperty("companyLegalAddress").GetString()));
        Assert.False(string.IsNullOrWhiteSpace(root.GetProperty("companySocials").GetString()));
    }

    [Fact]
    public async Task CreateAndUpdateOpportunity_ValidatesMentoringTypeAndRejectsUnknownTypes()
    {
        await using var factory = new TestApplicationFactory();
        using var client = factory.CreateClient();

        var loginResponse = await client.PostAsJsonAsync("/api/auth/login", new
        {
            role = "company",
            login = "7707083893",
            password = "Demo1234",
        });

        Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);

        var createResponse = await client.PostAsJsonAsync("/api/opportunities", new
        {
            title = "Mentoring opportunity",
            description = "Created from test",
            opportunityType = "mentoring",
            employmentType = "remote",
        });

        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);

        int opportunityId;
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDBContext>();
            var opportunity = await db.Opportunities.SingleAsync(item => item.Title == "Mentoring opportunity");
            opportunityId = opportunity.Id;
            Assert.Equal("mentoring", opportunity.OpportunityType);
        }

        var invalidCreateResponse = await client.PostAsJsonAsync("/api/opportunities", new
        {
            title = "Invalid type create",
            description = "Created from test",
            opportunityType = "unknown-type",
            employmentType = "remote",
        });

        Assert.Equal(HttpStatusCode.BadRequest, invalidCreateResponse.StatusCode);

        var invalidUpdateResponse = await client.PutAsJsonAsync($"/api/opportunities/{opportunityId}", new
        {
            opportunityType = "unknown-type",
        });

        Assert.Equal(HttpStatusCode.BadRequest, invalidUpdateResponse.StatusCode);

        var validUpdateResponse = await client.PutAsJsonAsync($"/api/opportunities/{opportunityId}", new
        {
            opportunityType = "mentoring",
            employmentType = "hybrid",
        });

        Assert.Equal(HttpStatusCode.OK, validUpdateResponse.StatusCode);
    }

    [Fact]
    public async Task GetOpportunities_ReturnsEmployerIdInPublicPayload()
    {
        await using var factory = new TestApplicationFactory();
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/api/opportunities");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        using var payload = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        var firstOpportunity = payload.RootElement.EnumerateArray().First();

        Assert.True(firstOpportunity.TryGetProperty("employerId", out var employerIdElement));
        Assert.True(employerIdElement.GetInt32() > 0);
    }
}

using Application.DBContext;
using DTO;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
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

        var loginResponse = await client.PostAsJsonAsync("/api/auth/login", new
        {
            role = "candidate",
            login = registrationPayload!.Email,
            password = "Password1",
        });

        Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);

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
}

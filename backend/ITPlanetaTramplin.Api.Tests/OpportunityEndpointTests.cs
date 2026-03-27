using Application.DBContext;
using DTO;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System.Net;
using System.Net.Http.Json;
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
}

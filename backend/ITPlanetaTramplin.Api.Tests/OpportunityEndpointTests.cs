using Application.DBContext;
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
            login = "demo-company@tramplin.local",
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
}

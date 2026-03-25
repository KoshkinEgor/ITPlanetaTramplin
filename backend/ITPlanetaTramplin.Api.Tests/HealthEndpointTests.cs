using System.Net;
using Xunit;

namespace ITPlanetaTramplin.Api.Tests;

public class HealthEndpointTests
{
    [Fact]
    public async Task HealthEndpoint_ReturnsOk()
    {
        await using var factory = new TestApplicationFactory();
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/health");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task AuthMe_WithoutCookie_ReturnsUnauthorized()
    {
        await using var factory = new TestApplicationFactory();
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/api/auth/me");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}

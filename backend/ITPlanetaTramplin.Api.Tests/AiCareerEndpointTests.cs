using DTO;
using System.Net;
using System.Net.Http.Json;
using Xunit;

namespace ITPlanetaTramplin.Api.Tests;

public sealed class AiCareerEndpointTests
{
    [Fact]
    public async Task QueueEndpoint_ReturnsAccepted_AndDeduplicatesActiveJob()
    {
        await using var factory = new TestApplicationFactory();
        using var client = factory.CreateClient();
        await RegisterAndConfirmCandidateAsync(client, "ai-job-owner@tramplin.local");

        var firstResponse = await client.PostAsJsonAsync(
            "/api/candidate/me/ai-career-recommendations/jobs",
            new { reason = "manual" });
        var secondResponse = await client.PostAsJsonAsync(
            "/api/candidate/me/ai-career-recommendations/jobs",
            new { reason = "profile_changed" });

        Assert.Equal(HttpStatusCode.Accepted, firstResponse.StatusCode);
        Assert.Equal(HttpStatusCode.Accepted, secondResponse.StatusCode);
        var first = await firstResponse.Content.ReadFromJsonAsync<AiCareerJobResponseDTO>();
        var second = await secondResponse.Content.ReadFromJsonAsync<AiCareerJobResponseDTO>();
        Assert.NotNull(first);
        Assert.NotNull(second);
        Assert.Equal(first!.JobId, second!.JobId);
        Assert.Equal(3, first.Steps.Count);

        var statusResponse = await client.GetAsync(
            $"/api/candidate/me/ai-career-recommendations/jobs/{first.JobId}");
        Assert.Equal(HttpStatusCode.OK, statusResponse.StatusCode);
    }

    [Fact]
    public async Task JobStatusEndpoint_DoesNotExposeAnotherCandidatesJob()
    {
        await using var factory = new TestApplicationFactory();
        using var ownerClient = factory.CreateClient();
        using var otherClient = factory.CreateClient();
        await RegisterAndConfirmCandidateAsync(ownerClient, "ai-owner@tramplin.local");
        await RegisterAndConfirmCandidateAsync(otherClient, "ai-other@tramplin.local");

        var queueResponse = await ownerClient.PostAsJsonAsync(
            "/api/candidate/me/ai-career-recommendations/jobs",
            new { reason = "manual" });
        var job = await queueResponse.Content.ReadFromJsonAsync<AiCareerJobResponseDTO>();

        var response = await otherClient.GetAsync(
            $"/api/candidate/me/ai-career-recommendations/jobs/{job!.JobId}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    private static async Task RegisterAndConfirmCandidateAsync(HttpClient client, string email)
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
    }
}

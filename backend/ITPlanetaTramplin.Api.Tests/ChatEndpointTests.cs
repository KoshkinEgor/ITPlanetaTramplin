using System.Net;
using System.Net.Http.Json;
using Application.DBContext;
using DTO;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace ITPlanetaTramplin.Api.Tests;

public class ChatEndpointTests
{
    [Fact]
    public async Task CandidateChatEndpoints_CreateThreadAndMessageForAllowedCandidatePair()
    {
        await using var factory = new TestApplicationFactory();
        using var senderClient = factory.CreateClient();
        using var recipientClient = factory.CreateClient();

        await RegisterAndConfirmCandidateAsync(senderClient, "chat-sender@tramplin.local");
        var recipient = await RegisterAndConfirmCandidateAsync(recipientClient, "chat-recipient@tramplin.local");
        var recipientUserId = await GetUserIdByEmailAsync(factory, recipient.Email);

        var startResponse = await senderClient.PostAsJsonAsync("/api/chats/start", new
        {
            recipientUserId,
            initialMessage = "Hello, let's discuss the project.",
        });

        Assert.Equal(HttpStatusCode.OK, startResponse.StatusCode);
        var thread = await startResponse.Content.ReadFromJsonAsync<ChatThreadReadDTO>();
        Assert.NotNull(thread);
        Assert.Equal(2, thread!.Participants.Count);
        Assert.Equal("Hello, let's discuss the project.", thread.LastMessage?.Body);

        var messagesResponse = await senderClient.GetAsync($"/api/chats/{thread.Id}/messages");
        Assert.Equal(HttpStatusCode.OK, messagesResponse.StatusCode);
        var messages = await messagesResponse.Content.ReadFromJsonAsync<List<ChatMessageReadDTO>>();
        Assert.Single(messages!);
    }

    [Fact]
    public async Task CandidateChatEndpoints_RespectCandidateMessagePrivacy()
    {
        await using var factory = new TestApplicationFactory();
        using var senderClient = factory.CreateClient();
        using var recipientClient = factory.CreateClient();

        await RegisterAndConfirmCandidateAsync(senderClient, "chat-privacy-sender@tramplin.local");
        var recipient = await RegisterAndConfirmCandidateAsync(recipientClient, "chat-privacy-recipient@tramplin.local");
        var recipientUserId = await GetUserIdByEmailAsync(factory, recipient.Email);

        var privacyResponse = await recipientClient.PutAsJsonAsync("/api/candidate/me", new
        {
            links = new
            {
                preferences = new
                {
                    audience = new
                    {
                        messagesAudience = "friends",
                    },
                },
            },
        });
        Assert.Equal(HttpStatusCode.OK, privacyResponse.StatusCode);

        var startResponse = await senderClient.PostAsJsonAsync("/api/chats/start", new
        {
            recipientUserId,
            initialMessage = "Message without friendship",
        });

        Assert.Equal(HttpStatusCode.Forbidden, startResponse.StatusCode);
    }

    [Fact]
    public async Task CandidateChatEndpoints_BlockDirectCandidateToModeratorThread()
    {
        await using var factory = new TestApplicationFactory();
        using var client = factory.CreateClient();
        await RegisterAndConfirmCandidateAsync(client, "chat-candidate-moderator@tramplin.local");

        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDBContext>();
        var moderatorUserId = await db.CuratorProfiles.Select(item => item.UserId).FirstAsync();

        var startResponse = await client.PostAsJsonAsync("/api/chats/start", new
        {
            recipientUserId = moderatorUserId,
            initialMessage = "Direct candidate to moderator",
        });

        Assert.Equal(HttpStatusCode.Forbidden, startResponse.StatusCode);
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

    private static async Task<int> GetUserIdByEmailAsync(TestApplicationFactory factory, string email)
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDBContext>();
        return await db.Users
            .Where(item => item.Email == email)
            .Select(item => item.Id)
            .SingleAsync();
    }
}

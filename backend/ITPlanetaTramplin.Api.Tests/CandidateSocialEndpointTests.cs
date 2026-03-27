using Application.DBContext;
using DTO;
using ITPlanetaTramplin.Api.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Models;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Nodes;
using Xunit;

namespace ITPlanetaTramplin.Api.Tests;

public class CandidateSocialEndpointTests
{
    [Fact]
    public async Task FriendRequestEndpoints_AcceptingRequestCreatesMutualContactsAndFriendEntry()
    {
        await using var factory = new TestApplicationFactory();
        using var client = factory.CreateClient();

        var first = await RegisterAndConfirmCandidateAsync(client, "social-first@tramplin.local");
        var second = await RegisterAndConfirmCandidateAsync(client, "social-second@tramplin.local");

        int firstUserId;
        int secondUserId;
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDBContext>();
            firstUserId = db.Users.Single(item => item.Email == first.Email).Id;
            secondUserId = db.Users.Single(item => item.Email == second.Email).Id;
        }

        await LoginCandidateAsync(client, first.Email);

        var createRequestResponse = await client.PostAsJsonAsync("/api/candidate/me/friends/requests", new
        {
            userId = secondUserId,
        });
        Assert.Equal(HttpStatusCode.OK, createRequestResponse.StatusCode);

        var requestPayload = await createRequestResponse.Content.ReadFromJsonAsync<JsonObject>();
        Assert.NotNull(requestPayload);
        var requestId = requestPayload!["id"]!.GetValue<int>();

        await client.PostAsync("/api/auth/logout", null);
        await LoginCandidateAsync(client, second.Email);

        var acceptResponse = await client.PostAsync($"/api/candidate/me/friends/requests/{requestId}/accept", null);
        Assert.Equal(HttpStatusCode.OK, acceptResponse.StatusCode);

        var friendsResponse = await client.GetAsync("/api/candidate/me/friends");
        Assert.Equal(HttpStatusCode.OK, friendsResponse.StatusCode);
        var friendsPayload = await friendsResponse.Content.ReadFromJsonAsync<JsonArray>();
        Assert.NotNull(friendsPayload);
        Assert.Contains(friendsPayload!, item => item?["userId"]?.GetValue<int>() == firstUserId);

        var contactsResponse = await client.GetAsync("/api/candidate/me/contacts");
        Assert.Equal(HttpStatusCode.OK, contactsResponse.StatusCode);
        var contactsPayload = await contactsResponse.Content.ReadFromJsonAsync<JsonArray>();
        Assert.NotNull(contactsPayload);
        Assert.Contains(contactsPayload!, item =>
            item?["userId"]?.GetValue<int>() == firstUserId
            && item?["relationship"]?["friendState"]?.GetValue<string>() == "friends");

        var removeFriendResponse = await client.DeleteAsync($"/api/candidate/me/friends/{firstUserId}");
        Assert.Equal(HttpStatusCode.OK, removeFriendResponse.StatusCode);

        var friendsAfterRemovalResponse = await client.GetAsync("/api/candidate/me/friends");
        Assert.Equal(HttpStatusCode.OK, friendsAfterRemovalResponse.StatusCode);
        var friendsAfterRemovalPayload = await friendsAfterRemovalResponse.Content.ReadFromJsonAsync<JsonArray>();
        Assert.NotNull(friendsAfterRemovalPayload);
        Assert.DoesNotContain(friendsAfterRemovalPayload!, item => item?["userId"]?.GetValue<int>() == firstUserId);

        using var verificationScope = factory.Services.CreateScope();
        var verificationDb = verificationScope.ServiceProvider.GetRequiredService<ApplicationDBContext>();
        Assert.True(await verificationDb.Contacts.AnyAsync(item => item.UserId == firstUserId && item.ContactProfileId == secondUserId));
        Assert.True(await verificationDb.Contacts.AnyAsync(item => item.UserId == secondUserId && item.ContactProfileId == firstUserId));
        Assert.False(await verificationDb.FriendRequests.AnyAsync(item =>
            ((item.SenderUserId == firstUserId && item.RecipientUserId == secondUserId)
             || (item.SenderUserId == secondUserId && item.RecipientUserId == firstUserId))
            && item.Status == FriendRequestStatuses.Accepted));
    }

    [Fact]
    public async Task CandidatePublicProfileEndpoint_RespectsContactAudience()
    {
        await using var factory = new TestApplicationFactory();
        using var client = factory.CreateClient();

        var viewer = await RegisterAndConfirmCandidateAsync(client, "public-viewer@tramplin.local");
        var owner = await RegisterAndConfirmCandidateAsync(client, "public-owner@tramplin.local");

        int ownerUserId;
        int ownerApplicantId;
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDBContext>();
            var ownerUser = db.Users.Include(item => item.ApplicantProfile).Single(item => item.Email == owner.Email);
            ownerUserId = ownerUser.Id;
            ownerApplicantId = ownerUser.ApplicantProfile!.Id;

            ownerUser.ApplicantProfile!.Links = JsonSerializer.Serialize(new
            {
                contacts = new
                {
                    telegram = "t.me/public-owner",
                    github = "github.com/public-owner",
                },
                preferences = new
                {
                    audience = new
                    {
                        contactsAudience = "contacts",
                    },
                    visibility = new
                    {
                        projectsVisibility = "contacts",
                    },
                },
                resumes = new object[]
                {
                    new
                    {
                        id = "resume-public",
                        title = "UX researcher",
                        visibility = "contacts",
                    },
                },
            });

            db.CandidateProjects.Add(new CandidateProject
            {
                ApplicantId = ownerApplicantId,
                Title = "Product Lab",
                ProjectType = "Проект",
                ShortDescription = "Исследовательский проект.",
                Role = "Researcher",
                StartDate = new DateOnly(2026, 1, 1),
                IsOngoing = true,
                Problem = "Нужен продуктовый discovery.",
                Contribution = "Собрал интервью.",
                Result = "Подготовил гипотезы.",
                ShowInPortfolio = true,
                CreatedAt = DateTime.UtcNow,
            });

            await db.SaveChangesAsync();
        }

        await LoginCandidateAsync(client, viewer.Email);

        var publicBeforeContact = await client.GetAsync($"/api/candidate/public/{ownerUserId}");
        Assert.Equal(HttpStatusCode.OK, publicBeforeContact.StatusCode);
        var beforePayload = await publicBeforeContact.Content.ReadFromJsonAsync<JsonObject>();
        Assert.NotNull(beforePayload);
        Assert.Null(beforePayload!["socialLinks"]);
        Assert.Empty(beforePayload["resumes"]!.AsArray());
        Assert.Empty(beforePayload["projects"]!.AsArray());
        Assert.Equal("none", beforePayload["relationship"]!["contactState"]!.GetValue<string>());

        var addContactResponse = await client.PostAsJsonAsync("/api/candidate/me/contacts", new
        {
            userId = ownerUserId,
        });
        Assert.Equal(HttpStatusCode.OK, addContactResponse.StatusCode);

        var publicAfterContact = await client.GetAsync($"/api/candidate/public/{ownerUserId}");
        Assert.Equal(HttpStatusCode.OK, publicAfterContact.StatusCode);
        var afterPayload = await publicAfterContact.Content.ReadFromJsonAsync<JsonObject>();
        Assert.NotNull(afterPayload);
        Assert.NotNull(afterPayload!["socialLinks"]);
        Assert.Single(afterPayload["resumes"]!.AsArray());
        Assert.Single(afterPayload["projects"]!.AsArray());
        Assert.Equal("saved", afterPayload["relationship"]!["contactState"]!.GetValue<string>());
        Assert.True(afterPayload["relationship"]!["canInviteToProject"]!.GetValue<bool>());
    }

    [Fact]
    public async Task ProjectInviteEndpoints_AcceptingInviteAddsParticipantToProject()
    {
        await using var factory = new TestApplicationFactory();
        using var client = factory.CreateClient();

        var owner = await RegisterAndConfirmCandidateAsync(client, "invite-owner@tramplin.local");
        var recipient = await RegisterAndConfirmCandidateAsync(client, "invite-recipient@tramplin.local");

        int recipientUserId;
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDBContext>();
            recipientUserId = db.Users.Single(item => item.Email == recipient.Email).Id;
        }

        await LoginCandidateAsync(client, owner.Email);

        var addContactResponse = await client.PostAsJsonAsync("/api/candidate/me/contacts", new
        {
            userId = recipientUserId,
        });
        Assert.Equal(HttpStatusCode.OK, addContactResponse.StatusCode);

        var createProjectResponse = await client.PostAsJsonAsync("/api/candidate/me/projects", new
        {
            title = "Community Lab",
            projectType = "Проект",
            shortDescription = "Совместный продуктовый спринт.",
            role = "Team lead",
            tags = new[] { "Research", "Discovery" },
            startDate = "2026-02",
            isOngoing = true,
            problem = "Нужно провести discovery.",
            contribution = "Организовал процесс.",
            result = "Собрали гипотезы.",
            showInPortfolio = true,
        });
        Assert.Equal(HttpStatusCode.Created, createProjectResponse.StatusCode);
        var project = await createProjectResponse.Content.ReadFromJsonAsync<CandidateProjectReadDTO>();
        Assert.NotNull(project);

        var createInviteResponse = await client.PostAsJsonAsync("/api/candidate/me/project-invites", new
        {
            recipientUserId,
            projectId = project!.Id,
            role = "UX researcher",
            message = "Присоединяйся к discovery-команде",
        });
        Assert.Equal(HttpStatusCode.OK, createInviteResponse.StatusCode);
        var invitePayload = await createInviteResponse.Content.ReadFromJsonAsync<JsonObject>();
        Assert.NotNull(invitePayload);
        var inviteId = invitePayload!["id"]!.GetValue<int>();

        await client.PostAsync("/api/auth/logout", null);
        await LoginCandidateAsync(client, recipient.Email);

        var acceptInviteResponse = await client.PostAsync($"/api/candidate/me/project-invites/{inviteId}/accept", null);
        Assert.Equal(HttpStatusCode.OK, acceptInviteResponse.StatusCode);

        using var verificationScope = factory.Services.CreateScope();
        var verificationDb = verificationScope.ServiceProvider.GetRequiredService<ApplicationDBContext>();
        var storedProject = await verificationDb.CandidateProjects.SingleAsync(item => item.Id == project.Id);
        Assert.Contains("UX researcher", storedProject.ParticipantsJson);
        Assert.Contains("Test Candidate User", storedProject.ParticipantsJson);
    }

    private static async Task LoginCandidateAsync(HttpClient client, string email)
    {
        var loginResponse = await client.PostAsJsonAsync("/api/auth/login", new
        {
            role = "candidate",
            login = email,
            password = "Password1",
        });
        Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);
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

using System.Net;
using System.Net.Http.Json;
using Application.DBContext;
using DTO;
using ITPlanetaTramplin.Api.Domain;
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
    public async Task CandidateChatEndpoints_ReusesAndUpgradesDirectThreadToApplicationContext()
    {
        await using var factory = new TestApplicationFactory();
        using var candidateClient = factory.CreateClient();
        using var companyClient = factory.CreateClient();

        // 1. Setup company, opportunity, and candidate
        await companyClient.PostAsJsonAsync("/api/auth/login", new
        {
            role = "company",
            login = "7707083893",
            password = "Demo1234",
        });
        
        int companyUserId;
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDBContext>();
            var employer = await db.EmployerProfiles.SingleAsync(item => item.Inn == "7707083893");
            companyUserId = employer.UserId;
        }

        var candidate = await RegisterAndConfirmCandidateAsync(candidateClient, "chat-lifecycle-sender@tramplin.local");
        var candidateUserId = await GetUserIdByEmailAsync(factory, candidate.Email);

        var title = $"ChatOpportunity-{Guid.NewGuid():N}";
        var createResponse = await companyClient.PostAsJsonAsync("/api/opportunities", new
        {
            title,
            description = "Created from chat test",
            opportunityType = "vacancy",
            employmentType = "online",
            schedule = "full_time",
            contactsJson = """{"email":"lifecycle@test.local"}""",
            salaryFrom = 90000m,
            salaryTo = 140000m,
            saveMode = "submit",
        });
        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);

        int opportunityId;
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDBContext>();
            var opportunity = await db.Opportunities.SingleAsync(item => item.Title == title);
            opportunity.ModerationStatus = "approved";
            await db.SaveChangesAsync();
            opportunityId = opportunity.Id;
        }

        await candidateClient.PostAsJsonAsync("/api/auth/login", new
        {
            role = "candidate",
            login = candidate.Email,
            password = "Password1",
        });

        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDBContext>();
            var profile = await db.ApplicantProfiles
                .Include(item => item.ApplicantEducations)
                .SingleAsync(item => item.UserId == candidateUserId);
            profile.Skills = new List<string> { "UX", "Figma" };
            profile.Links = System.Text.Json.JsonSerializer.Serialize(new
            {
                onboarding = new
                {
                    profession = "UX/UI-дизайнер",
                    gender = "female",
                    birthDate = "2002-04-12",
                    phone = "+79990000000",
                    city = "Москва",
                    citizenship = "Россия",
                    noExperience = true,
                    goal = "Goal",
                },
            });
            if (profile.ApplicantEducations.Count == 0)
            {
                profile.ApplicantEducations.Add(new Models.ApplicantEducation
                {
                    InstitutionName = "Test University",
                    Faculty = "Design",
                    Specialization = "Interface Design",
                    GraduationYear = 2027,
                    IsCompleted = false,
                });
            }
            await db.SaveChangesAsync();
        }

        var applyResponse = await candidateClient.PostAsJsonAsync($"/api/opportunities/{opportunityId}/applications", new { });
        Assert.Equal(HttpStatusCode.OK, applyResponse.StatusCode);
        var summary = await applyResponse.Content.ReadFromJsonAsync<OpportunityApplicationSummaryDTO>();
        Assert.NotNull(summary);
        var applicationId = summary!.Id;

        int secondApplicationId;
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDBContext>();
            var employer = await db.EmployerProfiles.SingleAsync(item => item.UserId == companyUserId);
            var applicant = await db.ApplicantProfiles.SingleAsync(item => item.UserId == candidateUserId);
            var secondOpportunity = new Models.Opportunity
            {
                EmployerId = employer.Id,
                Title = $"SecondChatOpportunity-{Guid.NewGuid():N}",
                Description = "Second opportunity from chat test",
                OpportunityType = "event",
                EmploymentType = "online",
                Schedule = "part_time",
                ModerationStatus = "approved",
            };
            db.Opportunities.Add(secondOpportunity);
            await db.SaveChangesAsync();

            var secondApplication = new Models.OpportunityApplication
            {
                OpportunityId = secondOpportunity.Id,
                ApplicantId = applicant.Id,
                Status = OpportunityApplicationStatuses.Submitted,
            };
            db.Applications.Add(secondApplication);
            await db.SaveChangesAsync();
            secondApplicationId = secondApplication.Id;
        }

        // 2. Candidate starts direct thread with company
        var startDirectResponse = await candidateClient.PostAsJsonAsync("/api/chats/start", new
        {
            recipientUserId = companyUserId,
            initialMessage = "Hello from candidate directly",
        });
        Assert.Equal(HttpStatusCode.OK, startDirectResponse.StatusCode);
        var directThread = await startDirectResponse.Content.ReadFromJsonAsync<ChatThreadReadDTO>();
        Assert.NotNull(directThread);
        Assert.Equal("direct", directThread!.ContextType);

        // 3. Company starts application thread with candidate
        var startAppResponse = await companyClient.PostAsJsonAsync("/api/chats/start", new
        {
            recipientUserId = candidateUserId,
            contextType = "application",
            contextId = applicationId,
            subject = "Application Chat",
            initialMessage = "Hello from company on application",
        });
        Assert.Equal(HttpStatusCode.OK, startAppResponse.StatusCode);
        var appThread = await startAppResponse.Content.ReadFromJsonAsync<ChatThreadReadDTO>();
        Assert.NotNull(appThread);
        
        Assert.Equal(directThread.Id, appThread!.Id);
        Assert.Equal("application", appThread.ContextType);
        Assert.Equal(applicationId, appThread.ContextId);

        // 4. Candidate starts direct thread with company again
        var startDirectAgainResponse = await candidateClient.PostAsJsonAsync("/api/chats/start", new
        {
            recipientUserId = companyUserId,
        });
        Assert.Equal(HttpStatusCode.OK, startDirectAgainResponse.StatusCode);
        var directAgainThread = await startDirectAgainResponse.Content.ReadFromJsonAsync<ChatThreadReadDTO>();
        Assert.NotNull(directAgainThread);
        
        Assert.Equal(directThread.Id, directAgainThread!.Id);
        Assert.Equal("application", directAgainThread.ContextType);

        // 5. A different application between the same candidate and company still reuses the same thread.
        var startSecondAppResponse = await companyClient.PostAsJsonAsync("/api/chats/start", new
        {
            recipientUserId = candidateUserId,
            contextType = "application",
            contextId = secondApplicationId,
            subject = "Second application chat",
            initialMessage = "Hello from company on another application",
        });
        Assert.Equal(HttpStatusCode.OK, startSecondAppResponse.StatusCode);
        var secondAppThread = await startSecondAppResponse.Content.ReadFromJsonAsync<ChatThreadReadDTO>();
        Assert.NotNull(secondAppThread);
        Assert.Equal(directThread.Id, secondAppThread!.Id);

        // 6. Employer notes written during status changes are appended to the same thread.
        var statusResponse = await companyClient.PutAsJsonAsync($"/api/opportunities/{opportunityId}/applications/{applicationId}", new
        {
            status = OpportunityApplicationStatuses.Invited,
            employerNote = "Приглашаем на интервью в четверг.",
        });
        Assert.Equal(HttpStatusCode.OK, statusResponse.StatusCode);

        var messagesResponse = await companyClient.GetAsync($"/api/chats/{directThread.Id}/messages");
        Assert.Equal(HttpStatusCode.OK, messagesResponse.StatusCode);
        var messages = await messagesResponse.Content.ReadFromJsonAsync<List<ChatMessageReadDTO>>();
        Assert.NotNull(messages);
        Assert.Contains(messages!, item => item.Body.Contains("Приглашаем на интервью в четверг.", StringComparison.Ordinal));
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

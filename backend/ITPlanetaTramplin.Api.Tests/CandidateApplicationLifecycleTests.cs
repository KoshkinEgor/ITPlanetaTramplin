using Application.DBContext;
using DTO;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Models;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Xunit;

namespace ITPlanetaTramplin.Api.Tests;

public class CandidateApplicationLifecycleTests
{
    [Fact]
    public async Task ApplyToOpportunity_ReturnsSummary_AndAppearsInCandidateList()
    {
        await using var factory = new TestApplicationFactory();
        using var client = factory.CreateClient();

        var opportunityId = await CreateApprovedOpportunityAsync(factory, client, $"summary-{Guid.NewGuid():N}");
        await client.PostAsync("/api/auth/logout", null);

        var candidate = await RegisterAndConfirmCandidateAsync(client, $"summary-{Guid.NewGuid():N}@tramplin.local");
        await LoginAsCandidateAsync(client, candidate.Email);
        await CompleteMandatoryCandidateProfileAsync(factory, candidate.Email);

        var applyResponse = await client.PostAsJsonAsync($"/api/opportunities/{opportunityId}/applications", new { });
        Assert.Equal(HttpStatusCode.OK, applyResponse.StatusCode);

        var summary = await applyResponse.Content.ReadFromJsonAsync<OpportunityApplicationSummaryDTO>();
        Assert.NotNull(summary);
        Assert.Equal(opportunityId, summary!.OpportunityId);
        Assert.Equal("submitted", summary.Status);

        var listResponse = await client.GetAsync("/api/candidate/me/applications");
        Assert.Equal(HttpStatusCode.OK, listResponse.StatusCode);

        var applications = await listResponse.Content.ReadFromJsonAsync<List<OpportunityApplicationSummaryDTO>>();
        Assert.NotNull(applications);
        Assert.Contains(applications!, item => item.Id == summary.Id && item.Status == "submitted");
    }

    [Fact]
    public async Task ApplyToOpportunity_ReturnsForbidden_WhenMandatoryOnboardingIsIncomplete()
    {
        await using var factory = new TestApplicationFactory();
        using var client = factory.CreateClient();

        var opportunityId = await CreateApprovedOpportunityAsync(factory, client, $"incomplete-{Guid.NewGuid():N}");
        await client.PostAsync("/api/auth/logout", null);

        var candidate = await RegisterAndConfirmCandidateAsync(client, $"incomplete-{Guid.NewGuid():N}@tramplin.local");
        await LoginAsCandidateAsync(client, candidate.Email);

        var applyResponse = await client.PostAsJsonAsync($"/api/opportunities/{opportunityId}/applications", new { });
        Assert.Equal(HttpStatusCode.Forbidden, applyResponse.StatusCode);

        var payload = await applyResponse.Content.ReadFromJsonAsync<MessageResponseDTO>();
        Assert.NotNull(payload);
        Assert.Contains("обязательные поля профиля", payload!.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task CandidateCanWithdrawOwnSubmittedApplication()
    {
        await using var factory = new TestApplicationFactory();
        using var client = factory.CreateClient();

        var opportunityId = await CreateApprovedOpportunityAsync(factory, client, $"withdraw-{Guid.NewGuid():N}");
        await client.PostAsync("/api/auth/logout", null);

        var candidate = await RegisterAndConfirmCandidateAsync(client, $"withdraw-{Guid.NewGuid():N}@tramplin.local");
        await LoginAsCandidateAsync(client, candidate.Email);
        await CompleteMandatoryCandidateProfileAsync(factory, candidate.Email);

        var applySummary = await ApplyToOpportunityAsync(client, opportunityId);

        var withdrawResponse = await client.PostAsync($"/api/candidate/me/applications/{applySummary.Id}/withdraw", null);
        Assert.Equal(HttpStatusCode.OK, withdrawResponse.StatusCode);

        var withdrawnSummary = await withdrawResponse.Content.ReadFromJsonAsync<OpportunityApplicationSummaryDTO>();
        Assert.NotNull(withdrawnSummary);
        Assert.Equal("withdrawn", withdrawnSummary!.Status);
    }

    [Fact]
    public async Task CandidateCanConfirmInvitedApplication()
    {
        await using var factory = new TestApplicationFactory();
        using var client = factory.CreateClient();

        var opportunityId = await CreateApprovedOpportunityAsync(factory, client, $"confirm-{Guid.NewGuid():N}");
        await client.PostAsync("/api/auth/logout", null);

        var candidate = await RegisterAndConfirmCandidateAsync(client, $"confirm-{Guid.NewGuid():N}@tramplin.local");
        await LoginAsCandidateAsync(client, candidate.Email);
        await CompleteMandatoryCandidateProfileAsync(factory, candidate.Email);

        var applySummary = await ApplyToOpportunityAsync(client, opportunityId);

        await client.PostAsync("/api/auth/logout", null);
        await LoginAsCompanyAsync(client);

        var inviteResponse = await client.PutAsJsonAsync($"/api/opportunities/{opportunityId}/applications/{applySummary.Id}", new
        {
            status = "invited",
            employerNote = "Приходите на следующий этап.",
        });
        Assert.Equal(HttpStatusCode.OK, inviteResponse.StatusCode);

        await client.PostAsync("/api/auth/logout", null);
        await LoginAsCandidateAsync(client, candidate.Email);

        var confirmResponse = await client.PostAsync($"/api/candidate/me/applications/{applySummary.Id}/confirm", null);
        Assert.Equal(HttpStatusCode.OK, confirmResponse.StatusCode);

        var confirmedSummary = await confirmResponse.Content.ReadFromJsonAsync<OpportunityApplicationSummaryDTO>();
        Assert.NotNull(confirmedSummary);
        Assert.Equal("accepted", confirmedSummary!.Status);
    }

    [Fact]
    public async Task CandidateCannotConfirmNonInvitedApplication()
    {
        await using var factory = new TestApplicationFactory();
        using var client = factory.CreateClient();

        var opportunityId = await CreateApprovedOpportunityAsync(factory, client, $"invalid-{Guid.NewGuid():N}");
        await client.PostAsync("/api/auth/logout", null);

        var candidate = await RegisterAndConfirmCandidateAsync(client, $"invalid-{Guid.NewGuid():N}@tramplin.local");
        await LoginAsCandidateAsync(client, candidate.Email);
        await CompleteMandatoryCandidateProfileAsync(factory, candidate.Email);

        var applySummary = await ApplyToOpportunityAsync(client, opportunityId);

        var confirmResponse = await client.PostAsync($"/api/candidate/me/applications/{applySummary.Id}/confirm", null);
        Assert.Equal(HttpStatusCode.BadRequest, confirmResponse.StatusCode);

        var error = await confirmResponse.Content.ReadFromJsonAsync<MessageResponseDTO>();
        Assert.NotNull(error);
        Assert.Contains("Подтвердить можно", error!.Message);
    }

    [Fact]
    public async Task CandidateCannotWithdrawAnotherCandidatesApplication()
    {
        await using var factory = new TestApplicationFactory();
        using var client = factory.CreateClient();

        var opportunityId = await CreateApprovedOpportunityAsync(factory, client, $"foreign-{Guid.NewGuid():N}");
        await client.PostAsync("/api/auth/logout", null);

        var firstCandidate = await RegisterAndConfirmCandidateAsync(client, $"foreign-a-{Guid.NewGuid():N}@tramplin.local");
        await LoginAsCandidateAsync(client, firstCandidate.Email);
        await CompleteMandatoryCandidateProfileAsync(factory, firstCandidate.Email);
        var applySummary = await ApplyToOpportunityAsync(client, opportunityId);

        await client.PostAsync("/api/auth/logout", null);

        var secondCandidate = await RegisterAndConfirmCandidateAsync(client, $"foreign-b-{Guid.NewGuid():N}@tramplin.local");
        await LoginAsCandidateAsync(client, secondCandidate.Email);

        var withdrawResponse = await client.PostAsync($"/api/candidate/me/applications/{applySummary.Id}/withdraw", null);
        Assert.Equal(HttpStatusCode.NotFound, withdrawResponse.StatusCode);
    }

    [Fact]
    public async Task CompanyAndCandidateObserveConsistentApplicationStatesAcrossReviewWithdrawInviteAndAccept()
    {
        await using var factory = new TestApplicationFactory();
        using var client = factory.CreateClient();

        var opportunityId = await CreateApprovedOpportunityAsync(factory, client, $"responses-{Guid.NewGuid():N}");
        await client.PostAsync("/api/auth/logout", null);

        var firstCandidate = await RegisterAndConfirmCandidateAsync(client, $"responses-a-{Guid.NewGuid():N}@tramplin.local");
        await LoginAsCandidateAsync(client, firstCandidate.Email);
        await CompleteMandatoryCandidateProfileAsync(factory, firstCandidate.Email);
        var firstApplication = await ApplyToOpportunityAsync(client, opportunityId);

        await client.PostAsync("/api/auth/logout", null);
        await LoginAsCompanyAsync(client);

        var moveToReviewResponse = await client.PutAsJsonAsync($"/api/opportunities/{opportunityId}/applications/{firstApplication.Id}", new
        {
            status = "reviewing",
            employerNote = "Пока держим отклик в резерве.",
        });
        Assert.Equal(HttpStatusCode.OK, moveToReviewResponse.StatusCode);

        await client.PostAsync("/api/auth/logout", null);
        await LoginAsCandidateAsync(client, firstCandidate.Email);

        var firstCandidateListResponse = await client.GetAsync("/api/candidate/me/applications");
        Assert.Equal(HttpStatusCode.OK, firstCandidateListResponse.StatusCode);

        var firstCandidateApplications = await firstCandidateListResponse.Content.ReadFromJsonAsync<List<OpportunityApplicationSummaryDTO>>();
        Assert.NotNull(firstCandidateApplications);
        var reviewingApplication = Assert.Single(firstCandidateApplications!, item => item.Id == firstApplication.Id);
        Assert.Equal("reviewing", reviewingApplication.Status);
        Assert.Equal("Пока держим отклик в резерве.", reviewingApplication.EmployerNote);

        var withdrawResponse = await client.PostAsync($"/api/candidate/me/applications/{firstApplication.Id}/withdraw", null);
        Assert.Equal(HttpStatusCode.OK, withdrawResponse.StatusCode);

        await client.PostAsync("/api/auth/logout", null);

        var secondCandidate = await RegisterAndConfirmCandidateAsync(client, $"responses-b-{Guid.NewGuid():N}@tramplin.local");
        await LoginAsCandidateAsync(client, secondCandidate.Email);
        await CompleteMandatoryCandidateProfileAsync(factory, secondCandidate.Email);
        var secondApplication = await ApplyToOpportunityAsync(client, opportunityId);

        await client.PostAsync("/api/auth/logout", null);
        await LoginAsCompanyAsync(client);

        var inviteResponse = await client.PutAsJsonAsync($"/api/opportunities/{opportunityId}/applications/{secondApplication.Id}", new
        {
            status = "invited",
            employerNote = "Приглашаем на интервью с командой.",
        });
        Assert.Equal(HttpStatusCode.OK, inviteResponse.StatusCode);

        var companyApplicationsResponse = await client.GetAsync($"/api/opportunities/{opportunityId}/applications");
        Assert.Equal(HttpStatusCode.OK, companyApplicationsResponse.StatusCode);

        using (var companyApplicationsPayload = JsonDocument.Parse(await companyApplicationsResponse.Content.ReadAsStringAsync()))
        {
            var applications = companyApplicationsPayload.RootElement.EnumerateArray().ToArray();
            var withdrawnApplication = Assert.Single(applications, item => item.GetProperty("id").GetInt32() == firstApplication.Id);
            var invitedApplication = Assert.Single(applications, item => item.GetProperty("id").GetInt32() == secondApplication.Id);

            Assert.Equal("withdrawn", withdrawnApplication.GetProperty("status").GetString());
            Assert.Equal("invited", invitedApplication.GetProperty("status").GetString());
            Assert.Equal("Приглашаем на интервью с командой.", invitedApplication.GetProperty("employerNote").GetString());
        }

        await client.PostAsync("/api/auth/logout", null);
        await LoginAsCandidateAsync(client, secondCandidate.Email);

        var confirmResponse = await client.PostAsync($"/api/candidate/me/applications/{secondApplication.Id}/confirm", null);
        Assert.Equal(HttpStatusCode.OK, confirmResponse.StatusCode);

        var confirmedApplication = await confirmResponse.Content.ReadFromJsonAsync<OpportunityApplicationSummaryDTO>();
        Assert.NotNull(confirmedApplication);
        Assert.Equal("accepted", confirmedApplication!.Status);
        Assert.Equal("Приглашаем на интервью с командой.", confirmedApplication.EmployerNote);

        await client.PostAsync("/api/auth/logout", null);
        await LoginAsCompanyAsync(client);

        var companyApplicationsAfterConfirmResponse = await client.GetAsync($"/api/opportunities/{opportunityId}/applications");
        Assert.Equal(HttpStatusCode.OK, companyApplicationsAfterConfirmResponse.StatusCode);

        using var companyApplicationsAfterConfirmPayload = JsonDocument.Parse(await companyApplicationsAfterConfirmResponse.Content.ReadAsStringAsync());
        Assert.Contains(
            companyApplicationsAfterConfirmPayload.RootElement.EnumerateArray(),
            item => item.GetProperty("id").GetInt32() == secondApplication.Id
                && item.GetProperty("status").GetString() == "accepted");
    }

    [Fact]
    public async Task CompanyCannotDirectlyUpdateAcceptedApplication()
    {
        await using var factory = new TestApplicationFactory();
        using var client = factory.CreateClient();

        var opportunityId = await CreateApprovedOpportunityAsync(factory, client, $"direct-lock-{Guid.NewGuid():N}");
        await client.PostAsync("/api/auth/logout", null);

        var candidate = await RegisterAndConfirmCandidateAsync(client, $"direct-lock-{Guid.NewGuid():N}@tramplin.local");
        await LoginAsCandidateAsync(client, candidate.Email);
        await CompleteMandatoryCandidateProfileAsync(factory, candidate.Email);
        var applySummary = await ApplyToOpportunityAsync(client, opportunityId);

        // Invite and Accept
        await client.PostAsync("/api/auth/logout", null);
        await LoginAsCompanyAsync(client);
        await client.PutAsJsonAsync($"/api/opportunities/{opportunityId}/applications/{applySummary.Id}", new
        {
            status = "invited",
            employerNote = "Приходите на интервью",
        });

        await client.PostAsync("/api/auth/logout", null);
        await LoginAsCandidateAsync(client, candidate.Email);
        await client.PostAsync($"/api/candidate/me/applications/{applySummary.Id}/confirm", null);

        // Try directly updating as company back to reviewing
        await client.PostAsync("/api/auth/logout", null);
        await LoginAsCompanyAsync(client);
        var updateResponse = await client.PutAsJsonAsync($"/api/opportunities/{opportunityId}/applications/{applySummary.Id}", new
        {
            status = "reviewing",
            employerNote = "Хотим вернуть на рассмотрение",
        });

        Assert.Equal(HttpStatusCode.BadRequest, updateResponse.StatusCode);
        var payload = await updateResponse.Content.ReadFromJsonAsync<MessageResponseDTO>();
        Assert.NotNull(payload);
        Assert.Contains("Нельзя изменить статус уже принятого отклика напрямую", payload!.Message);
    }

    [Fact]
    public async Task CompanyCannotDirectlyUpdateToWithdrawn()
    {
        await using var factory = new TestApplicationFactory();
        using var client = factory.CreateClient();

        var opportunityId = await CreateApprovedOpportunityAsync(factory, client, $"withdrawn-lock-{Guid.NewGuid():N}");
        await client.PostAsync("/api/auth/logout", null);

        var candidate = await RegisterAndConfirmCandidateAsync(client, $"withdrawn-lock-{Guid.NewGuid():N}@tramplin.local");
        await LoginAsCandidateAsync(client, candidate.Email);
        await CompleteMandatoryCandidateProfileAsync(factory, candidate.Email);
        var applySummary = await ApplyToOpportunityAsync(client, opportunityId);

        await client.PostAsync("/api/auth/logout", null);
        await LoginAsCompanyAsync(client);

        var updateResponse = await client.PutAsJsonAsync($"/api/opportunities/{opportunityId}/applications/{applySummary.Id}", new
        {
            status = "withdrawn",
            employerNote = "Отозвать отклик от имени компании",
        });

        Assert.Equal(HttpStatusCode.BadRequest, updateResponse.StatusCode);
        var payload = await updateResponse.Content.ReadFromJsonAsync<MessageResponseDTO>();
        Assert.NotNull(payload);
        Assert.Contains("Работодатель не может перевести отклик в статус 'Отозвано'", payload!.Message);
    }

    [Fact]
    public async Task CompanyCanCancelAcceptedApplicationThroughComplaintFlow()
    {
        await using var factory = new TestApplicationFactory();
        using var client = factory.CreateClient();

        var opportunityId = await CreateApprovedOpportunityAsync(factory, client, $"cancel-flow-{Guid.NewGuid():N}");
        await client.PostAsync("/api/auth/logout", null);

        var candidate = await RegisterAndConfirmCandidateAsync(client, $"cancel-flow-{Guid.NewGuid():N}@tramplin.local");
        await LoginAsCandidateAsync(client, candidate.Email);
        await CompleteMandatoryCandidateProfileAsync(factory, candidate.Email);
        var applySummary = await ApplyToOpportunityAsync(client, opportunityId);

        // Invite and Accept
        await client.PostAsync("/api/auth/logout", null);
        await LoginAsCompanyAsync(client);
        await client.PutAsJsonAsync($"/api/opportunities/{opportunityId}/applications/{applySummary.Id}", new
        {
            status = "invited",
            employerNote = "Приходите на интервью",
        });

        await client.PostAsync("/api/auth/logout", null);
        await LoginAsCandidateAsync(client, candidate.Email);
        await client.PostAsync($"/api/candidate/me/applications/{applySummary.Id}/confirm", null);

        // Cancel through cancel-accepted endpoint
        await client.PostAsync("/api/auth/logout", null);
        await LoginAsCompanyAsync(client);
        var cancelResponse = await client.PostAsJsonAsync($"/api/opportunities/{opportunityId}/applications/{applySummary.Id}/cancel-accepted", new
        {
            reason = "Кандидат не выходит на связь / Не явился",
            description = "Не отвечает на сообщения уже 3 дня.",
        });

        Assert.Equal(HttpStatusCode.OK, cancelResponse.StatusCode);

        // Verify status changed to rejected and employer note updated
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDBContext>();
            var application = await db.Applications.SingleAsync(item => item.Id == applySummary.Id);
            Assert.Equal("rejected", application.Status);
            Assert.Contains("Кандидат не выходит на связь / Не явился", application.EmployerNote);
            Assert.Contains("Не отвечает на сообщения уже 3 дня", application.EmployerNote);

            // Verify a complaint was created
            var complaint = await db.Complaints.SingleOrDefaultAsync(item => item.OpportunityId == opportunityId);
            Assert.NotNull(complaint);
            Assert.Equal("other", complaint!.Reason);
            Assert.Contains("Отмена принятого отклика №", complaint.Description);
            Assert.Contains("Не отвечает на сообщения уже 3 дня", complaint.Description);

            // Verify notification created for candidate
            var candidateUser = await db.Users.SingleAsync(item => item.Email == candidate.Email);
            var notification = await db.UserNotifications.FirstOrDefaultAsync(item => item.UserId == candidateUser.Id && item.Type == "application.status_changed" && item.Title == "Принятый отклик отменен");
            Assert.NotNull(notification);
            Assert.Contains("Кандидат не выходит на связь / Не явился", notification!.Message);
        }
    }

    private static async Task<int> CreateApprovedOpportunityAsync(TestApplicationFactory factory, HttpClient client, string title)
    {
        await LoginAsCompanyAsync(client);

        var createResponse = await client.PostAsJsonAsync("/api/opportunities", new
        {
            title,
            description = "Created from lifecycle test",
            opportunityType = "vacancy",
            employmentType = "online",
            schedule = "full_time",
            contactsJson = """{"email":"lifecycle@test.local"}""",
            salaryFrom = 90000m,
            salaryTo = 140000m,
            saveMode = "submit",
        });

        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);

        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDBContext>();
        var opportunity = await db.Opportunities.SingleAsync(item => item.Title == title);
        opportunity.ModerationStatus = "approved";
        await db.SaveChangesAsync();

        return opportunity.Id;
    }

    private static async Task<OpportunityApplicationSummaryDTO> ApplyToOpportunityAsync(HttpClient client, int opportunityId)
    {
        var response = await client.PostAsJsonAsync($"/api/opportunities/{opportunityId}/applications", new { });
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var summary = await response.Content.ReadFromJsonAsync<OpportunityApplicationSummaryDTO>();
        Assert.NotNull(summary);
        return summary!;
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

    private static async Task CompleteMandatoryCandidateProfileAsync(TestApplicationFactory factory, string email)
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDBContext>();
        var user = await db.Users
            .Include(item => item.ApplicantProfile)
            .ThenInclude(item => item.ApplicantEducations)
            .SingleAsync(item => item.Email == email);

        var profile = Assert.IsType<ApplicantProfile>(user.ApplicantProfile);
        profile.Skills = ["UX", "Figma"];
        profile.Links = JsonSerializer.Serialize(new
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
                goal = "Получить первую стажировку в продуктовой команде",
            },
        });

        if (profile.ApplicantEducations.Count == 0)
        {
            profile.ApplicantEducations.Add(new ApplicantEducation
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

    [Fact]
    public async Task CandidateCanReapplyAfterWithdrawing()
    {
        await using var factory = new TestApplicationFactory();
        using var client = factory.CreateClient();

        var opportunityId = await CreateApprovedOpportunityAsync(factory, client, $"reapply-{Guid.NewGuid():N}");
        await client.PostAsync("/api/auth/logout", null);

        var candidate = await RegisterAndConfirmCandidateAsync(client, $"reapply-{Guid.NewGuid():N}@tramplin.local");
        await LoginAsCandidateAsync(client, candidate.Email);
        await CompleteMandatoryCandidateProfileAsync(factory, candidate.Email);

        // First apply
        var applySummary = await ApplyToOpportunityAsync(client, opportunityId);
        Assert.Equal("submitted", applySummary.Status);

        // Withdraw
        var withdrawResponse = await client.PostAsync($"/api/candidate/me/applications/{applySummary.Id}/withdraw", null);
        Assert.Equal(HttpStatusCode.OK, withdrawResponse.StatusCode);

        // Reapply
        var reapplyResponse = await client.PostAsJsonAsync($"/api/opportunities/{opportunityId}/applications", new { });
        Assert.Equal(HttpStatusCode.OK, reapplyResponse.StatusCode);

        var reapplySummary = await reapplyResponse.Content.ReadFromJsonAsync<OpportunityApplicationSummaryDTO>();
        Assert.NotNull(reapplySummary);
        Assert.Equal(applySummary.Id, reapplySummary!.Id);
        Assert.Equal("submitted", reapplySummary.Status);
    }

    [Fact]
    public async Task CandidateCanDeclineInvitation()
    {
        await using var factory = new TestApplicationFactory();
        using var client = factory.CreateClient();

        var opportunityId = await CreateApprovedOpportunityAsync(factory, client, $"decline-{Guid.NewGuid():N}");
        await client.PostAsync("/api/auth/logout", null);

        var candidate = await RegisterAndConfirmCandidateAsync(client, $"decline-{Guid.NewGuid():N}@tramplin.local");
        await LoginAsCandidateAsync(client, candidate.Email);
        await CompleteMandatoryCandidateProfileAsync(factory, candidate.Email);

        var applySummary = await ApplyToOpportunityAsync(client, opportunityId);

        // Company invites
        await client.PostAsync("/api/auth/logout", null);
        await LoginAsCompanyAsync(client);
        await client.PutAsJsonAsync($"/api/opportunities/{opportunityId}/applications/{applySummary.Id}", new
        {
            status = "invited",
            employerNote = "Приглашаем на интервью",
        });

        // Candidate declines (withdraws)
        await client.PostAsync("/api/auth/logout", null);
        await LoginAsCandidateAsync(client, candidate.Email);
        var declineResponse = await client.PostAsync($"/api/candidate/me/applications/{applySummary.Id}/withdraw", null);
        Assert.Equal(HttpStatusCode.OK, declineResponse.StatusCode);

        var declinedSummary = await declineResponse.Content.ReadFromJsonAsync<OpportunityApplicationSummaryDTO>();
        Assert.NotNull(declinedSummary);
        Assert.Equal("withdrawn", declinedSummary!.Status);
    }

    [Fact]
    public async Task CompanyCannotModifyWithdrawnApplication()
    {
        await using var factory = new TestApplicationFactory();
        using var client = factory.CreateClient();

        var opportunityId = await CreateApprovedOpportunityAsync(factory, client, $"modify-withdrawn-{Guid.NewGuid():N}");
        await client.PostAsync("/api/auth/logout", null);

        var candidate = await RegisterAndConfirmCandidateAsync(client, $"modify-withdrawn-{Guid.NewGuid():N}@tramplin.local");
        await LoginAsCandidateAsync(client, candidate.Email);
        await CompleteMandatoryCandidateProfileAsync(factory, candidate.Email);

        var applySummary = await ApplyToOpportunityAsync(client, opportunityId);

        // Withdraw
        var withdrawResponse = await client.PostAsync($"/api/candidate/me/applications/{applySummary.Id}/withdraw", null);
        Assert.Equal(HttpStatusCode.OK, withdrawResponse.StatusCode);

        // Company tries to invite candidate
        await client.PostAsync("/api/auth/logout", null);
        await LoginAsCompanyAsync(client);
        var updateResponse = await client.PutAsJsonAsync($"/api/opportunities/{opportunityId}/applications/{applySummary.Id}", new
        {
            status = "invited",
            employerNote = "Хотим пригласить отозванный отклик",
        });

        Assert.Equal(HttpStatusCode.BadRequest, updateResponse.StatusCode);
        var payload = await updateResponse.Content.ReadFromJsonAsync<MessageResponseDTO>();
        Assert.NotNull(payload);
        Assert.Contains("Нельзя изменить статус отклика, который был отозван кандидатом", payload!.Message);
    }

    [Fact]
    public async Task CandidateCannotConfirmMentoringIfSeatsAreFull()
    {
        await using var factory = new TestApplicationFactory();
        using var client = factory.CreateClient();

        var opportunityId = await CreateApprovedOpportunityAsync(factory, client, $"mentoring-limit-{Guid.NewGuid():N}");

        // Modify opportunity in DB to be mentoring with 1 seat
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDBContext>();
            var opportunity = await db.Opportunities.SingleAsync(item => item.Id == opportunityId);
            opportunity.OpportunityType = "mentoring";
            opportunity.SeatsCount = 1;
            opportunity.Duration = "3 месяца";
            opportunity.MeetingFrequency = "Раз в неделю";
            await db.SaveChangesAsync();
        }

        // Candidate A
        await client.PostAsync("/api/auth/logout", null);
        var candidateA = await RegisterAndConfirmCandidateAsync(client, $"mentoring-a-{Guid.NewGuid():N}@tramplin.local");
        await LoginAsCandidateAsync(client, candidateA.Email);
        await CompleteMandatoryCandidateProfileAsync(factory, candidateA.Email);
        var applySummaryA = await ApplyToOpportunityAsync(client, opportunityId);

        // Candidate B
        await client.PostAsync("/api/auth/logout", null);
        var candidateB = await RegisterAndConfirmCandidateAsync(client, $"mentoring-b-{Guid.NewGuid():N}@tramplin.local");
        await LoginAsCandidateAsync(client, candidateB.Email);
        await CompleteMandatoryCandidateProfileAsync(factory, candidateB.Email);
        var applySummaryB = await ApplyToOpportunityAsync(client, opportunityId);

        // Company invites both
        await client.PostAsync("/api/auth/logout", null);
        await LoginAsCompanyAsync(client);
        await client.PutAsJsonAsync($"/api/opportunities/{opportunityId}/applications/{applySummaryA.Id}", new { status = "invited", employerNote = "Invite A" });
        await client.PutAsJsonAsync($"/api/opportunities/{opportunityId}/applications/{applySummaryB.Id}", new { status = "invited", employerNote = "Invite B" });

        // Candidate A confirms -> OK
        await client.PostAsync("/api/auth/logout", null);
        await LoginAsCandidateAsync(client, candidateA.Email);
        var confirmResponseA = await client.PostAsync($"/api/candidate/me/applications/{applySummaryA.Id}/confirm", null);
        Assert.Equal(HttpStatusCode.OK, confirmResponseA.StatusCode);

        // Candidate B confirms -> BadRequest because limit of 1 seat is reached
        await client.PostAsync("/api/auth/logout", null);
        await LoginAsCandidateAsync(client, candidateB.Email);
        var confirmResponseB = await client.PostAsync($"/api/candidate/me/applications/{applySummaryB.Id}/confirm", null);
        Assert.Equal(HttpStatusCode.BadRequest, confirmResponseB.StatusCode);

        var payload = await confirmResponseB.Content.ReadFromJsonAsync<MessageResponseDTO>();
        Assert.NotNull(payload);
        Assert.Contains("все свободные места на программу уже заняты", payload!.Message);
    }

    private static async Task LoginAsCandidateAsync(HttpClient client, string email)
    {
        var loginResponse = await client.PostAsJsonAsync("/api/auth/login", new
        {
            role = "candidate",
            login = email,
            password = "Password1",
        });

        Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);
    }

    private static async Task LoginAsCompanyAsync(HttpClient client)
    {
        var loginResponse = await client.PostAsJsonAsync("/api/auth/login", new
        {
            role = "company",
            login = "7707083893",
            password = "Demo1234",
        });

        Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);
    }
}

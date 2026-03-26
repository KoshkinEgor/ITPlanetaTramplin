using Application.DBContext;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System.Net;
using System.Net.Http.Json;
using DTO;
using Xunit;

namespace ITPlanetaTramplin.Api.Tests;

public class AuthEndpointTests
{
    [Fact]
    public async Task CandidateRegistration_Confirm_AndMeFlow_UsesCanonicalRoutes()
    {
        await using var factory = new TestApplicationFactory();
        using var client = factory.CreateClient();

        var registrationResponse = await client.PostAsJsonAsync("/api/auth/register/candidate", new
        {
            email = "candidate@tramplin.local",
            password = "Password1",
            name = "Test",
            surname = "Candidate",
            thirdname = "User",
        });

        Assert.Equal(HttpStatusCode.Created, registrationResponse.StatusCode);

        var payload = await registrationResponse.Content.ReadFromJsonAsync<PendingEmailVerificationDTO>();
        Assert.NotNull(payload);
        Assert.Equal("candidate", payload!.Role);
        Assert.False(string.IsNullOrWhiteSpace(payload.DebugCode));

        var confirmResponse = await client.PostAsJsonAsync("/api/auth/confirm-email", new
        {
            email = payload.Email,
            role = payload.Role,
            code = payload.DebugCode,
        });

        Assert.Equal(HttpStatusCode.OK, confirmResponse.StatusCode);

        var authResponse = await confirmResponse.Content.ReadFromJsonAsync<AuthResponseDTO>();
        Assert.NotNull(authResponse);
        Assert.Equal("candidate", authResponse!.User.Role);

        var meResponse = await client.GetAsync("/api/auth/me");
        Assert.Equal(HttpStatusCode.OK, meResponse.StatusCode);

        var me = await meResponse.Content.ReadFromJsonAsync<AuthUserDTO>();
        Assert.NotNull(me);
        Assert.Equal("candidate", me!.Role);
        Assert.True(me.IsVerified);
    }

    [Fact]
    public async Task LegacyEmployerLoginAlias_ReturnsNormalizedCompanyRole()
    {
        await using var factory = new TestApplicationFactory();
        using var client = factory.CreateClient();

        var registrationResponse = await client.PostAsJsonAsync("/api/auth/register/company", new
        {
            email = "hello@sever.local",
            password = "Password1",
            companyName = "Sever Co",
            inn = "5408114123",
        });

        Assert.Equal(HttpStatusCode.Created, registrationResponse.StatusCode);

        var payload = await registrationResponse.Content.ReadFromJsonAsync<PendingEmailVerificationDTO>();
        Assert.NotNull(payload);
        Assert.Equal("employer-start", payload!.VerificationFlow);

        var confirmResponse = await client.PostAsJsonAsync("/api/auth/confirm-email", new
        {
            email = payload.Email,
            role = payload.Role,
            code = payload.DebugCode,
        });

        Assert.Equal(HttpStatusCode.OK, confirmResponse.StatusCode);

        var logoutResponse = await client.PostAsync("/api/auth/logout", null);
        Assert.Equal(HttpStatusCode.OK, logoutResponse.StatusCode);

        var legacyLoginResponse = await client.PostAsJsonAsync("/api/login/employer", new
        {
            login = payload.Email,
            password = "Password1",
        });

        Assert.Equal(HttpStatusCode.OK, legacyLoginResponse.StatusCode);

        var authResponse = await legacyLoginResponse.Content.ReadFromJsonAsync<AuthResponseDTO>();
        Assert.NotNull(authResponse);
        Assert.Equal("company", authResponse!.User.Role);
    }

    [Fact]
    public async Task CompanyRegistration_ReturnsMismatchReason_WhenEmailDoesNotMatchInn()
    {
        await using var factory = new TestApplicationFactory();
        using var client = factory.CreateClient();

        var registrationResponse = await client.PostAsJsonAsync("/api/auth/register/company", new
        {
            email = "founder@gmail.com",
            password = "Password1",
            companyName = "Tramplin Co",
            inn = "7707083893",
        });

        Assert.Equal(HttpStatusCode.BadRequest, registrationResponse.StatusCode);

        var payload = await registrationResponse.Content.ReadFromJsonAsync<MessageResponseDTO>();
        Assert.NotNull(payload);
        Assert.Contains("доменов", payload!.Message, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("tramplin.local", payload.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task ForgotPassword_AndResetPassword_Flow_Works()
    {
        await using var factory = new TestApplicationFactory();
        using var client = factory.CreateClient();

        var registrationResponse = await client.PostAsJsonAsync("/api/auth/register/candidate", new
        {
            email = "reset@tramplin.local",
            password = "Password1",
            name = "Reset",
            surname = "Candidate",
            thirdname = "User",
        });

        var verificationPayload = await registrationResponse.Content.ReadFromJsonAsync<PendingEmailVerificationDTO>();
        Assert.NotNull(verificationPayload);

        var confirmResponse = await client.PostAsJsonAsync("/api/auth/confirm-email", new
        {
            email = verificationPayload!.Email,
            role = verificationPayload.Role,
            code = verificationPayload.DebugCode,
        });

        Assert.Equal(HttpStatusCode.OK, confirmResponse.StatusCode);
        await client.PostAsync("/api/auth/logout", null);

        var forgotResponse = await client.PostAsJsonAsync("/api/auth/forgot-password", new
        {
            email = verificationPayload.Email,
        });

        Assert.Equal(HttpStatusCode.OK, forgotResponse.StatusCode);

        var forgotPayload = await forgotResponse.Content.ReadFromJsonAsync<PasswordResetRequestResultDTO>();
        Assert.NotNull(forgotPayload);
        Assert.Equal(verificationPayload.Email, forgotPayload!.Email);
        Assert.False(string.IsNullOrWhiteSpace(forgotPayload.DebugCode));

        var resetResponse = await client.PostAsJsonAsync("/api/auth/reset-password", new
        {
            email = verificationPayload.Email,
            code = forgotPayload.DebugCode,
            password = "NewPassword1",
        });

        Assert.Equal(HttpStatusCode.OK, resetResponse.StatusCode);

        var loginResponse = await client.PostAsJsonAsync("/api/auth/login", new
        {
            role = "candidate",
            login = verificationPayload.Email,
            password = "NewPassword1",
        });

        Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);
        var authResponse = await loginResponse.Content.ReadFromJsonAsync<AuthResponseDTO>();
        Assert.NotNull(authResponse);
        Assert.Equal("candidate", authResponse!.User.Role);
    }

    [Fact]
    public async Task Login_ForUnverifiedCandidate_IssuesEmailVerificationCode()
    {
        await using var factory = new TestApplicationFactory();
        using var client = factory.CreateClient();

        var registrationResponse = await client.PostAsJsonAsync("/api/auth/register/candidate", new
        {
            email = "pending-login@tramplin.local",
            password = "Password1",
            name = "Pending",
            surname = "Login",
            thirdname = "User",
        });

        Assert.Equal(HttpStatusCode.Created, registrationResponse.StatusCode);

        var registrationPayload = await registrationResponse.Content.ReadFromJsonAsync<PendingEmailVerificationDTO>();
        Assert.NotNull(registrationPayload);

        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDBContext>();
            var user = await db.Users.SingleAsync(item => item.Email == registrationPayload!.Email);

            user.EmailVerificationCodeHash = null;
            user.EmailVerificationExpiresAt = null;
            user.EmailVerificationSentAt = null;
            user.EmailVerificationAttemptCount = 0;

            await db.SaveChangesAsync();
        }

        var loginResponse = await client.PostAsJsonAsync("/api/auth/login", new
        {
            role = "candidate",
            login = registrationPayload!.Email,
            password = "Password1",
        });

        Assert.Equal(HttpStatusCode.Forbidden, loginResponse.StatusCode);

        var pendingPayload = await loginResponse.Content.ReadFromJsonAsync<PendingEmailVerificationDTO>();
        Assert.NotNull(pendingPayload);
        Assert.Equal(registrationPayload.Email, pendingPayload!.Email);
        Assert.True(pendingPayload.RequiresEmailVerification);
        Assert.False(pendingPayload.EmailDeliveryFailed);
        Assert.False(string.IsNullOrWhiteSpace(pendingPayload.DebugCode));
        Assert.NotNull(pendingPayload.ExpiresAtUtc);

        var confirmResponse = await client.PostAsJsonAsync("/api/auth/confirm-email", new
        {
            email = pendingPayload.Email,
            role = pendingPayload.Role,
            code = pendingPayload.DebugCode,
        });

        Assert.Equal(HttpStatusCode.OK, confirmResponse.StatusCode);
    }

    [Fact]
    public async Task Login_ForLegacyCandidateWithoutVerificationState_SignsIn_AndMarksVerified()
    {
        await using var factory = new TestApplicationFactory();
        using var client = factory.CreateClient();

        var registrationResponse = await client.PostAsJsonAsync("/api/auth/register/candidate", new
        {
            email = "legacy-login@tramplin.local",
            password = "Password1",
            name = "Legacy",
            surname = "Candidate",
            thirdname = "User",
        });

        Assert.Equal(HttpStatusCode.Created, registrationResponse.StatusCode);

        var registrationPayload = await registrationResponse.Content.ReadFromJsonAsync<PendingEmailVerificationDTO>();
        Assert.NotNull(registrationPayload);

        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDBContext>();
            var user = await db.Users.SingleAsync(item => item.Email == registrationPayload!.Email);

            user.IsVerified = false;
            user.CreatedAt = new DateTime(2026, 3, 20, 0, 0, 0, DateTimeKind.Utc);
            user.EmailVerificationCodeHash = null;
            user.EmailVerificationExpiresAt = null;
            user.EmailVerificationSentAt = null;
            user.EmailVerificationAttemptCount = 0;

            await db.SaveChangesAsync();
        }

        var loginResponse = await client.PostAsJsonAsync("/api/auth/login", new
        {
            role = "candidate",
            login = registrationPayload!.Email,
            password = "Password1",
        });

        Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);

        var authResponse = await loginResponse.Content.ReadFromJsonAsync<AuthResponseDTO>();
        Assert.NotNull(authResponse);
        Assert.True(authResponse!.User.IsVerified);

        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDBContext>();
            var user = await db.Users.SingleAsync(item => item.Email == registrationPayload.Email);

            Assert.True(user.IsVerified);
            Assert.Null(user.EmailVerificationCodeHash);
            Assert.Null(user.EmailVerificationExpiresAt);
            Assert.Null(user.EmailVerificationSentAt);
            Assert.Equal(0, user.EmailVerificationAttemptCount);
        }
    }
}

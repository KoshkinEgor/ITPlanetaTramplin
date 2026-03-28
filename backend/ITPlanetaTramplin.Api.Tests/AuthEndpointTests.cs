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

        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDBContext>();
            var userCount = await db.Users.CountAsync(item => item.Email == payload.Email);
            Assert.Equal(0, userCount);
        }

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
        Assert.True(me.PreVerify);
    }

    [Fact]
    public async Task LegacyEmployerLoginAlias_UsesInnAndReturnsNormalizedCompanyRole()
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

        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDBContext>();
            var userCount = await db.Users.CountAsync(item => item.Email == payload.Email);
            Assert.Equal(0, userCount);
        }

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
            login = "5408114123",
            password = "Password1",
        });

        Assert.Equal(HttpStatusCode.OK, legacyLoginResponse.StatusCode);

        var authResponse = await legacyLoginResponse.Content.ReadFromJsonAsync<AuthResponseDTO>();
        Assert.NotNull(authResponse);
        Assert.Equal("company", authResponse!.User.Role);
    }

    [Fact]
    public async Task CompanyLogin_DoesNotAcceptEmail_WhenInnIsRequired()
    {
        await using var factory = new TestApplicationFactory();
        using var client = factory.CreateClient();

        var registrationResponse = await client.PostAsJsonAsync("/api/auth/register/company", new
        {
            email = "login-only-inn@sever.local",
            password = "Password1",
            companyName = "Sever Co",
            inn = "5408114123",
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

        var logoutResponse = await client.PostAsync("/api/auth/logout", null);
        Assert.Equal(HttpStatusCode.OK, logoutResponse.StatusCode);

        var loginResponse = await client.PostAsJsonAsync("/api/auth/login", new
        {
            role = "company",
            login = payload.Email,
            password = "Password1",
        });

        Assert.Equal(HttpStatusCode.Unauthorized, loginResponse.StatusCode);
    }

    [Fact]
    public async Task CompanyRegistration_WithoutEmail_SignsInImmediately()
    {
        await using var factory = new TestApplicationFactory();
        using var client = factory.CreateClient();

        var registrationResponse = await client.PostAsJsonAsync("/api/auth/register/company", new
        {
            password = "Password1",
            companyName = "Sever Co",
            inn = "5408114123",
        });

        Assert.Equal(HttpStatusCode.OK, registrationResponse.StatusCode);

        var authResponse = await registrationResponse.Content.ReadFromJsonAsync<AuthResponseDTO>();
        Assert.NotNull(authResponse);
        Assert.Equal("company", authResponse!.User.Role);
        Assert.True(authResponse.User.IsVerified);
        Assert.True(authResponse.User.PreVerify);

        var meResponse = await client.GetAsync("/api/auth/me");
        Assert.Equal(HttpStatusCode.OK, meResponse.StatusCode);

        var me = await meResponse.Content.ReadFromJsonAsync<AuthUserDTO>();
        Assert.NotNull(me);
        Assert.Equal("company", me!.Role);
        Assert.True(me.IsVerified);
        Assert.True(me.PreVerify);

        await client.PostAsync("/api/auth/logout", null);

        var loginResponse = await client.PostAsJsonAsync("/api/auth/login", new
        {
            role = "company",
            login = "5408114123",
            password = "Password1",
        });

        Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);
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
    public async Task Login_ForPendingCandidateRegistration_ReturnsVerificationChallenge()
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
        Assert.Equal("candidate", pendingPayload.Role);
        Assert.True(pendingPayload.RequiresEmailVerification);

        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDBContext>();
            var userCount = await db.Users.CountAsync(item => item.Email == registrationPayload.Email);
            Assert.Equal(0, userCount);
        }
    }

    [Fact]
    public async Task Login_WhenPreVerifyDisabled_IssuesEmailVerificationCode()
    {
        await using var factory = new TestApplicationFactory();
        using var client = factory.CreateClient();

        var registrationResponse = await client.PostAsJsonAsync("/api/auth/register/candidate", new
        {
            email = "preverify-off@tramplin.local",
            password = "Password1",
            name = "Pending",
            surname = "Login",
            thirdname = "User",
        });

        Assert.Equal(HttpStatusCode.Created, registrationResponse.StatusCode);

        var registrationPayload = await registrationResponse.Content.ReadFromJsonAsync<PendingEmailVerificationDTO>();
        Assert.NotNull(registrationPayload);

        var confirmResponse = await client.PostAsJsonAsync("/api/auth/confirm-email", new
        {
            email = registrationPayload!.Email,
            role = registrationPayload.Role,
            code = registrationPayload.DebugCode,
        });

        Assert.Equal(HttpStatusCode.OK, confirmResponse.StatusCode);
        await client.PostAsync("/api/auth/logout", null);

        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDBContext>();
            var user = await db.Users.SingleAsync(item => item.Email == registrationPayload.Email);

            user.PreVerify = false;
            user.IsVerified = false;
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

        var secondConfirmResponse = await client.PostAsJsonAsync("/api/auth/confirm-email", new
        {
            email = pendingPayload.Email,
            role = pendingPayload.Role,
            code = pendingPayload.DebugCode,
        });

        Assert.Equal(HttpStatusCode.OK, secondConfirmResponse.StatusCode);

        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDBContext>();
            var user = await db.Users.SingleAsync(item => item.Email == registrationPayload.Email);

            Assert.True(user.PreVerify);
            Assert.True(user.IsVerified);
            Assert.Null(user.EmailVerificationCodeHash);
            Assert.Null(user.EmailVerificationExpiresAt);
            Assert.Null(user.EmailVerificationSentAt);
            Assert.Equal(0, user.EmailVerificationAttemptCount);
        }
    }

    [Fact]
    public async Task AuthMe_ReturnsAdministratorFlag_ForModeratorAccounts()
    {
        await using var factory = new TestApplicationFactory();
        using var client = factory.CreateClient();

        var adminLoginResponse = await client.PostAsJsonAsync("/api/auth/login", new
        {
            role = "moderator",
            login = "administrator@tramplin.local",
            password = "Administrator1234",
        });

        Assert.Equal(HttpStatusCode.OK, adminLoginResponse.StatusCode);

        var adminMeResponse = await client.GetAsync("/api/auth/me");
        Assert.Equal(HttpStatusCode.OK, adminMeResponse.StatusCode);

        var adminMe = await adminMeResponse.Content.ReadFromJsonAsync<AuthUserDTO>();
        Assert.NotNull(adminMe);
        Assert.Equal("moderator", adminMe!.Role);
        Assert.True(adminMe.IsAdministrator);

        await client.PostAsync("/api/auth/logout", null);

        var moderatorLoginResponse = await client.PostAsJsonAsync("/api/auth/login", new
        {
            role = "moderator",
            login = "demo-curator@tramplin.local",
            password = "Curator1234",
        });

        Assert.Equal(HttpStatusCode.OK, moderatorLoginResponse.StatusCode);

        var moderatorMeResponse = await client.GetAsync("/api/auth/me");
        Assert.Equal(HttpStatusCode.OK, moderatorMeResponse.StatusCode);

        var moderatorMe = await moderatorMeResponse.Content.ReadFromJsonAsync<AuthUserDTO>();
        Assert.NotNull(moderatorMe);
        Assert.Equal("moderator", moderatorMe!.Role);
        Assert.False(moderatorMe.IsAdministrator);
    }
}

using System.Security.Claims;
using System.Text.Json;
using DTO;
using ITPlanetaTramplin.Api.Integrations;
using Models;

namespace ITPlanetaTramplin.Api.Auth;

internal static class AuthEndpointSupport
{
    public static IResult MessageResult(string message, int statusCode) =>
        Results.Json(new MessageResponseDTO { Message = message }, statusCode: statusCode);

    public static IResult InvalidCredentialsResult() =>
        MessageResult("Неверный логин или пароль.", StatusCodes.Status401Unauthorized);

    public static string? BuildDisplayName(User user, string role) =>
        role switch
        {
            PublicRoles.Candidate => string.Join(" ", new[] { user.ApplicantProfile?.Name, user.ApplicantProfile?.Surname, user.ApplicantProfile?.Thirdname }
                .Where(value => !string.IsNullOrWhiteSpace(value))
                .Select(value => value!.Trim())),
            PublicRoles.Company => user.EmployerProfile?.CompanyName?.Trim(),
            PublicRoles.Moderator => string.Join(" ", new[] { user.CuratorProfile?.Name, user.CuratorProfile?.Surname, user.CuratorProfile?.Thirdname }
                .Where(value => !string.IsNullOrWhiteSpace(value))
                .Select(value => value!.Trim())),
            _ => null,
        };

    public static string? GetPublicRole(User user)
    {
        if (user.ApplicantProfile is not null)
        {
            return PublicRoles.Candidate;
        }

        if (user.EmployerProfile is not null)
        {
            return PublicRoles.Company;
        }

        if (user.CuratorProfile is not null)
        {
            return PublicRoles.Moderator;
        }

        return null;
    }

    public static AuthUserDTO BuildAuthUser(User user, string role) =>
        new()
        {
            Id = user.Id,
            Email = user.Email,
            Role = role,
            IsVerified = user.IsVerified ?? false,
            DisplayName = BuildDisplayName(user, role),
        };

    public static string BuildVerificationFlow(User user, string role) =>
        role switch
        {
            PublicRoles.Candidate => "register-candidate",
            PublicRoles.Company => string.IsNullOrWhiteSpace(user.EmployerProfile?.Inn) ? "employer-start" : "employer-verify",
            _ => "register-candidate",
        };

    public static PendingEmailVerificationDTO BuildPendingEmailVerificationPayload(User user, string role, string message) =>
        new()
        {
            UserId = user.Id,
            Email = user.Email,
            Role = role,
            VerificationFlow = BuildVerificationFlow(user, role),
            ExpiresAtUtc = user.EmailVerificationExpiresAt,
            Message = message,
        };

    public static PasswordResetRequestResultDTO BuildPasswordResetPayload(User user, string message) =>
        new()
        {
            Email = user.Email,
            ExpiresAtUtc = user.PasswordResetExpiresAt,
            Message = message,
        };

    public static IResult EmailVerificationRequiredResult(User user, string role) =>
        Results.Json(
            BuildPendingEmailVerificationPayload(user, role, "Подтвердите email, чтобы войти в аккаунт."),
            statusCode: StatusCodes.Status403Forbidden);

    public static IResult SignInUser(HttpContext context, User user, string role, AuthRuntimeOptions authRuntimeOptions)
    {
        var tokenResult = AuthSupport.CreateToken(user, role, authRuntimeOptions.KeyBytes, authRuntimeOptions.AccessTokenLifetime);
        context.Response.Cookies.Append(
            authRuntimeOptions.CookieName,
            tokenResult.Token,
            AuthSupport.BuildAuthCookieOptions(context.Request.IsHttps, tokenResult.ExpiresAtUtc));

        return Results.Ok(new AuthResponseDTO
        {
            Token = tokenResult.Token,
            ExpiresAtUtc = tokenResult.ExpiresAtUtc,
            User = BuildAuthUser(user, role),
        });
    }

    public static async Task<PendingEmailVerificationDTO> IssueAndSendVerificationAsync(
        User user,
        string role,
        EmailVerificationService verificationService,
        SmtpEmailSender emailSender,
        CancellationToken cancellationToken,
        string successMessage,
        string emailFailureMessage,
        ILogger logger)
    {
        var issue = verificationService.IssueCode(user);
        var payload = BuildPendingEmailVerificationPayload(user, role, successMessage);
        payload.ExpiresAtUtc = issue.ExpiresAtUtc;

        try
        {
            var dispatchResult = await emailSender.SendAsync(
                user.Email,
                "Код подтверждения email",
                BuildVerificationEmailPlainTextBody(issue.Code, issue.ExpiresAtUtc),
                BuildVerificationEmailHtmlBody(issue.Code, issue.ExpiresAtUtc),
                cancellationToken);

            if (dispatchResult.Mode == EmailDispatchMode.LoggedToConsole)
            {
                payload.DebugCode = issue.Code;
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to send email verification code to {Email}.", user.Email);
            payload.EmailDeliveryFailed = true;
            payload.Message = emailFailureMessage;
        }

        return payload;
    }

    public static async Task<PasswordResetRequestResultDTO> IssueAndSendPasswordResetAsync(
        User user,
        PasswordResetService passwordResetService,
        SmtpEmailSender emailSender,
        CancellationToken cancellationToken,
        ILogger logger)
    {
        var issue = passwordResetService.IssueCode(user);
        var payload = BuildPasswordResetPayload(user, "Отправили код для сброса пароля на email.");
        payload.ExpiresAtUtc = issue.ExpiresAtUtc;

        try
        {
            var dispatchResult = await emailSender.SendAsync(
                user.Email,
                "Код для сброса пароля",
                BuildPasswordResetEmailPlainTextBody(issue.Code, issue.ExpiresAtUtc),
                BuildPasswordResetEmailHtmlBody(issue.Code, issue.ExpiresAtUtc),
                cancellationToken);

            if (dispatchResult.Mode == EmailDispatchMode.LoggedToConsole)
            {
                payload.DebugCode = issue.Code;
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to send password reset code to {Email}.", user.Email);
            payload.EmailDeliveryFailed = true;
            payload.Message = "Код создан, но письмо отправить не удалось. Попробуйте позже.";
        }

        return payload;
    }

    public static string GetEmailVerificationFailureMessage(EmailVerificationFailureReason reason) =>
        reason switch
        {
            EmailVerificationFailureReason.MissingCode => "Для этого аккаунта не найден активный код. Запросите новый.",
            EmailVerificationFailureReason.Expired => "Срок действия кода истек. Запросите новый код.",
            EmailVerificationFailureReason.TooManyAttempts => "Лимит попыток исчерпан. Запросите новый код.",
            EmailVerificationFailureReason.InvalidCode => "Код введен неверно.",
            EmailVerificationFailureReason.AlreadyVerified => "Email уже подтвержден.",
            _ => "Не удалось подтвердить email.",
        };

    public static string GetPasswordResetFailureMessage(PasswordResetFailureReason reason) =>
        reason switch
        {
            PasswordResetFailureReason.MissingCode => "Для этого аккаунта не найден активный код. Запросите новый.",
            PasswordResetFailureReason.Expired => "Срок действия кода истек. Запросите новый код.",
            PasswordResetFailureReason.TooManyAttempts => "Лимит попыток исчерпан. Запросите новый код.",
            PasswordResetFailureReason.InvalidCode => "Код введен неверно.",
            _ => "Не удалось сбросить пароль.",
        };

    public static object? TryParseJsonValue(string? rawValue)
    {
        if (string.IsNullOrWhiteSpace(rawValue))
        {
            return null;
        }

        try
        {
            return JsonSerializer.Deserialize<JsonElement>(rawValue);
        }
        catch
        {
            return rawValue.Trim();
        }
    }

    public static string? BuildEmployerVerificationData(string? rawVerificationData, EmployerInnLookupDTO? innLookup)
    {
        if (string.IsNullOrWhiteSpace(rawVerificationData) && innLookup is null)
        {
            return null;
        }

        return JsonSerializer.Serialize(new
        {
            form = TryParseJsonValue(rawVerificationData),
            dadata = innLookup is null
                ? null
                : new
                {
                    innLookup.Inn,
                    innLookup.CompanyName,
                    innLookup.LegalName,
                    innLookup.LegalAddress,
                    innLookup.Kpp,
                    innLookup.Ogrn,
                    innLookup.Status,
                    innLookup.IsActive,
                },
        });
    }

    public static int? GetCurrentUserId(HttpContext context)
    {
        var userIdClaim = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(userIdClaim, out var userId) ? userId : null;
    }

    private static string BuildVerificationEmailPlainTextBody(string code, DateTime expiresAtUtc) =>
        $"""
        Код подтверждения для Tramplin: {code}

        Введите его на экране подтверждения email.
        Код действует до {expiresAtUtc:yyyy-MM-dd HH:mm} UTC.

        Если вы не создавали аккаунт, просто проигнорируйте это письмо.
        """;

    private static string BuildVerificationEmailHtmlBody(string code, DateTime expiresAtUtc) =>
        $"""
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.5; color: #1f2937;">
            <h2 style="margin-bottom: 16px;">Подтверждение email</h2>
            <p>Ваш код подтверждения для Tramplin:</p>
            <p style="font-size: 32px; letter-spacing: 8px; font-weight: 700; margin: 20px 0;">{code}</p>
            <p>Введите его на экране подтверждения email.</p>
            <p>Код действует до <strong>{expiresAtUtc:yyyy-MM-dd HH:mm} UTC</strong>.</p>
            <p>Если вы не создавали аккаунт, просто проигнорируйте это письмо.</p>
          </body>
        </html>
        """;

    private static string BuildPasswordResetEmailPlainTextBody(string code, DateTime expiresAtUtc) =>
        $"""
        Код для сброса пароля Tramplin: {code}

        Введите его на экране восстановления пароля.
        Код действует до {expiresAtUtc:yyyy-MM-dd HH:mm} UTC.

        Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо.
        """;

    private static string BuildPasswordResetEmailHtmlBody(string code, DateTime expiresAtUtc) =>
        $"""
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.5; color: #1f2937;">
            <h2 style="margin-bottom: 16px;">Сброс пароля</h2>
            <p>Ваш код для сброса пароля Tramplin:</p>
            <p style="font-size: 32px; letter-spacing: 8px; font-weight: 700; margin: 20px 0;">{code}</p>
            <p>Введите его на экране восстановления пароля.</p>
            <p>Код действует до <strong>{expiresAtUtc:yyyy-MM-dd HH:mm} UTC</strong>.</p>
            <p>Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо.</p>
          </body>
        </html>
        """;
}

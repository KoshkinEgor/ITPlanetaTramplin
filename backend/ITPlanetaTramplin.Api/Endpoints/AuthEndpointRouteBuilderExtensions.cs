using Application.DBContext;
using DTO;
using ITPlanetaTramplin.Api.Auth;
using ITPlanetaTramplin.Api.Domain;
using ITPlanetaTramplin.Api.Integrations;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Models;

namespace ITPlanetaTramplin.Api.Endpoints;

internal static class AuthEndpointRouteBuilderExtensions
{
    public static RouteGroupBuilder MapAuthEndpoints(this RouteGroupBuilder api)
    {
        api.MapPost("/auth/login", HandleLoginAsync);
        api.MapPost("/login/applicant", (
            [FromBody] ApplicantLoginDTO request,
            HttpContext context,
            ApplicationDBContext db,
            AuthRuntimeOptions authRuntimeOptions,
            EmailVerificationService verificationService,
            PendingRegistrationStore pendingRegistrationStore,
            SmtpEmailSender emailSender,
            CancellationToken cancellationToken,
            ILoggerFactory loggerFactory) => HandleLoginAsync(
                new AuthLoginRequestDTO { Role = PublicRoles.Candidate, Login = request.Login, Password = request.Password },
                context,
                db,
                authRuntimeOptions,
                verificationService,
                pendingRegistrationStore,
                emailSender,
                cancellationToken,
                loggerFactory));
        api.MapPost("/login/employer", (
            [FromBody] EmployerLoginDTO request,
            HttpContext context,
            ApplicationDBContext db,
            AuthRuntimeOptions authRuntimeOptions,
            EmailVerificationService verificationService,
            PendingRegistrationStore pendingRegistrationStore,
            SmtpEmailSender emailSender,
            CancellationToken cancellationToken,
            ILoggerFactory loggerFactory) => HandleLoginAsync(
                new AuthLoginRequestDTO { Role = PublicRoles.Company, Login = request.Login, Password = request.Password },
                context,
                db,
                authRuntimeOptions,
                verificationService,
                pendingRegistrationStore,
                emailSender,
                cancellationToken,
                loggerFactory));
        api.MapPost("/login/curator", (
            [FromBody] CuratorLoginDTO request,
            HttpContext context,
            ApplicationDBContext db,
            AuthRuntimeOptions authRuntimeOptions,
            EmailVerificationService verificationService,
            PendingRegistrationStore pendingRegistrationStore,
            SmtpEmailSender emailSender,
            CancellationToken cancellationToken,
            ILoggerFactory loggerFactory) => HandleLoginAsync(
                new AuthLoginRequestDTO { Role = PublicRoles.Moderator, Login = request.Login, Password = request.Password },
                context,
                db,
                authRuntimeOptions,
                verificationService,
                pendingRegistrationStore,
                emailSender,
                cancellationToken,
                loggerFactory));

        api.MapPost("/auth/logout", HandleLogout);
        api.MapGet("/auth/me", HandleCurrentUserAsync).RequireAuthorization();

        api.MapPost("/auth/confirm-email", HandleConfirmEmailAsync);
        api.MapPost("/auth/email-confirmation/verify", HandleConfirmEmailAsync);
        api.MapPost("/auth/resend-confirmation", HandleResendConfirmationAsync);
        api.MapPost("/auth/email-confirmation/resend", HandleResendConfirmationAsync);
        api.MapPost("/auth/forgot-password", HandleForgotPasswordAsync);
        api.MapPost("/auth/reset-password", HandleResetPasswordAsync);
        api.MapGet("/auth/moderator-invitations/{token}", HandleGetModeratorInvitationAsync);
        api.MapPost("/auth/moderator-invitations/{token}/accept", HandleAcceptModeratorInvitationAsync);

        api.MapGet("/auth/register/company/lookup-inn/{inn}", HandleLookupInnAsync);
        api.MapGet("/registration/employer/lookup-inn/{inn}", HandleLookupInnAsync);
        api.MapPost("/auth/register/candidate", HandleRegisterCandidateAsync);
        api.MapPost("/registration/applicant", HandleRegisterCandidateAsync);
        api.MapPost("/auth/register/company", HandleRegisterCompanyAsync);
        api.MapPost("/registration/employer", HandleRegisterCompanyAsync);
        api.MapPost("/registration/curator", HandleRegisterModeratorAlias);

        return api;
    }

    private static IResult HandleLogout(HttpContext context, AuthRuntimeOptions authRuntimeOptions)
    {
        context.Response.Cookies.Delete(
            authRuntimeOptions.CookieName,
            AuthSupport.BuildAuthCookieDeletionOptions(context.Request.IsHttps));
        return Results.Ok(new MessageResponseDTO { Message = "Вы вышли из аккаунта." });
    }

    private static async Task<IResult> HandleLoginAsync(
        [FromBody] AuthLoginRequestDTO request,
        HttpContext context,
        ApplicationDBContext db,
        AuthRuntimeOptions authRuntimeOptions,
        EmailVerificationService verificationService,
        PendingRegistrationStore pendingRegistrationStore,
        SmtpEmailSender emailSender,
        CancellationToken cancellationToken,
        ILoggerFactory loggerFactory)
    {
        var role = PublicRoles.Normalize(request.Role);
        if (role is null || string.IsNullOrWhiteSpace(request.Login) || string.IsNullOrEmpty(request.Password))
        {
            return AuthEndpointSupport.InvalidCredentialsResult();
        }

        var user = await FindUserForLoginAsync(db, role, request.Login);
        if (user is null)
        {
            var pendingRegistration = FindPendingRegistrationForLogin(pendingRegistrationStore, role, request.Login);
            if (pendingRegistration is null
                || !AuthSupport.VerifyPasswordAndUpgrade(
                    pendingRegistration.Email,
                    pendingRegistration.PasswordHash,
                    request.Password,
                    out var pendingPasswordUpgraded,
                    out var upgradedPendingPasswordHash))
            {
                return AuthEndpointSupport.InvalidCredentialsResult();
            }

            if (pendingPasswordUpgraded)
            {
                pendingRegistration.PasswordHash = upgradedPendingPasswordHash;
            }

            var pendingPayload = await BuildLoginVerificationPayloadAsync(
                pendingRegistration,
                pendingRegistrationStore,
                emailSender,
                cancellationToken,
                loggerFactory.CreateLogger("AuthEndpoints"));

            return Results.Json(pendingPayload, statusCode: StatusCodes.Status403Forbidden);
        }

        if (!AuthSupport.VerifyPasswordAndUpgrade(user, request.Password, out var passwordUpgraded))
        {
            return AuthEndpointSupport.InvalidCredentialsResult();
        }

        if (passwordUpgraded)
        {
            await db.SaveChangesAsync(cancellationToken);
        }

        if ((role is PublicRoles.Candidate or PublicRoles.Company) && user.PreVerify != true)
        {
            var payload = await BuildLoginVerificationPayloadAsync(
                user,
                role,
                verificationService,
                emailSender,
                cancellationToken,
                loggerFactory.CreateLogger("AuthEndpoints"));

            await db.SaveChangesAsync(cancellationToken);
            return Results.Json(payload, statusCode: StatusCodes.Status403Forbidden);
        }

        return AuthEndpointSupport.SignInUser(context, user, role, authRuntimeOptions);
    }

    private static async Task<IResult> HandleCurrentUserAsync(HttpContext context, ApplicationDBContext db)
    {
        var userId = AuthEndpointSupport.GetCurrentUserId(context);
        var role = PublicRoles.Normalize(context.User.FindFirst("http://schemas.microsoft.com/ws/2008/06/identity/claims/role")?.Value);

        if (userId is null || role is null)
        {
            return Results.Unauthorized();
        }

        var user = await db.Users
            .Include(item => item.ApplicantProfile)
            .Include(item => item.EmployerProfile)
            .Include(item => item.CuratorProfile)
            .FirstOrDefaultAsync(item => item.Id == userId.Value && item.DeletedAt == null);

        return user is null
            ? Results.Unauthorized()
            : Results.Ok(AuthEndpointSupport.BuildAuthUser(user, role));
    }

    private static async Task<IResult> HandleConfirmEmailAsync(
        [FromBody] EmailVerificationConfirmDTO request,
        HttpContext context,
        EmailVerificationService verificationService,
        PendingRegistrationStore pendingRegistrationStore,
        ApplicationDBContext db,
        AuthRuntimeOptions authRuntimeOptions,
        CancellationToken cancellationToken)
    {
        var role = PublicRoles.Normalize(request.Role);
        if (role is not (PublicRoles.Candidate or PublicRoles.Company) || !AuthSupport.IsValidEmail(request.Email))
        {
            return AuthEndpointSupport.MessageResult("Не удалось определить аккаунт для подтверждения.", StatusCodes.Status400BadRequest);
        }

        var user = await FindUserByEmailAndRoleAsync(db, request.Email, role);
        if (user is not null)
        {
            var verificationResult = verificationService.Verify(user, request.Code);
            if (!verificationResult.Succeeded)
            {
                await db.SaveChangesAsync(cancellationToken);
                return AuthEndpointSupport.MessageResult(
                    AuthEndpointSupport.GetEmailVerificationFailureMessage(verificationResult.FailureReason),
                    StatusCodes.Status400BadRequest);
            }

            await db.SaveChangesAsync(cancellationToken);
            return AuthEndpointSupport.SignInUser(context, user, role, authRuntimeOptions);
        }

        var pendingRegistration = pendingRegistrationStore.FindByEmailAndRole(request.Email, role);
        if (pendingRegistration is null)
        {
            return AuthEndpointSupport.MessageResult("Аккаунт не найден.", StatusCodes.Status404NotFound);
        }

        var pendingVerificationResult = pendingRegistrationStore.Verify(pendingRegistration, request.Code);
        if (!pendingVerificationResult.Succeeded)
        {
            return AuthEndpointSupport.MessageResult(
                AuthEndpointSupport.GetEmailVerificationFailureMessage(pendingVerificationResult.FailureReason),
                StatusCodes.Status400BadRequest);
        }

        if (await db.Users.AnyAsync(item => item.DeletedAt == null && item.Email.ToLower() == pendingRegistration.Email, cancellationToken))
        {
            pendingRegistrationStore.Remove(pendingRegistration);
            return AuthEndpointSupport.MessageResult("Пользователь с таким email уже существует.", StatusCodes.Status409Conflict);
        }

        if (role == PublicRoles.Company
            && !string.IsNullOrWhiteSpace(pendingRegistration.CompanyInn)
            && await db.EmployerProfiles.Include(item => item.User)
                .AnyAsync(item => item.Inn == pendingRegistration.CompanyInn && item.User.DeletedAt == null, cancellationToken))
        {
            pendingRegistrationStore.Remove(pendingRegistration);
            return AuthEndpointSupport.MessageResult("Компания с таким ИНН уже зарегистрирована.", StatusCodes.Status409Conflict);
        }

        var confirmedUser = BuildConfirmedUserFromPendingRegistration(pendingRegistration);
        db.Users.Add(confirmedUser);
        await db.SaveChangesAsync(cancellationToken);
        pendingRegistrationStore.Remove(pendingRegistration);
        return AuthEndpointSupport.SignInUser(context, confirmedUser, role, authRuntimeOptions);
    }

    private static async Task<IResult> HandleResendConfirmationAsync(
        [FromBody] EmailVerificationResendDTO request,
        EmailVerificationService verificationService,
        PendingRegistrationStore pendingRegistrationStore,
        SmtpEmailSender emailSender,
        ApplicationDBContext db,
        CancellationToken cancellationToken,
        ILoggerFactory loggerFactory)
    {
        var role = PublicRoles.Normalize(request.Role);
        if (role is not (PublicRoles.Candidate or PublicRoles.Company) || !AuthSupport.IsValidEmail(request.Email))
        {
            return AuthEndpointSupport.MessageResult("Не удалось определить аккаунт для повторной отправки.", StatusCodes.Status400BadRequest);
        }

        var user = await FindUserByEmailAndRoleAsync(db, request.Email, role);
        if (user is not null)
        {
            if (user.IsVerified == true)
            {
                return AuthEndpointSupport.MessageResult("Email уже подтвержден.", StatusCodes.Status409Conflict);
            }

            if (!verificationService.CanResend(user, out var retryAfter))
            {
                return AuthEndpointSupport.MessageResult(
                    $"Повторная отправка будет доступна через {Math.Ceiling(retryAfter.TotalSeconds)} сек.",
                    StatusCodes.Status429TooManyRequests);
            }

            var userPayload = await AuthEndpointSupport.IssueAndSendVerificationAsync(
                user,
                role,
                verificationService,
                emailSender,
                cancellationToken,
                "Новый код подтверждения отправлен.",
                "Новый код создан, но письмо отправить не удалось. Попробуйте повторить отправку позже.",
                loggerFactory.CreateLogger("AuthEndpoints"));

            await db.SaveChangesAsync(cancellationToken);
            return Results.Ok(userPayload);
        }

        var pendingRegistration = pendingRegistrationStore.FindByEmailAndRole(request.Email, role);
        if (pendingRegistration is null)
        {
            return AuthEndpointSupport.MessageResult("Аккаунт не найден.", StatusCodes.Status404NotFound);
        }

        if (!pendingRegistrationStore.CanResend(pendingRegistration, out var pendingRetryAfter))
        {
            return AuthEndpointSupport.MessageResult(
                $"Повторная отправка будет доступна через {Math.Ceiling(pendingRetryAfter.TotalSeconds)} сек.",
                StatusCodes.Status429TooManyRequests);
        }

        var pendingPayload = await AuthEndpointSupport.IssueAndSendVerificationAsync(
            pendingRegistration,
            pendingRegistrationStore,
            emailSender,
            cancellationToken,
            "Новый код подтверждения отправлен.",
            "Новый код создан, но письмо отправить не удалось. Попробуйте повторить отправку позже.",
            loggerFactory.CreateLogger("AuthEndpoints"));

        return Results.Ok(pendingPayload);
    }

    private static async Task<IResult> HandleForgotPasswordAsync(
        [FromBody] ForgotPasswordRequestDTO request,
        PasswordResetService passwordResetService,
        SmtpEmailSender emailSender,
        ApplicationDBContext db,
        CancellationToken cancellationToken,
        ILoggerFactory loggerFactory)
    {
        if (!AuthSupport.IsValidEmail(request.Email))
        {
            return AuthEndpointSupport.MessageResult("Введите корректный email.", StatusCodes.Status400BadRequest);
        }

        var user = await db.Users
            .Include(item => item.ApplicantProfile)
            .Include(item => item.EmployerProfile)
            .Include(item => item.CuratorProfile)
            .FirstOrDefaultAsync(item => item.DeletedAt == null && item.Email.ToLower() == AuthSupport.NormalizeEmail(request.Email));

        if (user is null)
        {
            return Results.Ok(new MessageResponseDTO
            {
                Message = "Если аккаунт с таким email существует, мы отправили код для сброса пароля.",
            });
        }

        if (!passwordResetService.CanResend(user, out var retryAfter))
        {
            return AuthEndpointSupport.MessageResult(
                $"Повторная отправка будет доступна через {Math.Ceiling(retryAfter.TotalSeconds)} сек.",
                StatusCodes.Status429TooManyRequests);
        }

        var payload = await AuthEndpointSupport.IssueAndSendPasswordResetAsync(
            user,
            passwordResetService,
            emailSender,
            cancellationToken,
            loggerFactory.CreateLogger("AuthEndpoints"));

        await db.SaveChangesAsync();
        return Results.Ok(payload);
    }

    private static async Task<IResult> HandleResetPasswordAsync(
        [FromBody] ResetPasswordRequestDTO request,
        PasswordResetService passwordResetService,
        ApplicationDBContext db)
    {
        if (!AuthSupport.IsValidEmail(request.Email))
        {
            return AuthEndpointSupport.MessageResult("Введите корректный email.", StatusCodes.Status400BadRequest);
        }

        if (!AuthSupport.TryValidatePassword(request.Password, out var passwordError))
        {
            return AuthEndpointSupport.MessageResult(passwordError, StatusCodes.Status400BadRequest);
        }

        var user = await db.Users
            .FirstOrDefaultAsync(item => item.DeletedAt == null && item.Email.ToLower() == AuthSupport.NormalizeEmail(request.Email));

        if (user is null)
        {
            return AuthEndpointSupport.MessageResult("Аккаунт не найден.", StatusCodes.Status404NotFound);
        }

        var resetResult = passwordResetService.ResetPassword(user, request.Code, request.Password);
        if (!resetResult.Succeeded)
        {
            await db.SaveChangesAsync();
            return AuthEndpointSupport.MessageResult(
                AuthEndpointSupport.GetPasswordResetFailureMessage(resetResult.FailureReason),
                StatusCodes.Status400BadRequest);
        }

        await db.SaveChangesAsync();
        return Results.Ok(new MessageResponseDTO { Message = "Пароль обновлен. Теперь можно войти с новым паролем." });
    }

    private static async Task<IResult> HandleGetModeratorInvitationAsync(
        string token,
        ModeratorInvitationService invitationService,
        ApplicationDBContext db)
    {
        var invitation = await FindModeratorInvitationByTokenAsync(db, invitationService, token);
        if (invitation is null)
        {
            return Results.NotFound(new MessageResponseDTO { Message = "Приглашение не найдено." });
        }

        var isExpired = invitation.ExpiresAt <= DateTime.UtcNow;
        var isAccepted = invitation.AcceptedAt != null;
        var isRevoked = invitation.RevokedAt != null;

        var payload = new ModeratorInvitationDetailsDTO
        {
            Email = invitation.Email,
            DisplayName = string.Join(" ", new[] { invitation.Name, invitation.Surname, invitation.Thirdname }
                .Where(value => !string.IsNullOrWhiteSpace(value))
                .Select(value => value!.Trim())),
            InvitedByDisplayName = AuthEndpointSupport.BuildDisplayName(invitation.InvitedByUser, PublicRoles.Moderator) ?? "Модератор платформы",
            ExpiresAtUtc = invitation.ExpiresAt,
            IsExpired = isExpired,
            IsAccepted = isAccepted,
            IsRevoked = isRevoked,
            Message = isAccepted
                ? "Это приглашение уже принято."
                : isRevoked
                    ? "Это приглашение было отозвано."
                    : isExpired
                        ? "Срок действия приглашения истек."
                        : "Приглашение активно. Задайте пароль, чтобы войти в кабинет модератора.",
        };

        return Results.Ok(payload);
    }

    private static async Task<IResult> HandleAcceptModeratorInvitationAsync(
        string token,
        [FromBody] ModeratorInvitationAcceptDTO request,
        HttpContext context,
        ModeratorInvitationService invitationService,
        ApplicationDBContext db,
        AuthRuntimeOptions authRuntimeOptions,
        CancellationToken cancellationToken)
    {
        if (!AuthSupport.TryValidatePassword(request.Password, out var passwordError))
        {
            return AuthEndpointSupport.MessageResult(passwordError, StatusCodes.Status400BadRequest);
        }

        var invitation = await FindModeratorInvitationByTokenAsync(db, invitationService, token);
        if (invitation is null)
        {
            return Results.NotFound(new MessageResponseDTO { Message = "Приглашение не найдено." });
        }

        if (invitation.RevokedAt != null)
        {
            return AuthEndpointSupport.MessageResult("Это приглашение было отозвано.", StatusCodes.Status409Conflict);
        }

        if (invitation.AcceptedAt != null)
        {
            return AuthEndpointSupport.MessageResult("Это приглашение уже принято.", StatusCodes.Status409Conflict);
        }

        if (invitation.ExpiresAt <= DateTime.UtcNow)
        {
            return AuthEndpointSupport.MessageResult("Срок действия приглашения истек.", StatusCodes.Status410Gone);
        }

        var normalizedEmail = AuthSupport.NormalizeEmail(invitation.Email);
        if (await db.Users.AnyAsync(item => item.DeletedAt == null && item.Email.ToLower() == normalizedEmail, cancellationToken))
        {
            return AuthEndpointSupport.MessageResult("Пользователь с таким email уже существует.", StatusCodes.Status409Conflict);
        }

        var user = new User
        {
            Email = normalizedEmail,
            IsVerified = true,
            PreVerify = true,
            CuratorProfile = new CuratorProfile
            {
                IsAdministrator = false,
                Name = invitation.Name,
                Surname = invitation.Surname,
                Thirdname = invitation.Thirdname,
            },
        };

        user.PasswordHash = AuthSupport.HashPassword(user, request.Password);

        db.Users.Add(user);
        await db.SaveChangesAsync(cancellationToken);

        invitation.AcceptedAt = DateTime.UtcNow;
        invitation.AcceptedUserId = user.Id;
        await db.SaveChangesAsync(cancellationToken);

        return AuthEndpointSupport.SignInUser(context, user, PublicRoles.Moderator, authRuntimeOptions);
    }

    private static async Task<IResult> HandleLookupInnAsync(
        string inn,
        DadataService dadataService,
        CancellationToken cancellationToken,
        ILoggerFactory loggerFactory)
    {
        var normalizedInn = AuthSupport.NormalizeInn(inn);
        if (!AuthSupport.IsValidInn(normalizedInn) || string.IsNullOrWhiteSpace(normalizedInn))
        {
            return AuthEndpointSupport.MessageResult("ИНН должен содержать 10 или 12 цифр.", StatusCodes.Status400BadRequest);
        }

        try
        {
            var company = await dadataService.FindPartyByInnAsync(normalizedInn, cancellationToken);
            return company is null
                ? AuthEndpointSupport.MessageResult("Организация с таким ИНН не найдена.", StatusCodes.Status404NotFound)
                : Results.Ok(company);
        }
        catch (InvalidOperationException ex)
        {
            return AuthEndpointSupport.MessageResult(ex.Message, StatusCodes.Status503ServiceUnavailable);
        }
        catch (HttpRequestException ex)
        {
            loggerFactory.CreateLogger("AuthEndpoints").LogWarning(ex, "DaData lookup failed for INN {Inn}.", normalizedInn);
            return AuthEndpointSupport.MessageResult("Сервис проверки ИНН временно недоступен.", StatusCodes.Status503ServiceUnavailable);
        }
    }

    private static async Task<IResult> HandleRegisterCandidateAsync(
        [FromBody] ApplicantRegistrationDTO request,
        PendingRegistrationStore pendingRegistrationStore,
        SmtpEmailSender emailSender,
        ApplicationDBContext db,
        CancellationToken cancellationToken,
        ILoggerFactory loggerFactory)
    {
        if (!AuthSupport.IsValidEmail(request.Email))
        {
            return AuthEndpointSupport.MessageResult("Введите корректный email.", StatusCodes.Status400BadRequest);
        }

        if (!AuthSupport.TryValidatePassword(request.Password, out var passwordError))
        {
            return AuthEndpointSupport.MessageResult(passwordError, StatusCodes.Status400BadRequest);
        }

        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return AuthEndpointSupport.MessageResult("Имя обязательно.", StatusCodes.Status400BadRequest);
        }

        var normalizedEmail = AuthSupport.NormalizeEmail(request.Email);
        if (await db.Users.AnyAsync(item => item.DeletedAt == null && item.Email.ToLower() == normalizedEmail))
        {
            return AuthEndpointSupport.MessageResult("Пользователь с таким email уже существует.", StatusCodes.Status409Conflict);
        }

        var pendingRegistrationResult = pendingRegistrationStore.UpsertCandidate(
            normalizedEmail,
            AuthSupport.HashPassword(normalizedEmail, request.Password),
            request.Name,
            request.Surname ?? string.Empty,
            request.Thirdname);

        if (!pendingRegistrationResult.Succeeded)
        {
            return AuthEndpointSupport.MessageResult("Пользователь с таким email уже существует.", StatusCodes.Status409Conflict);
        }

        var payload = await AuthEndpointSupport.IssueAndSendVerificationAsync(
            pendingRegistrationResult.Registration!,
            pendingRegistrationStore,
            emailSender,
            cancellationToken,
            "Аккаунт будет создан после подтверждения email. Мы отправили код на почту.",
            "Код создан, но письмо отправить не удалось. Запросите код повторно.",
            loggerFactory.CreateLogger("AuthEndpoints"));

        return Results.Created("/api/auth/confirm-email", payload);
    }

    private static async Task<IResult> HandleRegisterCompanyAsync(
        [FromBody] EmployerRegistrationDTO request,
        HttpContext context,
        AuthRuntimeOptions authRuntimeOptions,
        PendingRegistrationStore pendingRegistrationStore,
        SmtpEmailSender emailSender,
        DadataService dadataService,
        ApplicationDBContext db,
        CancellationToken cancellationToken,
        ILoggerFactory loggerFactory)
    {
        if (!AuthSupport.TryValidatePassword(request.Password, out var passwordError))
        {
            return AuthEndpointSupport.MessageResult(passwordError, StatusCodes.Status400BadRequest);
        }

        if (string.IsNullOrWhiteSpace(request.CompanyName))
        {
            return AuthEndpointSupport.MessageResult("Название компании обязательно.", StatusCodes.Status400BadRequest);
        }

        var normalizedInn = AuthSupport.NormalizeInn(request.Inn);
        if (string.IsNullOrWhiteSpace(normalizedInn))
        {
            return AuthEndpointSupport.MessageResult("ИНН компании обязателен.", StatusCodes.Status400BadRequest);
        }

        if (!AuthSupport.IsValidInn(normalizedInn))
        {
            return AuthEndpointSupport.MessageResult("ИНН должен содержать 10 или 12 цифр.", StatusCodes.Status400BadRequest);
        }

        var hasExplicitEmail = !string.IsNullOrWhiteSpace(request.Email);
        if (hasExplicitEmail && !AuthSupport.IsValidEmail(request.Email))
        {
            return AuthEndpointSupport.MessageResult("Введите корректный email.", StatusCodes.Status400BadRequest);
        }

        var normalizedEmail = hasExplicitEmail
            ? AuthSupport.NormalizeEmail(request.Email!)
            : AuthSupport.BuildCompanySystemEmail(normalizedInn);
        EmployerInnLookupDTO? innLookup = null;

        try
        {
            innLookup = await dadataService.FindPartyByInnAsync(normalizedInn, cancellationToken);
        }
        catch (InvalidOperationException ex)
        {
            return AuthEndpointSupport.MessageResult(ex.Message, StatusCodes.Status503ServiceUnavailable);
        }
        catch (HttpRequestException ex)
        {
            loggerFactory.CreateLogger("AuthEndpoints")
                .LogWarning(ex, "DaData lookup failed during company registration for INN {Inn}.", normalizedInn);
            return AuthEndpointSupport.MessageResult("Сервис проверки ИНН временно недоступен.", StatusCodes.Status503ServiceUnavailable);
        }

        if (innLookup is null)
        {
            return AuthEndpointSupport.MessageResult("Организация с таким ИНН не найдена в DaData.", StatusCodes.Status400BadRequest);
        }

        if (!innLookup.IsActive)
        {
            return AuthEndpointSupport.MessageResult(
                "Компания по указанному ИНН найдена, но не находится в активном статусе.",
                StatusCodes.Status400BadRequest);
        }

        if (hasExplicitEmail && !TryMatchCompanyEmail(normalizedEmail, innLookup, out var emailValidationError))
        {
            return AuthEndpointSupport.MessageResult(emailValidationError, StatusCodes.Status400BadRequest);
        }

        if (await db.Users.AnyAsync(item => item.DeletedAt == null && item.Email.ToLower() == normalizedEmail, cancellationToken))
        {
            return AuthEndpointSupport.MessageResult("Пользователь с таким email уже существует.", StatusCodes.Status409Conflict);
        }

        if (!string.IsNullOrEmpty(normalizedInn) &&
            await db.EmployerProfiles.Include(item => item.User)
                .AnyAsync(item => item.Inn == normalizedInn && item.User.DeletedAt == null, cancellationToken))
        {
            return AuthEndpointSupport.MessageResult("Компания с таким ИНН уже зарегистрирована.", StatusCodes.Status409Conflict);
        }

        var verificationData = AuthEndpointSupport.BuildEmployerVerificationData(request.VerificationData, innLookup);
        var verificationMethod = innLookup is null ? (string.IsNullOrWhiteSpace(request.VerificationData) ? null : "manual") : "dadata";
        var legalAddress = !string.IsNullOrWhiteSpace(innLookup?.LegalAddress)
            ? innLookup.LegalAddress
            : string.IsNullOrWhiteSpace(request.LegalAddress)
                ? null
                : request.LegalAddress.Trim();

        if (!hasExplicitEmail)
        {
            var user = new User
            {
                Email = normalizedEmail,
                IsVerified = true,
                PreVerify = true,
                EmployerProfile = new EmployerProfile
                {
                    CompanyName = request.CompanyName.Trim(),
                    Inn = string.IsNullOrEmpty(normalizedInn) ? null : normalizedInn,
                    VerificationData = verificationData,
                    VerificationMethod = verificationMethod,
                    VerificationStatus = CompanyVerificationStatuses.Pending,
                    LegalAddress = legalAddress,
                },
            };

            user.PasswordHash = AuthSupport.HashPassword(user, request.Password);

            db.Users.Add(user);
            await db.SaveChangesAsync(cancellationToken);
            return AuthEndpointSupport.SignInUser(context, user, PublicRoles.Company, authRuntimeOptions);
        }

        var pendingRegistrationResult = pendingRegistrationStore.UpsertCompany(
            normalizedEmail,
            AuthSupport.HashPassword(normalizedEmail, request.Password),
            request.CompanyName,
            normalizedInn,
            verificationData,
            verificationMethod,
            legalAddress);

        if (!pendingRegistrationResult.Succeeded)
        {
            var message = pendingRegistrationResult.ConflictReason == PendingRegistrationConflictReason.InnTaken
                ? "Компания с таким ИНН уже зарегистрирована."
                : "Пользователь с таким email уже существует.";
            return AuthEndpointSupport.MessageResult(message, StatusCodes.Status409Conflict);
        }

        var payload = await AuthEndpointSupport.IssueAndSendVerificationAsync(
            pendingRegistrationResult.Registration!,
            pendingRegistrationStore,
            emailSender,
            cancellationToken,
            "Аккаунт компании будет создан после подтверждения email. Мы отправили код на почту.",
            "Код создан, но письмо отправить не удалось. Запросите код повторно.",
            loggerFactory.CreateLogger("AuthEndpoints"));

        return Results.Created("/api/auth/confirm-email", payload);
    }

    private static IResult HandleRegisterModeratorAlias() =>
        AuthEndpointSupport.MessageResult("Самостоятельная регистрация модератора недоступна.", StatusCodes.Status403Forbidden);

    private static async Task<User?> FindUserForLoginAsync(ApplicationDBContext db, string role, string login)
    {
        switch (role)
        {
            case PublicRoles.Candidate:
            {
                if (!AuthSupport.IsValidEmail(login))
                {
                    return null;
                }

                var normalizedEmail = AuthSupport.NormalizeEmail(login);
                return await db.Users
                    .Include(item => item.ApplicantProfile)
                    .FirstOrDefaultAsync(item =>
                        item.DeletedAt == null &&
                        item.ApplicantProfile != null &&
                        item.Email.ToLower() == normalizedEmail);
            }
            case PublicRoles.Company:
            {
                var normalizedInn = AuthSupport.NormalizeInn(login);
                if (!AuthSupport.IsValidInn(normalizedInn))
                {
                    return null;
                }

                return await db.Users
                    .Include(item => item.EmployerProfile)
                    .FirstOrDefaultAsync(item =>
                        item.DeletedAt == null &&
                        item.EmployerProfile != null &&
                        item.EmployerProfile.Inn == normalizedInn);
            }
            case PublicRoles.Moderator:
            {
                if (!AuthSupport.IsValidEmail(login))
                {
                    return null;
                }

                var normalizedEmail = AuthSupport.NormalizeEmail(login);
                return await db.Users
                    .Include(item => item.CuratorProfile)
                    .FirstOrDefaultAsync(item =>
                        item.DeletedAt == null &&
                        item.CuratorProfile != null &&
                        item.Email.ToLower() == normalizedEmail);
            }
            default:
                return null;
        }
    }

    private static async Task<User?> FindUserByEmailAndRoleAsync(ApplicationDBContext db, string email, string role)
    {
        var normalizedEmail = AuthSupport.NormalizeEmail(email);
        var query = db.Users.Where(item => item.DeletedAt == null && item.Email.ToLower() == normalizedEmail);

        return role switch
        {
            PublicRoles.Candidate => await query.Include(item => item.ApplicantProfile)
                .FirstOrDefaultAsync(item => item.ApplicantProfile != null),
            PublicRoles.Company => await query.Include(item => item.EmployerProfile)
                .FirstOrDefaultAsync(item => item.EmployerProfile != null),
            PublicRoles.Moderator => await query.Include(item => item.CuratorProfile)
                .FirstOrDefaultAsync(item => item.CuratorProfile != null),
            _ => null,
        };
    }

    private static PendingRegistration? FindPendingRegistrationForLogin(PendingRegistrationStore pendingRegistrationStore, string role, string login) =>
        role switch
        {
            PublicRoles.Candidate when AuthSupport.IsValidEmail(login)
                => pendingRegistrationStore.FindByEmailAndRole(login, role),
            PublicRoles.Company when !string.IsNullOrWhiteSpace(AuthSupport.NormalizeInn(login))
                => pendingRegistrationStore.FindCompanyByInn(login),
            _ => null,
        };

    private static User BuildConfirmedUserFromPendingRegistration(PendingRegistration registration) =>
        registration.Role switch
        {
            PublicRoles.Candidate => new User
            {
                Email = registration.Email,
                PasswordHash = registration.PasswordHash,
                IsVerified = true,
                PreVerify = true,
                ApplicantProfile = new ApplicantProfile
                {
                    ModerationStatus = CandidateModerationStatuses.Pending,
                    Name = registration.CandidateName ?? string.Empty,
                    Surname = registration.CandidateSurname ?? string.Empty,
                    Thirdname = registration.CandidateThirdname,
                },
            },
            PublicRoles.Company => new User
            {
                Email = registration.Email,
                PasswordHash = registration.PasswordHash,
                IsVerified = true,
                PreVerify = true,
                EmployerProfile = new EmployerProfile
                {
                    CompanyName = registration.CompanyName ?? string.Empty,
                    Inn = registration.CompanyInn,
                    VerificationData = registration.CompanyVerificationData,
                    VerificationMethod = registration.CompanyVerificationMethod,
                    VerificationStatus = CompanyVerificationStatuses.Pending,
                    LegalAddress = registration.CompanyLegalAddress,
                },
            },
            _ => throw new InvalidOperationException($"Unsupported pending registration role '{registration.Role}'."),
        };

    private static Task<ModeratorInvitation?> FindModeratorInvitationByTokenAsync(
        ApplicationDBContext db,
        ModeratorInvitationService invitationService,
        string token) =>
        db.ModeratorInvitations
            .Include(item => item.InvitedByUser)
                .ThenInclude(item => item.CuratorProfile)
            .FirstOrDefaultAsync(item => item.TokenHash == invitationService.ComputeHash(token));

    private static async Task<PendingEmailVerificationDTO> BuildLoginVerificationPayloadAsync(
        User user,
        string role,
        EmailVerificationService verificationService,
        SmtpEmailSender emailSender,
        CancellationToken cancellationToken,
        ILogger logger)
    {
        var hasActiveCode = !string.IsNullOrWhiteSpace(user.EmailVerificationCodeHash)
            && user.EmailVerificationExpiresAt is DateTime expiresAtUtc
            && expiresAtUtc > DateTime.UtcNow;

        if (hasActiveCode && !verificationService.CanResend(user, out var retryAfter))
        {
            var payload = AuthEndpointSupport.BuildPendingEmailVerificationPayload(
                user,
                role,
                $"Подтвердите email, чтобы войти в аккаунт. Код уже отправлен, повторная отправка будет доступна через {Math.Ceiling(retryAfter.TotalSeconds)} сек.");

            payload.ExpiresAtUtc = user.EmailVerificationExpiresAt;
            return payload;
        }

        return await AuthEndpointSupport.IssueAndSendVerificationAsync(
            user,
            role,
            verificationService,
            emailSender,
            cancellationToken,
            "Подтвердите email, чтобы войти в аккаунт. Мы отправили код подтверждения на почту.",
            "Подтвердите email, чтобы войти в аккаунт. Код создан, но письмо отправить не удалось. Запросите отправку ещё раз.",
            logger);
    }

    private static async Task<PendingEmailVerificationDTO> BuildLoginVerificationPayloadAsync(
        PendingRegistration registration,
        PendingRegistrationStore pendingRegistrationStore,
        SmtpEmailSender emailSender,
        CancellationToken cancellationToken,
        ILogger logger)
    {
        var hasActiveCode = !string.IsNullOrWhiteSpace(registration.EmailVerificationCodeHash)
            && registration.EmailVerificationExpiresAt is DateTime expiresAtUtc
            && expiresAtUtc > DateTime.UtcNow;

        if (hasActiveCode && !pendingRegistrationStore.CanResend(registration, out var retryAfter))
        {
            var payload = AuthEndpointSupport.BuildPendingEmailVerificationPayload(
                registration,
                $"Подтвердите email, чтобы завершить регистрацию. Код уже отправлен, повторная отправка будет доступна через {Math.Ceiling(retryAfter.TotalSeconds)} сек.");

            payload.ExpiresAtUtc = registration.EmailVerificationExpiresAt;
            return payload;
        }

        return await AuthEndpointSupport.IssueAndSendVerificationAsync(
            registration,
            pendingRegistrationStore,
            emailSender,
            cancellationToken,
            "Подтвердите email, чтобы завершить регистрацию. Мы отправили код подтверждения на почту.",
            "Подтвердите email, чтобы завершить регистрацию. Код создан, но письмо отправить не удалось. Запросите отправку еще раз.",
            logger);
    }

    private static bool TryMatchCompanyEmail(string email, EmployerInnLookupDTO innLookup, out string errorMessage)
    {
        var knownEmails = innLookup.Emails
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .Select(AuthSupport.NormalizeEmail)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        if (knownEmails.Length == 0)
        {
            errorMessage = "Не удалось сверить email с ИНН: в DaData для этой компании нет корпоративной почты.";
            return false;
        }

        var normalizedEmail = AuthSupport.NormalizeEmail(email);
        if (knownEmails.Contains(normalizedEmail, StringComparer.OrdinalIgnoreCase))
        {
            errorMessage = string.Empty;
            return true;
        }

        var requestedDomain = GetEmailDomain(normalizedEmail);
        var knownDomains = knownEmails
            .Select(GetEmailDomain)
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        if (!string.IsNullOrWhiteSpace(requestedDomain) &&
            knownDomains.Contains(requestedDomain, StringComparer.OrdinalIgnoreCase))
        {
            errorMessage = string.Empty;
            return true;
        }

        if (knownDomains.Length > 0)
        {
            errorMessage =
                $"Почта не совпадает с данными DaData для ИНН {innLookup.Inn}. Используйте корпоративный email на одном из доменов: {string.Join(", ", knownDomains)}.";
            return false;
        }

        errorMessage = "Почта не совпадает с данными DaData для указанного ИНН.";
        return false;
    }

    private static string? GetEmailDomain(string? email)
    {
        if (string.IsNullOrWhiteSpace(email))
        {
            return null;
        }

        var parts = email.Split('@', 2, StringSplitOptions.TrimEntries);
        return parts.Length == 2 && !string.IsNullOrWhiteSpace(parts[1])
            ? parts[1].ToLowerInvariant()
            : null;
    }
}

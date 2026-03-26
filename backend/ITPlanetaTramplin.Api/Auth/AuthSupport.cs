using System.ComponentModel.DataAnnotations;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using Models;

namespace ITPlanetaTramplin.Api.Auth;

internal sealed record AuthTokenResult(string Token, DateTime ExpiresAtUtc);

internal static class AuthSupport
{
    private static readonly EmailAddressAttribute EmailValidator = new();
    private static readonly PasswordHasher<User> PasswordHasher = new();

    public static string NormalizeEmail(string email) =>
        email.Trim().ToLowerInvariant();

    public static string NormalizeInn(string? inn) =>
        new string((inn ?? string.Empty).Where(char.IsDigit).ToArray());

    public static bool IsValidEmail(string? email) =>
        !string.IsNullOrWhiteSpace(email) && EmailValidator.IsValid(email.Trim());

    public static string BuildCompanySystemEmail(string inn) =>
        $"company-{NormalizeInn(inn)}@company.tramplin.local";

    public static bool IsValidInn(string? inn)
    {
        var normalizedInn = NormalizeInn(inn);
        return string.IsNullOrEmpty(normalizedInn) || normalizedInn.Length is 10 or 12;
    }

    public static bool TryValidatePassword(string? password, out string errorMessage)
    {
        if (string.IsNullOrEmpty(password))
        {
            errorMessage = "Пароль обязателен.";
            return false;
        }

        if (password.Length < 8)
        {
            errorMessage = "Пароль должен содержать минимум 8 символов.";
            return false;
        }

        if (!password.Any(char.IsUpper))
        {
            errorMessage = "Пароль должен содержать хотя бы одну заглавную букву.";
            return false;
        }

        if (!password.Any(char.IsLower))
        {
            errorMessage = "Пароль должен содержать хотя бы одну строчную букву.";
            return false;
        }

        if (!password.Any(char.IsDigit))
        {
            errorMessage = "Пароль должен содержать хотя бы одну цифру.";
            return false;
        }

        errorMessage = string.Empty;
        return true;
    }

    public static string HashPassword(User user, string password) =>
        PasswordHasher.HashPassword(user, password);

    public static bool VerifyPasswordAndUpgrade(User user, string password, out bool passwordUpgraded)
    {
        passwordUpgraded = false;

        if (string.IsNullOrEmpty(user.PasswordHash) || string.IsNullOrEmpty(password))
        {
            return false;
        }

        try
        {
            var verificationResult = PasswordHasher.VerifyHashedPassword(user, user.PasswordHash, password);

            if (verificationResult == PasswordVerificationResult.Success)
            {
                return true;
            }

            if (verificationResult == PasswordVerificationResult.SuccessRehashNeeded)
            {
                user.PasswordHash = PasswordHasher.HashPassword(user, password);
                passwordUpgraded = true;
                return true;
            }
        }
        catch
        {
            // Legacy plain-text passwords are upgraded below after a successful match.
        }

        if (!string.Equals(user.PasswordHash, password, StringComparison.Ordinal))
        {
            return false;
        }

        user.PasswordHash = PasswordHasher.HashPassword(user, password);
        passwordUpgraded = true;
        return true;
    }

    public static AuthTokenResult CreateToken(User user, string role, byte[] keyBytes, TimeSpan lifetime)
    {
        var expiresAtUtc = DateTime.UtcNow.Add(lifetime);
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, role),
        };

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = expiresAtUtc,
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(keyBytes), SecurityAlgorithms.HmacSha256),
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);
        return new AuthTokenResult(tokenHandler.WriteToken(token), expiresAtUtc);
    }

    public static CookieOptions BuildAuthCookieOptions(bool isHttps, DateTime expiresAtUtc) =>
        new()
        {
            HttpOnly = true,
            Secure = isHttps,
            SameSite = isHttps ? SameSiteMode.None : SameSiteMode.Lax,
            Path = "/",
            Expires = expiresAtUtc,
            MaxAge = expiresAtUtc - DateTime.UtcNow,
        };

    public static CookieOptions BuildAuthCookieDeletionOptions(bool isHttps) =>
        new()
        {
            HttpOnly = true,
            Secure = isHttps,
            SameSite = isHttps ? SameSiteMode.None : SameSiteMode.Lax,
            Path = "/",
        };

    public static string? ExtractTokenFromCookie(string? cookieValue)
    {
        if (string.IsNullOrWhiteSpace(cookieValue))
        {
            return null;
        }

        const string bearerPrefix = "Bearer ";
        return cookieValue.StartsWith(bearerPrefix, StringComparison.OrdinalIgnoreCase)
            ? cookieValue[bearerPrefix.Length..].Trim()
            : cookieValue.Trim();
    }
}

using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Options;
using Models;

namespace ITPlanetaTramplin.Api.Auth;

internal enum PasswordResetFailureReason
{
    None,
    MissingCode,
    Expired,
    TooManyAttempts,
    InvalidCode,
}

internal sealed record PasswordResetIssue(string Code, DateTime ExpiresAtUtc);

internal sealed record PasswordResetAttemptResult(
    bool Succeeded,
    PasswordResetFailureReason FailureReason = PasswordResetFailureReason.None);

internal sealed class PasswordResetService
{
    private readonly PasswordResetOptions _options;
    private readonly byte[] _hashKey;

    public PasswordResetService(IOptions<PasswordResetOptions> options)
    {
        _options = options.Value;
        _hashKey = Encoding.UTF8.GetBytes(_options.HashKey ?? "password-reset-default-key");
    }

    public PasswordResetIssue IssueCode(User user)
    {
        var now = DateTime.UtcNow;
        var code = GenerateNumericCode(_options.CodeLength);

        user.PasswordResetCodeHash = ComputeHash(user.Email, code);
        user.PasswordResetExpiresAt = now.AddMinutes(_options.CodeLifetimeMinutes);
        user.PasswordResetSentAt = now;
        user.PasswordResetAttemptCount = 0;

        return new PasswordResetIssue(code, user.PasswordResetExpiresAt.Value);
    }

    public bool CanResend(User user, out TimeSpan retryAfter)
    {
        retryAfter = TimeSpan.Zero;

        if (user.PasswordResetSentAt is null)
        {
            return true;
        }

        var nextAllowedUtc = user.PasswordResetSentAt.Value.AddSeconds(_options.ResendCooldownSeconds);
        var delta = nextAllowedUtc - DateTime.UtcNow;
        if (delta <= TimeSpan.Zero)
        {
            return true;
        }

        retryAfter = delta;
        return false;
    }

    public PasswordResetAttemptResult ResetPassword(User user, string? code, string password)
    {
        if (string.IsNullOrWhiteSpace(user.PasswordResetCodeHash) || user.PasswordResetExpiresAt is null)
        {
            return new PasswordResetAttemptResult(false, PasswordResetFailureReason.MissingCode);
        }

        if (user.PasswordResetAttemptCount >= _options.MaxAttempts)
        {
            return new PasswordResetAttemptResult(false, PasswordResetFailureReason.TooManyAttempts);
        }

        if (user.PasswordResetExpiresAt <= DateTime.UtcNow)
        {
            return new PasswordResetAttemptResult(false, PasswordResetFailureReason.Expired);
        }

        var normalizedCode = NormalizeCode(code);
        if (normalizedCode.Length != _options.CodeLength)
        {
            user.PasswordResetAttemptCount += 1;
            return new PasswordResetAttemptResult(false, PasswordResetFailureReason.InvalidCode);
        }

        var expectedHash = ComputeHash(user.Email, normalizedCode);
        var actualBytes = Encoding.UTF8.GetBytes(user.PasswordResetCodeHash);
        var expectedBytes = Encoding.UTF8.GetBytes(expectedHash);
        var matches = actualBytes.Length == expectedBytes.Length
            && CryptographicOperations.FixedTimeEquals(actualBytes, expectedBytes);

        if (!matches)
        {
            user.PasswordResetAttemptCount += 1;

            if (user.PasswordResetAttemptCount >= _options.MaxAttempts)
            {
                user.PasswordResetExpiresAt = DateTime.UtcNow;
                return new PasswordResetAttemptResult(false, PasswordResetFailureReason.TooManyAttempts);
            }

            return new PasswordResetAttemptResult(false, PasswordResetFailureReason.InvalidCode);
        }

        user.PasswordHash = AuthSupport.HashPassword(user, password);
        user.PasswordResetCodeHash = null;
        user.PasswordResetExpiresAt = null;
        user.PasswordResetSentAt = null;
        user.PasswordResetAttemptCount = 0;

        return new PasswordResetAttemptResult(true);
    }

    private string ComputeHash(string email, string code)
    {
        using var hmac = new HMACSHA256(_hashKey);
        var payload = Encoding.UTF8.GetBytes($"{email.Trim().ToLowerInvariant()}:{code}");
        return Convert.ToHexString(hmac.ComputeHash(payload));
    }

    private static string NormalizeCode(string? code) =>
        new string((code ?? string.Empty).Where(char.IsDigit).ToArray());

    private static string GenerateNumericCode(int length)
    {
        var digits = new char[length];

        for (var index = 0; index < length; index += 1)
        {
            digits[index] = (char)('0' + RandomNumberGenerator.GetInt32(0, 10));
        }

        return new string(digits);
    }
}

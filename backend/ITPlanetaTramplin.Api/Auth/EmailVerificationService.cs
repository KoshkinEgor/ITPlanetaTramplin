using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Options;
using Models;

namespace ITPlanetaTramplin.Api.Auth;

internal enum EmailVerificationFailureReason
{
    None,
    MissingCode,
    Expired,
    TooManyAttempts,
    InvalidCode,
    AlreadyVerified,
}

internal sealed record EmailVerificationIssue(string Code, DateTime ExpiresAtUtc);

internal sealed record EmailVerificationAttemptResult(
    bool Succeeded,
    EmailVerificationFailureReason FailureReason = EmailVerificationFailureReason.None);

internal sealed class EmailVerificationService
{
    private readonly EmailVerificationOptions _options;
    private readonly byte[] _hashKey;

    public EmailVerificationService(IOptions<EmailVerificationOptions> options)
    {
        _options = options.Value;
        _hashKey = Encoding.UTF8.GetBytes(_options.HashKey ?? "email-verification-default-key");
    }

    public EmailVerificationIssue IssueCode(User user)
    {
        var now = DateTime.UtcNow;
        var code = GenerateNumericCode(_options.CodeLength);

        user.IsVerified = false;
        user.EmailVerificationCodeHash = ComputeHash(user.Email, code);
        user.EmailVerificationExpiresAt = now.AddMinutes(_options.CodeLifetimeMinutes);
        user.EmailVerificationSentAt = now;
        user.EmailVerificationAttemptCount = 0;

        return new EmailVerificationIssue(code, user.EmailVerificationExpiresAt.Value);
    }

    public bool CanResend(User user, out TimeSpan retryAfter)
    {
        retryAfter = TimeSpan.Zero;

        if (user.EmailVerificationSentAt is null)
        {
            return true;
        }

        var nextAllowedUtc = user.EmailVerificationSentAt.Value.AddSeconds(_options.ResendCooldownSeconds);
        var delta = nextAllowedUtc - DateTime.UtcNow;
        if (delta <= TimeSpan.Zero)
        {
            return true;
        }

        retryAfter = delta;
        return false;
    }

    public EmailVerificationAttemptResult Verify(User user, string? code)
    {
        if (user.IsVerified == true)
        {
            return new EmailVerificationAttemptResult(false, EmailVerificationFailureReason.AlreadyVerified);
        }

        if (string.IsNullOrWhiteSpace(user.EmailVerificationCodeHash) || user.EmailVerificationExpiresAt is null)
        {
            return new EmailVerificationAttemptResult(false, EmailVerificationFailureReason.MissingCode);
        }

        if (user.EmailVerificationAttemptCount >= _options.MaxAttempts)
        {
            return new EmailVerificationAttemptResult(false, EmailVerificationFailureReason.TooManyAttempts);
        }

        if (user.EmailVerificationExpiresAt <= DateTime.UtcNow)
        {
            return new EmailVerificationAttemptResult(false, EmailVerificationFailureReason.Expired);
        }

        var normalizedCode = NormalizeCode(code);
        if (normalizedCode.Length != _options.CodeLength)
        {
            user.EmailVerificationAttemptCount += 1;
            return new EmailVerificationAttemptResult(false, EmailVerificationFailureReason.InvalidCode);
        }

        var expectedHash = ComputeHash(user.Email, normalizedCode);
        var actualBytes = Encoding.UTF8.GetBytes(user.EmailVerificationCodeHash);
        var expectedBytes = Encoding.UTF8.GetBytes(expectedHash);
        var matches = actualBytes.Length == expectedBytes.Length
            && CryptographicOperations.FixedTimeEquals(actualBytes, expectedBytes);

        if (!matches)
        {
            user.EmailVerificationAttemptCount += 1;

            if (user.EmailVerificationAttemptCount >= _options.MaxAttempts)
            {
                user.EmailVerificationExpiresAt = DateTime.UtcNow;
                return new EmailVerificationAttemptResult(false, EmailVerificationFailureReason.TooManyAttempts);
            }

            return new EmailVerificationAttemptResult(false, EmailVerificationFailureReason.InvalidCode);
        }

        user.IsVerified = true;
        user.PreVerify = true;
        user.EmailVerificationCodeHash = null;
        user.EmailVerificationExpiresAt = null;
        user.EmailVerificationSentAt = null;
        user.EmailVerificationAttemptCount = 0;

        return new EmailVerificationAttemptResult(true);
    }

    public int CodeLength => _options.CodeLength;

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

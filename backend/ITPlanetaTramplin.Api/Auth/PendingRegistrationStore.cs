using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Options;

namespace ITPlanetaTramplin.Api.Auth;

internal enum PendingRegistrationConflictReason
{
    None,
    EmailTaken,
    InnTaken,
}

internal enum PendingRegistrationFailureReason
{
    None,
    MissingCode,
    Expired,
    TooManyAttempts,
    InvalidCode,
}

internal sealed record PendingRegistrationIssue(string Code, DateTime ExpiresAtUtc);

internal sealed record PendingRegistrationAttemptResult(
    bool Succeeded,
    PendingRegistrationFailureReason FailureReason = PendingRegistrationFailureReason.None);

internal sealed record PendingRegistrationUpsertResult(
    bool Succeeded,
    PendingRegistration? Registration = null,
    PendingRegistrationConflictReason ConflictReason = PendingRegistrationConflictReason.None);

internal sealed class PendingRegistration
{
    public string Role { get; init; } = string.Empty;

    public string Email { get; init; } = string.Empty;

    public string PasswordHash { get; set; } = string.Empty;

    public string VerificationFlow { get; init; } = string.Empty;

    public DateTime CreatedAtUtc { get; init; }

    public DateTime UpdatedAtUtc { get; set; }

    public string? CandidateName { get; init; }

    public string? CandidateSurname { get; init; }

    public string? CandidateThirdname { get; init; }

    public string? CompanyName { get; init; }

    public string? CompanyInn { get; init; }

    public string? CompanyVerificationData { get; init; }

    public string? CompanyVerificationMethod { get; init; }

    public string? CompanyLegalAddress { get; init; }

    public string? EmailVerificationCodeHash { get; set; }

    public DateTime? EmailVerificationExpiresAt { get; set; }

    public DateTime? EmailVerificationSentAt { get; set; }

    public int EmailVerificationAttemptCount { get; set; }
}

internal sealed class PendingRegistrationStore
{
    private static readonly TimeSpan EntryLifetime = TimeSpan.FromHours(24);

    private readonly EmailVerificationOptions _options;
    private readonly byte[] _hashKey;
    private readonly Dictionary<string, PendingRegistration> _items = new(StringComparer.OrdinalIgnoreCase);
    private readonly object _sync = new();

    public PendingRegistrationStore(IOptions<EmailVerificationOptions> options)
    {
        _options = options.Value;
        _hashKey = Encoding.UTF8.GetBytes(_options.HashKey ?? "email-verification-default-key");
    }

    public PendingRegistrationUpsertResult UpsertCandidate(
        string email,
        string passwordHash,
        string name,
        string surname,
        string? thirdname)
    {
        var normalizedEmail = AuthSupport.NormalizeEmail(email);
        var key = BuildKey(PublicRoles.Candidate, normalizedEmail);

        lock (_sync)
        {
            CleanupExpiredEntriesLocked();

            var emailTaken = _items.Values.Any(item =>
                !string.Equals(BuildKey(item.Role, item.Email), key, StringComparison.OrdinalIgnoreCase)
                && string.Equals(item.Email, normalizedEmail, StringComparison.OrdinalIgnoreCase));

            if (emailTaken)
            {
                return new PendingRegistrationUpsertResult(false, ConflictReason: PendingRegistrationConflictReason.EmailTaken);
            }

            var now = DateTime.UtcNow;
            var registration = new PendingRegistration
            {
                Role = PublicRoles.Candidate,
                Email = normalizedEmail,
                PasswordHash = passwordHash,
                VerificationFlow = "register-candidate",
                CreatedAtUtc = now,
                UpdatedAtUtc = now,
                CandidateName = name.Trim(),
                CandidateSurname = surname.Trim(),
                CandidateThirdname = string.IsNullOrWhiteSpace(thirdname) ? null : thirdname.Trim(),
            };

            _items[key] = registration;
            return new PendingRegistrationUpsertResult(true, registration);
        }
    }

    public PendingRegistrationUpsertResult UpsertCompany(
        string email,
        string passwordHash,
        string companyName,
        string inn,
        string? verificationData,
        string? verificationMethod,
        string? legalAddress)
    {
        var normalizedEmail = AuthSupport.NormalizeEmail(email);
        var normalizedInn = AuthSupport.NormalizeInn(inn);
        var key = BuildKey(PublicRoles.Company, normalizedEmail);

        lock (_sync)
        {
            CleanupExpiredEntriesLocked();

            var emailTaken = _items.Values.Any(item =>
                !string.Equals(BuildKey(item.Role, item.Email), key, StringComparison.OrdinalIgnoreCase)
                && string.Equals(item.Email, normalizedEmail, StringComparison.OrdinalIgnoreCase));

            if (emailTaken)
            {
                return new PendingRegistrationUpsertResult(false, ConflictReason: PendingRegistrationConflictReason.EmailTaken);
            }

            var innTaken = _items.Values.Any(item =>
                item.Role == PublicRoles.Company
                && !string.Equals(BuildKey(item.Role, item.Email), key, StringComparison.OrdinalIgnoreCase)
                && string.Equals(item.CompanyInn, normalizedInn, StringComparison.Ordinal));

            if (innTaken)
            {
                return new PendingRegistrationUpsertResult(false, ConflictReason: PendingRegistrationConflictReason.InnTaken);
            }

            var now = DateTime.UtcNow;
            var registration = new PendingRegistration
            {
                Role = PublicRoles.Company,
                Email = normalizedEmail,
                PasswordHash = passwordHash,
                VerificationFlow = string.IsNullOrWhiteSpace(verificationData) ? "employer-start" : "employer-verify",
                CreatedAtUtc = now,
                UpdatedAtUtc = now,
                CompanyName = companyName.Trim(),
                CompanyInn = normalizedInn,
                CompanyVerificationData = verificationData,
                CompanyVerificationMethod = verificationMethod,
                CompanyLegalAddress = string.IsNullOrWhiteSpace(legalAddress) ? null : legalAddress.Trim(),
            };

            _items[key] = registration;
            return new PendingRegistrationUpsertResult(true, registration);
        }
    }

    public PendingRegistration? FindByEmailAndRole(string email, string role)
    {
        var normalizedEmail = AuthSupport.NormalizeEmail(email);
        var key = BuildKey(role, normalizedEmail);

        lock (_sync)
        {
            CleanupExpiredEntriesLocked();
            return _items.TryGetValue(key, out var registration) ? registration : null;
        }
    }

    public PendingRegistration? FindCompanyByInn(string inn)
    {
        var normalizedInn = AuthSupport.NormalizeInn(inn);

        lock (_sync)
        {
            CleanupExpiredEntriesLocked();
            return _items.Values.FirstOrDefault(item =>
                item.Role == PublicRoles.Company
                && string.Equals(item.CompanyInn, normalizedInn, StringComparison.Ordinal));
        }
    }

    public bool CanResend(PendingRegistration registration, out TimeSpan retryAfter)
    {
        retryAfter = TimeSpan.Zero;

        lock (_sync)
        {
            if (registration.EmailVerificationSentAt is null)
            {
                return true;
            }

            var nextAllowedUtc = registration.EmailVerificationSentAt.Value.AddSeconds(_options.ResendCooldownSeconds);
            var delta = nextAllowedUtc - DateTime.UtcNow;
            if (delta <= TimeSpan.Zero)
            {
                return true;
            }

            retryAfter = delta;
            return false;
        }
    }

    public PendingRegistrationIssue IssueCode(PendingRegistration registration)
    {
        lock (_sync)
        {
            var now = DateTime.UtcNow;
            var code = GenerateNumericCode(_options.CodeLength);

            registration.EmailVerificationCodeHash = ComputeHash(registration.Email, code);
            registration.EmailVerificationExpiresAt = now.AddMinutes(_options.CodeLifetimeMinutes);
            registration.EmailVerificationSentAt = now;
            registration.EmailVerificationAttemptCount = 0;
            registration.UpdatedAtUtc = now;

            return new PendingRegistrationIssue(code, registration.EmailVerificationExpiresAt.Value);
        }
    }

    public PendingRegistrationAttemptResult Verify(PendingRegistration registration, string? code)
    {
        lock (_sync)
        {
            registration.UpdatedAtUtc = DateTime.UtcNow;

            if (string.IsNullOrWhiteSpace(registration.EmailVerificationCodeHash)
                || registration.EmailVerificationExpiresAt is null)
            {
                return new PendingRegistrationAttemptResult(false, PendingRegistrationFailureReason.MissingCode);
            }

            if (registration.EmailVerificationAttemptCount >= _options.MaxAttempts)
            {
                return new PendingRegistrationAttemptResult(false, PendingRegistrationFailureReason.TooManyAttempts);
            }

            if (registration.EmailVerificationExpiresAt <= DateTime.UtcNow)
            {
                return new PendingRegistrationAttemptResult(false, PendingRegistrationFailureReason.Expired);
            }

            var normalizedCode = NormalizeCode(code);
            if (normalizedCode.Length != _options.CodeLength)
            {
                registration.EmailVerificationAttemptCount += 1;
                return new PendingRegistrationAttemptResult(false, PendingRegistrationFailureReason.InvalidCode);
            }

            var expectedHash = ComputeHash(registration.Email, normalizedCode);
            var actualBytes = Encoding.UTF8.GetBytes(registration.EmailVerificationCodeHash);
            var expectedBytes = Encoding.UTF8.GetBytes(expectedHash);
            var matches = actualBytes.Length == expectedBytes.Length
                && CryptographicOperations.FixedTimeEquals(actualBytes, expectedBytes);

            if (!matches)
            {
                registration.EmailVerificationAttemptCount += 1;

                if (registration.EmailVerificationAttemptCount >= _options.MaxAttempts)
                {
                    registration.EmailVerificationExpiresAt = DateTime.UtcNow;
                    return new PendingRegistrationAttemptResult(false, PendingRegistrationFailureReason.TooManyAttempts);
                }

                return new PendingRegistrationAttemptResult(false, PendingRegistrationFailureReason.InvalidCode);
            }

            return new PendingRegistrationAttemptResult(true);
        }
    }

    public void Remove(PendingRegistration registration)
    {
        lock (_sync)
        {
            _items.Remove(BuildKey(registration.Role, registration.Email));
        }
    }

    private void CleanupExpiredEntriesLocked()
    {
        var now = DateTime.UtcNow;
        var expiredKeys = _items
            .Where(item => item.Value.UpdatedAtUtc <= now - EntryLifetime)
            .Select(item => item.Key)
            .ToArray();

        foreach (var key in expiredKeys)
        {
            _items.Remove(key);
        }
    }

    private static string BuildKey(string role, string email) =>
        $"{PublicRoles.Normalize(role) ?? role}:{AuthSupport.NormalizeEmail(email)}";

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

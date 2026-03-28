using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Options;
using Models;

namespace ITPlanetaTramplin.Api.Auth;

internal sealed record ModeratorInvitationIssue(string Token, DateTime ExpiresAtUtc);

internal sealed class ModeratorInvitationService
{
    private readonly ModeratorInvitationOptions _options;
    private readonly byte[] _hashKey;

    public ModeratorInvitationService(IOptions<ModeratorInvitationOptions> options)
    {
        _options = options.Value;
        _hashKey = Encoding.UTF8.GetBytes(_options.HashKey ?? "moderator-invitation-default-key");
    }

    public ModeratorInvitationIssue IssueToken(ModeratorInvitation invitation)
    {
        var now = DateTime.UtcNow;
        var token = GenerateToken(_options.TokenLengthBytes);

        invitation.TokenHash = ComputeHash(token);
        invitation.ExpiresAt = now.AddHours(_options.LifetimeHours);

        return new ModeratorInvitationIssue(token, invitation.ExpiresAt);
    }

    public string ComputeHash(string? token)
    {
        using var hmac = new HMACSHA256(_hashKey);
        var payload = Encoding.UTF8.GetBytes((token ?? string.Empty).Trim());
        return Convert.ToHexString(hmac.ComputeHash(payload));
    }

    public string ResolveFrontendBaseUrl(HttpContext context)
    {
        var origin = context.Request.Headers.Origin.FirstOrDefault();
        if (Uri.TryCreate(origin, UriKind.Absolute, out var originUri))
        {
            return originUri.GetLeftPart(UriPartial.Authority).TrimEnd('/');
        }

        var referer = context.Request.Headers.Referer.FirstOrDefault();
        if (Uri.TryCreate(referer, UriKind.Absolute, out var refererUri))
        {
            return refererUri.GetLeftPart(UriPartial.Authority).TrimEnd('/');
        }

        return (_options.FrontendBaseUrl ?? "http://127.0.0.1:3000").TrimEnd('/');
    }

    private static string GenerateToken(int lengthBytes)
    {
        var bytes = RandomNumberGenerator.GetBytes(Math.Max(lengthBytes, 16));
        return Convert.ToBase64String(bytes)
            .TrimEnd('=')
            .Replace('+', '-')
            .Replace('/', '_');
    }
}

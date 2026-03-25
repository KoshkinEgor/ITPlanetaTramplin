namespace ITPlanetaTramplin.Api.Auth;

internal static class PublicRoles
{
    public const string Candidate = "candidate";
    public const string Company = "company";
    public const string Moderator = "moderator";

    public static string? Normalize(string? role) =>
        role?.Trim().ToLowerInvariant() switch
        {
            "candidate" or "applicant" => Candidate,
            "company" or "employer" => Company,
            "moderator" or "curator" => Moderator,
            _ => null,
        };
}

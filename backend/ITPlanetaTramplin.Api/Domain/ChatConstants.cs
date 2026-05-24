namespace ITPlanetaTramplin.Api.Domain;

internal static class ChatContextTypes
{
    public const string Direct = "direct";
    public const string Application = "application";
    public const string Opportunity = "opportunity";
    public const string CompanyModeration = "company_moderation";
    public const string Complaint = "complaint";

    public static string Normalize(string? value) =>
        value?.Trim().ToLowerInvariant() switch
        {
            Application => Application,
            Opportunity => Opportunity,
            CompanyModeration => CompanyModeration,
            Complaint => Complaint,
            _ => Direct,
        };
}

internal static class ChatPrivacyScopes
{
    public const string Everyone = "everyone";
    public const string Contacts = "contacts";
    public const string Friends = "friends";
    public const string Nobody = "nobody";

    public static string NormalizeCandidateIncoming(string? value) =>
        value?.Trim().ToLowerInvariant() switch
        {
            Contacts => Contacts,
            Friends => Friends,
            Nobody => Nobody,
            _ => Everyone,
        };
}

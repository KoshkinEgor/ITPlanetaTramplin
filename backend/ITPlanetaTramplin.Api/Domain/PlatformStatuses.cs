namespace ITPlanetaTramplin.Api.Domain;

internal static class CompanyVerificationStatuses
{
    public const string Pending = "pending";
    public const string Approved = "approved";
    public const string Revision = "revision";
    public const string Rejected = "rejected";

    public static string Normalize(string? value) =>
        value?.Trim().ToLowerInvariant() switch
        {
            Pending => Pending,
            Approved => Approved,
            Revision => Revision,
            Rejected => Rejected,
            _ => Pending,
        };

    public static bool IsKnown(string? value) =>
        value?.Trim().ToLowerInvariant() is Pending or Approved or Revision or Rejected;
}

internal static class OpportunityModerationStatuses
{
    public const string Pending = "pending";
    public const string Approved = "approved";
    public const string Revision = "revision";
    public const string Rejected = "rejected";

    public static string Normalize(string? value) =>
        value?.Trim().ToLowerInvariant() switch
        {
            Pending => Pending,
            Approved => Approved,
            Revision => Revision,
            Rejected => Rejected,
            _ => Pending,
        };

    public static bool IsKnown(string? value) =>
        value?.Trim().ToLowerInvariant() is Pending or Approved or Revision or Rejected;
}

internal static class CandidateModerationStatuses
{
    public const string Pending = "pending";
    public const string Approved = "approved";
    public const string Revision = "revision";
    public const string Rejected = "rejected";

    public static string Normalize(string? value) =>
        value?.Trim().ToLowerInvariant() switch
        {
            Pending => Pending,
            Approved => Approved,
            Revision => Revision,
            Rejected => Rejected,
            _ => Pending,
        };

    public static bool IsKnown(string? value) =>
        value?.Trim().ToLowerInvariant() is Pending or Approved or Revision or Rejected;
}

internal static class OpportunityTypes
{
    public const string Vacancy = "vacancy";
    public const string Internship = "internship";
    public const string Event = "event";
    public const string Mentoring = "mentoring";

    public static string? Normalize(string? value) =>
        value?.Trim().ToLowerInvariant() switch
        {
            Vacancy => Vacancy,
            Internship => Internship,
            Event => Event,
            Mentoring => Mentoring,
            _ => null,
        };

    public static bool IsKnown(string? value) => Normalize(value) is not null;
}

internal static class OpportunityApplicationStatuses
{
    public const string Submitted = "submitted";
    public const string Reviewing = "reviewing";
    public const string Invited = "invited";
    public const string Accepted = "accepted";
    public const string Rejected = "rejected";
    public const string Withdrawn = "withdrawn";

    public static string Normalize(string? value) =>
        value?.Trim().ToLowerInvariant() switch
        {
            Submitted => Submitted,
            Reviewing => Reviewing,
            Invited => Invited,
            Accepted => Accepted,
            Rejected => Rejected,
            Withdrawn => Withdrawn,
            _ => Submitted,
        };

    public static bool IsKnown(string? value) =>
        value?.Trim().ToLowerInvariant() is Submitted or Reviewing or Invited or Accepted or Rejected or Withdrawn;
}

internal static class FriendRequestStatuses
{
    public const string Pending = "pending";
    public const string Accepted = "accepted";
    public const string Declined = "declined";
    public const string Canceled = "canceled";

    public static string Normalize(string? value) =>
        value?.Trim().ToLowerInvariant() switch
        {
            Pending => Pending,
            Accepted => Accepted,
            Declined => Declined,
            Canceled => Canceled,
            _ => Pending,
        };

    public static bool IsKnown(string? value) =>
        value?.Trim().ToLowerInvariant() is Pending or Accepted or Declined or Canceled;
}

internal static class ProjectInviteStatuses
{
    public const string Pending = "pending";
    public const string Accepted = "accepted";
    public const string Declined = "declined";
    public const string Canceled = "canceled";

    public static string Normalize(string? value) =>
        value?.Trim().ToLowerInvariant() switch
        {
            Pending => Pending,
            Accepted => Accepted,
            Declined => Declined,
            Canceled => Canceled,
            _ => Pending,
        };

    public static bool IsKnown(string? value) =>
        value?.Trim().ToLowerInvariant() is Pending or Accepted or Declined or Canceled;
}

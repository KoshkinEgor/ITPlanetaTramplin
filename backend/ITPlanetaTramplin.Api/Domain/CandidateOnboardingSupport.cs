using System.Text.Json.Nodes;
using Models;

namespace ITPlanetaTramplin.Api.Domain;

internal static class CandidateOnboardingSupport
{
    public static bool IsMandatoryProfileComplete(ApplicantProfile profile)
    {
        ArgumentNullException.ThrowIfNull(profile);

        var links = ParseJsonObject(profile.Links);
        var onboarding = GetObjectNode(links, "onboarding");

        return HasPrimaryProfession(onboarding)
            && HasBasics(profile, onboarding)
            && profile.ApplicantEducations.Count > 0
            && profile.Skills is { Count: > 0 }
            && HasExperience(onboarding)
            && !string.IsNullOrWhiteSpace(GetString(onboarding, "goal"));
    }

    public static JsonObject ParseJsonObject(string? rawValue)
    {
        if (string.IsNullOrWhiteSpace(rawValue))
        {
            return new JsonObject();
        }

        try
        {
            return JsonNode.Parse(rawValue)?.AsObject() ?? new JsonObject();
        }
        catch
        {
            return new JsonObject();
        }
    }

    public static JsonObject? GetObjectNode(JsonObject source, string key) =>
        source[key] as JsonObject;

    private static bool HasPrimaryProfession(JsonObject? onboarding) =>
        !string.IsNullOrWhiteSpace(GetString(onboarding, "profession"));

    private static bool HasBasics(ApplicantProfile profile, JsonObject? onboarding)
    {
        if (string.IsNullOrWhiteSpace(profile.Name) || string.IsNullOrWhiteSpace(profile.Surname))
        {
            return false;
        }

        return !string.IsNullOrWhiteSpace(GetString(onboarding, "gender"))
            && !string.IsNullOrWhiteSpace(GetString(onboarding, "birthDate"))
            && !string.IsNullOrWhiteSpace(GetString(onboarding, "phone"))
            && !string.IsNullOrWhiteSpace(GetString(onboarding, "city"))
            && !string.IsNullOrWhiteSpace(GetString(onboarding, "citizenship"));
    }

    private static bool HasExperience(JsonObject? onboarding)
    {
        if (onboarding is null)
        {
            return false;
        }

        if (GetBool(onboarding, "noExperience"))
        {
            return true;
        }

        var experiences = onboarding["experiences"] as JsonArray;
        if (experiences is not null)
        {
            foreach (var item in experiences)
            {
                if (item is JsonObject experience && IsExperienceComplete(experience))
                {
                    return true;
                }
            }
        }

        var legacyExperience = onboarding["experience"] as JsonObject;
        return legacyExperience is not null && IsLegacyExperienceComplete(legacyExperience);
    }

    private static bool IsExperienceComplete(JsonObject experience)
    {
        var isCurrent = GetBool(experience, "isCurrent");
        var hasEndMonth = !string.IsNullOrWhiteSpace(GetString(experience, "endMonth"));

        return !string.IsNullOrWhiteSpace(GetString(experience, "company"))
            && !string.IsNullOrWhiteSpace(GetString(experience, "role"))
            && !string.IsNullOrWhiteSpace(GetString(experience, "summary"))
            && !string.IsNullOrWhiteSpace(GetString(experience, "startMonth"))
            && (isCurrent || hasEndMonth);
    }

    private static bool IsLegacyExperienceComplete(JsonObject experience)
    {
        if (GetBool(experience, "noExperience"))
        {
            return true;
        }

        return !string.IsNullOrWhiteSpace(GetString(experience, "company"))
            && !string.IsNullOrWhiteSpace(GetString(experience, "role"))
            && !string.IsNullOrWhiteSpace(GetString(experience, "summary"))
            && !string.IsNullOrWhiteSpace(GetString(experience, "period"));
    }

    private static string GetString(JsonObject? source, string key) =>
        source?[key]?.GetValue<string?>()?.Trim() ?? string.Empty;

    private static bool GetBool(JsonObject? source, string key) =>
        source?[key]?.GetValue<bool?>() == true;
}

namespace ITPlanetaTramplin.Api.Auth;

internal sealed class ModeratorInvitationOptions
{
    public int TokenLengthBytes { get; set; } = 32;

    public int LifetimeHours { get; set; } = 72;

    public string? HashKey { get; set; }

    public string FrontendBaseUrl { get; set; } = "http://127.0.0.1:3000";
}

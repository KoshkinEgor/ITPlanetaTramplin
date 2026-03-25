namespace ITPlanetaTramplin.Api.Auth;

public class PasswordResetOptions
{
    public int CodeLength { get; set; } = 6;

    public int CodeLifetimeMinutes { get; set; } = 15;

    public int ResendCooldownSeconds { get; set; } = 60;

    public int MaxAttempts { get; set; } = 5;

    public string? HashKey { get; set; }
}

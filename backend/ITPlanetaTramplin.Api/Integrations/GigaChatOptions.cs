namespace ITPlanetaTramplin.Api.Integrations;

public sealed class GigaChatOptions
{
    public bool Enabled { get; set; }

    public string? AuthKey { get; set; }

    public string Scope { get; set; } = "GIGACHAT_API_PERS";

    public string Model { get; set; } = "GigaChat";

    public string OAuthUrl { get; set; } = "https://ngw.devices.sberbank.ru:9443/api/v2/oauth";

    public string ChatCompletionsUrl { get; set; } = "https://gigachat.devices.sberbank.ru/api/v1/chat/completions";

    public int TimeoutSeconds { get; set; } = 30;

    public bool AllowInsecureTls { get; set; }

    public string? CaCertificatePath { get; set; }
}

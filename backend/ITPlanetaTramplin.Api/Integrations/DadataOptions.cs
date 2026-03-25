namespace ITPlanetaTramplin.Api.Integrations;

public class DadataOptions
{
    public string BaseUrl { get; set; } = "https://suggestions.dadata.ru";

    public string? ApiKey { get; set; }

    public bool IsConfigured => !string.IsNullOrWhiteSpace(ApiKey);
}

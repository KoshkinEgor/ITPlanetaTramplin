namespace ITPlanetaTramplin.Api.Integrations;

public class YandexGeocoderOptions
{
    public string BaseUrl { get; set; } = "https://geocode-maps.yandex.ru";

    public string ApiKey { get; set; } = string.Empty;

    public bool IsConfigured => !string.IsNullOrWhiteSpace(ApiKey);
}

using Application.DBContext;
using ITPlanetaTramplin.Api.Infrastructure;
using ITPlanetaTramplin.Api.Integrations;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Options;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Text.Json;

namespace ITPlanetaTramplin.Api.Tests;

internal sealed class TestApplicationFactory : WebApplicationFactory<Program>
{
    private readonly string _databaseName = $"tramplin-tests-{Guid.NewGuid():N}";
    private readonly string _verificationStorageRoot = Path.Combine(Path.GetTempPath(), "tramplin-tests", "company-verification", Guid.NewGuid().ToString("N"));

    public TestApplicationFactory()
    {
        Environment.SetEnvironmentVariable("Jwt__Key", "test-jwt-signing-key-for-integration-tests");
        Environment.SetEnvironmentVariable("Database__ApplyMigrationsOnStartup", "false");
        Environment.SetEnvironmentVariable("Smtp__Host", string.Empty);
        Environment.SetEnvironmentVariable("Smtp__FromEmail", string.Empty);
        Environment.SetEnvironmentVariable("EmailVerification__HashKey", "test-email-verification-key");
        Environment.SetEnvironmentVariable("PasswordReset__HashKey", "test-password-reset-key");
        Environment.SetEnvironmentVariable("Dadata__ApiKey", "test-dadata-api-key");
        Environment.SetEnvironmentVariable("YandexGeocoder__ApiKey", "test-yandex-api-key");
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");
        builder.ConfigureServices(services =>
        {
            services.RemoveAll(typeof(DbContextOptions<ApplicationDBContext>));
            services.RemoveAll(typeof(ApplicationDBContext));
            services.RemoveAll(typeof(IDbContextOptionsConfiguration<ApplicationDBContext>));
            services.AddDbContext<ApplicationDBContext>(options => options.UseInMemoryDatabase(_databaseName));
            services.Configure<CompanyVerificationOptions>(options =>
            {
                options.StorageRoot = _verificationStorageRoot;
                options.MaxFileSizeBytes = 10 * 1024 * 1024;
            });
            services.RemoveAll<DadataService>();
            services.AddTransient(_ =>
                new DadataService(
                    new HttpClient(new FakeDadataMessageHandler())
                    {
                        BaseAddress = new Uri("https://suggestions.dadata.ru"),
                    },
                    Options.Create(new DadataOptions
                    {
                        ApiKey = "test-dadata-api-key",
                        BaseUrl = "https://suggestions.dadata.ru",
                    })));
            services.RemoveAll<YandexGeocoderService>();
            services.AddTransient(_ =>
                new YandexGeocoderService(
                    new HttpClient(new FakeYandexGeocoderMessageHandler())
                    {
                        BaseAddress = new Uri("https://geocode-maps.yandex.ru"),
                    },
                    Options.Create(new YandexGeocoderOptions
                    {
                        ApiKey = "test-yandex-api-key",
                        BaseUrl = "https://geocode-maps.yandex.ru",
                    })));

            using var scope = services.BuildServiceProvider().CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDBContext>();
            db.Database.EnsureCreated();
        });
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);

        try
        {
            if (Directory.Exists(_verificationStorageRoot))
            {
                Directory.Delete(_verificationStorageRoot, recursive: true);
            }
        }
        catch
        {
            // Ignore cleanup failures in test teardown.
        }
    }
}

internal sealed class FakeDadataMessageHandler : HttpMessageHandler
{
    protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        var path = request.RequestUri?.AbsolutePath;

        if (path == "/suggestions/api/4_1/rs/findById/party")
        {
            return await HandleFindByInnAsync(request, cancellationToken);
        }

        if (path == "/suggestions/api/4_1/rs/suggest/address")
        {
            return await HandleAddressSuggestAsync(request, cancellationToken);
        }

        if (path == "/suggestions/api/4_1/rs/geolocate/address")
        {
            return await HandleAddressGeolocateAsync(request, cancellationToken);
        }

        return new HttpResponseMessage(HttpStatusCode.NotFound);
    }

    private static async Task<HttpResponseMessage> HandleFindByInnAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        var payload = await request.Content!.ReadAsStringAsync(cancellationToken);

        if (payload.Contains("7707083893", StringComparison.Ordinal))
        {
            return BuildResponse(
                """
                {
                  "suggestions": [
                    {
                      "value": "ООО \"Трамплин\"",
                      "data": {
                        "inn": "7707083893",
                        "kpp": "770701001",
                        "ogrn": "1027700132195",
                        "state": { "status": "ACTIVE" },
                        "name": {
                          "short_with_opf": "ООО \"Трамплин\"",
                          "full_with_opf": "Общество с ограниченной ответственностью \"Трамплин\""
                        },
                        "address": { "value": "г Москва, ул Тестовая, д 1" },
                        "emails": [
                          { "unrestricted_value": "company@tramplin.local" },
                          { "unrestricted_value": "careers@tramplin.local" }
                        ]
                      }
                    }
                  ]
                }
                """);
        }

        if (payload.Contains("5408114123", StringComparison.Ordinal))
        {
            return BuildResponse(
                """
                {
                  "suggestions": [
                    {
                      "value": "ООО \"Север\"",
                      "data": {
                        "inn": "5408114123",
                        "kpp": "540801001",
                        "ogrn": "1025400000000",
                        "state": { "status": "ACTIVE" },
                        "name": {
                          "short_with_opf": "ООО \"Север\"",
                          "full_with_opf": "Общество с ограниченной ответственностью \"Север\""
                        },
                        "address": { "value": "г Новосибирск, ул Ленина, д 10" },
                        "emails": [
                          { "unrestricted_value": "hello@sever.local" }
                        ]
                      }
                    }
                  ]
                }
                """);
        }

        return BuildResponse("{\"suggestions\":[]}");
    }

    private static async Task<HttpResponseMessage> HandleAddressSuggestAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        var payload = await request.Content!.ReadAsStringAsync(cancellationToken);
        using var document = JsonDocument.Parse(payload);
        var query = document.RootElement.TryGetProperty("query", out var queryProperty) ? queryProperty.GetString() : null;

        if (query?.Contains("Тестовая", StringComparison.OrdinalIgnoreCase) == true)
        {
            return BuildResponse(
                """
                {
                  "suggestions": [
                    {
                      "value": "ул Тестовая",
                      "data": {
                        "result": "г Москва, ул Тестовая",
                        "region_with_type": "г Москва",
                        "city_with_type": "г Москва",
                        "street_with_type": "ул Тестовая",
                        "street": "Тестовая",
                        "street_fias_id": "street-testovaya",
                        "fias_id": "street-testovaya",
                        "geo_lat": "55.755800",
                        "geo_lon": "37.617700"
                      }
                    },
                    {
                      "value": "ул Тестовая, д 1",
                      "unrestricted_value": "г Москва, ул Тестовая, д 1",
                      "data": {
                        "result": "г Москва, ул Тестовая, д 1",
                        "region_with_type": "г Москва",
                        "city_with_type": "г Москва",
                        "street_with_type": "ул Тестовая",
                        "street": "Тестовая",
                        "house": "1",
                        "street_fias_id": "street-testovaya",
                        "fias_id": "house-testovaya-1",
                        "geo_lat": "55.755810",
                        "geo_lon": "37.617710"
                      }
                    }
                  ]
                }
                """);
        }

        return BuildResponse("{\"suggestions\":[]}");
    }

    private static async Task<HttpResponseMessage> HandleAddressGeolocateAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        _ = await request.Content!.ReadAsStringAsync(cancellationToken);

        return BuildResponse(
            """
            {
              "suggestions": [
                {
                  "value": "ул Тестовая, д 1",
                  "unrestricted_value": "г Москва, ул Тестовая, д 1",
                  "data": {
                    "result": "г Москва, ул Тестовая, д 1",
                    "region_with_type": "г Москва",
                    "city_with_type": "г Москва",
                    "street_with_type": "ул Тестовая",
                    "street": "Тестовая",
                    "house": "1",
                    "street_fias_id": "street-testovaya",
                    "fias_id": "house-testovaya-1",
                    "geo_lat": "55.755810",
                    "geo_lon": "37.617710"
                  }
                },
                {
                  "value": "ул Тестовая, д 3",
                  "unrestricted_value": "г Москва, ул Тестовая, д 3",
                  "data": {
                    "result": "г Москва, ул Тестовая, д 3",
                    "region_with_type": "г Москва",
                    "city_with_type": "г Москва",
                    "street_with_type": "ул Тестовая",
                    "street": "Тестовая",
                    "house": "3",
                    "street_fias_id": "street-testovaya",
                    "fias_id": "house-testovaya-3",
                    "geo_lat": "55.755820",
                    "geo_lon": "37.617740"
                  }
                },
                {
                  "value": "ул Тестовая, д 7",
                  "unrestricted_value": "г Москва, ул Тестовая, д 7",
                  "data": {
                    "result": "г Москва, ул Тестовая, д 7",
                    "region_with_type": "г Москва",
                    "city_with_type": "г Москва",
                    "street_with_type": "ул Тестовая",
                    "street": "Тестовая",
                    "house": "7",
                    "street_fias_id": "street-testovaya",
                    "fias_id": "house-testovaya-7",
                    "geo_lat": "55.755850",
                    "geo_lon": "37.617780"
                  }
                }
              ]
            }
            """);
    }

    private static HttpResponseMessage BuildResponse(string json) =>
        new(HttpStatusCode.OK)
        {
            Content = new StringContent(json, Encoding.UTF8, "application/json"),
        };
}

internal sealed class FakeYandexGeocoderMessageHandler : HttpMessageHandler
{
    protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        var path = request.RequestUri?.AbsolutePath;
        if (!string.Equals(path, "/v1/", StringComparison.Ordinal))
        {
            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.NotFound));
        }

        var geocode = ReadQueryParameter(request.RequestUri, "geocode");
        if (string.IsNullOrWhiteSpace(geocode))
        {
            return Task.FromResult(BuildResponse("{\"response\":{\"GeoObjectCollection\":{\"featureMember\":[]}}}"));
        }

        if (geocode.Contains("Чебоксары", StringComparison.OrdinalIgnoreCase))
        {
            return Task.FromResult(BuildResponse(
                """
                {
                  "response": {
                    "GeoObjectCollection": {
                      "featureMember": [
                        {
                          "GeoObject": {
                            "name": "Чебоксары",
                            "description": "Чувашская Республика, Россия",
                            "Point": { "pos": "47.251888 56.143900" },
                            "metaDataProperty": {
                              "GeocoderMetaData": {
                                "kind": "locality",
                                "text": "Россия, Чувашская Республика, Чебоксары",
                                "Address": {
                                  "formatted": "Россия, Чувашская Республика, Чебоксары",
                                  "Components": [
                                    { "kind": "country", "name": "Россия" },
                                    { "kind": "province", "name": "Чувашская Республика" },
                                    { "kind": "locality", "name": "Чебоксары" }
                                  ]
                                }
                              }
                            }
                          }
                        }
                      ]
                    }
                  }
                }
                """));
        }

        if (geocode.Contains("Тестовая", StringComparison.OrdinalIgnoreCase))
        {
            return Task.FromResult(BuildResponse(
                """
                {
                  "response": {
                    "GeoObjectCollection": {
                      "featureMember": [
                        {
                          "GeoObject": {
                            "name": "Тестовая улица",
                            "description": "Москва, Россия",
                            "Point": { "pos": "37.617700 55.755800" },
                            "metaDataProperty": {
                              "GeocoderMetaData": {
                                "kind": "street",
                                "text": "Россия, Москва, Тестовая улица",
                                "Address": {
                                  "formatted": "Россия, Москва, Тестовая улица",
                                  "Components": [
                                    { "kind": "country", "name": "Россия" },
                                    { "kind": "locality", "name": "Москва" },
                                    { "kind": "street", "name": "Тестовая улица" }
                                  ]
                                }
                              }
                            }
                          }
                        },
                        {
                          "GeoObject": {
                            "name": "Тестовая улица, 1",
                            "description": "Москва, Россия",
                            "Point": { "pos": "37.617710 55.755810" },
                            "metaDataProperty": {
                              "GeocoderMetaData": {
                                "kind": "house",
                                "text": "Россия, Москва, Тестовая улица, 1",
                                "Address": {
                                  "formatted": "Россия, Москва, Тестовая улица, 1",
                                  "Components": [
                                    { "kind": "country", "name": "Россия" },
                                    { "kind": "locality", "name": "Москва" },
                                    { "kind": "street", "name": "Тестовая улица" },
                                    { "kind": "house", "name": "1" }
                                  ]
                                }
                              }
                            }
                          }
                        }
                      ]
                    }
                  }
                }
                """));
        }

        if (geocode.Contains("37.61771,55.75581", StringComparison.OrdinalIgnoreCase) ||
            geocode.Contains("37.617700,55.755800", StringComparison.OrdinalIgnoreCase))
        {
            return Task.FromResult(BuildResponse(
                """
                {
                  "response": {
                    "GeoObjectCollection": {
                      "featureMember": [
                        {
                          "GeoObject": {
                            "name": "Тестовая улица, 1",
                            "description": "Москва, Россия",
                            "Point": { "pos": "37.617710 55.755810" },
                            "metaDataProperty": {
                              "GeocoderMetaData": {
                                "kind": "house",
                                "text": "Россия, Москва, Тестовая улица, 1",
                                "Address": {
                                  "formatted": "Россия, Москва, Тестовая улица, 1",
                                  "Components": [
                                    { "kind": "country", "name": "Россия" },
                                    { "kind": "locality", "name": "Москва" },
                                    { "kind": "street", "name": "Тестовая улица" },
                                    { "kind": "house", "name": "1" }
                                  ]
                                }
                              }
                            }
                          }
                        },
                        {
                          "GeoObject": {
                            "name": "Тестовая улица, 3",
                            "description": "Москва, Россия",
                            "Point": { "pos": "37.617740 55.755820" },
                            "metaDataProperty": {
                              "GeocoderMetaData": {
                                "kind": "house",
                                "text": "Россия, Москва, Тестовая улица, 3",
                                "Address": {
                                  "formatted": "Россия, Москва, Тестовая улица, 3",
                                  "Components": [
                                    { "kind": "country", "name": "Россия" },
                                    { "kind": "locality", "name": "Москва" },
                                    { "kind": "street", "name": "Тестовая улица" },
                                    { "kind": "house", "name": "3" }
                                  ]
                                }
                              }
                            }
                          }
                        },
                        {
                          "GeoObject": {
                            "name": "Тестовая улица, 7",
                            "description": "Москва, Россия",
                            "Point": { "pos": "37.617780 55.755850" },
                            "metaDataProperty": {
                              "GeocoderMetaData": {
                                "kind": "house",
                                "text": "Россия, Москва, Тестовая улица, 7",
                                "Address": {
                                  "formatted": "Россия, Москва, Тестовая улица, 7",
                                  "Components": [
                                    { "kind": "country", "name": "Россия" },
                                    { "kind": "locality", "name": "Москва" },
                                    { "kind": "street", "name": "Тестовая улица" },
                                    { "kind": "house", "name": "7" }
                                  ]
                                }
                              }
                            }
                          }
                        }
                      ]
                    }
                  }
                }
                """));
        }

        return Task.FromResult(BuildResponse("{\"response\":{\"GeoObjectCollection\":{\"featureMember\":[]}}}"));
    }

    private static string? ReadQueryParameter(Uri? uri, string key)
    {
        if (uri is null || string.IsNullOrWhiteSpace(uri.Query))
        {
            return null;
        }

        foreach (var pair in uri.Query.TrimStart('?').Split('&', StringSplitOptions.RemoveEmptyEntries))
        {
            var parts = pair.Split('=', 2, StringSplitOptions.None);
            if (parts.Length == 0 || !string.Equals(parts[0], key, StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            return parts.Length > 1 ? Uri.UnescapeDataString(parts[1]) : string.Empty;
        }

        return null;
    }

    private static HttpResponseMessage BuildResponse(string json) =>
        new(HttpStatusCode.OK)
        {
            Content = new StringContent(json, Encoding.UTF8, "application/json"),
        };
}

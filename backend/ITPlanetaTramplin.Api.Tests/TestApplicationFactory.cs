using Application.DBContext;
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

namespace ITPlanetaTramplin.Api.Tests;

internal sealed class TestApplicationFactory : WebApplicationFactory<Program>
{
    private readonly string _databaseName = $"tramplin-tests-{Guid.NewGuid():N}";

    public TestApplicationFactory()
    {
        Environment.SetEnvironmentVariable("Jwt__Key", "test-jwt-signing-key-for-integration-tests");
        Environment.SetEnvironmentVariable("Database__ApplyMigrationsOnStartup", "false");
        Environment.SetEnvironmentVariable("Smtp__Host", string.Empty);
        Environment.SetEnvironmentVariable("Smtp__FromEmail", string.Empty);
        Environment.SetEnvironmentVariable("EmailVerification__HashKey", "test-email-verification-key");
        Environment.SetEnvironmentVariable("PasswordReset__HashKey", "test-password-reset-key");
        Environment.SetEnvironmentVariable("Dadata__ApiKey", "test-dadata-api-key");
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

            using var scope = services.BuildServiceProvider().CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDBContext>();
            db.Database.EnsureCreated();
        });
    }
}

internal sealed class FakeDadataMessageHandler : HttpMessageHandler
{
    protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        if (request.RequestUri?.AbsolutePath != "/suggestions/api/4_1/rs/findById/party")
        {
            return new HttpResponseMessage(HttpStatusCode.NotFound);
        }

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

    private static HttpResponseMessage BuildResponse(string json) =>
        new(HttpStatusCode.OK)
        {
            Content = new StringContent(json, Encoding.UTF8, "application/json"),
        };
}

using Application.DBContext;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

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

            using var scope = services.BuildServiceProvider().CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDBContext>();
            db.Database.EnsureCreated();
        });
    }
}

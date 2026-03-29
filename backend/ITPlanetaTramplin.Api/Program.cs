using Application.DBContext;
using ITPlanetaTramplin.Api.Auth;
using ITPlanetaTramplin.Api.Endpoints;
using ITPlanetaTramplin.Api.Infrastructure;
using ITPlanetaTramplin.Api.Integrations;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Npgsql;
using System.Security.Claims;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:3000", "http://127.0.0.1:3000")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

const string authCookieName = "Authorization";
var jwtSigningKey = builder.Configuration["Jwt:Key"];
if (string.IsNullOrWhiteSpace(jwtSigningKey))
{
    jwtSigningKey = builder.Environment.IsDevelopment()
        ? "local-dev-jwt-signing-key-change-me"
        : throw new InvalidOperationException("Jwt:Key must be configured.");
}

var jwtLifetimeMinutes = int.TryParse(builder.Configuration["Jwt:AccessTokenLifetimeMinutes"], out var configuredTokenLifetimeMinutes)
    && configuredTokenLifetimeMinutes > 0
    ? configuredTokenLifetimeMinutes
    : 60;
var accessTokenLifetime = TimeSpan.FromMinutes(jwtLifetimeMinutes);
var keyBytes = Encoding.UTF8.GetBytes(jwtSigningKey);

var connectionString = ResolveConnectionString(builder.Configuration);

builder.Services.Configure<EmailVerificationOptions>(builder.Configuration.GetSection("EmailVerification"));
builder.Services.Configure<ModeratorInvitationOptions>(builder.Configuration.GetSection("ModeratorInvitations"));
builder.Services.Configure<PasswordResetOptions>(builder.Configuration.GetSection("PasswordReset"));
builder.Services.Configure<SmtpOptions>(builder.Configuration.GetSection("Smtp"));
builder.Services.Configure<DadataOptions>(builder.Configuration.GetSection("Dadata"));
builder.Services.AddSingleton(Options.Create(BuildYandexGeocoderOptions(builder.Configuration, builder.Environment)));
builder.Services.Configure<CompanyVerificationOptions>(builder.Configuration.GetSection("CompanyVerification"));
builder.Services.AddSingleton(new AuthRuntimeOptions(authCookieName, keyBytes, accessTokenLifetime));
builder.Services.AddSingleton<EmailVerificationService>();
builder.Services.AddSingleton<PendingRegistrationStore>();
builder.Services.AddSingleton<ModeratorInvitationService>();
builder.Services.AddSingleton<PasswordResetService>();
builder.Services.AddSingleton<CompanyVerificationStorage>();
builder.Services.AddTransient<SmtpEmailSender>();
builder.Services.AddHttpClient<DadataService>();
builder.Services.AddHttpClient<YandexGeocoderService>(httpClient =>
{
    if (builder.Environment.IsDevelopment())
    {
        httpClient.DefaultRequestHeaders.Referrer = new Uri("http://localhost:3000/");
    }
});
builder.Services.AddDbContext<ApplicationDBContext>(options => options.UseNpgsql(connectionString));
builder.Services.AddHealthChecks();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = false,
        ValidateAudience = false,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(keyBytes),
        ClockSkew = TimeSpan.FromMinutes(1),
    };

    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            if (!string.IsNullOrWhiteSpace(context.Token))
            {
                return Task.CompletedTask;
            }

            if (context.Request.Cookies.TryGetValue(authCookieName, out var cookieToken))
            {
                context.Token = AuthSupport.ExtractTokenFromCookie(cookieToken);
            }

            return Task.CompletedTask;
        },
    };
});

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("requireCompanyRole", policy => policy.RequireClaim(ClaimTypes.Role, PublicRoles.Company));
    options.AddPolicy("requireModeratorRole", policy => policy.RequireClaim(ClaimTypes.Role, PublicRoles.Moderator));
    options.AddPolicy("requireCandidateRole", policy => policy.RequireClaim(ClaimTypes.Role, PublicRoles.Candidate));

    options.AddPolicy("requireEmployerRole", policy => policy.RequireClaim(ClaimTypes.Role, PublicRoles.Company));
    options.AddPolicy("requireCuratorRole", policy => policy.RequireClaim(ClaimTypes.Role, PublicRoles.Moderator));
    options.AddPolicy("requireApplicantRole", policy => policy.RequireClaim(ClaimTypes.Role, PublicRoles.Candidate));
});

var app = builder.Build();

var applyMigrationsOnStartup = app.Configuration.GetValue<bool?>("Database:ApplyMigrationsOnStartup")
    ?? app.Environment.IsDevelopment();
var seedDemoDataOnStartup = app.Configuration.GetValue<bool?>("Database:SeedDemoDataOnStartup")
    ?? app.Environment.IsDevelopment();

if (applyMigrationsOnStartup)
{
    try
    {
        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDBContext>();
        db.Database.Migrate();
    }
    catch (Exception ex)
    {
        app.Logger.LogError(ex, "Failed to apply database migrations on startup.");
        throw;
    }
}

if (seedDemoDataOnStartup)
{
    try
    {
        await DevelopmentDataSeeder.SeedAsync(app.Services);
    }
    catch (Exception ex)
    {
        app.Logger.LogError(ex, "Failed to seed development data.");
        throw;
    }
}

app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();

app.MapHealthChecks("/health");

var api = app.MapGroup("/api");
api.MapCommonEndpoints();
api.MapAuthEndpoints();
api.MapCandidateEndpoints();
api.MapCompanyEndpoints();
api.MapOpportunityEndpoints();
api.MapModerationEndpoints();

app.Run();

static string ResolveConnectionString(IConfiguration configuration)
{
    var connectionString = new[]
    {
        configuration.GetConnectionString("DefaultConnection"),
        configuration["ConnectionStrings:DefaultConnection"],
        configuration["API_CONNECTION_STRING"],
        TryConvertDatabaseUrl(configuration["DATABASE_URL"]),
        TryBuildPostgresConnectionString(configuration),
    }.FirstOrDefault(item => !string.IsNullOrWhiteSpace(item));

    return !string.IsNullOrWhiteSpace(connectionString)
        ? connectionString
        : throw new InvalidOperationException(
            "Database connection string is not configured. Set ConnectionStrings__DefaultConnection, API_CONNECTION_STRING, DATABASE_URL, or POSTGRES_HOST/POSTGRES_DB/POSTGRES_USER/POSTGRES_PASSWORD.");
}

static string? TryBuildPostgresConnectionString(IConfiguration configuration)
{
    var host = configuration["POSTGRES_HOST"];
    var database = configuration["POSTGRES_DB"];
    var username = configuration["POSTGRES_USER"];
    var password = configuration["POSTGRES_PASSWORD"];

    if (string.IsNullOrWhiteSpace(host) ||
        string.IsNullOrWhiteSpace(database) ||
        string.IsNullOrWhiteSpace(username) ||
        string.IsNullOrWhiteSpace(password))
    {
        return null;
    }

    return new NpgsqlConnectionStringBuilder
    {
        Host = host.Trim(),
        Port = int.TryParse(configuration["POSTGRES_PORT"], out var port) ? port : 5432,
        Database = database.Trim(),
        Username = username.Trim(),
        Password = password,
    }.ConnectionString;
}

static string? TryConvertDatabaseUrl(string? databaseUrl)
{
    if (string.IsNullOrWhiteSpace(databaseUrl))
    {
        return null;
    }

    if (!Uri.TryCreate(databaseUrl, UriKind.Absolute, out var uri) ||
        (uri.Scheme != "postgres" && uri.Scheme != "postgresql"))
    {
        return databaseUrl;
    }

    var builder = new NpgsqlConnectionStringBuilder
    {
        Host = uri.Host,
        Port = uri.IsDefaultPort ? 5432 : uri.Port,
        Database = uri.AbsolutePath.TrimStart('/'),
    };

    var userInfo = uri.UserInfo.Split(':', 2, StringSplitOptions.None);
    if (userInfo.Length > 0 && !string.IsNullOrWhiteSpace(userInfo[0]))
    {
        builder.Username = Uri.UnescapeDataString(userInfo[0]);
    }

    if (userInfo.Length > 1)
    {
        builder.Password = Uri.UnescapeDataString(userInfo[1]);
    }

    foreach (var (key, value) in ParseQueryString(uri.Query))
    {
        switch (key)
        {
            case "sslmode" when Enum.TryParse<SslMode>(value, true, out var sslMode):
                builder.SslMode = sslMode;
                break;
            case "pooling" when bool.TryParse(value, out var pooling):
                builder.Pooling = pooling;
                break;
            case "maximum pool size" when int.TryParse(value, out var maxPoolSize):
                builder.MaxPoolSize = maxPoolSize;
                break;
            case "minimum pool size" when int.TryParse(value, out var minPoolSize):
                builder.MinPoolSize = minPoolSize;
                break;
        }
    }

    return builder.ConnectionString;
}

static IEnumerable<(string Key, string Value)> ParseQueryString(string query)
{
    if (string.IsNullOrWhiteSpace(query))
    {
        yield break;
    }

    foreach (var pair in query.TrimStart('?').Split('&', StringSplitOptions.RemoveEmptyEntries))
    {
        var parts = pair.Split('=', 2, StringSplitOptions.None);
        var key = Uri.UnescapeDataString(parts[0]).Replace('_', ' ').Trim().ToLowerInvariant();
        var value = parts.Length > 1 ? Uri.UnescapeDataString(parts[1]).Trim() : string.Empty;
        yield return (key, value);
    }
}

static YandexGeocoderOptions BuildYandexGeocoderOptions(IConfiguration configuration, IWebHostEnvironment environment)
{
    var options = new YandexGeocoderOptions();
    configuration.GetSection("YandexGeocoder").Bind(options);

    if (string.IsNullOrWhiteSpace(options.ApiKey))
    {
        options.ApiKey = configuration["VITE_YANDEX_MAPS_API_KEY"] ?? string.Empty;
    }

    if (string.IsNullOrWhiteSpace(options.ApiKey) && environment.IsDevelopment())
    {
        options.ApiKey = TryReadDotEnvValue(environment.ContentRootPath, "VITE_YANDEX_MAPS_API_KEY") ?? string.Empty;
    }

    return options;
}

static string? TryReadDotEnvValue(string contentRootPath, string key)
{
    var directory = new DirectoryInfo(contentRootPath);

    while (directory is not null)
    {
        foreach (var fileName in new[] { ".env.local", ".env" })
        {
            var filePath = Path.Combine(directory.FullName, fileName);
            if (!File.Exists(filePath))
            {
                continue;
            }

            foreach (var rawLine in File.ReadLines(filePath))
            {
                var line = rawLine.Trim();
                if (string.IsNullOrWhiteSpace(line) || line.StartsWith('#'))
                {
                    continue;
                }

                var separatorIndex = line.IndexOf('=');
                if (separatorIndex <= 0)
                {
                    continue;
                }

                var currentKey = line[..separatorIndex].Trim();
                if (!string.Equals(currentKey, key, StringComparison.Ordinal))
                {
                    continue;
                }

                return line[(separatorIndex + 1)..].Trim().Trim('"');
            }
        }

        directory = directory.Parent;
    }

    return null;
}

public partial class Program;

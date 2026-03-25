namespace ITPlanetaTramplin.Api.Auth;

internal sealed record AuthRuntimeOptions(string CookieName, byte[] KeyBytes, TimeSpan AccessTokenLifetime);

using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;

namespace ITPlanetaTramplin.Api.Infrastructure;

internal sealed class UserMediaOptions
{
    public string? StorageRoot { get; set; }

    public long MaxFileSizeBytes { get; set; } = 5 * 1024 * 1024;
}

internal sealed record UserMediaStoredFile(
    string StorageKey,
    string OriginalName,
    string ContentType,
    long SizeBytes);

internal sealed class UserMediaStorage
{
    private static readonly IReadOnlyDictionary<string, string> AllowedExtensions = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
    {
        [".jpg"] = "image/jpeg",
        [".jpeg"] = "image/jpeg",
        [".png"] = "image/png",
        [".webp"] = "image/webp",
    };

    private readonly string _storageRoot;

    public UserMediaStorage(IOptions<UserMediaOptions> options, IWebHostEnvironment environment)
    {
        var value = options.Value;
        _storageRoot = Path.GetFullPath(
            string.IsNullOrWhiteSpace(value.StorageRoot)
                ? Path.Combine(environment.ContentRootPath, "App_Data", "user-media")
                : value.StorageRoot.Trim());

        MaxFileSizeBytes = value.MaxFileSizeBytes > 0 ? value.MaxFileSizeBytes : 5 * 1024 * 1024;
    }

    public string StorageRoot => _storageRoot;

    public long MaxFileSizeBytes { get; }

    public string? ValidateImage(IFormFile? file)
    {
        if (file is null || file.Length <= 0)
        {
            return "Загрузите изображение в формате JPG, PNG или WEBP.";
        }

        if (file.Length > MaxFileSizeBytes)
        {
            return $"Размер файла превышает лимит {Math.Round(MaxFileSizeBytes / 1024d / 1024d, 1):0.#} MB.";
        }

        var extension = NormalizeExtension(file.FileName);
        if (extension is null || !AllowedExtensions.ContainsKey(extension))
        {
            return "Поддерживаются только JPG, PNG и WEBP.";
        }

        var contentType = ResolveContentType(file.ContentType, extension);
        if (!AllowedExtensions.Values.Contains(contentType, StringComparer.OrdinalIgnoreCase))
        {
            return "Тип изображения не поддерживается.";
        }

        return null;
    }

    public async Task<UserMediaStoredFile> SaveImageAsync(
        int userId,
        IFormFile file,
        CancellationToken cancellationToken)
    {
        var validationError = ValidateImage(file);
        if (validationError is not null)
        {
            throw new InvalidOperationException(validationError);
        }

        var extension = NormalizeExtension(file.FileName)!;
        var storageKey = Path.Combine($"user-{userId}", $"{Guid.NewGuid():N}{extension}").Replace('\\', '/');
        var fullPath = ResolveStoragePath(storageKey);

        Directory.CreateDirectory(Path.GetDirectoryName(fullPath)!);

        await using (var stream = File.Create(fullPath))
        {
            await file.CopyToAsync(stream, cancellationToken);
        }

        return new UserMediaStoredFile(
            storageKey,
            Path.GetFileName(file.FileName),
            ResolveContentType(file.ContentType, extension),
            file.Length);
    }

    private string ResolveStoragePath(string storageKey)
    {
        var sanitizedKey = storageKey.Replace('/', Path.DirectorySeparatorChar).Replace('\\', Path.DirectorySeparatorChar);
        var fullPath = Path.GetFullPath(Path.Combine(_storageRoot, sanitizedKey));

        if (!IsPathInsideStorageRoot(fullPath))
        {
            throw new InvalidOperationException("Invalid media path.");
        }

        return fullPath;
    }

    private bool IsPathInsideStorageRoot(string fullPath)
    {
        var normalizedRoot = _storageRoot.TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
        var rootWithSeparator = normalizedRoot + Path.DirectorySeparatorChar;

        return string.Equals(fullPath, normalizedRoot, StringComparison.OrdinalIgnoreCase)
            || fullPath.StartsWith(rootWithSeparator, StringComparison.OrdinalIgnoreCase);
    }

    private static string? NormalizeExtension(string? fileName)
    {
        var extension = Path.GetExtension(fileName ?? string.Empty);
        return string.IsNullOrWhiteSpace(extension) ? null : extension.Trim().ToLowerInvariant();
    }

    private static string ResolveContentType(string? contentType, string extension)
    {
        if (!string.IsNullOrWhiteSpace(contentType) &&
            contentType.Contains('/', StringComparison.Ordinal) &&
            AllowedExtensions.Values.Contains(contentType.Trim(), StringComparer.OrdinalIgnoreCase))
        {
            return contentType.Trim();
        }

        return AllowedExtensions.TryGetValue(extension, out var mappedContentType)
            ? mappedContentType
            : "application/octet-stream";
    }
}

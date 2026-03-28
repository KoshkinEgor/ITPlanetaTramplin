using DTO;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;

namespace ITPlanetaTramplin.Api.Infrastructure;

internal sealed class CompanyVerificationOptions
{
    public string? StorageRoot { get; set; }

    public long MaxFileSizeBytes { get; set; } = 10 * 1024 * 1024;
}

internal sealed record CompanyVerificationStoredFile(
    string StorageKey,
    string OriginalName,
    string ContentType,
    long SizeBytes);

internal sealed class CompanyVerificationStorage
{
    private static readonly IReadOnlyDictionary<string, string> AllowedExtensions = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
    {
        [".pdf"] = "application/pdf",
        [".jpg"] = "image/jpeg",
        [".jpeg"] = "image/jpeg",
        [".png"] = "image/png",
        [".webp"] = "image/webp",
    };

    private readonly string _storageRoot;

    public CompanyVerificationStorage(IOptions<CompanyVerificationOptions> options)
    {
        var value = options.Value;
        _storageRoot = Path.GetFullPath(
            string.IsNullOrWhiteSpace(value.StorageRoot)
                ? Path.Combine(Path.GetTempPath(), "tramplin", "company-verification")
                : value.StorageRoot.Trim());

        MaxFileSizeBytes = value.MaxFileSizeBytes > 0 ? value.MaxFileSizeBytes : 10 * 1024 * 1024;
    }

    public long MaxFileSizeBytes { get; }

    public string? Validate(IFormFile? file)
    {
        if (file is null || file.Length <= 0)
        {
            return "Загрузите выписку ЕГРЮЛ в формате PDF, JPG, PNG или WEBP.";
        }

        if (file.Length > MaxFileSizeBytes)
        {
            return $"Размер файла превышает лимит {Math.Round(MaxFileSizeBytes / 1024d / 1024d, 1):0.#} MB.";
        }

        var extension = NormalizeExtension(file.FileName);
        if (extension is null || !AllowedExtensions.ContainsKey(extension))
        {
            return "Поддерживаются только PDF, JPG, PNG и WEBP.";
        }

        return null;
    }

    public async Task<CompanyVerificationStoredFile> SaveAsync(
        int companyId,
        IFormFile file,
        string? previousStorageKey,
        CancellationToken cancellationToken)
    {
        var validationError = Validate(file);
        if (validationError is not null)
        {
            throw new InvalidOperationException(validationError);
        }

        var extension = NormalizeExtension(file.FileName)!;
        var storageKey = Path.Combine($"company-{companyId}", $"{Guid.NewGuid():N}{extension}").Replace('\\', '/');
        var fullPath = ResolveStoragePath(storageKey);

        Directory.CreateDirectory(Path.GetDirectoryName(fullPath)!);

        await using (var stream = File.Create(fullPath))
        {
            await file.CopyToAsync(stream, cancellationToken);
        }

        Delete(previousStorageKey);

        return new CompanyVerificationStoredFile(
            storageKey,
            Path.GetFileName(file.FileName),
            ResolveContentType(file.ContentType, extension),
            file.Length);
    }

    public bool TryGetFilePath(string? storageKey, out string? fullPath)
    {
        fullPath = null;

        if (string.IsNullOrWhiteSpace(storageKey))
        {
            return false;
        }

        string candidatePath;
        try
        {
            candidatePath = ResolveStoragePath(storageKey);
        }
        catch (InvalidOperationException)
        {
            return false;
        }

        if (!File.Exists(candidatePath))
        {
            return false;
        }

        fullPath = candidatePath;
        return true;
    }

    public void Delete(string? storageKey)
    {
        if (!TryGetFilePath(storageKey, out var fullPath) || string.IsNullOrWhiteSpace(fullPath))
        {
            return;
        }

        File.Delete(fullPath);
    }

    private string ResolveStoragePath(string storageKey)
    {
        var sanitizedKey = storageKey.Replace('/', Path.DirectorySeparatorChar).Replace('\\', Path.DirectorySeparatorChar);
        var fullPath = Path.GetFullPath(Path.Combine(_storageRoot, sanitizedKey));

        if (!fullPath.StartsWith(_storageRoot, StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Invalid verification document path.");
        }

        return fullPath;
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

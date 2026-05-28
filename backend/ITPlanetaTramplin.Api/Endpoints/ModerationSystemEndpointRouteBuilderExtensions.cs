using System.Text.Json;
using Application.DBContext;
using DTO;
using ITPlanetaTramplin.Api.Auth;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Models;

namespace ITPlanetaTramplin.Api.Endpoints;

internal static partial class ModerationEndpointRouteBuilderExtensions
{
    private static void MapModeratorSystemEndpoints(RouteGroupBuilder api)
    {
        api.MapGet("/moderation/tags", GetModerationTagsAsync).RequireAuthorization("requireModeratorRole");
        api.MapPost("/moderation/tags", CreateModerationTagAsync).RequireAuthorization("requireModeratorRole");
        api.MapPut("/moderation/tags/{id:int}", UpdateModerationTagAsync).RequireAuthorization("requireModeratorRole");
        api.MapPost("/moderation/tags/{id:int}/enable", EnableModerationTagAsync).RequireAuthorization("requireModeratorRole");
        api.MapPost("/moderation/tags/{id:int}/disable", DisableModerationTagAsync).RequireAuthorization("requireModeratorRole");
        api.MapPost("/moderation/tags/merge", MergeModerationTagsAsync).RequireAuthorization("requireModeratorRole");

        api.MapGet("/moderation/system/references", GetModerationReferencesAsync).RequireAuthorization("requireModeratorRole");
        api.MapPost("/moderation/system/references", CreateModerationReferenceAsync).RequireAuthorization("requireModeratorRole");
        api.MapPut("/moderation/system/references/{id:int}", UpdateModerationReferenceAsync).RequireAuthorization("requireModeratorRole");

        api.MapGet("/moderation/audit-log", GetModerationAuditLogAsync).RequireAuthorization("requireModeratorRole");
        api.MapGet("/moderation/me/settings", GetModeratorSettingsAsync).RequireAuthorization("requireModeratorRole");
        api.MapPut("/moderation/me/settings", UpdateModeratorSettingsAsync).RequireAuthorization("requireModeratorRole");
    }

    private static async Task<IResult> GetModerationTagsAsync(string? query, string? status, ApplicationDBContext db)
    {
        var normalizedQuery = NormalizeTagName(query);
        var normalizedStatus = string.IsNullOrWhiteSpace(status) ? "all" : status.Trim().ToLowerInvariant();

        var tags = await db.Tags
            .Include(item => item.Opportunities)
            .Include(item => item.MergedIntoTag)
            .OrderBy(item => item.Name)
            .ToListAsync();

        var filtered = tags
            .Where(item => string.IsNullOrWhiteSpace(normalizedQuery) || item.Name.Contains(normalizedQuery, StringComparison.OrdinalIgnoreCase))
            .Where(item => normalizedStatus switch
            {
                "active" => item.IsActive != false,
                "inactive" or "disabled" => item.IsActive == false,
                "pending" => item.IsActive == false && item.MergedIntoTagId == null,
                "merged" => item.MergedIntoTagId != null,
                _ => true,
            })
            .Select(MapTag)
            .ToList();

        return Results.Ok(new
        {
            Items = filtered,
            Stats = new
            {
                Total = tags.Count,
                Active = tags.Count(item => item.IsActive != false),
                Disabled = tags.Count(item => item.IsActive == false),
                Pending = tags.Count(item => item.IsActive == false && item.MergedIntoTagId == null),
                Merged = tags.Count(item => item.MergedIntoTagId != null),
                Unused = tags.Count(item => item.Opportunities.Count == 0),
            },
        });
    }

    private static async Task<IResult> CreateModerationTagAsync(
        [FromBody] ModerationTagUpsertDTO request,
        HttpContext context,
        ApplicationDBContext db)
    {
        var actorUserId = AuthEndpointSupport.GetCurrentUserId(context);
        var name = NormalizeTagName(request.Name);
        if (string.IsNullOrWhiteSpace(name))
        {
            return AuthEndpointSupport.MessageResult("Укажите название тега.", StatusCodes.Status400BadRequest);
        }

        var existing = await db.Tags.FirstOrDefaultAsync(item => item.Name.ToLower() == name.ToLower());
        if (existing is not null)
        {
            if (existing.IsActive == false)
            {
                existing.IsActive = true;
                existing.UpdatedAt = DateTime.UtcNow;
                existing.UpdatedByUserId = actorUserId;
                AddAuditLog(db, actorUserId, "tag.enabled", "tag", existing.Id, $"Тег «{existing.Name}» включен повторно");
                await db.SaveChangesAsync();
            }

            return Results.Ok(MapTag(existing));
        }

        var tag = new Tag
        {
            Name = name,
            CreatedBy = actorUserId,
            IsActive = true,
            UpdatedAt = DateTime.UtcNow,
            UpdatedByUserId = actorUserId,
        };
        db.Tags.Add(tag);
        await db.SaveChangesAsync();

        AddAuditLog(db, actorUserId, "tag.created", "tag", tag.Id, $"Создан тег «{tag.Name}»");
        await db.SaveChangesAsync();

        return Results.Created($"/api/moderation/tags/{tag.Id}", MapTag(tag));
    }

    private static async Task<IResult> UpdateModerationTagAsync(
        int id,
        [FromBody] ModerationTagUpsertDTO request,
        HttpContext context,
        ApplicationDBContext db)
    {
        var actorUserId = AuthEndpointSupport.GetCurrentUserId(context);
        var tag = await db.Tags.Include(item => item.Opportunities).FirstOrDefaultAsync(item => item.Id == id);
        if (tag is null)
        {
            return Results.NotFound();
        }

        var name = NormalizeTagName(request.Name);
        if (string.IsNullOrWhiteSpace(name))
        {
            return AuthEndpointSupport.MessageResult("Укажите название тега.", StatusCodes.Status400BadRequest);
        }

        var duplicate = await db.Tags.AnyAsync(item => item.Id != id && item.Name.ToLower() == name.ToLower());
        if (duplicate)
        {
            return AuthEndpointSupport.MessageResult("Тег с таким названием уже существует.", StatusCodes.Status409Conflict);
        }

        var oldName = tag.Name;
        tag.Name = name;
        tag.UpdatedAt = DateTime.UtcNow;
        tag.UpdatedByUserId = actorUserId;
        AddAuditLog(db, actorUserId, "tag.updated", "tag", tag.Id, $"Тег «{oldName}» переименован в «{tag.Name}»");
        await db.SaveChangesAsync();

        return Results.Ok(MapTag(tag));
    }

    private static Task<IResult> EnableModerationTagAsync(int id, HttpContext context, ApplicationDBContext db) =>
        SetTagActiveStateAsync(id, true, context, db);

    private static Task<IResult> DisableModerationTagAsync(int id, HttpContext context, ApplicationDBContext db) =>
        SetTagActiveStateAsync(id, false, context, db);

    private static async Task<IResult> SetTagActiveStateAsync(int id, bool isActive, HttpContext context, ApplicationDBContext db)
    {
        var actorUserId = AuthEndpointSupport.GetCurrentUserId(context);
        var tag = await db.Tags.Include(item => item.Opportunities).FirstOrDefaultAsync(item => item.Id == id);
        if (tag is null)
        {
            return Results.NotFound();
        }

        tag.IsActive = isActive;
        tag.UpdatedAt = DateTime.UtcNow;
        tag.UpdatedByUserId = actorUserId;
        AddAuditLog(db, actorUserId, isActive ? "tag.enabled" : "tag.disabled", "tag", tag.Id, isActive ? $"Тег «{tag.Name}» включен" : $"Тег «{tag.Name}» отключен");
        await db.SaveChangesAsync();

        return Results.Ok(MapTag(tag));
    }

    private static async Task<IResult> MergeModerationTagsAsync(
        [FromBody] ModerationTagMergeDTO request,
        HttpContext context,
        ApplicationDBContext db)
    {
        var actorUserId = AuthEndpointSupport.GetCurrentUserId(context);
        if (!await IsCurrentModeratorAdministratorAsync(context, db))
        {
            return AuthEndpointSupport.MessageResult("Объединять теги может только куратор-администратор.", StatusCodes.Status403Forbidden);
        }

        if (request.SourceTagId == request.TargetTagId)
        {
            return AuthEndpointSupport.MessageResult("Выберите два разных тега.", StatusCodes.Status400BadRequest);
        }

        var source = await db.Tags.Include(item => item.Opportunities).FirstOrDefaultAsync(item => item.Id == request.SourceTagId);
        var target = await db.Tags.Include(item => item.Opportunities).FirstOrDefaultAsync(item => item.Id == request.TargetTagId);
        if (source is null || target is null)
        {
            return Results.NotFound();
        }

        foreach (var opportunity in source.Opportunities.ToList())
        {
            if (!target.Opportunities.Any(item => item.Id == opportunity.Id))
            {
                target.Opportunities.Add(opportunity);
            }
        }

        source.Opportunities.Clear();
        source.IsActive = false;
        source.MergedIntoTagId = target.Id;
        source.UpdatedAt = DateTime.UtcNow;
        source.UpdatedByUserId = actorUserId;
        target.UpdatedAt = DateTime.UtcNow;
        target.UpdatedByUserId = actorUserId;

        AddAuditLog(db, actorUserId, "tag.merged", "tag", source.Id, $"Тег «{source.Name}» объединен с «{target.Name}»", new { sourceTagId = source.Id, targetTagId = target.Id });
        await db.SaveChangesAsync();

        return Results.Ok(new { Source = MapTag(source), Target = MapTag(target) });
    }

    private static async Task<IResult> GetModerationReferencesAsync(ApplicationDBContext db)
    {
        var items = await SystemReferenceSupport.GetReferenceItemsAsync(db, activeOnly: false);
        return Results.Ok(SystemReferenceSupport.BuildReferencesResponse(items));
    }

    private static async Task<IResult> CreateModerationReferenceAsync(
        [FromBody] SystemReferenceItemUpsertDTO request,
        HttpContext context,
        ApplicationDBContext db)
    {
        if (!await IsCurrentModeratorAdministratorAsync(context, db))
        {
            return AuthEndpointSupport.MessageResult("Справочники может менять только куратор-администратор.", StatusCodes.Status403Forbidden);
        }

        var actorUserId = AuthEndpointSupport.GetCurrentUserId(context);
        var category = NormalizeReferenceCategory(request.Category);
        var key = SystemReferenceSupport.NormalizeReferenceKey(request.Key);
        var label = NormalizeRequiredText(request.Label);
        if (string.IsNullOrWhiteSpace(category) || string.IsNullOrWhiteSpace(key) || string.IsNullOrWhiteSpace(label))
        {
            return AuthEndpointSupport.MessageResult("Укажите категорию, ключ и название.", StatusCodes.Status400BadRequest);
        }

        if (await db.SystemReferenceItems.AnyAsync(item => item.Category == category && item.Key == key))
        {
            return AuthEndpointSupport.MessageResult("Такое значение справочника уже существует.", StatusCodes.Status409Conflict);
        }

        var item = new SystemReferenceItem
        {
            Category = category,
            Key = key,
            Label = label,
            Description = NormalizeOptionalText(request.Description),
            IsActive = request.IsActive ?? true,
            IsSystem = false,
            SortOrder = request.SortOrder ?? 100,
            UpdatedAt = DateTime.UtcNow,
            UpdatedByUserId = actorUserId,
        };
        db.SystemReferenceItems.Add(item);
        AddAuditLog(db, actorUserId, "reference.created", "system_reference", null, $"Добавлено значение справочника «{item.Label}»", new { item.Category, item.Key });
        await db.SaveChangesAsync();

        return Results.Created($"/api/moderation/system/references/{item.Id}", SystemReferenceSupport.MapReferenceItem(item));
    }

    private static async Task<IResult> UpdateModerationReferenceAsync(
        int id,
        [FromBody] SystemReferenceItemUpsertDTO request,
        HttpContext context,
        ApplicationDBContext db)
    {
        if (!await IsCurrentModeratorAdministratorAsync(context, db))
        {
            return AuthEndpointSupport.MessageResult("Справочники может менять только куратор-администратор.", StatusCodes.Status403Forbidden);
        }

        var actorUserId = AuthEndpointSupport.GetCurrentUserId(context);
        var item = await db.SystemReferenceItems.FirstOrDefaultAsync(entry => entry.Id == id);
        if (item is null)
        {
            return Results.NotFound();
        }

        var nextCategory = NormalizeReferenceCategory(request.Category);
        var nextKey = SystemReferenceSupport.NormalizeReferenceKey(request.Key);
        var nextLabel = NormalizeRequiredText(request.Label);
        if (string.IsNullOrWhiteSpace(nextLabel))
        {
            return AuthEndpointSupport.MessageResult("Укажите название.", StatusCodes.Status400BadRequest);
        }

        if (item.IsSystem && (!string.Equals(item.Category, nextCategory, StringComparison.OrdinalIgnoreCase) || !string.Equals(item.Key, nextKey, StringComparison.OrdinalIgnoreCase)))
        {
            return AuthEndpointSupport.MessageResult("Системный ключ нельзя переименовать или перенести.", StatusCodes.Status409Conflict);
        }

        if (!item.IsSystem && (!string.Equals(item.Category, nextCategory, StringComparison.OrdinalIgnoreCase) || !string.Equals(item.Key, nextKey, StringComparison.OrdinalIgnoreCase)))
        {
            var duplicate = await db.SystemReferenceItems.AnyAsync(entry => entry.Id != id && entry.Category == nextCategory && entry.Key == nextKey);
            if (duplicate)
            {
                return AuthEndpointSupport.MessageResult("Такое значение справочника уже существует.", StatusCodes.Status409Conflict);
            }

            item.Category = nextCategory;
            item.Key = nextKey;
        }

        item.Label = nextLabel;
        item.Description = NormalizeOptionalText(request.Description);
        item.IsActive = request.IsActive ?? item.IsActive;
        item.SortOrder = request.SortOrder ?? item.SortOrder;
        item.UpdatedAt = DateTime.UtcNow;
        item.UpdatedByUserId = actorUserId;
        AddAuditLog(db, actorUserId, "reference.updated", "system_reference", item.Id, $"Обновлен справочник «{item.Label}»", new { item.Category, item.Key, item.IsActive });
        await db.SaveChangesAsync();

        return Results.Ok(SystemReferenceSupport.MapReferenceItem(item));
    }

    private static async Task<IResult> GetModerationAuditLogAsync(string? query, string? entityType, ApplicationDBContext db)
    {
        var normalizedQuery = string.IsNullOrWhiteSpace(query) ? null : query.Trim();
        var normalizedEntityType = string.IsNullOrWhiteSpace(entityType) ? null : entityType.Trim().ToLowerInvariant();

        var rows = await db.ModerationAuditLogs
            .Include(item => item.ActorUser)
            .ThenInclude(item => item!.CuratorProfile)
            .OrderByDescending(item => item.CreatedAt)
            .Take(250)
            .ToListAsync();

        var filtered = rows
            .Where(item => normalizedEntityType is null || item.EntityType.Equals(normalizedEntityType, StringComparison.OrdinalIgnoreCase))
            .Where(item => normalizedQuery is null || item.Summary.Contains(normalizedQuery, StringComparison.OrdinalIgnoreCase) || item.Action.Contains(normalizedQuery, StringComparison.OrdinalIgnoreCase))
            .Select(item => new
            {
                item.Id,
                Kind = item.EntityType,
                Title = item.Action,
                Description = item.Summary,
                Status = item.Action.Contains("disabled", StringComparison.OrdinalIgnoreCase) || item.Action.Contains("rejected", StringComparison.OrdinalIgnoreCase) ? "rejected" : "approved",
                Timestamp = item.CreatedAt,
                ActorUserId = item.ActorUserId,
                ActorName = item.ActorUser?.CuratorProfile is null
                    ? item.ActorUser?.Email
                    : BuildModeratorDisplayName(item.ActorUser.CuratorProfile.Name, item.ActorUser.CuratorProfile.Surname, item.ActorUser.CuratorProfile.Thirdname),
                item.EntityType,
                item.EntityId,
                Metadata = item.MetadataJson,
            })
            .ToList();

        return Results.Ok(filtered);
    }

    private static async Task<IResult> GetModeratorSettingsAsync(HttpContext context, ApplicationDBContext db)
    {
        var userId = AuthEndpointSupport.GetCurrentUserId(context);
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var user = await db.Users.Include(item => item.CuratorProfile).FirstOrDefaultAsync(item => item.Id == userId.Value);
        if (user?.CuratorProfile is null)
        {
            return Results.Unauthorized();
        }

        var settings = await EnsureModeratorSettingsAsync(db, userId.Value);
        return Results.Ok(MapModeratorSettings(user, settings));
    }

    private static async Task<IResult> UpdateModeratorSettingsAsync(
        [FromBody] ModeratorSettingsUpdateDTO request,
        HttpContext context,
        ApplicationDBContext db)
    {
        var userId = AuthEndpointSupport.GetCurrentUserId(context);
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var user = await db.Users.Include(item => item.CuratorProfile).FirstOrDefaultAsync(item => item.Id == userId.Value);
        if (user?.CuratorProfile is null)
        {
            return Results.Unauthorized();
        }

        if (!IsValidJsonObject(request.NotificationSettingsJson) || !IsValidJsonObject(request.QueueSettingsJson))
        {
            return AuthEndpointSupport.MessageResult("Настройки должны быть JSON-объектом.", StatusCodes.Status400BadRequest);
        }

        var settings = await EnsureModeratorSettingsAsync(db, userId.Value);
        settings.NotificationSettingsJson = NormalizeJsonObject(request.NotificationSettingsJson, DefaultNotificationSettingsJson);
        settings.QueueSettingsJson = NormalizeJsonObject(request.QueueSettingsJson, DefaultQueueSettingsJson);
        settings.StartPage = NormalizeOptionalText(request.StartPage) ?? "/moderator";
        settings.UpdatedAt = DateTime.UtcNow;

        AddAuditLog(db, userId.Value, "settings.updated", "moderator_settings", settings.Id, "Куратор обновил настройки кабинета");
        await db.SaveChangesAsync();

        return Results.Ok(MapModeratorSettings(user, settings));
    }

    internal static void AddAuditLog(
        ApplicationDBContext db,
        int? actorUserId,
        string action,
        string entityType,
        int? entityId,
        string summary,
        object? metadata = null)
    {
        db.ModerationAuditLogs.Add(new ModerationAuditLog
        {
            ActorUserId = actorUserId,
            Action = action,
            EntityType = entityType,
            EntityId = entityId,
            Summary = summary,
            MetadataJson = metadata is null ? "{}" : JsonSerializer.Serialize(metadata),
        });
    }

    private static object MapTag(Tag tag) => new
    {
        tag.Id,
        tag.Name,
        IsActive = tag.IsActive != false,
        tag.CreatedBy,
        tag.UpdatedAt,
        tag.UpdatedByUserId,
        tag.MergedIntoTagId,
        MergedIntoTagName = tag.MergedIntoTag?.Name,
        UsageCount = tag.Opportunities?.Count ?? 0,
    };

    private static async Task<bool> IsCurrentModeratorAdministratorAsync(HttpContext context, ApplicationDBContext db)
    {
        var userId = AuthEndpointSupport.GetCurrentUserId(context);
        if (userId is null)
        {
            return false;
        }

        return await db.CuratorProfiles.AnyAsync(item => item.UserId == userId.Value && item.IsAdministrator);
    }

    private static async Task<ModeratorSetting> EnsureModeratorSettingsAsync(ApplicationDBContext db, int userId)
    {
        var settings = await db.ModeratorSettings.FirstOrDefaultAsync(item => item.UserId == userId);
        if (settings is not null)
        {
            return settings;
        }

        settings = new ModeratorSetting
        {
            UserId = userId,
            NotificationSettingsJson = DefaultNotificationSettingsJson,
            QueueSettingsJson = DefaultQueueSettingsJson,
            StartPage = "/moderator",
            UpdatedAt = DateTime.UtcNow,
        };
        db.ModeratorSettings.Add(settings);
        await db.SaveChangesAsync();
        return settings;
    }

    private static object MapModeratorSettings(User user, ModeratorSetting settings) => new
    {
        User = new
        {
            user.Id,
            user.Email,
            Name = user.CuratorProfile?.Name,
            Surname = user.CuratorProfile?.Surname,
            Thirdname = user.CuratorProfile?.Thirdname,
            IsAdministrator = user.CuratorProfile?.IsAdministrator == true,
            DisplayName = user.CuratorProfile is null
                ? user.Email
                : BuildModeratorDisplayName(user.CuratorProfile.Name, user.CuratorProfile.Surname, user.CuratorProfile.Thirdname),
        },
        Settings = new
        {
            settings.Id,
            settings.UserId,
            NotificationSettings = DeserializeJson(settings.NotificationSettingsJson),
            QueueSettings = DeserializeJson(settings.QueueSettingsJson),
            settings.StartPage,
            settings.UpdatedAt,
        },
    };

    private const string DefaultNotificationSettingsJson = "{\"complaints\":true,\"opportunities\":true,\"companies\":true,\"candidates\":true,\"system\":true}";
    private const string DefaultQueueSettingsJson = "{\"defaultSort\":\"newest\",\"pageSize\":20,\"includeClosedComplaints\":false}";

    private static string NormalizeTagName(string? value) =>
        string.IsNullOrWhiteSpace(value) ? string.Empty : string.Join(" ", value.Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries));

    private static string NormalizeReferenceCategory(string? value) =>
        string.IsNullOrWhiteSpace(value) ? string.Empty : value.Trim().ToLowerInvariant();

    private static string NormalizeRequiredText(string? value) =>
        string.IsNullOrWhiteSpace(value) ? string.Empty : value.Trim();

    private static string? NormalizeOptionalText(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static bool IsValidJsonObject(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return true;
        }

        try
        {
            using var document = JsonDocument.Parse(value);
            return document.RootElement.ValueKind == JsonValueKind.Object;
        }
        catch (JsonException)
        {
            return false;
        }
    }

    private static string NormalizeJsonObject(string? value, string fallback) =>
        string.IsNullOrWhiteSpace(value) ? fallback : value.Trim();

    private static object DeserializeJson(string value)
    {
        try
        {
            return JsonSerializer.Deserialize<object>(value) ?? new { };
        }
        catch (JsonException)
        {
            return new { };
        }
    }
}

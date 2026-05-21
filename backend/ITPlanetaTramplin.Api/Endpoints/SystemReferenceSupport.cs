using Application.DBContext;
using Microsoft.EntityFrameworkCore;
using Models;

namespace ITPlanetaTramplin.Api.Endpoints;

internal static class SystemReferenceSupport
{
    internal const string OpportunityTypesCategory = "opportunity_types";
    internal const string EmploymentTypesCategory = "employment_types";
    internal const string OpportunityLevelsCategory = "opportunity_levels";
    internal const string ExperienceLevelsCategory = "experience_levels";
    internal const string WorkSchedulesCategory = "work_schedules";
    internal const string ComplaintReasonsCategory = "complaint_reasons";
    internal const string ModerationStatusesCategory = "moderation_statuses";

    internal static readonly IReadOnlyList<SystemReferenceItem> DefaultItems =
    [
        BuildDefault(1, OpportunityTypesCategory, "vacancy", "Вакансия", true, 10),
        BuildDefault(2, OpportunityTypesCategory, "internship", "Стажировка", true, 20),
        BuildDefault(3, OpportunityTypesCategory, "event", "Мероприятие", true, 30),
        BuildDefault(4, OpportunityTypesCategory, "mentoring", "Менторская программа", true, 40),

        BuildDefault(5, EmploymentTypesCategory, "office", "Офис", true, 10),
        BuildDefault(6, EmploymentTypesCategory, "hybrid", "Гибрид", true, 20),
        BuildDefault(7, EmploymentTypesCategory, "remote", "Удаленно", true, 30),
        BuildDefault(8, EmploymentTypesCategory, "online", "Онлайн", true, 40),

        BuildDefault(9, OpportunityLevelsCategory, "no_experience", "Без опыта", false, 10),
        BuildDefault(10, OpportunityLevelsCategory, "junior", "Junior", false, 20),
        BuildDefault(11, OpportunityLevelsCategory, "middle", "Middle", false, 30),
        BuildDefault(12, OpportunityLevelsCategory, "senior", "Senior", false, 40),

        BuildDefault(22, ExperienceLevelsCategory, "no_experience", "Без опыта", false, 10),
        BuildDefault(23, ExperienceLevelsCategory, "junior", "Junior", false, 20),
        BuildDefault(24, ExperienceLevelsCategory, "middle", "Middle", false, 30),
        BuildDefault(25, ExperienceLevelsCategory, "senior", "Senior", false, 40),
        BuildDefault(26, ExperienceLevelsCategory, "lead", "Lead", false, 50),

        BuildDefault(27, WorkSchedulesCategory, "full_time", "Полный день", false, 10),
        BuildDefault(28, WorkSchedulesCategory, "part_time", "Частичная занятость", false, 20),
        BuildDefault(29, WorkSchedulesCategory, "flexible", "Гибкий график", false, 30),
        BuildDefault(30, WorkSchedulesCategory, "weekends", "По выходным", false, 40),
        BuildDefault(31, WorkSchedulesCategory, "shift", "Сменный график", false, 50),

        BuildDefault(13, ComplaintReasonsCategory, "spam", "Спам или мошенничество", false, 10),
        BuildDefault(14, ComplaintReasonsCategory, "incorrect_data", "Некорректная информация", false, 20),
        BuildDefault(15, ComplaintReasonsCategory, "contacts", "Проблема с контактами", false, 30),
        BuildDefault(16, ComplaintReasonsCategory, "other", "Другое", false, 40),

        BuildDefault(17, ModerationStatusesCategory, "pending", "На проверке", true, 10),
        BuildDefault(18, ModerationStatusesCategory, "approved", "Одобрено", true, 20),
        BuildDefault(19, ModerationStatusesCategory, "revision", "На доработке", true, 30),
        BuildDefault(20, ModerationStatusesCategory, "rejected", "Отклонено", true, 40),
        BuildDefault(21, ModerationStatusesCategory, "archived", "В архиве", true, 50),
    ];

    internal static async Task<List<SystemReferenceItem>> GetReferenceItemsAsync(ApplicationDBContext db, bool activeOnly = false)
    {
        var dbItems = await db.SystemReferenceItems
            .AsNoTracking()
            .Where(item => !activeOnly || item.IsActive)
            .OrderBy(item => item.Category)
            .ThenBy(item => item.SortOrder)
            .ThenBy(item => item.Label)
            .ToListAsync();

        return dbItems.Count > 0
            ? dbItems
            : DefaultItems.Where(item => !activeOnly || item.IsActive).ToList();
    }

    internal static object BuildReferencesResponse(IEnumerable<SystemReferenceItem> items)
    {
        var orderedItems = items
            .OrderBy(item => item.Category)
            .ThenBy(item => item.SortOrder)
            .ThenBy(item => item.Label)
            .ToList();
        var mappedItems = orderedItems.Select(MapReferenceItem).ToList();

        return new
        {
            Items = mappedItems,
            Categories = new
            {
                OpportunityTypes = orderedItems.Where(item => item.Category == OpportunityTypesCategory).Select(MapReferenceItem).ToList(),
                EmploymentTypes = orderedItems.Where(item => item.Category == EmploymentTypesCategory).Select(MapReferenceItem).ToList(),
                OpportunityLevels = orderedItems.Where(item => item.Category == OpportunityLevelsCategory).Select(MapReferenceItem).ToList(),
                ExperienceLevels = orderedItems.Where(item => item.Category == ExperienceLevelsCategory).Select(MapReferenceItem).ToList(),
                WorkSchedules = orderedItems.Where(item => item.Category == WorkSchedulesCategory).Select(MapReferenceItem).ToList(),
                ComplaintReasons = orderedItems.Where(item => item.Category == ComplaintReasonsCategory).Select(MapReferenceItem).ToList(),
                ModerationStatuses = orderedItems.Where(item => item.Category == ModerationStatusesCategory).Select(MapReferenceItem).ToList(),
            },
        };
    }

    internal static object MapReferenceItem(SystemReferenceItem item) => new
    {
        item.Id,
        item.Category,
        Value = item.Key,
        Key = item.Key,
        item.Label,
        item.Description,
        item.IsActive,
        item.IsSystem,
        item.SortOrder,
        item.UpdatedAt,
        item.UpdatedByUserId,
    };

    internal static bool IsSystemOpportunityType(string value) =>
        DefaultItems.Any(item =>
            item.Category == OpportunityTypesCategory &&
            item.IsSystem &&
            string.Equals(item.Key, value, StringComparison.OrdinalIgnoreCase));

    internal static async Task<bool> IsActiveValueAsync(ApplicationDBContext db, string category, string? value)
    {
        var normalized = NormalizeReferenceKey(value);
        if (string.IsNullOrWhiteSpace(normalized))
        {
            return true;
        }

        if (!await db.SystemReferenceItems.AnyAsync())
        {
            return DefaultItems.Any(item =>
                item.IsActive &&
                item.Category == category &&
                string.Equals(item.Key, normalized, StringComparison.OrdinalIgnoreCase));
        }

        return await db.SystemReferenceItems.AnyAsync(item =>
            item.IsActive &&
            item.Category == category &&
            item.Key.ToLower() == normalized);
    }

    internal static string NormalizeReferenceKey(string? value) =>
        string.IsNullOrWhiteSpace(value)
            ? string.Empty
            : value.Trim().ToLowerInvariant().Replace(" ", "_");

    private static SystemReferenceItem BuildDefault(int id, string category, string key, string label, bool isSystem, int sortOrder) =>
        new()
        {
            Id = id,
            Category = category,
            Key = key,
            Label = label,
            IsActive = true,
            IsSystem = isSystem,
            SortOrder = sortOrder,
            CreatedAt = new DateTime(2026, 5, 21, 0, 0, 0, DateTimeKind.Utc),
        };
}

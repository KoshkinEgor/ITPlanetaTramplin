namespace DTO;

public class ModerationTagUpsertDTO
{
    public string Name { get; set; } = string.Empty;
}

public class ModerationTagMergeDTO
{
    public int SourceTagId { get; set; }

    public int TargetTagId { get; set; }
}

public class SystemReferenceItemUpsertDTO
{
    public string Category { get; set; } = string.Empty;

    public string Key { get; set; } = string.Empty;

    public string Label { get; set; } = string.Empty;

    public string? Description { get; set; }

    public bool? IsActive { get; set; }

    public int? SortOrder { get; set; }
}

public class ModeratorSettingsUpdateDTO
{
    public string? NotificationSettingsJson { get; set; }

    public string? QueueSettingsJson { get; set; }

    public string? StartPage { get; set; }
}
